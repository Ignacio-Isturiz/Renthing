import uuid
import random
import logging
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny

from .serializers import RegisterSerializer, UserSerializer
from .models import UserProfile, PasswordResetCode

logger = logging.getLogger(__name__)

# --- VISTAS DE AUTENTICACIÓN Y REGISTRO ---

class RegisterView(generics.CreateAPIView):
    """
    Maneja el registro de usuarios con verificación por CÓDIGO (OTP)
    y protección contra fuerza bruta.
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        # 1. Verificar si el correo está en periodo de bloqueo
        user_exists = User.objects.filter(email=email).first()
        if user_exists and hasattr(user_exists, 'profile'):
            profile = user_exists.profile
            if profile.is_blocked():
                tiempo_restante = profile.blocked_until - timezone.now()
                minutos = int(tiempo_restante.total_seconds() // 60)
                return Response(
                    {"error": f"Este correo está bloqueado temporalmente. Intenta en {minutos} minutos."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if user_exists.is_active:
                return Response({"error": "Este correo ya está registrado."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Procesar el registro
        if user_exists and not user_exists.is_active:
            user = user_exists
        else:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            user.is_active = False # Inactivo hasta poner el código
            user.save()

        # 3. Generar Código de Verificación de 6 dígitos
        # Reutilizamos el campo verification_token para guardar el código numérico
        verification_code = str(random.randint(100000, 999999))
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.verification_token = verification_code
        profile.save()

        # 4. Enviar Email con el código
        try:
            self.send_verification_email(user.email, verification_code)
        except Exception:
            logger.exception("Error enviando correo de verificacion para %s", user.email)
            return Response(
                {"error": "No se pudo enviar el correo de verificación. Intenta de nuevo en unos minutos."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({
            "message": "Código de verificación enviado. Revisa tu correo."
        }, status=status.HTTP_201_CREATED)

    def send_verification_email(self, email, code):
        subject = 'Tu código de activación - Renthing'
        message = (
            f"Gracias por registrarte en Renthing.\n\n"
            f"Tu código de verificación es: {code}\n\n"
            f"Ingresa este código en la aplicación para activar tu cuenta.\n"
            f"Si no solicitaste este registro, puedes ignorar este mensaje."
        )

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Endpoint que recibe el email y el código escrito por el usuario en el modal.
    """
    email = request.data.get('email')
    # Compatibilidad: frontend nuevo envia 'code', versiones anteriores enviaban 'token'.
    code = request.data.get('code') or request.data.get('token')

    if not email or not code:
        return Response({"error": "Email y código son requeridos."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email=email).first()
    
    if not user or not hasattr(user, 'profile'):
        return Response({"error": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

    profile = user.profile

    # Verificación del código
    if profile.verification_token == code:
        user.is_active = True
        user.save()
        
        profile.verification_token = None # Limpiar código usado
        profile.failed_verification_attempts = 0
        profile.save()
        
        return Response({"message": "Cuenta activada correctamente."}, status=status.HTTP_200_OK)
    else:
        # Lógica de intentos fallidos para seguridad
        profile.failed_verification_attempts += 1
        if profile.failed_verification_attempts >= 5:
            profile.blocked_until = timezone.now() + timedelta(hours=1)
            profile.save()
            return Response({"error": "Demasiados intentos fallidos. Bloqueado por 1 hora."}, status=status.HTTP_403_FORBIDDEN)
        
        profile.save()
        return Response({"error": "El código ingresado es incorrecto."}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(ObtainAuthToken):
    """
    Login estándar que valida si el usuario está activo (verificado).
    """
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        if not user.is_active:
            return Response(
                {"error": "Debes confirmar tu correo electrónico antes de iniciar sesión."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'user': UserSerializer(user).data
        })

# --- GOOGLE SIGN IN ---

@api_view(['POST'])
@permission_classes([AllowAny])
def google_sign_in(request):
    email = request.data.get('email')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    google_id = request.data.get('google_id')
    picture = request.data.get('picture')
    
    if not email or not google_id:
        return Response({"error": "Email y google_id son requeridos"}, status=status.HTTP_400_BAD_REQUEST)
    
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email,
            'first_name': first_name,
            'last_name': last_name,
            'is_active': True 
        }
    )
    
    if not created:
        user.first_name = first_name
        user.last_name = last_name
        user.save()
    
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.google_id = google_id
    if picture:
        profile.picture = picture
    profile.save()
    
    token, _ = Token.objects.get_or_create(user=user)
    
    return Response({
        'id': user.id,
        'email': user.email,
        'token': token.key,
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)


# --- RECUPERACIÓN DE CONTRASEÑA ---

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get('email')
    user = User.objects.filter(email=email).first()

    if user:
        if hasattr(user, 'profile') and user.profile.google_id:
            return Response({"error": "Este usuario usa Google. Inicia sesión con Google."}, status=status.HTTP_400_BAD_REQUEST)
        
        code_obj = PasswordResetCode.objects.create(
            user=user, 
            code=PasswordResetCode.generate_code()
        )

        send_mail(
            'Código de recuperación - Renthing',
            f'Tu código de verificación es: {code_obj.code}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

    return Response({"message": "Si el correo existe, recibirás un código de 6 dígitos."}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_confirm(request):
    email = request.data.get('email')
    code = request.data.get('code')
    new_password = request.data.get('new_password')

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"error": "Datos inválidos"}, status=status.HTTP_400_BAD_REQUEST)

    reset_entry = PasswordResetCode.objects.filter(user=user, code=code).last()

    if reset_entry and reset_entry.is_valid():
        user.set_password(new_password)
        user.save()
        reset_entry.is_used = True
        reset_entry.save()
        return Response({"message": "Contraseña actualizada con éxito"}, status=status.HTTP_200_OK)
    
    return Response({"error": "Código inválido o expirado"}, status=status.HTTP_400_BAD_REQUEST)
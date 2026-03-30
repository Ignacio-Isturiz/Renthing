from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer
from .models import UserProfile
from django.core.mail import send_mail
from django.conf import settings
from .models import PasswordResetCode


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token.key
        }, status=status.HTTP_201_CREATED)

class LoginView(ObtainAuthToken):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def google_sign_in(request):
    """
    Crea o actualiza un usuario desde Google Sign In
    Espera: {email, first_name, last_name, google_id, picture}
    """
    email = request.data.get('email')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    google_id = request.data.get('google_id')
    picture = request.data.get('picture')
    
    if not email or not google_id:
        return Response(
            {"error": "Email y google_id son requeridos"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Buscar o crear usuario
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email,  # Usar email como username
            'first_name': first_name,
            'last_name': last_name,
        }
    )
    
    # Actualizar datos si no es nuevo
    if not created:
        user.first_name = first_name
        user.last_name = last_name
        user.save()
    
    # Actualizar o crear profile
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.google_id = google_id
    if picture:
        profile.picture = picture
    profile.save()
    
    # Crear o obtener token
    token, _ = Token.objects.get_or_create(user=user)
    
    return Response({
        'id': user.id,
        'email': user.email,
        'token': token.key,
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get('email')
    user = User.objects.filter(email=email).first()

    if user:
        # Validación de Google
        if hasattr(user, 'profile') and user.profile.google_id:
            return Response(
                {"error": "Inicia sesión con google"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generar código
        code_obj = PasswordResetCode.objects.create(
            user=user, 
            code=PasswordResetCode.generate_code()
        )

        # Enviar Email (Configura tu SMTP en settings.py)
        send_mail(
            'Código de recuperación - Renthing',
            f'Tu código de verificación es: {code_obj.code}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

    # Por seguridad, siempre respondemos éxito aunque el correo no exista
    return Response({"message": "Si el correo existe, recibirás un código de 6 dígitos."}, status=status.HTTP_200_OK)

# 2. Verificar y Cambiar Contraseña
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_confirm(request):
    email = request.data.get('email')
    code = request.data.get('code')
    new_password = request.data.get('new_password')

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"error": "Datos inválidos"}, status=status.HTTP_400_BAD_REQUEST)

    # Buscar el código más reciente para este usuario
    reset_entry = PasswordResetCode.objects.filter(user=user, code=code).last()

    if reset_entry and reset_entry.is_valid():
        user.set_password(new_password)
        user.save()
        reset_entry.is_used = True
        reset_entry.save()
        return Response({"message": "Contraseña actualizada con éxito"}, status=status.HTTP_200_OK)
    
    return Response({"error": "Código inválido o expirado"}, status=status.HTTP_400_BAD_REQUEST)
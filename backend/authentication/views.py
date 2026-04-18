import uuid
import random
import logging
import base64
import binascii
from datetime import timedelta
from django.db import DataError
from django.db.models import Avg, Sum
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.shortcuts import redirect

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ProductSerializer,
    ProductCreateSerializer,
    NearbyProductsQuerySerializer,
    ProductCategorySuggestionSerializer,
    RentalRequestSerializer,
    EarningSerializer,
)
from .models import UserProfile, PasswordResetCode, Product, RentalRequest, Earning
from .services.category_service import ProductCategoryCatalog
from .services.location_service import CoordinatesResolver, CoordinatesValidationError
from .services.product_service import ProductQueryService, ProductWriteService

logger = logging.getLogger(__name__)


class ProductCreateView(APIView):
    """
    POST: Crea un producto con ubicacion propia (latitud/longitud).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = ProductWriteService.create_product(
            owner=request.user,
            validated_data=serializer.validated_data,
        )

        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class NearbyProductListView(APIView):
    """
    GET: Lista productos disponibles cercanos a una coordenada.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        query_serializer = NearbyProductsQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        query_data = query_serializer.validated_data

        try:
            coordinates = CoordinatesResolver.resolve(
                latitude=query_data["latitude"],
                longitude=query_data["longitude"],
            )
        except CoordinatesValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        products_qs = ProductQueryService.list_available_nearby(
            latitude=coordinates.latitude,
            longitude=coordinates.longitude,
            radius_km=query_data["radius_km"],
            limit=query_data["limit"],
        )

        payload = {
            "origin": {
                "latitude": coordinates.latitude,
                "longitude": coordinates.longitude,
            },
            "radius_km": query_data["radius_km"],
            "count": len(products_qs),
            "products": ProductSerializer(products_qs, many=True).data,
        }
        return Response(payload, status=status.HTTP_200_OK)


class ProductCategoryCatalogView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {"categories": ProductCategoryCatalog.list_options()},
            status=status.HTTP_200_OK,
        )


class ProductCategorySuggestionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ProductCategorySuggestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        suggestion = ProductCategoryCatalog.suggest(serializer.validated_data["title"])
        return Response(suggestion, status=status.HTTP_200_OK)

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
    Garantiza que devuelve siempre un ID válido.
    """
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response(
                {"error": "Credenciales inválidas."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user = serializer.validated_data['user']
        
        if not user.is_active:
            return Response(
                {"error": "Debes confirmar tu correo electrónico antes de iniciar sesión."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validar que el usuario tenga un ID válido
        if not user.pk or not isinstance(user.pk, int):
            logger.error(f"Usuario {user.email} tiene un ID inválido: {user.pk}")
            return Response(
                {"error": "Error interno del servidor. Contacta al soporte."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.pk,  # ID del usuario (entero)
            'id': user.pk,  # También enviar como 'id' para compatibilidad con NextAuth
            'email': user.email,
            'user': UserSerializer(user, context={'request': request}).data
        }, status=status.HTTP_200_OK)

# --- GOOGLE SIGN IN ---

@api_view(['POST'])
@permission_classes([AllowAny])
def google_sign_in(request):
    """
    Maneja el registro/login automático mediante Google OAuth.
    Garantiza que devuelve un ID válido.
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
    
    try:
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
        
        # Validar que el usuario tenga un ID válido
        if not user.pk or not isinstance(user.pk, int):
            logger.error(f"Usuario {user.email} tiene un ID inválido: {user.pk}")
            return Response(
                {"error": "Error interno del servidor. Contacta al soporte."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'id': user.pk,  # ID del usuario (entero)
            'email': user.email,
            'token': token.key,
            'user': UserSerializer(user, context={'request': request}).data
        }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error en google_sign_in: {str(e)}")
        return Response(
            {"error": "Error al procesar la solicitud de Google. Intenta de nuevo."}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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


# --- VISTAS PROTEGIDAS ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Obtiene el perfil del usuario autenticado.
    Requiere autenticación (TOKEN).
    """
    try:
        user = request.user
        
        if not user.is_authenticated:
            return Response(
                {"error": "Autenticación requerida."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response({
            'id': user.pk,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_active': user.is_active,
            'user': UserSerializer(user, context={'request': request}).data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error obteniendo perfil del usuario: {str(e)}")
        return Response(
            {"error": "Error al obtener el perfil."}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_overview(request):
    """
    Devuelve datos dinámicos para la dashboard del usuario autenticado.
    """
    user = request.user

    products_qs = Product.objects.filter(owner=user).order_by('-created_at')
    pending_qs = RentalRequest.objects.filter(
        product__owner=user,
        status=RentalRequest.STATUS_PENDING,
    ).select_related('product', 'renter').order_by('-created_at')
    active_qs = RentalRequest.objects.filter(
        product__owner=user,
        status=RentalRequest.STATUS_ACCEPTED,
    ).select_related('product', 'renter').order_by('-start_date')
    earnings_qs = Earning.objects.filter(owner=user).select_related('product').order_by('-earned_at')

    now = timezone.now()
    month_earnings = earnings_qs.filter(
        earned_at__year=now.year,
        earned_at__month=now.month,
    ).aggregate(total=Sum('amount'))['total'] or 0

    rating_avg = active_qs.aggregate(avg=Avg('rating_by_renter'))['avg']
    rented_count = products_qs.filter(status=Product.STATUS_RENTED).count()

    payload = {
        'user': {
            'id': user.id,
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'email': user.email,
        },
        'summary': {
            'products_count': products_qs.count(),
            'rented_count': rented_count,
            'pending_requests': pending_qs.count(),
            'rating': round(float(rating_avg or 0), 1),
            'monthly_earnings': float(month_earnings),
        },
        'pending_requests': RentalRequestSerializer(pending_qs[:5], many=True).data,
        'active_rentals': RentalRequestSerializer(active_qs[:6], many=True).data,
        'products': ProductSerializer(products_qs[:12], many=True).data,
        'recent_earnings': EarningSerializer(earnings_qs[:8], many=True).data,
    }
    return Response(payload, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_profile_picture(request):
    """
    Actualiza la foto de perfil a partir de un archivo, sin guardar en media.
    Espera multipart con el campo `image`.
    """
    image = request.FILES.get('image')
    if not image:
        return Response(
            {'error': 'Debes enviar una imagen en el campo `image`.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not image.content_type or not image.content_type.startswith('image/'):
        return Response(
            {'error': 'El archivo enviado no es una imagen válida.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if image.size and image.size > 2 * 1024 * 1024:
        return Response(
            {'error': 'La imagen es demasiado pesada. Máximo permitido: 2MB.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    encoded_image = base64.b64encode(image.read()).decode('ascii')
    picture_url = f"data:{image.content_type};base64,{encoded_image}"

    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.picture = picture_url
    profile.profile_image = None
    try:
        profile.save(update_fields=['picture', 'profile_image'])
    except DataError:
        return Response(
            {'error': 'La imagen no pudo guardarse. Intenta con una imagen mas pequena.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    public_picture_url = request.build_absolute_uri(f"/api/auth/profile/picture/{request.user.id}/")
    return Response({'picture_url': public_picture_url}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_profile_picture(request, user_id):
    user = User.objects.filter(pk=user_id).select_related('profile').first()
    if not user or not hasattr(user, 'profile'):
        return Response(status=status.HTTP_404_NOT_FOUND)

    picture = (user.profile.picture or '').strip()
    if not picture:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if picture.startswith('http://') or picture.startswith('https://'):
        return redirect(picture)

    if picture.startswith('data:image/') and ',' in picture:
        metadata, raw_data = picture.split(',', 1)
        mime_type = metadata[5:].split(';')[0] or 'image/png'
        try:
            image_bytes = base64.b64decode(raw_data)
        except (ValueError, binascii.Error):
            return Response(status=status.HTTP_404_NOT_FOUND)

        return HttpResponse(image_bytes, content_type=mime_type)

    return Response(status=status.HTTP_404_NOT_FOUND)
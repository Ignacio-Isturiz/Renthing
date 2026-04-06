from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Product, RentalRequest, Earning

class UserSerializer(serializers.ModelSerializer):
    cedula = serializers.SerializerMethodField()
    google_id = serializers.SerializerMethodField()
    picture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'cedula', 'google_id', 'picture')
    
    def get_cedula(self, obj):
        try:
            return obj.profile.cedula
        except UserProfile.DoesNotExist:
            return None
    
    def get_google_id(self, obj):
        try:
            return obj.profile.google_id
        except UserProfile.DoesNotExist:
            return None
    
    def get_picture(self, obj):
        try:
            if obj.profile.profile_image:
                request = self.context.get('request')
                image_url = obj.profile.profile_image.url
                if request:
                    return request.build_absolute_uri(image_url)
                return image_url
            return obj.profile.picture
        except UserProfile.DoesNotExist:
            return None

class RegisterSerializer(serializers.ModelSerializer):
    cedula = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name', 'cedula')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        cedula = validated_data.pop('cedula', None)
        
        try:
            user = User.objects.create_user(
                username=validated_data['email'],
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
            )
            
            # Crear profile con cedula si se proporciona
            if cedula:
                UserProfile.objects.create(user=user, cedula=cedula)
            else:
                UserProfile.objects.create(user=user)
            
            return user
        except Exception as e:
            raise serializers.ValidationError(f"Error creando usuario: {str(e)}")


class ProductSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "title",
            "category",
            "image_url",
            "daily_price",
            "status",
            "status_label",
            "created_at",
        )


class RentalRequestSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_image_url = serializers.CharField(source="product.image_url", read_only=True)
    renter_name = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = RentalRequest
        fields = (
            "id",
            "product_id",
            "product_title",
            "product_image_url",
            "renter_name",
            "start_date",
            "end_date",
            "status",
            "status_label",
            "total_price",
            "rating_by_renter",
            "created_at",
        )

    def get_renter_name(self, obj):
        full_name = f"{obj.renter.first_name} {obj.renter.last_name}".strip()
        return full_name or obj.renter.username


class EarningSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True)

    class Meta:
        model = Earning
        fields = ("id", "product_title", "amount", "earned_at")

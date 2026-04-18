from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Product, RentalRequest, Earning
from .services.category_service import ProductCategoryCatalog

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
            picture = obj.profile.picture
            if not picture:
                return None

            if picture.startswith("data:image/"):
                request = self.context.get("request")
                relative_path = f"/api/auth/profile/picture/{obj.id}/"
                if request:
                    return request.build_absolute_uri(relative_path)
                return relative_path

            return picture
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
    owner_name = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "title",
            "description",
            "category",
            "image_url",
            "daily_price",
            "country_code",
            "latitude",
            "longitude",
            "address",
            "status",
            "status_label",
            "owner_name",
            "distance_km",
            "created_at",
        )

    def get_owner_name(self, obj):
        full_name = f"{obj.owner.first_name} {obj.owner.last_name}".strip()
        return full_name or obj.owner.username

    def get_distance_km(self, obj):
        distance = getattr(obj, "distance_km", None)
        if distance is None:
            return None
        return round(float(distance), 3)


class ProductCreateSerializer(serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    category = serializers.CharField(required=True, allow_blank=False, allow_null=False)
    image_url = serializers.CharField(required=True, allow_blank=False, allow_null=False)

    class Meta:
        model = Product
        fields = (
            "title",
            "description",
            "category",
            "image_url",
            "daily_price",
            "latitude",
            "longitude",
            "address",
        )
        extra_kwargs = {
            "latitude": {"required": True},
            "longitude": {"required": True},
        }

    def validate_image_url(self, value):
        if not value.startswith("data:image/"):
            raise serializers.ValidationError("La imagen del producto debe enviarse como data URL.")
        return value

    def validate_category(self, value):
        if not ProductCategoryCatalog.is_valid_label(value):
            raise serializers.ValidationError("La categoria seleccionada no es valida.")
        return value

    def validate(self, attrs):
        latitude = float(attrs.get("latitude"))
        longitude = float(attrs.get("longitude"))

        if latitude < -90 or latitude > 90:
            raise serializers.ValidationError({"latitude": "La latitud debe estar entre -90 y 90."})

        if longitude < -180 or longitude > 180:
            raise serializers.ValidationError({"longitude": "La longitud debe estar entre -180 y 180."})

        return attrs


class NearbyProductsQuerySerializer(serializers.Serializer):
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)
    radius_km = serializers.FloatField(required=False, default=25.0)
    limit = serializers.IntegerField(required=False, default=50)

    def validate(self, attrs):
        latitude = attrs["latitude"]
        longitude = attrs["longitude"]
        radius_km = attrs["radius_km"]
        limit = attrs["limit"]

        if latitude < -90 or latitude > 90:
            raise serializers.ValidationError({"latitude": "La latitud debe estar entre -90 y 90."})
        if longitude < -180 or longitude > 180:
            raise serializers.ValidationError({"longitude": "La longitud debe estar entre -180 y 180."})
        if radius_km <= 0 or radius_km > 500:
            raise serializers.ValidationError({"radius_km": "El radio debe ser mayor a 0 y maximo 500 km."})
        if limit <= 0 or limit > 100:
            raise serializers.ValidationError({"limit": "El limite debe estar entre 1 y 100."})

        return attrs


class ProductCategorySuggestionSerializer(serializers.Serializer):
    title = serializers.CharField(required=True, allow_blank=False, allow_null=False, max_length=120)


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

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

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

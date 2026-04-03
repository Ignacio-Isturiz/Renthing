import random
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

class UserProfile(models.Model):
    """Extensión del modelo User para datos adicionales y seguridad"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    cedula = models.CharField(max_length=50, blank=True, null=True)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    picture = models.URLField(blank=True, null=True)
    verification_token = models.CharField(max_length=100, blank=True, null=True)
    failed_verification_attempts = models.IntegerField(default=0)
    blocked_until = models.DateTimeField(null=True, blank=True)

    def is_blocked(self):
        """Verifica si el usuario está bajo restricción de tiempo"""
        if self.blocked_until and timezone.now() < self.blocked_until:
            return True
        return False

    def __str__(self):
        return f"Profile de {self.user.email}"

class PasswordResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        # El código expira en 15 minutos
        return not self.is_used and self.created_at >= timezone.now() - timedelta(minutes=15)

    @staticmethod
    def generate_code():
        return str(random.randint(100000, 999999))
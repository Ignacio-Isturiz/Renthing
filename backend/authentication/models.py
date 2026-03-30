from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    """Extensión del modelo User para datos adicionales"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    cedula = models.CharField(max_length=50, blank=True, null=True)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    picture = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return f"Profile de {self.user.email}"

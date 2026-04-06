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
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
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


class Product(models.Model):
    STATUS_AVAILABLE = "available"
    STATUS_RENTED = "rented"
    STATUS_CHOICES = [
        (STATUS_AVAILABLE, "Disponible"),
        (STATUS_RENTED, "Alquilado"),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="products")
    title = models.CharField(max_length=120)
    category = models.CharField(max_length=80, blank=True)
    image_url = models.URLField(blank=True, null=True)
    daily_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_AVAILABLE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.owner.email})"


class RentalRequest(models.Model):
    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_REJECTED = "rejected"
    STATUS_COMPLETED = "completed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pendiente"),
        (STATUS_ACCEPTED, "Aceptada"),
        (STATUS_REJECTED, "Rechazada"),
        (STATUS_COMPLETED, "Completada"),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="rental_requests")
    renter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rental_requests")
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rating_by_renter = models.DecimalField(max_digits=2, decimal_places=1, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.title} -> {self.renter.email} ({self.status})"


class Earning(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="earnings")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    rental_request = models.ForeignKey(RentalRequest, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-earned_at"]

    def __str__(self):
        return f"{self.owner.email}: {self.amount}"
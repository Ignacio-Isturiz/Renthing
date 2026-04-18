from django.contrib import admin
from .models import UserProfile, PasswordResetCode, Product, RentalRequest, Earning


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
	list_display = ("user", "cedula", "google_id", "blocked_until")
	search_fields = ("user__email", "cedula", "google_id")


@admin.register(PasswordResetCode)
class PasswordResetCodeAdmin(admin.ModelAdmin):
	list_display = ("user", "code", "created_at", "is_used")
	search_fields = ("user__email", "code")
	list_filter = ("is_used",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
	list_display = ("title", "owner", "latitude", "longitude", "status", "daily_price", "created_at")
	search_fields = ("title", "owner__email", "category")
	list_filter = ("status", "category")


@admin.register(RentalRequest)
class RentalRequestAdmin(admin.ModelAdmin):
	list_display = ("product", "renter", "status", "start_date", "end_date", "total_price")
	search_fields = ("product__title", "renter__email", "product__owner__email")
	list_filter = ("status",)


@admin.register(Earning)
class EarningAdmin(admin.ModelAdmin):
	list_display = ("owner", "product", "amount", "earned_at")
	search_fields = ("owner__email", "product__title")

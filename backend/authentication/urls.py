from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    google_sign_in,
    request_password_reset,
    reset_password_confirm,
    verify_email,
    user_profile,
    dashboard_overview,
    update_profile_picture,
    public_profile_picture,
    ProductCreateView,
    NearbyProductListView,
    ProductCategoryCatalogView,
    ProductCategorySuggestionView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('google/', google_sign_in, name='google_sign_in'),
    path('password-reset/', request_password_reset, name='password_reset'),
    path('password-reset-confirm/', reset_password_confirm, name='password_reset_confirm'),
    path('verify-email/', verify_email, name='verify_email'),
    path('profile/', user_profile, name='user_profile'),  # Ruta protegida
    path('profile/picture/', update_profile_picture, name='update_profile_picture'),
    path('profile/picture/<int:user_id>/', public_profile_picture, name='public_profile_picture'),
    path('dashboard/', dashboard_overview, name='dashboard_overview'),
    path('product-categories/', ProductCategoryCatalogView.as_view(), name='product_categories'),
    path('product-categories/suggest/', ProductCategorySuggestionView.as_view(), name='product_category_suggest'),
    path('products/', ProductCreateView.as_view(), name='products_create'),
    path('products/nearby/', NearbyProductListView.as_view(), name='products_nearby'),
]

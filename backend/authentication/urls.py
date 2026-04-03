from django.urls import path
from .views import RegisterView, LoginView, google_sign_in, request_password_reset, reset_password_confirm, verify_email

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('google/', google_sign_in, name='google_sign_in'),
    path('password-reset/', request_password_reset, name='password_reset'),
    path('password-reset-confirm/', reset_password_confirm, name='password_reset_confirm'),
    path('verify-email/', verify_email, name='verify_email'),
]

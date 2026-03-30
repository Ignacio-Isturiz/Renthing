from django.urls import path
from .views import RegisterView, LoginView, google_sign_in, request_password_reset, reset_password_confirm

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('google/', google_sign_in, name='google_sign_in'),
    path('password-reset-request/', request_password_reset),
    path('password-reset-confirm/', reset_password_confirm),    
]

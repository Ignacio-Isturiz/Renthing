"""
Permisos y utilidades de autenticación y autorización.
"""
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


class IsAuthenticatedUser(IsAuthenticated):
    """
    Permite el acceso solo a usuarios autenticados.
    Es una versión mejorada de IsAuthenticated con mejor manejo de errores.
    """
    message = "Autenticación requerida."


class IsOwnerOrReadOnly(BasePermission):
    """
    Permite que solo el propietario de un objeto pueda modificarlo.
    Útil para proteger rutas de dashboard.
    """
    
    def has_object_permission(self, request, view, obj):
        # GET, HEAD, OPTIONS siempre se permiten
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Verificar que el usuario sea el propietario del objeto
        return obj.user == request.user


class IsUserItself(BasePermission):
    """
    Permite que un usuario solo acceda a su propio perfil/datos.
    """
    
    def has_permission(self, request, view):
        # El usuario debe estar autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Si la URL contiene un user_id, verificar que sea el mismo
        user_id = view.kwargs.get('user_id')
        if user_id:
            return int(user_id) == request.user.id
        
        return True

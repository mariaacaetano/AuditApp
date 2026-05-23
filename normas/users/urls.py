from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    AdminUsuarioDetailView,
    AdminUsuariosView,
    CodigoAcessoDetailView,
    CodigosAcessoCSVView,
    CodigosAcessoView,
    LoginView,
    LogsUsuarioView,
    RegisterView,
)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('admin/usuarios/', AdminUsuariosView.as_view(), name='admin_usuarios'),
    path('admin/usuarios/logs/', LogsUsuarioView.as_view(), name='logs_usuarios'),
    path('admin/usuarios/<int:id_usuario>/', AdminUsuarioDetailView.as_view(), name='admin_usuario_detail'),
    path('admin/usuarios/<int:id_usuario>/logs/', LogsUsuarioView.as_view(), name='logs_usuario_detail'),
    path('admin/codigos-acesso/', CodigosAcessoView.as_view(), name='codigos_acesso'),
    path('admin/codigos-acesso/<int:id_codigo>/', CodigoAcessoDetailView.as_view(), name='codigo_acesso_detail'),
    path('admin/codigos-acesso/csv/', CodigosAcessoCSVView.as_view(), name='codigos_acesso_csv'),
]

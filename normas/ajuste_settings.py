import os

# O Django vai tentar ler as variáveis passadas pelo Docker, se não achar, usa os fallbacks locais
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'audit_premium'),
        'USER': os.environ.get('DB_USER', 'audit_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'audit_secure_password_2026'),
        'HOST': os.environ.get('DB_HOST', '127.0.0.1'), # No Docker, 'DB_HOST' será 'db'
        'PORT': os.environ.get('DB_PORT', '3306'),
    }
}

# Permite que o seu contêiner React acesse a API do Django
CORS_ALLOW_ALL_ORIGINS = True # Ou configure CORS_ALLOWED_ORIGINS em produção
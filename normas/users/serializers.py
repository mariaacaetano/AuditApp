from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from .models import CodigoAcessoCadastro, LogUsuario, Usuario
from controles.models import Auditor 

class CustomTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['name'] = user.get_full_name() or user.username
        token['cargo'] = user.cargo
        token['is_superuser'] = user.is_superuser
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'name': self.user.get_full_name() or self.user.username,
            'email': self.user.email,
            'cargo': self.user.cargo,
            'is_superuser': self.user.is_superuser,
        }
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    name = serializers.CharField(write_only=True, required=True)
    access_code = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Usuario
        fields = ('username', 'name', 'email', 'password', 'access_code')

    def validate(self, attrs):
        codigo_texto = attrs.get('access_code', '').strip()
        email = attrs.get('email', '').strip().lower()

        try:
            codigo = CodigoAcessoCadastro.objects.get(codigo=codigo_texto)
        except CodigoAcessoCadastro.DoesNotExist:
            raise serializers.ValidationError({'access_code': 'Código de acesso inválido.'})

        if not codigo.ativo:
            raise serializers.ValidationError({'access_code': 'Código de acesso inativo.'})

        if codigo.usado_por_id:
            raise serializers.ValidationError({'access_code': 'Código de acesso já utilizado.'})

        if codigo.email and codigo.email.lower() != email:
            raise serializers.ValidationError({'email': 'Este código de acesso pertence a outro e-mail.'})

        attrs['codigo_acesso_obj'] = codigo
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        name = validated_data.pop('name', '')
        codigo = validated_data.pop('codigo_acesso_obj')
        validated_data.pop('access_code', None)
        codigo = CodigoAcessoCadastro.objects.select_for_update().get(pk=codigo.pk)

        if not codigo.ativo or codigo.usado_por_id:
            raise serializers.ValidationError({'access_code': 'Código de acesso indisponível.'})

        first_name = name.split()[0] if name else ''
        last_name = ' '.join(name.split()[1:]) if name else ''

        user = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            cargo=codigo.cargo or 'Auditor',
        )

        # Cria o perfil de Auditor automaticamente
        Auditor.objects.create(
            id_user=user,
            nome_auditor=name or user.username,
        )

        codigo.usado_por = user
        codigo.usado_em = timezone.now()
        codigo.save(update_fields=['usado_por', 'usado_em'])

        return user


class AdminUsuarioSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = (
            'id',
            'username',
            'name',
            'first_name',
            'last_name',
            'email',
            'cargo',
            'is_active',
            'is_superuser',
            'date_joined',
        )
        read_only_fields = ('id', 'username', 'name', 'is_superuser', 'date_joined')

    def get_name(self, obj):
        return obj.get_full_name() or obj.username


class AdminUsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Usuario
        fields = ('username', 'name', 'email', 'password', 'cargo', 'is_active')

    def create(self, validated_data):
        name = validated_data.pop('name', '')
        first_name = name.split()[0] if name else ''
        last_name = ' '.join(name.split()[1:]) if name else ''

        user = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            cargo=validated_data.get('cargo', 'Auditor'),
            is_active=validated_data.get('is_active', True),
        )
        Auditor.objects.create(
            id_user=user,
            nome_auditor=name or user.username,
        )
        return user


class CodigoAcessoSerializer(serializers.ModelSerializer):
    usado_por_username = serializers.CharField(source='usado_por.username', read_only=True)
    criado_por_username = serializers.CharField(source='criado_por.username', read_only=True)

    class Meta:
        model = CodigoAcessoCadastro
        fields = (
            'id_codigo',
            'codigo',
            'nome',
            'email',
            'cargo',
            'ativo',
            'usado_por',
            'usado_por_username',
            'criado_por',
            'criado_por_username',
            'criado_em',
            'usado_em',
        )
        read_only_fields = (
            'id_codigo',
            'usado_por',
            'usado_por_username',
            'criado_por',
            'criado_por_username',
            'criado_em',
            'usado_em',
        )


class LogUsuarioSerializer(serializers.ModelSerializer):
    usuario_alvo_username_atual = serializers.CharField(source='usuario_alvo.username', read_only=True)
    alterado_por_username = serializers.CharField(source='alterado_por.username', read_only=True)

    class Meta:
        model = LogUsuario
        fields = (
            'id_log',
            'usuario_alvo',
            'usuario_alvo_username',
            'usuario_alvo_username_atual',
            'alterado_por',
            'alterado_por_username',
            'acao',
            'alteracoes',
            'criado_em',
        )

import csv
import io

from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CodigoAcessoCadastro, LogUsuario, Usuario
from .serializers import (
    AdminUsuarioCreateSerializer,
    AdminUsuarioSerializer,
    CodigoAcessoSerializer,
    CustomTokenSerializer,
    LogUsuarioSerializer,
    RegisterSerializer,
)


class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenSerializer


def snapshot_usuario(usuario):
    return {
        'username': usuario.username,
        'first_name': usuario.first_name,
        'last_name': usuario.last_name,
        'email': usuario.email,
        'cargo': usuario.cargo,
        'is_active': usuario.is_active,
        'is_superuser': usuario.is_superuser,
    }


def diff_campos(antes, depois):
    return {
        campo: {'antes': antes[campo], 'depois': depois[campo]}
        for campo in antes
        if antes[campo] != depois[campo]
    }


def registrar_log_usuario(usuario_alvo, alterado_por, acao, alteracoes):
    if not alteracoes:
        return None

    return LogUsuario.objects.create(
        usuario_alvo=usuario_alvo if usuario_alvo.pk else None,
        usuario_alvo_username=usuario_alvo.username,
        alterado_por=alterado_por if getattr(alterado_por, 'is_authenticated', False) else None,
        acao=acao,
        alteracoes=alteracoes,
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'detail': 'Conta criada com sucesso.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUsuariosView(APIView):
    permission_classes = [IsSuperUser]

    def get(self, request):
        usuarios = Usuario.objects.all().order_by('username')
        return Response(AdminUsuarioSerializer(usuarios, many=True).data)

    def post(self, request):
        serializer = AdminUsuarioCreateSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()
            registrar_log_usuario(
                usuario_alvo=usuario,
                alterado_por=request.user,
                acao='criacao',
                alteracoes={
                    campo: {'antes': None, 'depois': valor}
                    for campo, valor in snapshot_usuario(usuario).items()
                },
            )
            return Response(AdminUsuarioSerializer(usuario).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUsuarioDetailView(APIView):
    permission_classes = [IsSuperUser]

    def get_object(self, id_usuario):
        return Usuario.objects.get(id=id_usuario)

    def get(self, request, id_usuario):
        try:
            usuario = self.get_object(id_usuario)
        except Usuario.DoesNotExist:
            return Response({'detail': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminUsuarioSerializer(usuario).data)

    def patch(self, request, id_usuario):
        try:
            usuario = self.get_object(id_usuario)
        except Usuario.DoesNotExist:
            return Response({'detail': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminUsuarioSerializer(usuario, data=request.data, partial=True)
        if serializer.is_valid():
            antes = snapshot_usuario(usuario)
            serializer.save()
            depois = snapshot_usuario(usuario)
            registrar_log_usuario(
                usuario_alvo=usuario,
                alterado_por=request.user,
                acao='atualizacao',
                alteracoes=diff_campos(antes, depois),
            )
            return Response(AdminUsuarioSerializer(usuario).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id_usuario):
        try:
            usuario = self.get_object(id_usuario)
        except Usuario.DoesNotExist:
            return Response({'detail': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if usuario == request.user:
            return Response({'detail': 'Você não pode excluir o próprio usuário.'}, status=status.HTTP_400_BAD_REQUEST)

        registrar_log_usuario(
            usuario_alvo=usuario,
            alterado_por=request.user,
            acao='exclusao',
            alteracoes={
                campo: {'antes': valor, 'depois': None}
                for campo, valor in snapshot_usuario(usuario).items()
            },
        )
        usuario.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogsUsuarioView(APIView):
    permission_classes = [IsSuperUser]

    def get(self, request, id_usuario=None):
        logs = LogUsuario.objects.select_related('usuario_alvo', 'alterado_por')
        if id_usuario is not None:
            logs = logs.filter(usuario_alvo_id=id_usuario)
        return Response(LogUsuarioSerializer(logs, many=True).data)


class CodigosAcessoView(APIView):
    permission_classes = [IsSuperUser]

    def get(self, request):
        codigos = CodigoAcessoCadastro.objects.select_related('usado_por', 'criado_por').all()
        return Response(CodigoAcessoSerializer(codigos, many=True).data)

    def post(self, request):
        serializer = CodigoAcessoSerializer(data=request.data)
        if serializer.is_valid():
            codigo = serializer.save(criado_por=request.user)
            return Response(CodigoAcessoSerializer(codigo).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CodigoAcessoDetailView(APIView):
    permission_classes = [IsSuperUser]

    def get_object(self, id_codigo):
        return CodigoAcessoCadastro.objects.get(id_codigo=id_codigo)

    def patch(self, request, id_codigo):
        try:
            codigo = self.get_object(id_codigo)
        except CodigoAcessoCadastro.DoesNotExist:
            return Response({'detail': 'Código de acesso não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CodigoAcessoSerializer(codigo, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(CodigoAcessoSerializer(codigo).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id_codigo):
        try:
            codigo = self.get_object(id_codigo)
        except CodigoAcessoCadastro.DoesNotExist:
            return Response({'detail': 'Código de acesso não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        codigo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CodigosAcessoCSVView(APIView):
    permission_classes = [IsSuperUser]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="codigos_acesso_cadastro.csv"'
        writer = csv.writer(response)
        writer.writerow(['codigo', 'nome', 'email', 'cargo', 'ativo', 'usado_por', 'usado_em'])

        for item in CodigoAcessoCadastro.objects.select_related('usado_por').all():
            writer.writerow([
                item.codigo,
                item.nome or '',
                item.email or '',
                item.cargo,
                'true' if item.ativo else 'false',
                item.usado_por.username if item.usado_por else '',
                item.usado_em.isoformat() if item.usado_em else '',
            ])

        return response

    def post(self, request):
        arquivo = request.FILES.get('arquivo')
        if not arquivo:
            return Response({'detail': 'Envie um arquivo CSV no campo "arquivo".'}, status=status.HTTP_400_BAD_REQUEST)

        texto = arquivo.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(texto))
        criados = 0
        atualizados = 0

        for linha in reader:
            codigo = (linha.get('codigo') or '').strip()
            if not codigo:
                continue

            ativo_raw = (linha.get('ativo') or 'true').strip().lower()
            ativo = ativo_raw not in ('false', '0', 'nao', 'não', 'inativo')
            defaults = {
                'nome': (linha.get('nome') or '').strip() or None,
                'email': (linha.get('email') or '').strip() or None,
                'cargo': (linha.get('cargo') or 'Auditor').strip() or 'Auditor',
                'ativo': ativo,
                'criado_por': request.user,
            }
            _, created = CodigoAcessoCadastro.objects.update_or_create(
                codigo=codigo,
                defaults=defaults,
            )
            if created:
                criados += 1
            else:
                atualizados += 1

        return Response({'criados': criados, 'atualizados': atualizados})

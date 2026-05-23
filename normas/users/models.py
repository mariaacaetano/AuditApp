from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    
    telefone = models.CharField(max_length=20, blank=True, null=True)
    cargo = models.CharField(max_length=100, default='Auditor')
    foto = models.ImageField(upload_to='usuarios/',blank=True,null=True)

    def __str__(self):
        return self.username


class CodigoAcessoCadastro(models.Model):
    id_codigo = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=80, unique=True)
    nome = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    cargo = models.CharField(max_length=100, default='Auditor')
    ativo = models.BooleanField(default=True)
    usado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        related_name='codigos_acesso_usados',
        null=True,
        blank=True,
    )
    criado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        related_name='codigos_acesso_criados',
        null=True,
        blank=True,
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    usado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'codigos_acesso_cadastro'
        verbose_name = 'Código de Acesso para Cadastro'
        verbose_name_plural = 'Códigos de Acesso para Cadastro'
        ordering = ['-criado_em']

    def __str__(self):
        return self.codigo


class LogUsuario(models.Model):
    id_log = models.AutoField(primary_key=True)
    usuario_alvo = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        related_name='logs_recebidos',
        null=True,
        blank=True,
    )
    usuario_alvo_username = models.CharField(max_length=150, blank=True, null=True)
    alterado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        related_name='logs_usuarios_executados',
        null=True,
        blank=True,
    )
    acao = models.CharField(max_length=50)
    alteracoes = models.JSONField(default=dict, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'logs_usuarios'
        verbose_name = 'Log de Usuário'
        verbose_name_plural = 'Logs de Usuários'
        ordering = ['-criado_em']

    def __str__(self):
        alvo = self.usuario_alvo_username or self.usuario_alvo_id or '-'
        autor = self.alterado_por.username if self.alterado_por else 'sistema'
        return f'{self.acao} - {alvo} por {autor}'

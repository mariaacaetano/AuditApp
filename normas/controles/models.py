from django.db import models
from django.conf import settings
from users.models import Usuario

# situação da auditoria
class SituacaoChoices(models.TextChoices):
    INCONCLUIDA = 'INCONCLUIDA', 'Inconcluída'
    CONCLUIDA = 'CONCLUIDA', 'Concluída'
    
class SituacaoControleChoices(models.TextChoices):
    CONFORME = 'CONFORME', 'Conforme'
    NAO_CONFORME = 'NAO_CONFORME', 'Não Conforme'
    NAO_APLICA = 'NAO_APLICA', 'Não Aplica'

# registro dfe normas
class Norma(models.Model):
    
    id_norma = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100,unique=True)
    descricao = models.TextField()
    versao = models.CharField(max_length=20)
    
    class Meta:
        db_table = 'normas'
        verbose_name = 'Norma'
        verbose_name_plural = 'Normas'
    
    def __str__(self):
        return f'{self.nome}: {self.versao}'    

# controles e auxiliares 27002
class TipoControle(models.Model):
    
    id_tipo_controle = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=50, unique=True)
    descricao = models.TextField()
    
    class Meta:
        db_table = 'tipos_controle'
        verbose_name = 'Tipo de Controle'
        verbose_name_plural = 'Tipos de Controle'
    
    def __str__(self):
        return self.nome
    
class PropriedadeSI(models.Model):
    
    id_propriedade = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=50, unique=True)
    descricao = models.TextField()
    
    class Meta:
        db_table = 'propriedades_si'
        verbose_name = 'Propriedade de Segurança da Informação'
        verbose_name_plural = 'Propriedades de Segurança da Informação'
    
    def __str__(self):
        return self.nome
    
class ConceitoSI(models.Model):
    
    id_conceito = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=50, unique=True)
    descricao = models.TextField()
    
    class Meta:
        db_table = 'conceitos_si'
        verbose_name = 'Conceito de Segurança da Informação'
        verbose_name_plural = 'Conceitos de Segurança da Informação'
    
    def __str__(self):
        return self.nome

class CapacidadeOperacional(models.Model):
    
    id_capacidade = models.AutoField(primary_key=True)
    nome = models.TextField()
    descricao = models.TextField()
    
    class Meta:
        db_table = 'capacidades_operacionais'
        verbose_name = 'Capacidade Operacional'
        verbose_name_plural = 'Capacidades Operacionais'
    
    def __str__(self):
        return self.nome
    
class DominioSeguranca(models.Model):
    
    id_dominio = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=50, unique=True)
    descricao = models.TextField()
    propriedade_inclui = models.TextField(max_length=200)
    
    class Meta:
        db_table = 'dominios_seguranca'
        verbose_name = 'Domínio de Segurança'
        verbose_name_plural = 'Domínios de Segurança'
    
    def __str__(self):
        return self.nome

class TemaControle(models.Model):
    
    id_tema = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=50, unique=True)
    descricao = models.TextField()
    
    class Meta:
        db_table = 'temas_controle'
        verbose_name = 'Tema de Controle'
        verbose_name_plural = 'Temas de Controle'
    
    def __str__(self):
        return self.nome

class Controle27002(models.Model):
    id_controle = models.AutoField(primary_key=True)
    norma = models.ForeignKey(Norma,on_delete=models.CASCADE,related_name='controles')
    indice_norma = models.CharField(max_length=20)
    titulo = models.CharField(max_length=255)
    descricao = models.TextField()
    categoria = models.CharField(max_length=100,blank=True,null=True)

    # relacionamentos many to many com as outras entidades
    tipos_controle = models.ManyToManyField(TipoControle,related_name='controles',blank=True)
    propriedades_si = models.ManyToManyField(PropriedadeSI,related_name='controles',blank=True)
    conceitos_si = models.ManyToManyField(ConceitoSI,related_name='controles',blank=True)
    capacidades_operacionais = models.ManyToManyField(CapacidadeOperacional,related_name='controles',blank=True)
    dominios_seguranca = models.ManyToManyField(DominioSeguranca,related_name='controles',blank=True)
    temas_controle = models.ManyToManyField(TemaControle,related_name='controles',blank=True)
    
    class Meta:
        db_table = 'controles_27002'
        verbose_name = 'Controle 27002'
        verbose_name_plural = 'Controles 27002'

        unique_together = (
            'norma',
            'indice_norma'
        )

    def __str__(self):
        return f'{self.indice_norma} - {self.titulo}'

# controles e auxiliares 27701
class AtributosAnexos(models.Model):
    
    id_atributo = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    descricao = models.CharField(max_length=255)
    
    class Meta:
        db_table = 'atributos_anexos'
        verbose_name = 'Atributo Anexo'
        verbose_name_plural = 'Atributos Anexos'
    
    def __str__(self):
        return f'{self.nome}: {self.descricao}'
    
class TipoControleAnexo(models.Model):            
    
    id_tipo_controle_anexo = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    descricao = models.CharField(max_length=255)
    
    class Meta:
        db_table = 'tipos_controle_anexos'
        verbose_name = 'Tipo de Controle Anexo'
        verbose_name_plural = 'Tipos de Controle Anexos'
    
    def __str__(self):
        return f'{self.nome}: {self.descricao}'
    
class Controle27701(models.Model):
    
    id_controle = models.AutoField(primary_key=True)
    norma = models.ForeignKey(Norma,on_delete=models.CASCADE,related_name='controles_27701')
    indice_norma = models.CharField(max_length=20)
    titulo = models.CharField(max_length=255)
    anexoB = models.CharField(max_length=255, blank=True, null=True)
    orientacao_anexoB = models.TextField(blank=True, null=True)
    
    # relacionamentos many to many com as outras entidades
    atributos_anexos = models.ManyToManyField(AtributosAnexos,related_name='controles_27701',blank=True)
    tipos_controle_anexo = models.ManyToManyField(TipoControleAnexo,related_name='controles_27701',blank=True)
    
    class Meta:
        db_table = 'controles_27701'
        verbose_name = 'Controle 27701'
        verbose_name_plural = 'Controles 27701'

        unique_together = (
            'norma',
            'indice_norma'
        )

    def __str__(self):
        return f'{self.indice_norma} - {self.titulo}'

# cadastro de empresas
class Empresa(models.Model):
    
    id_empresa = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, unique=True)
    cnpj = models.CharField(max_length=20, unique=True)
    porte = models.CharField(max_length=20)
    setor = models.CharField(max_length=50)
    descricao = models.TextField()
    
    class Meta:
        db_table = 'empresa'
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
    
    def __str__(self):
        return self.nome

# castro de auditores e auditorias
class Auditor(models.Model):
    
    
    id_auditor = models.AutoField(primary_key=True)
    id_user = models.ForeignKey(Usuario,on_delete=models.CASCADE,related_name='auditores',null=True,blank=True)
    nome_auditor = models.CharField(max_length=100)
    documento_auditor = models.CharField(max_length=20)
    
    class Meta:
        db_table = 'auditores'
        verbose_name = 'Auditor'
        verbose_name_plural = 'Auditores'
    
    def __str__(self):
        return self.nome_auditor

class Auditoria(models.Model):
    
    id_auditoria = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=120, blank=True, default='')
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='auditorias')
    norma = models.ForeignKey(Norma, on_delete=models.CASCADE, related_name='auditorias')
    auditor = models.ForeignKey(Auditor, on_delete=models.CASCADE, related_name='auditorias')
    data_auditoria = models.DateField()
    descricao = models.TextField()
    status = models.CharField(max_length=20, choices=SituacaoChoices.choices, default=SituacaoChoices.INCONCLUIDA)
    
    class Meta:
        db_table = 'auditorias'
        verbose_name = 'Auditoria'
        verbose_name_plural = 'Auditorias'
    
    def __str__(self):
        return f'{self.nome or f"Auditoria {self.id_auditoria}"} - {self.empresa.nome} - {self.data_auditoria}'

class LogModificacao(models.Model):
    id_log = models.AutoField(primary_key=True)
    auditoria = models.ForeignKey(Auditoria, on_delete=models.CASCADE, related_name='logs_modificacao', null=True, blank=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, related_name='logs_modificacao', null=True, blank=True)
    acao = models.CharField(max_length=50)
    entidade = models.CharField(max_length=80)
    objeto_id = models.CharField(max_length=80, blank=True, null=True)
    alteracoes = models.JSONField(default=dict, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'logs_modificacao'
        verbose_name = 'Log de Modificação'
        verbose_name_plural = 'Logs de Modificação'
        ordering = ['-criado_em']

    def __str__(self):
        auditoria_id = self.auditoria_id or '-'
        usuario = self.usuario.username if self.usuario else 'sistema'
        return f'{self.entidade} {self.objeto_id} - Auditoria {auditoria_id} - {usuario}'
    
# cadastro de respostas e evidências
class RespostasAuditoria27002(models.Model):
    
    id_resposta27002 = models.AutoField(primary_key=True)
    auditoria = models.ForeignKey(Auditoria, on_delete=models.CASCADE, related_name='respostas_27002')
    controle = models.ForeignKey(Controle27002, on_delete=models.CASCADE, related_name='respostas_auditoria')
    observacoes = models.TextField(blank=True, null=True)
    justificativa = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    possui_andamento = models.BooleanField(default=False)
    situacao = models.CharField(max_length=20, choices=SituacaoControleChoices.choices)

    class Meta:
        db_table = 'respostas_auditoria_27002'
        verbose_name = 'Resposta de Auditoria 27002'
        verbose_name_plural = 'Respostas de Auditoria 27002'
        
    def __str__(self):
        return f'Resposta {self.id_resposta27002} - Auditoria {self.auditoria.id_auditoria} - Controle {self.controle.indice_norma}'
    
class RespostasAuditoria27701(models.Model):
    
    id_resposta27701 = models.AutoField(primary_key=True)
    auditoria = models.ForeignKey(Auditoria, on_delete=models.CASCADE, related_name='respostas_27701')
    controle = models.ForeignKey(Controle27701, on_delete=models.CASCADE, related_name='respostas_auditoria')
    observacoes = models.TextField(blank=True, null=True)
    justificativa = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    possui_andamento = models.BooleanField(default=False)
    situacao = models.CharField(max_length=20, choices=SituacaoControleChoices.choices)

    class Meta:
        db_table = 'respostas_auditoria_27701'
        verbose_name = 'Resposta de Auditoria 27701'
        verbose_name_plural = 'Respostas de Auditoria 27701'
        
    def __str__(self):
        return f'Resposta {self.id_resposta27701} - Auditoria {self.auditoria.id_auditoria} - Controle {self.controle.indice_norma}'

class Evidencias27002(models.Model):
    
    id_evidencia = models.AutoField(primary_key=True)
    resposta_auditoria = models.ForeignKey(RespostasAuditoria27002, on_delete=models.CASCADE, related_name='evidencias')
    arquivo = models.FileField(upload_to='evidencias/')
    descricao = models.TextField()
    
    class Meta:
        db_table = 'evidencias_27002'
        verbose_name = 'Evidência 27002'
        verbose_name_plural = 'Evidências 27002'
    
    def __str__(self):
        return f'Evidência {self.id_evidencia} - {self.resposta_auditoria}'
    
class Evidencias27701(models.Model):
    
    id_evidencia = models.AutoField(primary_key=True)
    resposta_auditoria = models.ForeignKey(RespostasAuditoria27701, on_delete=models.CASCADE, related_name='evidencias')
    arquivo = models.FileField(upload_to='evidencias/')
    descricao = models.TextField()
    
    class Meta:
        db_table = 'evidencias_27701'
        verbose_name = 'Evidência 27701'
        verbose_name_plural = 'Evidências 27701'
    
    def __str__(self):
        return f'Evidência {self.id_evidencia} - {self.resposta_auditoria}'

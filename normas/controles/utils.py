from .models import Auditoria, Empresa, Norma
from .models import (
    Auditoria,
    Empresa,
    Norma,
    Auditor,
    SituacaoChoices,
    LogModificacao,
    Controle27002,
    RespostasAuditoria27002,
    Controle27701,
    RespostasAuditoria27701
)
from users.models import Usuario

def registrar_log_modificacao(auditoria, usuario, acao, entidade, objeto_id, alteracoes):
    if not alteracoes:
        return None

    return LogModificacao.objects.create(
        auditoria=auditoria,
        usuario=usuario if getattr(usuario, 'is_authenticated', False) else None,
        acao=acao,
        entidade=entidade,
        objeto_id=str(objeto_id) if objeto_id is not None else None,
        alteracoes=alteracoes,
    )


def _valor_data(valor):
    return str(valor) if valor is not None else None


def _diff_campos(antes, depois):
    return {
        campo: {'antes': antes[campo], 'depois': depois[campo]}
        for campo in antes
        if antes[campo] != depois[campo]
    }


def _snapshot_auditoria(auditoria):
    return {
        'nome': auditoria.nome,
        'empresa': auditoria.empresa.nome,
        'norma': auditoria.norma.nome,
        'data_auditoria': _valor_data(auditoria.data_auditoria),
        'descricao': auditoria.descricao,
        'status': auditoria.status,
    }


def _snapshot_resposta(resposta):
    if not resposta:
        return {
            'situacao': None,
            'observacoes': None,
            'justificativa': None,
            'possui_andamento': None,
        }

    return {
        'situacao': resposta.situacao,
        'observacoes': resposta.observacoes or '',
        'justificativa': resposta.justificativa or '',
        'possui_andamento': resposta.possui_andamento,
    }

def criar_empresa(data: dict) -> Empresa:
    try:
        required_fields = ["nome", "cnpj", "porte", "setor", "descricao"]
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Campo '{field}' é obrigatório.")

        if Empresa.objects.filter(cnpj=data["cnpj"]).exists():
            raise ValueError("CNPJ já cadastrado.")
        empresa = Empresa.objects.create(
            nome=data["nome"],
            cnpj=data["cnpj"],
            porte=data["porte"],    
            setor=data["setor"],
            descricao=data["descricao"]
        )
        return empresa
    except Exception as e:
        raise ValueError(str(e))
    
def editar_empresa(id_empresa: int, data: dict) -> Empresa:
    try:
        empresa = Empresa.objects.get(id_empresa=id_empresa)
        empresa.nome = data.get("nome", empresa.nome)
        empresa.cnpj = data.get("cnpj", empresa.cnpj)
        empresa.porte = data.get("porte", empresa.porte)
        empresa.setor = data.get("setor", empresa.setor)
        empresa.descricao = data.get("descricao", empresa.descricao)
        empresa.save()
        return empresa
    except Empresa.DoesNotExist:
        raise ValueError("Empresa não encontrada.")
    except Exception as e:
        raise ValueError(str(e))


def deletar_empresa(id_empresa: int):
    try:
        empresa = Empresa.objects.get(id_empresa=id_empresa)
        empresa.delete()
    except Empresa.DoesNotExist:
        raise ValueError("Empresa não encontrada.")

def listar_auditorias(user) -> list:
    if user.is_superuser:
        auditorias = Auditoria.objects.select_related('empresa', 'norma', 'auditor').all()
    else:
        try:
            auditor = Auditor.objects.get(id_user=user)
        except Auditor.DoesNotExist:
            return []
        auditorias = Auditoria.objects.select_related('empresa', 'norma', 'auditor').filter(auditor=auditor)

    return [
        {
            'id_auditoria': a.id_auditoria,
            'nome': a.nome or f'Auditoria #{a.id_auditoria}',
            'empresa': a.empresa.nome,
            'norma': a.norma.nome,
            'auditor': a.auditor.nome_auditor,
            'data_auditoria': str(a.data_auditoria),
            'descricao': a.descricao,
            'status': a.status,
            'pode_editar_concluida': user.is_superuser,
        }
        for a in auditorias
    ]


def criar_auditoria(data: dict, user) -> Auditoria:
    try:
        empresa = Empresa.objects.get(id_empresa=data["id_empresa"])
        norma = Norma.objects.get(id_norma=data["id_norma"])
        auditor = Auditor.objects.get(id_user=user)
    except Auditor.DoesNotExist:
        raise ValueError("Usuário não possui perfil de auditor.")
    except Empresa.DoesNotExist:
        raise ValueError("Empresa não encontrada.")
    except Norma.DoesNotExist:
        raise ValueError("Norma não encontrada.")

    auditoria = Auditoria.objects.create(
        nome=data.get("nome") or "",
        empresa=empresa,
        norma=norma,
        auditor=auditor,
        data_auditoria=data["data_auditoria"],
        descricao=data["descricao"],
    )
    return auditoria

def editar_auditoria(id_auditoria: int, data: dict, user) -> Auditoria:
    try:
        auditoria = Auditoria.objects.get(id_auditoria=id_auditoria)
    except Auditoria.DoesNotExist:
        raise ValueError("Auditoria não encontrada.")

    if auditoria.status == SituacaoChoices.CONCLUIDA and not user.is_superuser:
        raise ValueError("Auditoria concluída só pode ser editada por um superusuário.")

    antes = _snapshot_auditoria(auditoria)

    if not user.is_superuser:
        try:
            auditor = Auditor.objects.get(id_user=user)
            if auditoria.auditor != auditor:
                raise ValueError("Você não tem permissão para editar esta auditoria.")
        except Auditor.DoesNotExist:
            raise ValueError("Usuário não possui perfil de auditor.")

    if "id_empresa" in data:
        try:
            auditoria.empresa = Empresa.objects.get(id_empresa=data["id_empresa"])
        except Empresa.DoesNotExist:
            raise ValueError("Empresa não encontrada.")

    if "id_norma" in data:
        try:
            auditoria.norma = Norma.objects.get(id_norma=data["id_norma"])
        except Norma.DoesNotExist:
            raise ValueError("Norma não encontrada.")

    auditoria.data_auditoria = data.get("data_auditoria", auditoria.data_auditoria)
    auditoria.nome = data.get("nome", auditoria.nome)
    auditoria.descricao = data.get("descricao", auditoria.descricao)
    auditoria.save()

    depois = _snapshot_auditoria(auditoria)
    registrar_log_modificacao(
        auditoria=auditoria,
        usuario=user,
        acao='atualizacao',
        entidade='auditoria',
        objeto_id=auditoria.id_auditoria,
        alteracoes=_diff_campos(antes, depois),
    )
    return auditoria


def deletar_auditoria(id_auditoria: int, user):
    try:
        auditoria = Auditoria.objects.get(id_auditoria=id_auditoria)
    except Auditoria.DoesNotExist:
        raise ValueError("Auditoria não encontrada.")

    if not user.is_superuser:
        try:
            auditor = Auditor.objects.get(id_user=user)
            if auditoria.auditor != auditor:
                raise ValueError("Você não tem permissão para excluir esta auditoria.")
        except Auditor.DoesNotExist:
            raise ValueError("Usuário não possui perfil de auditor.")

    auditoria.delete()


def montar_payload_controle(controle, resposta):
    return {
        'controle': {
            'id': controle.id_controle,
            'indice': controle.indice_norma,
            'titulo': controle.titulo,
            'descricao': controle.descricao,
            'categoria': controle.categoria,
            'tipos_controle': list(controle.tipos_controle.values('id_tipo_controle', 'nome')),
            'propriedades_si': list(controle.propriedades_si.values('id_propriedade', 'nome')),
            'conceitos_si': list(controle.conceitos_si.values('id_conceito', 'nome')),
            'capacidades_operacionais': list(controle.capacidades_operacionais.values('id_capacidade', 'nome')),
            'dominios_seguranca': list(controle.dominios_seguranca.values('id_dominio', 'nome')),
            'temas_controle': list(controle.temas_controle.values('id_tema', 'nome')),
        },
        'resposta': {
            'situacao': resposta.situacao if resposta else None,
            'observacoes': resposta.observacoes if resposta else None,
            'justificativa': resposta.justificativa if resposta else None,
            'possui_andamento': resposta.possui_andamento if resposta else None,
        }
    }
 
 
def salvar_resposta_27002(auditoria, controle, data, user=None):
    resposta_antiga = RespostasAuditoria27002.objects.filter(
        auditoria=auditoria,
        controle=controle,
    ).first()
    antes = _snapshot_resposta(resposta_antiga)

    resposta, _ = RespostasAuditoria27002.objects.update_or_create(
        auditoria=auditoria,
        controle=controle,
        defaults={
            'situacao': data['situacao'],
            'observacoes': data.get('observacoes', ''),
            'justificativa': data.get('justificativa', ''),
            'possui_andamento': data.get('possui_andamento', False),
        }
    )
    depois = _snapshot_resposta(resposta)
    registrar_log_modificacao(
        auditoria=auditoria,
        usuario=user,
        acao='atualizacao',
        entidade='resposta_27002',
        objeto_id=controle.id_controle,
        alteracoes=_diff_campos(antes, depois),
    )
    return resposta
 
 
def proximo_controle_27002(id_controle_atual):
    return Controle27002.objects.filter(
        id_controle__gt=id_controle_atual
    ).order_by('id_controle').first()
 
 
def retomar_auditoria_27002(auditoria):
    respondidos = RespostasAuditoria27002.objects.filter(
        auditoria=auditoria
    ).values_list('controle_id', flat=True)
 
    return Controle27002.objects.exclude(
        id_controle__in=respondidos
    ).order_by('id_controle').first()
 
 
def montar_payload_controle_27701(controle, resposta):
    return {
        'controle': {
            'id': controle.id_controle,
            'indice': controle.indice_norma,
            'titulo': controle.titulo,
            'anexoB': controle.anexoB,
            'orientacao_anexoB': controle.orientacao_anexoB,
            'atributos_anexos': list(controle.atributos_anexos.values('id_atributo', 'nome', 'descricao')),
            'tipos_controle_anexo': list(controle.tipos_controle_anexo.values('id_tipo_controle_anexo', 'nome', 'descricao')),
        },
        'resposta': {
            'situacao': resposta.situacao if resposta else None,
            'observacoes': resposta.observacoes if resposta else None,
            'justificativa': resposta.justificativa if resposta else None,
            'possui_andamento': resposta.possui_andamento if resposta else None,
        }
    }
 
 
def salvar_resposta_27701(auditoria, controle, data, user=None):
    resposta_antiga = RespostasAuditoria27701.objects.filter(
        auditoria=auditoria,
        controle=controle,
    ).first()
    antes = _snapshot_resposta(resposta_antiga)

    resposta, _ = RespostasAuditoria27701.objects.update_or_create(
        auditoria=auditoria,
        controle=controle,
        defaults={
            'situacao': data['situacao'],
            'observacoes': data.get('observacoes', ''),
            'justificativa': data.get('justificativa', ''),
            'possui_andamento': data.get('possui_andamento', False),
        }
    )
    depois = _snapshot_resposta(resposta)
    registrar_log_modificacao(
        auditoria=auditoria,
        usuario=user,
        acao='atualizacao',
        entidade='resposta_27701',
        objeto_id=controle.id_controle,
        alteracoes=_diff_campos(antes, depois),
    )
    return resposta
 
 
def proximo_controle_27701(id_controle_atual):
    return Controle27701.objects.filter(
        id_controle__gt=id_controle_atual
    ).order_by('id_controle').first()
 
 
def retomar_auditoria_27701(auditoria):
    respondidos = RespostasAuditoria27701.objects.filter(
        auditoria=auditoria
    ).values_list('controle_id', flat=True)
 
    return Controle27701.objects.exclude(
        id_controle__in=respondidos
    ).order_by('id_controle').first()
    
def listar_respostas_auditoria_27002(auditoria):
    """Retorna todos os controles 27002 com suas respostas para uma auditoria."""
    controles = Controle27002.objects.prefetch_related(
        'tipos_controle', 'propriedades_si', 'conceitos_si',
        'capacidades_operacionais', 'dominios_seguranca', 'temas_controle'
    ).all().order_by('id_controle')

    respostas_map = {
        r.controle_id: r
        for r in RespostasAuditoria27002.objects.filter(auditoria=auditoria)
    }

    return [
        montar_payload_controle(controle, respostas_map.get(controle.id_controle))
        for controle in controles
    ]


def listar_respostas_auditoria_27701(auditoria):
    """Retorna todos os controles 27701 com suas respostas para uma auditoria."""
    controles = Controle27701.objects.prefetch_related(
        'atributos_anexos', 'tipos_controle_anexo'
    ).all().order_by('id_controle')

    respostas_map = {
        r.controle_id: r
        for r in RespostasAuditoria27701.objects.filter(auditoria=auditoria)
    }

    return [
        montar_payload_controle_27701(controle, respostas_map.get(controle.id_controle))
        for controle in controles
    ]


def listar_logs_modificacao(auditoria):
    return [
        {
            'id_log': log.id_log,
            'auditoria': log.auditoria_id,
            'usuario': log.usuario.username if log.usuario else None,
            'acao': log.acao,
            'entidade': log.entidade,
            'objeto_id': log.objeto_id,
            'alteracoes': log.alteracoes,
            'criado_em': log.criado_em.isoformat(),
        }
        for log in LogModificacao.objects.filter(auditoria=auditoria)
    ]

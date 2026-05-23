import json
from pathlib import Path

from .models import (
    Auditoria,
    RespostasAuditoria27002,
    RespostasAuditoria27701,
    Evidencias27002,
    Evidencias27701,
)


def _base_data_dir() -> Path:
    return Path(__file__).resolve().parent.parent / 'data'


def ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def _auditoria_dir(id_auditoria: int) -> Path:
    """normas/data/auditoria_<id>/"""
    return _base_data_dir() / f'auditoria_{id_auditoria}'


def relatorio_path(id_auditoria: int) -> Path:
    """normas/data/auditoria_<id>/relatorio.json"""
    d = _auditoria_dir(id_auditoria)
    ensure_dir(d)
    return d / 'relatorio.json'


def evidencia_storage_paths(
    id_auditoria: int,
    id_controle: int,
    *,
    nome_arquivo: str,
    norma_slug: str = '',
):
    """Retorna (pasta_absoluta, arquivo_absoluto, rel_para_MEDIA_ROOT).

    Estrutura no disco:
      data/auditoria_<id>/evidencias/<norma_slug>_controle_<id_controle>_<arquivo>
    """
    auditoria_dir = _auditoria_dir(id_auditoria)
    pasta = auditoria_dir / 'evidencias'
    ensure_dir(pasta)

    nome_final = f'{norma_slug}_controle_{id_controle}_{nome_arquivo}'
    arquivo = pasta / nome_final
    rel = Path(f'auditoria_{id_auditoria}') / 'evidencias' / nome_final
    return pasta, arquivo, rel.as_posix()


def montar_relatorio_json(auditoria: Auditoria) -> dict:
    respostas = []

    for r in RespostasAuditoria27002.objects.filter(auditoria=auditoria).select_related('controle'):
        respostas.append({
            'controle_id': r.controle_id,
            'controle_indice': r.controle.indice_norma,
            'controle_titulo': r.controle.titulo,
            'norma': '27002',
            'resposta': {
                'situacao': r.situacao,
                'observacoes': r.observacoes,
                'justificativa': r.justificativa,
                'possui_andamento': r.possui_andamento,
            },
            'evidencias': [
                {
                    'id': ev.id_evidencia,
                    'descricao': ev.descricao,
                    'arquivo': ev.arquivo.url if getattr(ev.arquivo, 'url', None) else None,
                }
                for ev in Evidencias27002.objects.filter(resposta_auditoria=r).order_by('id_evidencia')
            ],
        })

    for r in RespostasAuditoria27701.objects.filter(auditoria=auditoria).select_related('controle'):
        respostas.append({
            'controle_id': r.controle_id,
            'controle_indice': r.controle.indice_norma,
            'controle_titulo': r.controle.titulo,
            'norma': '27701',
            'resposta': {
                'situacao': r.situacao,
                'observacoes': r.observacoes,
                'justificativa': r.justificativa,
                'possui_andamento': r.possui_andamento,
            },
            'evidencias': [
                {
                    'id': ev.id_evidencia,
                    'descricao': ev.descricao,
                    'arquivo': ev.arquivo.url if getattr(ev.arquivo, 'url', None) else None,
                }
                for ev in Evidencias27701.objects.filter(resposta_auditoria=r).order_by('id_evidencia')
            ],
        })

    return {
        'auditoria': {
            'id_auditoria': auditoria.id_auditoria,
            'empresa': auditoria.empresa.nome,
            'norma': auditoria.norma.nome,
            'data_auditoria': str(auditoria.data_auditoria),
            'descricao': auditoria.descricao,
            'status': auditoria.status,
        },
        'respostas': respostas,
    }


def atualizar_relatorio_json(auditoria: Auditoria) -> Path:
    path = relatorio_path(auditoria.id_auditoria)
    payload = montar_relatorio_json(auditoria)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return path
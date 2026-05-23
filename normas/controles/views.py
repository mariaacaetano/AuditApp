from django.http import JsonResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view

from . import utils
from .models import (
    Norma,
    Empresa,
    Auditoria,
    SituacaoChoices,
    Controle27002,
    RespostasAuditoria27002,
    Controle27701,
    RespostasAuditoria27701,
    Evidencias27002,
    Evidencias27701,
)
from .evidencias_helpers import (
    evidencia_storage_paths,
    atualizar_relatorio_json,
)


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

def _auditoria_por_id(id_auditoria: int) -> Auditoria:
    return Auditoria.objects.get(id_auditoria=id_auditoria)


def _evidencia_url(evid_obj):
    try:
        return evid_obj.arquivo.url
    except Exception:
        return None


def _auditoria_concluida_sem_permissao(id_auditoria: int, user) -> bool:
    status_atual = (
        Auditoria.objects.filter(id_auditoria=id_auditoria)
        .values_list('status', flat=True)
        .first()
    )
    return status_atual == 'CONCLUIDA' and not user.is_superuser


# ---------------------------------------------------------------------------
# Normas
# ---------------------------------------------------------------------------

@api_view(['GET'])
def normas_list(request):
    normas = Norma.objects.all().values()
    return JsonResponse(list(normas), safe=False, status=200)


# ---------------------------------------------------------------------------
# Empresas
# ---------------------------------------------------------------------------

@api_view(['GET'])
def empresas_list(request):
    empresas = Empresa.objects.all().values()
    return JsonResponse(list(empresas), safe=False, status=200)


@api_view(['POST'])
def empresa_create(request):
    empresa = utils.criar_empresa(request.data)
    return JsonResponse(
        {"mensagem": f"A empresa {empresa.nome} foi adicionada à base com sucesso."},
        status=201,
    )


@api_view(['PUT'])
def empresa_edit(request, id_empresa):
    empresa = utils.editar_empresa(id_empresa, request.data)
    return JsonResponse(
        {"mensagem": f"Empresa {empresa.nome} atualizada com sucesso."},
        status=200,
    )


@api_view(['DELETE'])
def empresa_delete(request, id_empresa):
    utils.deletar_empresa(id_empresa)
    return JsonResponse({"mensagem": "Empresa excluída com sucesso."}, status=200)


# ---------------------------------------------------------------------------
# Auditorias
# ---------------------------------------------------------------------------

@api_view(['POST'])
def auditoria_create(request):
    try:
        auditoria = utils.criar_auditoria(request.data, request.user)
        return JsonResponse(
            {"mensagem": f"A auditoria para a empresa {auditoria.empresa.nome} foi criada com sucesso."},
            status=201,
        )
    except ValueError as e:
        return JsonResponse({"detail": str(e)}, status=400)


@api_view(['PUT'])
def auditoria_edit(request, id_auditoria):
    try:
        auditoria = utils.editar_auditoria(id_auditoria, request.data, request.user)
        return JsonResponse(
            {"mensagem": f"Auditoria {auditoria.id_auditoria} atualizada com sucesso."},
            status=200,
        )
    except ValueError as e:
        return JsonResponse({"detail": str(e)}, status=400)


@api_view(['DELETE'])
def auditoria_delete(request, id_auditoria):
    try:
        utils.deletar_auditoria(id_auditoria, request.user)
        return JsonResponse({"mensagem": "Auditoria excluída com sucesso."}, status=200)
    except ValueError as e:
        return JsonResponse({"detail": str(e)}, status=400)


@api_view(['GET'])
def auditorias_list(request):
    auditorias = utils.listar_auditorias(request.user)
    return JsonResponse(auditorias, safe=False, status=200)


@api_view(['GET', 'PATCH'])
def auditoria_detail(request, id_auditoria):
    try:
        auditoria = Auditoria.objects.get(id_auditoria=id_auditoria)
    except Auditoria.DoesNotExist:
        return JsonResponse({"detail": "Auditoria não encontrada."}, status=404)

    if request.method == 'GET':
        return JsonResponse({
            'id_auditoria': auditoria.id_auditoria,
            'nome': auditoria.nome or f'Auditoria #{auditoria.id_auditoria}',
            'empresa': auditoria.empresa.nome,
            'norma': auditoria.norma.nome,
            'auditor': auditoria.auditor.nome_auditor,
            'data_auditoria': str(auditoria.data_auditoria),
            'descricao': auditoria.descricao,
            'status': auditoria.status,
            'is_superuser': request.user.is_superuser,
        })

    # PATCH
    antes = {'status': auditoria.status}
    novo_status = request.data.get('status')
    if novo_status:
        auditoria.status = novo_status
        auditoria.save()
    depois = {'status': auditoria.status}

    utils.registrar_log_modificacao(
        auditoria=auditoria,
        usuario=request.user,
        acao='atualizacao',
        entidade='auditoria',
        objeto_id=auditoria.id_auditoria,
        alteracoes={
            campo: {'antes': antes[campo], 'depois': depois[campo]}
            for campo in antes
            if antes[campo] != depois[campo]
        },
    )
    return JsonResponse({
        "mensagem": f"Auditoria {auditoria.id_auditoria} atualizada com sucesso.",
        "status": auditoria.status,
    })


@api_view(['GET'])
def logs_modificacao_auditoria(request, id_auditoria):
    try:
        auditoria = Auditoria.objects.get(id_auditoria=id_auditoria)
    except Auditoria.DoesNotExist:
        return JsonResponse({"detail": "Auditoria não encontrada."}, status=404)

    return JsonResponse(utils.listar_logs_modificacao(auditoria), safe=False, status=200)


# ---------------------------------------------------------------------------
# Controles 27002
# ---------------------------------------------------------------------------

class RespostaControle27002View(APIView):
    def get(self, request, id_auditoria, id_controle):
        auditoria = Auditoria.objects.get(id_auditoria=id_auditoria)
        controle = Controle27002.objects.get(id_controle=id_controle)
        resposta = RespostasAuditoria27002.objects.filter(
            auditoria=auditoria, controle=controle
        ).first()
        return Response(utils.montar_payload_controle(controle, resposta))

    def post(self, request, id_auditoria, id_controle):
        auditoria = Auditoria.objects.get(id_auditoria=id_auditoria)
        if auditoria.status == SituacaoChoices.CONCLUIDA and not request.user.is_superuser:
            return Response(
                {'detail': 'Auditoria concluída não permite alteração de respostas.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        controle = Controle27002.objects.get(id_controle=id_controle)
        utils.salvar_resposta_27002(auditoria, controle, request.data, request.user)
        proximo = utils.proximo_controle_27002(id_controle)
        return Response({
            'mensagem': f'Resposta ao controle {controle.indice_norma} salva com sucesso.',
            'proximo_controle_id': proximo.id_controle if proximo else None,
            'proximo_controle_indice': proximo.indice_norma if proximo else None,
            'auditoria_concluida': proximo is None,
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def retomar_auditoria_27002(request, id_auditoria):
    auditoria = Auditoria.objects.get(id_auditoria=id_auditoria)
    proximo = utils.retomar_auditoria_27002(auditoria)
    if proximo is None:
        return Response({'mensagem': 'Todos os controles já foram respondidos.'})
    return Response({
        'proximo_controle_id': proximo.id_controle,
        'proximo_controle_indice': proximo.indice_norma,
    })


@api_view(['GET'])
def respostas_auditoria_27002(request, id_auditoria):
    try:
        auditoria = Auditoria.objects.get(id_auditoria=id_auditoria)
    except Auditoria.DoesNotExist:
        return JsonResponse({"detail": "Auditoria não encontrada."}, status=404)
    return JsonResponse(
        utils.listar_respostas_auditoria_27002(auditoria),
        safe=False, status=200,
    )


# ---------------------------------------------------------------------------
# Controles 27701
# ---------------------------------------------------------------------------

class RespostaControle27701View(APIView):
    def get(self, request, id_auditoria, id_controle):
        auditoria = Auditoria.objects.get(id_auditoria=id_auditoria)
        controle = Controle27701.objects.get(id_controle=id_controle)
        resposta = RespostasAuditoria27701.objects.filter(
            auditoria=auditoria, controle=controle
        ).first()
        return Response(utils.montar_payload_controle_27701(controle, resposta))

    def post(self, request, id_auditoria, id_controle):
        auditoria = Auditoria.objects.get(id_auditoria=id_auditoria)
        if auditoria.status == SituacaoChoices.CONCLUIDA and not request.user.is_superuser:
            return Response(
                {'detail': 'Auditoria concluída não permite alteração de respostas.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        controle = Controle27701.objects.get(id_controle=id_controle)
        utils.salvar_resposta_27701(auditoria, controle, request.data, request.user)
        proximo = utils.proximo_controle_27701(id_controle)
        return Response({
            'mensagem': f'Resposta ao controle {controle.indice_norma} salva com sucesso.',
            'proximo_controle_id': proximo.id_controle if proximo else None,
            'proximo_controle_indice': proximo.indice_norma if proximo else None,
            'auditoria_concluida': proximo is None,
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def retomar_auditoria_27701(request, id_auditoria):
    auditoria = Auditoria.objects.get(id_auditoria=id_auditoria)
    proximo = utils.retomar_auditoria_27701(auditoria)
    if proximo is None:
        return Response({'mensagem': 'Todos os controles já foram respondidos.'})
    return Response({
        'proximo_controle_id': proximo.id_controle,
        'proximo_controle_indice': proximo.indice_norma,
    })


@api_view(['GET'])
def respostas_auditoria_27701(request, id_auditoria):
    try:
        auditoria = Auditoria.objects.get(id_auditoria=id_auditoria)
    except Auditoria.DoesNotExist:
        return JsonResponse({"detail": "Auditoria não encontrada."}, status=404)
    return JsonResponse(
        utils.listar_respostas_auditoria_27701(auditoria),
        safe=False, status=200,
    )


# ---------------------------------------------------------------------------
# Evidências 27002
# ---------------------------------------------------------------------------

class Evidencias27002View(APIView):
    def get(self, request, id_auditoria: int, id_controle: int):
        auditoria = _auditoria_por_id(id_auditoria)
        controle = Controle27002.objects.get(id_controle=id_controle)
        resposta = RespostasAuditoria27002.objects.filter(
            auditoria=auditoria, controle=controle
        ).first()

        if not resposta:
            return Response([], status=status.HTTP_200_OK)

        evids = Evidencias27002.objects.filter(resposta_auditoria=resposta).order_by('id_evidencia')
        payload = [
            {'id': e.id_evidencia, 'descricao': e.descricao, 'arquivo': _evidencia_url(e)}
            for e in evids
        ]
        return Response(payload, status=status.HTTP_200_OK)

    def post(self, request, id_auditoria: int, id_controle: int):
        if _auditoria_concluida_sem_permissao(id_auditoria, request.user):
            return Response(
                {'detail': 'Auditoria concluída não permite alteração.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        auditoria = _auditoria_por_id(id_auditoria)
        controle = Controle27002.objects.get(id_controle=id_controle)
        resposta = RespostasAuditoria27002.objects.filter(
            auditoria=auditoria, controle=controle
        ).first()
        if not resposta:
            return Response(
                {'detail': 'Salve a resposta antes de anexar evidências.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        arquivo = request.FILES.get('arquivo')
        if not arquivo:
            return Response({'detail': 'Arquivo é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        descricao = request.data.get('descricao') or ''
        pasta, full_path, rel = evidencia_storage_paths(
            id_auditoria=id_auditoria,
            id_controle=id_controle,
            nome_arquivo=arquivo.name,
            norma_slug='27002',
        )

        with open(full_path, 'wb+') as dest:
            for chunk in arquivo.chunks():
                dest.write(chunk)

        Evidencias27002.objects.create(
            resposta_auditoria=resposta,
            descricao=descricao,
            arquivo=rel,
        )

        try:
            atualizar_relatorio_json(auditoria)
        except Exception:
            pass

        evids = Evidencias27002.objects.filter(resposta_auditoria=resposta).order_by('id_evidencia')
        payload = [
            {'id': e.id_evidencia, 'descricao': e.descricao, 'arquivo': _evidencia_url(e)}
            for e in evids
        ]
        return Response(payload, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Evidências 27701
# ---------------------------------------------------------------------------

class Evidencias27701View(APIView):
    def get(self, request, id_auditoria: int, id_controle: int):
        auditoria = _auditoria_por_id(id_auditoria)
        controle = Controle27701.objects.get(id_controle=id_controle)
        resposta = RespostasAuditoria27701.objects.filter(
            auditoria=auditoria, controle=controle
        ).first()

        if not resposta:
            return Response([], status=status.HTTP_200_OK)

        evids = Evidencias27701.objects.filter(resposta_auditoria=resposta).order_by('id_evidencia')
        payload = [
            {'id': e.id_evidencia, 'descricao': e.descricao, 'arquivo': _evidencia_url(e)}
            for e in evids
        ]
        return Response(payload, status=status.HTTP_200_OK)

    def post(self, request, id_auditoria: int, id_controle: int):
        if _auditoria_concluida_sem_permissao(id_auditoria, request.user):
            return Response(
                {'detail': 'Auditoria concluída não permite alteração.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        auditoria = _auditoria_por_id(id_auditoria)
        controle = Controle27701.objects.get(id_controle=id_controle)
        resposta = RespostasAuditoria27701.objects.filter(
            auditoria=auditoria, controle=controle
        ).first()
        if not resposta:
            return Response(
                {'detail': 'Salve a resposta antes de anexar evidências.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        arquivo = request.FILES.get('arquivo')
        if not arquivo:
            return Response({'detail': 'Arquivo é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        descricao = request.data.get('descricao') or ''
        pasta, full_path, rel = evidencia_storage_paths(
            id_auditoria=id_auditoria,
            id_controle=id_controle,
            nome_arquivo=arquivo.name,
            norma_slug='27701',
        )

        with open(full_path, 'wb+') as dest:
            for chunk in arquivo.chunks():
                dest.write(chunk)

        Evidencias27701.objects.create(
            resposta_auditoria=resposta,
            descricao=descricao,
            arquivo=rel,
        )

        try:
            atualizar_relatorio_json(auditoria)
        except Exception:
            pass

        evids = Evidencias27701.objects.filter(resposta_auditoria=resposta).order_by('id_evidencia')
        payload = [
            {'id': e.id_evidencia, 'descricao': e.descricao, 'arquivo': _evidencia_url(e)}
            for e in evids
        ]
        return Response(payload, status=status.HTTP_201_CREATED)

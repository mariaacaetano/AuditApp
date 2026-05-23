import os
import csv
import sys
import django

BASE_PROJECT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
sys.path.append(BASE_PROJECT)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from controles.models import (
    Norma,
    TipoControle,
    PropriedadeSI,
    ConceitoSI,
    CapacidadeOperacional,
    DominioSeguranca,
    TemaControle,
    Controle27002,
    AtributosAnexos,
    TipoControleAnexo,
    Controle27701
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def abrir_csv(nome_arquivo):
    caminho = os.path.join(BASE_DIR, nome_arquivo)

    with open(caminho, mode='r', encoding='utf-8-sig') as arquivo:
        leitor = csv.DictReader(arquivo)
        return list(leitor)


#normas
def inserir_normas():
    dados = abrir_csv('normas.csv')
    for row in dados:
        Norma.objects.update_or_create(
            id_norma=row['id_norma'],
            defaults={
                'nome': row['nome'],
                'descricao': row['descricao'],
                'versao': row['versao']
            }
        )
    print('Normas inseridas.')


# controles 27002 e auxiliares
def inserir_tipo_controle():
    dados = abrir_csv('controles 27002 - tipo_controle.csv')
    for row in dados:
        TipoControle.objects.get_or_create(
            nome=row['tipo_controle'].strip().lower(),
            defaults={
                'descricao': row['descricao']
            }
        )
    print('TipoControle inserido')


def inserir_propriedade_si():
    dados = abrir_csv('controles 27002 - propriedade_si.csv')
    for row in dados:
        PropriedadeSI.objects.get_or_create(
            nome=row['propriedade_si'].strip().lower(),
            defaults={
                'descricao': row['descricao']
            }
        )
    print('PropriedadeSI inserido')


def inserir_conceito_si():
    dados = abrir_csv('controles 27002 - conceito_si.csv')
    for row in dados:
        ConceitoSI.objects.get_or_create(
            nome=row['conceito_si'].strip().lower(),
            defaults={
                'descricao': row['descricao']
            }
        )
    print('ConceitoSI inserido')


def inserir_capacidade_operacional():
    dados = abrir_csv('controles 27002 - capacidade_op.csv')
    for row in dados:
        CapacidadeOperacional.objects.get_or_create(
            nome=row['propriedade_si'].strip().lower(),
            defaults={
                'descricao': row['descricao']
            }
        )
    print('CapacidadeOperacional inserido')


def inserir_dominio_seg():
    dados = abrir_csv('controles 27002 - domínio_seg.csv')
    for row in dados:
        DominioSeguranca.objects.get_or_create(
            nome=row['propriedade_si'].strip().lower(),
            defaults={
                'descricao': row['descricao'],
                'propriedade_inclui': row['prop_inclui']
            }
        )
    print('DominioSeguranca inserido')


def inserir_tema_controle():
    dados = abrir_csv('controles 27002 - tema_controle.csv')
    for row in dados:
        TemaControle.objects.get_or_create(
            nome=row['tema'].strip().lower(),
            defaults={
                'descricao': row['descricao']
            }
        )
    print('TemaControle inserido')


def texto_para_lista(valor):
    valor = valor.replace('[', '').replace(']', '')
    valor = valor.replace('"', '')
    return [v.strip().lower() for v in valor.split(',')]

def inserir_controles_27002():

    norma = Norma.objects.get(nome='ISO 27001')
    dados = abrir_csv('controles 27002.csv')

    for row in dados:
        controle, created = Controle27002.objects.get_or_create(
            norma=norma,
            indice_norma=row['id_iso'],
            defaults={
                'titulo': row['titulo'],
                'descricao': row['descricao_controle']
            }
        )

        tipos = texto_para_lista(row['tipo_controle'])
        for nome in tipos:
            try:
                obj = TipoControle.objects.get(nome=nome)
                controle.tipos_controle.add(obj)
            except TipoControle.DoesNotExist:
                print(f'  [AVISO] TipoControle não encontrado: "{nome}" (controle {row["id_iso"]})')

        propriedades = texto_para_lista(row['propriedade_si'])
        for nome in propriedades:
            try:
                obj = PropriedadeSI.objects.get(nome=nome)
                controle.propriedades_si.add(obj)
            except PropriedadeSI.DoesNotExist:
                print(f'  [AVISO] PropriedadeSI não encontrada: "{nome}" (controle {row["id_iso"]})')

        conceitos = texto_para_lista(row['conceito_si'])
        for nome in conceitos:
            try:
                obj = ConceitoSI.objects.get(nome=nome)
                controle.conceitos_si.add(obj)
            except ConceitoSI.DoesNotExist:
                print(f'  [AVISO] ConceitoSI não encontrado: "{nome}" (controle {row["id_iso"]})')

        capacidades = texto_para_lista(row['capacidade_op'])
        for nome in capacidades:
            try:
                obj = CapacidadeOperacional.objects.get(nome=nome)
                controle.capacidades_operacionais.add(obj)
            except CapacidadeOperacional.DoesNotExist:
                print(f'  [AVISO] CapacidadeOperacional não encontrada: "{nome}" (controle {row["id_iso"]})')

        dominios = texto_para_lista(row['dominio_seg'])
        for nome in dominios:
            try:
                obj = DominioSeguranca.objects.get(nome=nome)
                controle.dominios_seguranca.add(obj)
            except DominioSeguranca.DoesNotExist:
                print(f'  [AVISO] DominioSeguranca não encontrado: "{nome}" (controle {row["id_iso"]})')

        temas = texto_para_lista(row['tema_controle'])
        for nome in temas:
            try:
                obj = TemaControle.objects.get(nome=nome)
                controle.temas_controle.add(obj)
            except TemaControle.DoesNotExist:
                print(f'  [AVISO] TemaControle não encontrado: "{nome}" (controle {row["id_iso"]})')

    print('Controles 27002 inseridos')


# controles 27701 e auxiliares
def inserir_atributos_anexos():
    dados = abrir_csv('controles 27701 - atributo_anexo.csv')
    for row in dados:
        AtributosAnexos.objects.get_or_create(
            nome=row['atributo_anexo'].strip().lower(),
            defaults={
                'descricao': row['descricao']
            }
        )
    print('AtributosAnexos inseridos')


def inserir_tipo_controle_anexo():
    dados = abrir_csv('controles 27701 - tipo_controle_anexo.csv')
    for row in dados:
        TipoControleAnexo.objects.get_or_create(
            nome=row['tipo_controle'].strip().lower(),
            defaults={
                'descricao': row['descricao']
            }
        )
    print('TipoControleAnexo inserido')


def inserir_controles_27701():
    norma = Norma.objects.get(nome='ISO 27701')
    dados = abrir_csv('controles 27701.csv')
    for row in dados:

        controle, created = Controle27701.objects.get_or_create(
            norma=norma,
            indice_norma=row['id_iso'],
            defaults={
                'titulo': row['titulo'],
                'anexoB': row['orientacao_anexoB'],
                'orientacao_anexoB': row['descricao_orientacao_anexoB']
            }
        )

        atributos = texto_para_lista(row['atributo'])
        for nome in atributos:
            try:
                obj = AtributosAnexos.objects.get(nome=nome)
                controle.atributos_anexos.add(obj)
            except:
                pass
        
        tipos = texto_para_lista(row['tipo_controle'])
        for nome in tipos:
            try:
                obj = TipoControleAnexo.objects.get(nome=nome)
                controle.tipos_controle_anexo.add(obj)
            except:
                pass
    print('Controles 27701 inseridos')

if __name__ == '__main__':

    try:
        inserir_normas()
    except Exception as e:
        print(f'Erro ao inserir normas: {e}')
    
    try:
        inserir_tipo_controle()
        inserir_propriedade_si()
        inserir_conceito_si()
        inserir_capacidade_operacional()
        inserir_dominio_seg()
        inserir_tema_controle()
        inserir_controles_27002()
    except Exception as e:
        print(f'Erro ao inserir controles 27002: {e}')

    try:
        inserir_atributos_anexos()
        inserir_tipo_controle_anexo()
        inserir_controles_27701()
    except Exception as e:
        print(f'Erro ao inserir controles 27701: {e}')

    print('\nBase inserida com sucesso.')
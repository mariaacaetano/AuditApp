from django.contrib import admin

from .models import (
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
    Controle27701,
    Empresa,
    Auditor,
    Auditoria,
    RespostasAuditoria27002,
    RespostasAuditoria27701,
    Evidencias27002,
    Evidencias27701
)

admin.site.register(Norma)
admin.site.register(TipoControle)
admin.site.register(PropriedadeSI)
admin.site.register(ConceitoSI)
admin.site.register(CapacidadeOperacional)
admin.site.register(DominioSeguranca)
admin.site.register(TemaControle)                   
admin.site.register(Controle27002)
admin.site.register(AtributosAnexos)
admin.site.register(TipoControleAnexo)
admin.site.register(Controle27701)
admin.site.register(Empresa)
admin.site.register(Auditor)
admin.site.register(Auditoria)
admin.site.register(RespostasAuditoria27002)
admin.site.register(RespostasAuditoria27701)
admin.site.register(Evidencias27002)
admin.site.register(Evidencias27701)

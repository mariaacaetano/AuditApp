from django.urls import path
from . import views

urlpatterns = [
    path("normas/", views.normas_list, name="normas_list"),
    path("empresas/view", views.empresas_list, name="empresas"),
    path("empresas/create/", views.empresa_create, name="empresa_create"),
    path("empresas/<int:id_empresa>/edit/", views.empresa_edit, name="empresa_edit"),
    path("empresas/<int:id_empresa>/delete/", views.empresa_delete, name="empresa_delete"),
    path("auditorias/create/", views.auditoria_create, name="auditoria_create"),
    path("auditorias/view", views.auditorias_list, name="auditorias_list"),
    path("auditorias/<int:id_auditoria>/edit/", views.auditoria_edit, name="auditoria_edit"),
    path("auditorias/<int:id_auditoria>/delete/", views.auditoria_delete, name="auditoria_delete"),
    path('auditoria/<int:id_auditoria>/27002/retomar/', views.retomar_auditoria_27002, name='retomar-27002'),
    path('auditoria/<int:id_auditoria>/27002/controle/<int:id_controle>/', views.RespostaControle27002View.as_view(), name='resposta-27002'),
    path('auditoria/<int:id_auditoria>/27701/retomar/', views.retomar_auditoria_27701, name='retomar-27701'),
    path('auditoria/<int:id_auditoria>/27701/controle/<int:id_controle>/', views.RespostaControle27701View.as_view(), name='resposta-27701'),
    path('auditoria/<int:id_auditoria>/27002/respostas/', views.respostas_auditoria_27002, name='respostas-27002'),
    path('auditoria/<int:id_auditoria>/27701/respostas/', views.respostas_auditoria_27701, name='respostas-27701'),

    # Evidências (upload e listagem)
    path('auditoria/<int:id_auditoria>/27002/controle/<int:id_controle>/evidencias/', views.Evidencias27002View.as_view(), name='evidencias-27002'),
    path('auditoria/<int:id_auditoria>/27701/controle/<int:id_controle>/evidencias/', views.Evidencias27701View.as_view(), name='evidencias-27701'),


    path("auditorias/<int:id_auditoria>/logs/", views.logs_modificacao_auditoria, name="logs_modificacao_auditoria"),

    path("auditorias/<int:id_auditoria>/", views.auditoria_detail, name="auditoria_detail"),
]

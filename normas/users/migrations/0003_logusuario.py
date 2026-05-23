# Generated manually after adding user change logs

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_codigoacessocadastro'),
    ]

    operations = [
        migrations.CreateModel(
            name='LogUsuario',
            fields=[
                ('id_log', models.AutoField(primary_key=True, serialize=False)),
                ('usuario_alvo_username', models.CharField(blank=True, max_length=150, null=True)),
                ('acao', models.CharField(max_length=50)),
                ('alteracoes', models.JSONField(blank=True, default=dict)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('alterado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='logs_usuarios_executados', to=settings.AUTH_USER_MODEL)),
                ('usuario_alvo', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='logs_recebidos', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Log de Usuário',
                'verbose_name_plural': 'Logs de Usuários',
                'db_table': 'logs_usuarios',
                'ordering': ['-criado_em'],
            },
        ),
    ]

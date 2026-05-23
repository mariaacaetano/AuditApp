# Generated manually after adding modification logs

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('controles', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='LogModificacao',
            fields=[
                ('id_log', models.AutoField(primary_key=True, serialize=False)),
                ('acao', models.CharField(max_length=50)),
                ('entidade', models.CharField(max_length=80)),
                ('objeto_id', models.CharField(blank=True, max_length=80, null=True)),
                ('alteracoes', models.JSONField(blank=True, default=dict)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('auditoria', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='logs_modificacao', to='controles.auditoria')),
                ('usuario', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='logs_modificacao', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Log de Modificação',
                'verbose_name_plural': 'Logs de Modificação',
                'db_table': 'logs_modificacao',
                'ordering': ['-criado_em'],
            },
        ),
    ]

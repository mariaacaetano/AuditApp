# Generated manually after adding access-code based registration

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CodigoAcessoCadastro',
            fields=[
                ('id_codigo', models.AutoField(primary_key=True, serialize=False)),
                ('codigo', models.CharField(max_length=80, unique=True)),
                ('nome', models.CharField(blank=True, max_length=150, null=True)),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('cargo', models.CharField(default='Auditor', max_length=100)),
                ('ativo', models.BooleanField(default=True)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('usado_em', models.DateTimeField(blank=True, null=True)),
                ('criado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='codigos_acesso_criados', to=settings.AUTH_USER_MODEL)),
                ('usado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='codigos_acesso_usados', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Código de Acesso para Cadastro',
                'verbose_name_plural': 'Códigos de Acesso para Cadastro',
                'db_table': 'codigos_acesso_cadastro',
                'ordering': ['-criado_em'],
            },
        ),
    ]

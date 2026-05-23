from django.db import migrations, models


def preencher_nomes_auditorias(apps, schema_editor):
    Auditoria = apps.get_model('controles', 'Auditoria')
    for auditoria in Auditoria.objects.all():
        if not auditoria.nome:
            auditoria.nome = f'Auditoria #{auditoria.id_auditoria}'
            auditoria.save(update_fields=['nome'])


class Migration(migrations.Migration):

    dependencies = [
        ('controles', '0003_logmodificacao'),
    ]

    operations = [
        migrations.AddField(
            model_name='auditoria',
            name='nome',
            field=models.CharField(blank=True, default='', max_length=120),
        ),
        migrations.RunPython(preencher_nomes_auditorias, migrations.RunPython.noop),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0009_alter_userprofile_picture_text"),
    ]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="image_url",
            field=models.TextField(blank=True, null=True),
        ),
    ]

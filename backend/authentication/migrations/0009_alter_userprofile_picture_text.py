from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0008_product_coordinates_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="userprofile",
            name="picture",
            field=models.TextField(blank=True, null=True),
        ),
    ]

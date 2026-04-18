from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0007_alter_product_options"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="address",
            field=models.CharField(blank=True, default="", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="product",
            name="latitude",
            field=models.DecimalField(blank=True, db_index=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="product",
            name="longitude",
            field=models.DecimalField(blank=True, db_index=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AlterField(
            model_name="product",
            name="country_code",
            field=models.CharField(blank=True, db_index=True, max_length=2, null=True),
        ),
    ]

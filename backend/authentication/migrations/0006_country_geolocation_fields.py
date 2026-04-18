from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0005_userprofile_profile_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="country_code",
            field=models.CharField(db_index=True, default="CO", max_length=2),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="userprofile",
            name="country_code",
            field=models.CharField(blank=True, db_index=True, max_length=2, null=True),
        ),
    ]

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0003_userprofile_blocked_until_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=120)),
                ("category", models.CharField(blank=True, max_length=80)),
                ("image_url", models.URLField(blank=True, null=True)),
                ("daily_price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                (
                    "status",
                    models.CharField(
                        choices=[("available", "Disponible"), ("rented", "Alquilado")],
                        default="available",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "owner",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="products", to="auth.user"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="RentalRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("start_date", models.DateField()),
                ("end_date", models.DateField()),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pendiente"),
                            ("accepted", "Aceptada"),
                            ("rejected", "Rechazada"),
                            ("completed", "Completada"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("total_price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("rating_by_renter", models.DecimalField(blank=True, decimal_places=1, max_digits=2, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "product",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="rental_requests", to="authentication.product"),
                ),
                (
                    "renter",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="rental_requests", to="auth.user"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Earning",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("earned_at", models.DateTimeField(auto_now_add=True)),
                (
                    "owner",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="earnings", to="auth.user"),
                ),
                (
                    "product",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="authentication.product"),
                ),
                (
                    "rental_request",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="authentication.rentalrequest"),
                ),
            ],
            options={"ordering": ["-earned_at"]},
        ),
    ]

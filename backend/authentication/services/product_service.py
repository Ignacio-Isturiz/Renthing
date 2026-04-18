from typing import Any

from django.db.models import F, FloatField, Value
from django.db.models.expressions import ExpressionWrapper
from django.db.models.functions import ACos, Cast, Cos, Greatest, Least, Radians, Sin

from ..models import Product


class ProductQueryService:
    @staticmethod
    def list_available_nearby(*, latitude: float, longitude: float, radius_km: float, limit: int):
        # Haversine simplificado sobre esfera para Postgres sin PostGIS.
        earth_radius_km = 6371.0
        latitude_field = Cast(F("latitude"), FloatField())
        longitude_field = Cast(F("longitude"), FloatField())
        cosine_argument = (
            Cos(Radians(Value(latitude)))
            * Cos(Radians(latitude_field))
            * Cos(Radians(longitude_field) - Radians(Value(longitude)))
            + Sin(Radians(Value(latitude))) * Sin(Radians(latitude_field))
        )

        distance_expression = ExpressionWrapper(
            Value(earth_radius_km)
            * ACos(Least(Greatest(cosine_argument, Value(-1.0)), Value(1.0))),
            output_field=FloatField(),
        )

        return (
            Product.objects.filter(
                status=Product.STATUS_AVAILABLE,
                latitude__isnull=False,
                longitude__isnull=False,
            )
            .annotate(distance_km=distance_expression)
            .filter(distance_km__lte=radius_km)
            .select_related("owner")
            .order_by("distance_km", "-created_at")[:limit]
        )


class ProductWriteService:
    @staticmethod
    def create_product(*, owner, validated_data: dict[str, Any]) -> Product:
        return Product.objects.create(owner=owner, **validated_data)

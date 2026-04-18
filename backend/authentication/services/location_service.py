from dataclasses import dataclass


class CoordinatesValidationError(ValueError):
    pass


@dataclass(frozen=True)
class Coordinates:
    latitude: float
    longitude: float


class CoordinatesResolver:
    @classmethod
    def resolve(cls, *, latitude: float, longitude: float) -> Coordinates:
        if latitude < -90 or latitude > 90:
            raise CoordinatesValidationError("La latitud debe estar entre -90 y 90.")
        if longitude < -180 or longitude > 180:
            raise CoordinatesValidationError("La longitud debe estar entre -180 y 180.")

        return Coordinates(latitude=latitude, longitude=longitude)

    @classmethod
    def from_query_params(cls, query_params) -> Coordinates:
        raw_latitude = query_params.get("latitude")
        raw_longitude = query_params.get("longitude")

        if raw_latitude is None or raw_longitude is None:
            raise CoordinatesValidationError("Debes enviar latitude y longitude.")

        try:
            latitude = float(raw_latitude)
            longitude = float(raw_longitude)
        except (TypeError, ValueError) as exc:
            raise CoordinatesValidationError("latitude y longitude deben ser numericos.") from exc

        return cls.resolve(latitude=latitude, longitude=longitude)

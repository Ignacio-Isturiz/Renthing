import json
import re
from dataclasses import dataclass
from typing import Any
from urllib import error, request

from django.conf import settings


@dataclass(frozen=True)
class ProductCategoryOption:
    category: str
    subcategory: str

    @property
    def label(self) -> str:
        return f"{self.category} / {self.subcategory}"


class ProductCategoryCatalog:
    DEFAULT_LABEL = "Otros / General"

    OPTIONS = [
        ProductCategoryOption("Otros", "General"),
        ProductCategoryOption("Herramientas", "Taladros"),
        ProductCategoryOption("Herramientas", "Sierras"),
        ProductCategoryOption("Herramientas", "Lijadoras"),
        ProductCategoryOption("Herramientas", "Soldadoras"),
        ProductCategoryOption("Audio", "Parlantes"),
        ProductCategoryOption("Audio", "Equipos de sonido"),
        ProductCategoryOption("Audio", "Micrófonos"),
        ProductCategoryOption("Audio", "Consolas DJ"),
        ProductCategoryOption("Audio", "Monitores de estudio"),
        ProductCategoryOption("Fiesta", "Sonido para eventos"),
        ProductCategoryOption("Fotografía", "Cámaras"),
        ProductCategoryOption("Fotografía", "Iluminación"),
        ProductCategoryOption("Tecnología", "Computadores"),
        ProductCategoryOption("Tecnología", "Proyectores"),
        ProductCategoryOption("Tecnología", "Monitores"),
        ProductCategoryOption("Tecnología", "Impresoras"),
        ProductCategoryOption("Tecnología", "Accesorios de carga"),
        ProductCategoryOption("Hogar", "Aspiradoras"),
        ProductCategoryOption("Hogar", "Cocinas portátiles"),
        ProductCategoryOption("Hogar", "Limpieza a presión"),
        ProductCategoryOption("Fiesta", "Luces LED"),
        ProductCategoryOption("Fiesta", "Máquinas de humo"),
        ProductCategoryOption("Eventos", "Carpas"),
        ProductCategoryOption("Eventos", "Sillas"),
        ProductCategoryOption("Eventos", "Mesas"),
        ProductCategoryOption("Deporte", "Bicicletas"),
        ProductCategoryOption("Deporte", "Patines"),
        ProductCategoryOption("Deporte", "Pesas"),
        ProductCategoryOption("Construcción", "Escaleras"),
        ProductCategoryOption("Construcción", "Andamios"),
        ProductCategoryOption("Jardín", "Cortacésped"),
        ProductCategoryOption("Camping", "Carpas"),
        ProductCategoryOption("Camping", "Neveras portátiles"),
    ]

    KEYWORD_HINTS = [
        ("equipo de sonido", "Audio / Equipos de sonido"),
        ("sonido para fiestas", "Audio / Equipos de sonido"),
        ("sonido para eventos", "Fiesta / Sonido para eventos"),
        ("equipo sonido", "Audio / Equipos de sonido"),
        ("audio", "Audio / Equipos de sonido"),
        ("sonido", "Audio / Equipos de sonido"),
        ("taladro", "Herramientas / Taladros"),
        ("perforadora", "Herramientas / Taladros"),
        ("sierra", "Herramientas / Sierras"),
        ("lija", "Herramientas / Lijadoras"),
        ("soldadora", "Herramientas / Soldadoras"),
        ("parlante", "Audio / Parlantes"),
        ("bocina", "Audio / Parlantes"),
        ("microfono", "Audio / Micrófonos"),
        ("micrófono", "Audio / Micrófonos"),
        ("dj", "Audio / Consolas DJ"),
        ("estudio", "Audio / Monitores de estudio"),
        ("camara", "Fotografía / Cámaras"),
        ("cámara", "Fotografía / Cámaras"),
        ("ilumin", "Fotografía / Iluminación"),
        ("computador", "Tecnología / Computadores"),
        ("computadora", "Tecnología / Computadores"),
        ("ordenador", "Tecnología / Computadores"),
        ("laptop", "Tecnología / Computadores"),
        ("notebook", "Tecnología / Computadores"),
        ("pc", "Tecnología / Computadores"),
        ("proyector", "Tecnología / Proyectores"),
        ("monitor", "Tecnología / Monitores"),
        ("impresora", "Tecnología / Impresoras"),
        ("carga", "Tecnología / Accesorios de carga"),
        ("aspiradora", "Hogar / Aspiradoras"),
        ("cocina", "Hogar / Cocinas portátiles"),
        ("presion", "Hogar / Limpieza a presión"),
        ("presión", "Hogar / Limpieza a presión"),
        ("led", "Fiesta / Luces LED"),
        ("humo", "Fiesta / Máquinas de humo"),
        ("carpa", "Eventos / Carpas"),
        ("silla", "Eventos / Sillas"),
        ("mesa", "Eventos / Mesas"),
        ("bicicleta", "Deporte / Bicicletas"),
        ("patin", "Deporte / Patines"),
        ("patín", "Deporte / Patines"),
        ("peso", "Deporte / Pesas"),
        ("escalera", "Construcción / Escaleras"),
        ("andamio", "Construcción / Andamios"),
        ("cortacesped", "Jardín / Cortacésped"),
        ("cortacésped", "Jardín / Cortacésped"),
        ("camping", "Camping / Carpas"),
        ("nevera", "Camping / Neveras portátiles"),
        ("portatil", "Camping / Neveras portátiles"),
        ("portátil", "Camping / Neveras portátiles"),
    ]

    @classmethod
    def list_options(cls) -> list[dict[str, str]]:
        return [
            {"category": option.category, "subcategory": option.subcategory, "label": option.label}
            for option in cls.OPTIONS
        ]

    @classmethod
    def labels(cls) -> set[str]:
        return {option.label for option in cls.OPTIONS}

    @classmethod
    def is_valid_label(cls, value: str) -> bool:
        return value in cls.labels()

    @classmethod
    def suggest(cls, title: str) -> dict[str, str]:
        cleaned_title = title.strip()
        if not cleaned_title:
            raise ValueError("El titulo es requerido para sugerir categoria.")

        fallback = cls._heuristic_suggestion(cleaned_title)
        api_key = getattr(settings, "OPENAI_API_KEY", "").strip()
        if not api_key:
            return fallback

        try:
            response = cls._request_openai(api_key=api_key, title=cleaned_title)
            if response:
                return response
        except Exception:
            return fallback

        return fallback

    @classmethod
    def _heuristic_suggestion(cls, title: str) -> dict[str, str]:
        normalized = cls._normalize(title)
        matches = [
            (keyword, label)
            for keyword, label in cls.KEYWORD_HINTS
            if cls._normalize(keyword) in normalized
        ]

        if matches:
            keyword, label = sorted(matches, key=lambda item: len(cls._normalize(item[0])), reverse=True)[0]
            category, subcategory = label.split(" / ", 1)
            return {"category": category, "subcategory": subcategory, "label": label, "source": "heuristic", "match": keyword}

        default_category, default_subcategory = cls.DEFAULT_LABEL.split(" / ", 1)
        return {
            "category": default_category,
            "subcategory": default_subcategory,
            "label": cls.DEFAULT_LABEL,
            "source": "heuristic",
        }

    @classmethod
    def _request_openai(cls, *, api_key: str, title: str) -> dict[str, str] | None:
        allowed_labels = sorted(cls.labels())
        payload = {
            "model": getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
            "temperature": 0,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Clasifica productos para un marketplace de alquiler. Responde SOLO con JSON valido. "
                        "Usa la categoria y subcategoria mas especificas posibles segun el titulo. "
                        "El JSON debe tener las claves category, subcategory y label. "
                        "label debe ser exactamente una de las opciones permitidas y no inventes etiquetas nuevas."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Titulo: {title}\n\n"
                        f"Opciones permitidas:\n- " + "\n- ".join(allowed_labels) +
                        "\n\nDevuelve la opcion mejor ajustada al producto, por ejemplo equipo de sonido, parlantes o audio para eventos deben caer en Audio / Equipos de sonido o Audio / Parlantes, no en Herramientas."
                        "\n\nSi una opcion no tiene nada que ver con los opciones permitidas, dí |No identificado| y elige la opcion por defecto."
                        "\n\nSi no puedes clasificar un producto con confianza, piensa en sinónimos o palabras relacionadas al titulo para encontrar la mejor coincidencia dentro de las opciones permitidas."
                        "\n\nUtiliza lenguaje de todo los paises. Por ejemplo en venezuela se dice corneta al bafla y bafle es un equipo de sonido en colombia, en argentina se dice parlante, en colombia se dice parlante o equipo de sonido, en mexico se dice bocina o equipo de sonido, etc. No te limites a un solo país para entender el titulo."
                    ),
                },
            ],
        }

        req = request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=10) as response:
                body = json.loads(response.read().decode("utf-8"))
        except error.URLError:
            return None

        content = body["choices"][0]["message"]["content"].strip()
        parsed = cls._extract_json(content)
        if not parsed:
            return None

        label = str(parsed.get("label", "")).strip()
        if label not in allowed_labels:
            return None

        category, subcategory = label.split(" / ", 1)
        return {"category": category, "subcategory": subcategory, "label": label, "source": "openai"}

    @staticmethod
    def _normalize(value: str) -> str:
        return re.sub(r"[^a-z0-9]+", "", value.lower())

    @staticmethod
    def _extract_json(content: str) -> dict[str, Any] | None:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, flags=re.DOTALL)
            if not match:
                return None
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None
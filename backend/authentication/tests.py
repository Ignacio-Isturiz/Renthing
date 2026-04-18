from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Product


class ProductGeolocationAPITests(APITestCase):
    def setUp(self):
        self.owner_a = User.objects.create_user(
            username="owner-a@example.com",
            email="owner-a@example.com",
            password="secret123",
        )
        self.owner_b = User.objects.create_user(
            username="owner-b@example.com",
            email="owner-b@example.com",
            password="secret123",
        )

        Product.objects.create(
            owner=self.owner_a,
            title="Taladro Centro",
            category="Herramientas / Taladros",
            daily_price=50000,
            latitude=4.711000,
            longitude=-74.072100,
            address="Bogota Centro",
            status=Product.STATUS_AVAILABLE,
        )
        Product.objects.create(
            owner=self.owner_b,
            title="Parlante Norte",
            category="Audio / Parlantes",
            daily_price=30000,
            latitude=4.760000,
            longitude=-74.040000,
            address="Bogota Norte",
            status=Product.STATUS_AVAILABLE,
        )

    def test_list_nearby_products_orders_by_distance(self):
        response = self.client.get(
            "/api/auth/products/nearby/?latitude=4.7110&longitude=-74.0721&radius_km=20"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(response.data["products"][0]["title"], "Taladro Centro")
        first_distance = response.data["products"][0]["distance_km"]
        second_distance = response.data["products"][1]["distance_km"]
        self.assertLessEqual(first_distance, second_distance)

    def test_create_product_persists_coordinates_in_database(self):
        token, _ = Token.objects.get_or_create(user=self.owner_a)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        payload = {
            "title": "Proyector",
            "description": "Proyector full HD con HDMI y control remoto.",
            "category": "Tecnología / Proyectores",
            "daily_price": "45000",
            "latitude": "4.648625",
            "longitude": "-74.247894",
            "address": "Funza, Cundinamarca",
            "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
        }
        response = self.client.post("/api/auth/products/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.filter(title="Proyector", owner=self.owner_a).count(), 1)

        created = Product.objects.get(title="Proyector", owner=self.owner_a)
        self.assertEqual(float(created.latitude), 4.648625)
        self.assertEqual(float(created.longitude), -74.247894)
        self.assertEqual(created.description, "Proyector full HD con HDMI y control remoto.")

    def test_list_product_categories_returns_backend_catalog(self):
        response = self.client.get("/api/auth/product-categories/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["categories"]), 20)
        labels = {item["label"] for item in response.data["categories"]}
        self.assertIn("Herramientas / Taladros", labels)

    def test_suggest_product_category_uses_backend_catalog(self):
        response = self.client.post(
            "/api/auth/product-categories/suggest/",
            {"title": "Taladro percutor profesional"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["label"], "Herramientas / Taladros")
        self.assertEqual(response.data["category"], "Herramientas")
        self.assertEqual(response.data["subcategory"], "Taladros")

    def test_suggest_product_category_for_computer_title(self):
        response = self.client.post(
            "/api/auth/product-categories/suggest/",
            {"title": "Computador gamer de alto rendimiento"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["label"], "Tecnología / Computadores")

    def test_suggest_product_category_unknown_title_uses_neutral_fallback(self):
        response = self.client.post(
            "/api/auth/product-categories/suggest/",
            {"title": "Producto inventado xyz123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["label"], "Otros / General")
        self.assertNotEqual(response.data["label"], "Herramientas / Taladros")

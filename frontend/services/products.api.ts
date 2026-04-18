export interface PublicProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  daily_price: string;
  country_code: string | null;
  latitude: string | null;
  longitude: string | null;
  address: string;
  status: "available" | "rented";
  status_label: string;
  owner_name: string;
  distance_km: number | null;
  created_at: string;
}

interface NearbyProductsResponse {
  origin: {
    latitude: number;
    longitude: number;
  };
  radius_km: number;
  count: number;
  products: PublicProduct[];
}

export interface CreateProductPayload {
  title: string;
  description?: string;
  category: string;
  image_url: string;
  daily_price: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ProductCategoryOption {
  category: string;
  subcategory: string;
  label: string;
}

interface ProductCategoryCatalogResponse {
  categories: ProductCategoryOption[];
}

export interface ProductCategorySuggestionResponse extends ProductCategoryOption {
  source: "openai" | "heuristic";
}

export async function fetchNearbyProducts(params: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
}): Promise<NearbyProductsResponse> {
  const searchParams = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
  });

  if (params.radiusKm !== undefined) {
    searchParams.set("radius_km", String(params.radiusKm));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/products/nearby/?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`No se pudieron cargar productos cercanos (${response.status}): ${message}`);
  }

  return response.json();
}

export async function createProduct(payload: CreateProductPayload, token: string): Promise<PublicProduct> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/products/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`No se pudo crear el producto (${response.status}): ${message}`);
  }

  return response.json();
}

export async function fetchProductCategories(): Promise<ProductCategoryOption[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/product-categories/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`No se pudieron cargar las categorias (${response.status}): ${message}`);
  }

  const payload = (await response.json()) as ProductCategoryCatalogResponse;
  return payload.categories;
}

export async function suggestProductCategory(title: string): Promise<ProductCategorySuggestionResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/product-categories/suggest/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`No se pudo sugerir la categoria (${response.status}): ${message}`);
  }

  return response.json();
}

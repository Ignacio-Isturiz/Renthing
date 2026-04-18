export interface DashboardSummary {
  products_count: number;
  rented_count: number;
  pending_requests: number;
  rating: number;
  monthly_earnings: number;
}

export interface DashboardRentalRequest {
  id: number;
  product_id: number;
  product_title: string;
  product_image_url: string;
  renter_name: string;
  start_date: string;
  end_date: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  status_label: string;
  total_price: string;
  rating_by_renter: string | null;
  created_at: string;
}

export interface DashboardProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  image_url: string;
  daily_price: string;
  status: "available" | "rented";
  status_label: string;
  created_at: string;
}

export interface DashboardEarning {
  id: number;
  product_title: string;
  amount: string;
  earned_at: string;
}

export interface DashboardPayload {
  user: {
    id: number;
    name: string;
    email: string;
  };
  summary: DashboardSummary;
  pending_requests: DashboardRentalRequest[];
  active_rentals: DashboardRentalRequest[];
  products: DashboardProduct[];
  recent_earnings: DashboardEarning[];
}

export async function fetchDashboardData(token: string): Promise<DashboardPayload> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/dashboard/`, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`No se pudo cargar la dashboard (${response.status}): ${message}`);
  }

  return response.json();
}

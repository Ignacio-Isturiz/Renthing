import { redirect } from "next/navigation";

export default function LegacyUserDashboardRoute() {
  redirect("/dashboard");
}
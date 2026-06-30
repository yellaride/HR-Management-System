import { redirect } from "next/navigation";

export default function AdminPortalEntry() {
  // /admin-portal -> /admin/dashboard
  redirect("/admin/dashboard");
}


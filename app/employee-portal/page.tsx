import { redirect } from "next/navigation";

export default function EmployeePortalEntry() {
  // /employee-portal -> /employee/dashboard
  redirect("/employee/dashboard");
}


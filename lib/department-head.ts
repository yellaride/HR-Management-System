import dbConnect from "@/lib/mongodb";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { DepartmentHead } from "@/modals/DepartmentHead";
import { Employee } from "@/modals/Employee";

export type DepartmentHeadContext = {
  user: SessionUser;
  department: string;
};

/**
 * Returns the department-head context for the current session, or null.
 *
 * A user is a valid head only when ALL of the following hold (checked live
 * against the database on every request — never trusted from the JWT):
 *  1. authenticated with the "employee" role,
 *  2. a DepartmentHead mapping exists for them,
 *  3. they are still an active employee of that same department.
 */
export async function getDepartmentHeadContext(): Promise<DepartmentHeadContext | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "employee") return null;

  await dbConnect();

  const headDoc = await DepartmentHead.findOne({ userId: user.id })
    .select("department")
    .lean<{ department?: string } | null>();
  if (!headDoc?.department) return null;

  const employee = await Employee.findOne({ userId: user.id })
    .select("department status")
    .lean<{ department?: string; status?: string } | null>();

  if (!employee || employee.status === "Inactive" || employee.department !== headDoc.department) {
    return null;
  }

  return { user, department: headDoc.department };
}

/**
 * Returns userIds (as strings) of active members of a department.
 * Pass excludeUserId to leave out the head themselves — a head can never
 * act on their own records.
 */
export async function getDepartmentMemberUserIds(
  department: string,
  excludeUserId?: string
): Promise<string[]> {
  await dbConnect();
  const members = await Employee.find({ department, status: { $ne: "Inactive" } })
    .select("userId")
    .lean<{ userId?: { toString(): string } }[]>();

  return members
    .map((m) => (m.userId ? m.userId.toString() : ""))
    .filter((id) => id.length > 0 && id !== excludeUserId);
}

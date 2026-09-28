import type { Role } from "@/lib/roles";

export function isAdmin(role: Role | string | undefined): boolean {
  return role === "ADMIN";
}

export function canManageUsers(role: Role | string | undefined): boolean {
  return role === "ADMIN";
}

export function canExport(role: Role | string | undefined): boolean {
  return role === "ADMIN" || role === "VIEWER" || role === "STAFF";
}

export function canReconcile(role: Role | string | undefined): boolean {
  return role === "ADMIN" || role === "STAFF";
}

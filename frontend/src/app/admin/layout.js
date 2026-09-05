import RoleGuard from "@/components/auth/RoleGuard";

export default function AdminLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      {children}
    </RoleGuard>
  );
}

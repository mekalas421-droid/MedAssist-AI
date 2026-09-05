import RoleGuard from "@/components/auth/RoleGuard";

export default function ProviderLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["provider", "clinic"]}>
      {children}
    </RoleGuard>
  );
}

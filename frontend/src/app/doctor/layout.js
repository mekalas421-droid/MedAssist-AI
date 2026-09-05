import RoleGuard from "@/components/auth/RoleGuard";

export default function DoctorLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["doctor"]}>
      {children}
    </RoleGuard>
  );
}

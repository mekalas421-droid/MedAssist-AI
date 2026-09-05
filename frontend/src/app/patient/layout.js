import RoleGuard from "@/components/auth/RoleGuard";

export default function PatientLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      {children}
    </RoleGuard>
  );
}

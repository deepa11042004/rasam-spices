import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/admin-session";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { logoutAction } from "./actions";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar adminUsername={admin.username} logoutAction={logoutAction} />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

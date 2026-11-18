import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/admin-session";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { logoutAction } from "./actions";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col bg-admin-ivory lg:flex-row">
      <AdminSidebar adminUsername={admin.username} logoutAction={logoutAction} />

      {/* min-w-0 lets wide tables scroll inside the column instead of
          pushing the whole page sideways. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader adminUsername={admin.username} logoutAction={logoutAction} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

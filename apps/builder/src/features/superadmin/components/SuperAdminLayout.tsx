import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";

const navItems = [
  { href: "/superadmin", label: "Dashboard", icon: "📊" },
  { href: "/superadmin/branding", label: "Branding & Theming", icon: "🎨" },
  { href: "/superadmin/content", label: "Content Manager", icon: "📝" },
  { href: "/superadmin/plans", label: "Plans & Pricing", icon: "💳" },
  { href: "/superadmin/gateways", label: "Payment Gateways", icon: "🔑" },
  { href: "/superadmin/clients", label: "Client Management", icon: "🏢" },
  { href: "/superadmin/emails", label: "Email Templates", icon: "✉️" },
  { href: "/superadmin/authentication", label: "Social Login", icon: "🔐" },
  { href: "/superadmin/audit", label: "Audit Log", icon: "🔍" },
  { href: "/superadmin/app-text", label: "App Text", icon: "📱" },
];

export function SuperAdminLayout({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const router = useRouter();
  const current = router.pathname;

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <aside className="flex w-64 flex-col border-r border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2 border-b border-gray-800 px-5 py-4">
          <span className="text-lg font-bold text-white">⚙️ Super Admin</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map((item) => {
            const active =
              current === item.href ||
              (item.href !== "/superadmin" && current.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-indigo-600/20 text-indigo-300 font-medium"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-800 p-4">
          <Link
            href="/"
            className="block rounded px-3 py-2 text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300"
          >
            ← Back to App
          </Link>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center border-b border-gray-800 bg-gray-900 px-6 py-3">
          <h1 className="text-lg font-semibold text-white">{title}</h1>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-950 p-6">{children}</main>
      </div>
    </div>
  );
}

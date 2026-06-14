import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useInstallPrompt, useOnlineStatus, useServiceWorker } from "../hooks/usePwa";
import { InstallPrompt } from "./InstallPrompt";

const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: HomeIcon, exact: true },
  { href: "/app/leads", label: "Leads", icon: LeadsIcon },
  { href: "/app/bots", label: "Bots", icon: BotsIcon },
  { href: "/app/notifications", label: "Alerts", icon: BellIcon },
  { href: "/app/settings", label: "Settings", icon: SettingsIcon },
];

type Props = { children: ReactNode; title?: string; back?: string };

export function AppLayout({ children, title = "AI Chat Bot Pro", back }: Props) {
  const router = useRouter();
  const online = useOnlineStatus();
  const { state: installState, install } = useInstallPrompt();
  useServiceWorker();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ChatBot Pro" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/api/manifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 bottom-0 z-20">
          <div className="p-4 border-b border-gray-100">
            <p className="font-bold text-gray-900 text-lg">ChatBot Pro</p>
            <p className="text-xs text-gray-400">Lead Dashboard</p>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? router.pathname === href : router.pathname.startsWith(href);
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}>
                  <Icon className={`w-5 h-5 ${active ? "text-indigo-600" : "text-gray-400"}`} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-gray-100">
            <Link href="/chatbots" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
              <span>⬅</span> Back to Builder
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
          {/* Mobile header */}
          <header className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 safe-top">
            {back && (
              <button onClick={() => router.push(back)} className="p-1 -ml-1 text-gray-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="flex-1 font-semibold text-gray-900 text-base truncate">{title}</h1>
          </header>

          {/* Offline banner */}
          {!online && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
              <p className="text-xs text-amber-700 font-medium">📶 You&apos;re offline — showing cached data</p>
            </div>
          )}

          <main className="flex-1 pb-20 md:pb-0">{children}</main>
        </div>

        {/* Bottom nav — mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 flex safe-bottom">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? router.pathname === href : router.pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${active ? "text-indigo-600" : "text-gray-400"}`}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        <InstallPrompt state={installState} install={install} />
      </div>
    </>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function LeadsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function BotsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
}
function BellIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function ChevronLeft({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
}

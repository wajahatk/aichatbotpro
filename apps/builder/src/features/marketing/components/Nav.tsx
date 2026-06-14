import Link from "next/link";
import { useState } from "react";
import type { MarketingBranding } from "../lib/getMarketingData";

type Props = { branding: MarketingBranding };

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export function Nav({ branding }: Props) {
  const [open, setOpen] = useState(false);
  const grad = `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src={branding.logoUrl}
            alt={branding.appName}
            className="h-8 w-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span className="font-bold text-lg text-slate-900 tracking-tight">{branding.appName}</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/signin" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5">
            Sign in
          </Link>
          <Link href="/register" className="text-sm font-semibold text-white px-4 py-2 rounded-lg shadow-sm hover:opacity-90 transition-opacity" style={{ background: grad }}>
            Start Free Trial
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-slate-100 gap-1.5"
        >
          <span className={`block w-5 h-0.5 bg-slate-700 transition-all origin-center ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-slate-700 transition-all ${open ? "opacity-0 scale-x-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-slate-700 transition-all origin-center ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-5 py-5 space-y-1">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-slate-700 font-medium py-2.5 border-b border-slate-50">
              {l.label}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <Link href="/signin" className="block text-center border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700">
              Sign in
            </Link>
            <Link href="/register" className="block text-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ background: grad }}>
              Start Free Trial
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

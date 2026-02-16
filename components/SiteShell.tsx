"use client";

import Link from "next/link";
import { useRouter } from "next/router";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/insights", label: "Insights" },
];

type SiteShellProps = {
  children: React.ReactNode;
};

export default function SiteShell({ children }: SiteShellProps) {
  const { pathname } = useRouter();

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-3 shadow-xl shadow-slate-950/50">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Smart Bookmark App</p>
            <p className="text-sm text-slate-200">Private bookmarks with Supabase + Google signing</p>
          </div>
          <nav aria-label="Primary">
            <ul className="flex gap-3 text-sm">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`rounded-full px-3 py-1 font-semibold transition ${
                        isActive
                          ? "border border-emerald-400/80 bg-emerald-500/10 text-emerald-200"
                          : "border border-transparent text-slate-200 hover:border-slate-600"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}

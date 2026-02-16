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
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
        <header className="glass-card flex flex-col gap-2 rounded-3xl px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Smart Bookmark App</p>
              <p className="text-sm font-semibold text-white">Private bookmarks with Supabase + Google signing</p>
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
                            ? "border accent-border bg-emerald-500/10 text-emerald-200"
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
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

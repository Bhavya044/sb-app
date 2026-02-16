import "./globals.css";

export const metadata = {
  title: "Smart Bookmark Manager",
  description: "Minimal bookmark manager with Supabase, Google Auth, and real-time sync.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-slate-950 px-4 py-10">
          <div className="mx-auto max-w-4xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

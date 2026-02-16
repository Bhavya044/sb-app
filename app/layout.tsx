import "./globals.css";

export const metadata = {
  title: "Smart Bookmark Manager",
  description: "Minimal bookmark manager with Supabase, Google Auth, and real-time sync.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-transparent">
        <main className="min-h-screen px-4 py-10">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

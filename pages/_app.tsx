"use client";

import type { AppProps } from "next/app";
import SiteShell from "@/components/SiteShell";
import "@/styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SiteShell>
      <Component {...pageProps} />
    </SiteShell>
  );
}

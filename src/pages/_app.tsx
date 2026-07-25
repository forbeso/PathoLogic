import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/next";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import RouteProgress from "@/components/RouteProgress";

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <RouteProgress />
      <AppErrorBoundary key={router.asPath}>
        <Component {...pageProps} />
      </AppErrorBoundary>
      <Analytics />
    </>
  );
}

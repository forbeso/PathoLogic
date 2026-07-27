import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/next";
import { MotionConfig } from "framer-motion";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import RouteProgress from "@/components/RouteProgress";
import TelemetryProvider from "@/components/TelemetryProvider";
import { trackWebVital } from "@/lib/telemetry";

function focusMainContent() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;
  window.setTimeout(() => {
    mainContent.focus({ preventScroll: true });
    mainContent.scrollIntoView({ block: "start" });
  }, 0);
}

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <TelemetryProvider>
      <MotionConfig reducedMotion="user">
        <a
          href="#main-content"
          onClick={(event) => {
            event.preventDefault();
            focusMainContent();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            focusMainContent();
          }}
          className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-xl transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>
        <RouteProgress />
        <AppErrorBoundary key={router.asPath}>
          <Component {...pageProps} />
        </AppErrorBoundary>
        <Analytics />
      </MotionConfig>
    </TelemetryProvider>
  );
}

export function reportWebVitals(metric: {
  name: string;
  value: number;
  id: string;
  label?: string;
}) {
  trackWebVital(metric);
}

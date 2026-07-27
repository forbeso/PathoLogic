import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/router";
import { Wifi, WifiOff } from "lucide-react";
import { reportClientIssue } from "@/lib/telemetry";

type ConnectionState = "online" | "offline" | "restored";

export default function TelemetryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("online");

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      if (event.message.includes("ResizeObserver loop")) return;
      reportClientIssue(event.error ?? new Error(event.message), {
        context: "window_error",
        recoverable: true,
      });
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportClientIssue(event.reason, {
        context: "unhandled_rejection",
        recoverable: true,
      });
    };
    const handleRouteError = (error: Error) => {
      if ("cancelled" in error && error.cancelled) return;
      reportClientIssue(error, {
        context: "route_navigation",
        recoverable: true,
      });
    };
    const handleOffline = () => setConnectionState("offline");
    const handleOnline = () => {
      setConnectionState((current) =>
        current === "offline" ? "restored" : "online"
      );
    };

    if (!navigator.onLine) setConnectionState("offline");
    window.addEventListener("error", handleWindowError);
    window.addEventListener(
      "unhandledrejection",
      handleUnhandledRejection
    );
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    router.events.on("routeChangeError", handleRouteError);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      router.events.off("routeChangeError", handleRouteError);
    };
  }, [router.events]);

  useEffect(() => {
    if (connectionState !== "restored") return;
    const timer = window.setTimeout(() => setConnectionState("online"), 3500);
    return () => window.clearTimeout(timer);
  }, [connectionState]);

  return (
    <>
      {children}
      {connectionState !== "online" ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 left-1/2 z-[120] flex w-[min(92vw,420px)] -translate-x-1/2 items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-2xl ${
            connectionState === "offline"
              ? "border-amber-300 bg-amber-50 text-amber-950"
              : "border-teal-300 bg-teal-50 text-teal-950"
          }`}
        >
          {connectionState === "offline" ? (
            <WifiOff className="mt-0.5 shrink-0" size={18} />
          ) : (
            <Wifi className="mt-0.5 shrink-0" size={18} />
          )}
          <div>
            <div className="font-bold">
              {connectionState === "offline"
                ? "You are offline"
                : "Connection restored"}
            </div>
            <p className="mt-0.5 leading-5">
              {connectionState === "offline"
                ? "Your current screen remains available. Saving and new generated content will resume when you reconnect."
                : "Online saving and generated practice are available again."}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

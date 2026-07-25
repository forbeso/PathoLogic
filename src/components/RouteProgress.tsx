import Router from "next/router";
import { useEffect, useState } from "react";

export default function RouteProgress() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== Router.asPath) setLoading(true);
    };
    const handleComplete = () => setLoading(false);

    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleComplete);
    Router.events.on("routeChangeError", handleComplete);

    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleComplete);
      Router.events.off("routeChangeError", handleComplete);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      className="pointer-events-none fixed inset-x-0 top-0 z-[1000] h-1 overflow-hidden bg-teal-950/10"
    >
      <div className="h-full w-2/3 animate-[route-progress_1s_ease-in-out_infinite] bg-teal-400 motion-reduce:w-full motion-reduce:animate-none" />
    </div>
  );
}

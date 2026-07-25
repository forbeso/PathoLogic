import Link from "next/link";
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Ambulance, Home, RefreshCw, TriangleAlert } from "lucide-react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PathoLogix page error", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-[#eef7f4] px-4 py-10 text-slate-950">
        <section className="w-full max-w-lg rounded-lg border border-[#bfd6cf] bg-white p-6 text-center shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:p-8">
          <Link
            href="/"
            className="mx-auto inline-flex items-center gap-2 text-lg font-black text-slate-950"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700">
              <Ambulance size={20} />
            </span>
            PathoLogix
          </Link>

          <span className="mx-auto mt-7 grid h-12 w-12 place-items-center rounded-lg bg-amber-100 text-amber-800">
            <TriangleAlert size={23} />
          </span>
          <h1 className="mt-4 text-2xl font-black">This page needs a quick reset.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            PathoLogix encountered an unexpected problem. Refresh the page to
            try again, or return home and reopen your training activity.
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              <RefreshCw size={17} />
              Refresh page
            </button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#b7ccc5] bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              <Home size={17} />
              Return home
            </Link>
          </div>
        </section>
      </main>
    );
  }
}

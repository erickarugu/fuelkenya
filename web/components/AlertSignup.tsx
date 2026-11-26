"use client";

import { useState } from "react";
import { ALERTS_SUBSCRIBE_URL } from "@/lib/api";

interface AlertSignupProps {
  town?: string;
  source: string;
}

type State = "idle" | "sending" | "done" | "error";

export default function AlertSignup({ town, source }: AlertSignupProps) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch(ALERTS_SUBSCRIBE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, town, source, website })
      });
      if (res.ok) {
        setState("done");
        return;
      }
      const body = await res.json().catch(() => null);
      setMessage(
        res.status === 422
          ? "Enter a valid email address."
          : res.status === 429
            ? "Too many tries. Please wait a minute."
            : typeof body?.detail === "string"
              ? body.detail
              : "Something went wrong. Please try again."
      );
      setState("error");
    } catch {
      setMessage("Couldn't reach the server. Check your connection and try again.");
      setState("error");
    }
  }

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-6 py-5">
      <h2 className="text-lg font-bold text-stone-900 dark:text-white">
        Get new fuel prices on the 14th
      </h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        One email a month when EPRA announces new pump prices. No spam, unsubscribe any time.
      </p>
      {state === "done" ? (
        <p role="status" className="mt-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          You&apos;re on the list. We&apos;ll email you when the next prices are out.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor={`alert-email-${source}`} className="sr-only">
            Email address
          </label>
          <input
            id={`alert-email-${source}`}
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-full border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-black/30 px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-emerald-500"
          />
          {/* Honeypot for bots; hidden from people and screen readers. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
            name="website"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {state === "sending" ? "Signing up…" : "Alert me"}
          </button>
        </form>
      )}
      {state === "error" && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";

type Theme = "light" | "dark";

const faqs = [
  {
    question: "Q: Can I paste content directly on this page?",
    answer:
      "A: Yes. Paste into the textarea, set TTL and one-time mode if needed, then [ CREATE LINK ].",
  },
  {
    question: "Q: Does this work in Proxmox shell?",
    answer:
      "A: Yes. Generate the URL in browser, then run the curl command from your Proxmox host or VM.",
  },
  {
    question: "Q: What if clipboard write is blocked?",
    answer:
      "A: Use fallback pipes: pbcopy on macOS, xclip on X11, or wl-copy on Wayland.",
  },
  {
    question: "Q: How long is data stored?",
    answer:
      "A: Current flow supports 10m, 1h, 24h, and 7d TTL presets with optional one-time links.",
  },
];

function ttlToLabel(ttl: string) {
  switch (ttl) {
    case "600":
      return "10m";
    case "3600":
      return "1h";
    case "604800":
      return "7d";
    default:
      return "24h";
  }
}

export default function Home() {
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState("86400");
  const [oneTime, setOneTime] = useState(false);
  const [error, setError] = useState("");
  const [path, setPath] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [isLoading, setIsLoading] = useState(false);

  const activePath = path ?? "";
  const url = useMemo(
    () => (activePath ? `https://copyit.pipeops.app/${activePath}` : ""),
    [activePath],
  );
  const cmd = useMemo(() => (url ? `curl -fsSL ${url}` : ""), [url]);

  function applyTheme(nextTheme: Theme) {
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("copyit-theme", nextTheme);
    setTheme(nextTheme);
  }

  useEffect(() => {
    const saved = window.localStorage.getItem("copyit-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme: Theme =
      saved === "light" || saved === "dark"
        ? saved
        : prefersDark
          ? "dark"
          : "light";

    applyTheme(initialTheme);
  }, []);

  async function createLink() {
    if (!content.trim()) {
      setError("ERR: Buffer is empty.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/snippets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          ttl_seconds: Number(ttl),
          one_time: oneTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to alloc snippet block");
      }

      setPath(data.path);
    } catch (err: unknown) {
      console.error(err);
      setError(`ERR: ${err instanceof Error ? err.message : "Segmentation fault (core dumped)"}`);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleTheme() {
    applyTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <main className="min-h-screen p-4 md:p-8 font-mono text-sm">
      {/* Header */}
      <header className="mb-12 flex items-center justify-between border-b-2 border-[color:var(--border-strong)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[color:var(--accent)]">
            COPYIT_v1.0.0
          </h1>
          <p className="text-[color:var(--text-muted)]">
            [ TERMINAL RELAY SERVICE ]
          </p>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="hover:text-[color:var(--accent)] hover:underline"
          >
            [ {theme === "dark" ? "LIGHT_MODE" : "DARK_MODE"} ]
          </button>
          <a href="#faq" className="hover:text-[color:var(--accent)] hover:underline">
            [ MANUAL ]
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl grid gap-12 lg:grid-cols-2">
        {/* Left Column - Form */}
        <section>
          <div className="mb-4 text-[color:var(--accent)]">
            root@copyit:~# ./create_link.sh
          </div>

          <div className="border border-[color:var(--border-strong)] bg-[color:var(--surface)] p-4">
            <label
              htmlFor="paste-content"
              className="mb-2 block font-bold text-[color:var(--text-strong)]"
            >
              $ CAT &gt;&gt; STDIN
            </label>
            <textarea
              id="paste-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste raw block here..."
              className="h-48 w-full resize-none border border-[color:var(--border-strong)] bg-black p-3 text-[color:var(--accent)] outline-none focus:border-[color:var(--accent)]"
              spellCheck="false"
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-[color:var(--text-strong)] font-bold">
                --ttl
                <select
                  value={ttl}
                  onChange={(event) => setTtl(event.target.value)}
                  className="border border-[color:var(--border-strong)] bg-black p-2 text-[color:var(--accent)] outline-none focus:border-[color:var(--accent)] appearance-none cursor-pointer"
                >
                  <option value="600">600 (10m)</option>
                  <option value="3600">3600 (1h)</option>
                  <option value="86400">86400 (24h)</option>
                  <option value="604800">604800 (7d)</option>
                </select>
              </label>

              <label className="flex items-end gap-3 pb-2 text-[color:var(--text-strong)] font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={oneTime}
                  onChange={(event) => setOneTime(event.target.checked)}
                  className="h-4 w-4 appearance-none border border-[color:var(--border-strong)] checked:bg-[color:var(--accent)] outline-none"
                />
                --one-time
              </label>
            </div>

            {error ? (
              <div className="mt-4 text-red-500 font-bold bg-red-500/10 border border-red-500 p-2">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={createLink}
                disabled={isLoading}
                className="font-bold text-[color:var(--text-strong)] hover:text-black hover:bg-[color:var(--accent)] border-2 border-[color:var(--accent)] px-4 py-1 transition-colors disabled:opacity-50 disabled:bg-transparent disabled:text-[color:var(--text-strong)]"
              >
                {isLoading ? "[ PROCESSING... ]" : (path ? "[ RENEW LINK ]" : "[ EXECUTE ]")}
              </button>
            </div>
          </div>
        </section>

        {/* Right Column - Output */}
        <section>
          <div className="mb-4 text-[color:var(--accent)]">
            root@copyit:~# watch tail -f stdout
          </div>

          <div className="terminal-shell scan-line h-full min-h-[16rem] p-5">
            <div className="mb-4 text-[color:var(--text-muted)] border-b border-[color:var(--border-strong)] pb-2 flex justify-between">
              <span>STATUS: {path ? "ALLOCATED" : "AWAITING_INPUT"}</span>
              <span>{path && `TTL: ${ttlToLabel(ttl)} | ONE_TIME: ${oneTime}`}</span>
            </div>

            {path ? (
              <div className="space-y-6">
                <div>
                  <div className="text-[color:var(--text-muted)] mb-1"># Generated Target URL</div>
                  <div className="break-all text-white bg-black/50 p-2 border border-[color:var(--border-strong)]">
                    {url}
                  </div>
                  <div className="mt-2">
                    <CopyButton text={url} label="COPY URL" />
                  </div>
                </div>

                <div>
                  <div className="text-[color:var(--text-muted)] mb-1"># Curl payload directly to stdout</div>
                  <div className="break-all text-[color:var(--accent)] bg-black/50 p-2 border border-[color:var(--border-strong)] shadow-[0_0_10px_rgba(0,255,0,0.1)]">
                    {cmd}
                  </div>
                  <div className="mt-2">
                    <CopyButton text={cmd} label="COPY CMD" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="opacity-50 animate-pulse text-[color:var(--accent)]">
                _
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Info Sections */}
      <div className="mx-auto max-w-4xl mt-16 grid gap-8 md:grid-cols-2">
        <section className="border border-[color:var(--border-strong)] bg-[color:var(--surface)] p-6">
          <h2 className="mb-4 text-lg font-bold border-b border-[color:var(--border-strong)] pb-2">
            [ WORKFLOW: PROXMOX / SSH ]
          </h2>
          <pre className="text-xs text-[color:var(--text-muted)] whitespace-pre-wrap">
            {`# 1. Create link on local dev machine
# 2. Open remote terminal session
root@pve:~# curl -fsSL https://copyit.pipeops.app/solar-maple-drift > payload.txt
root@pve:~# chmod +x payload.txt`}
          </pre>
        </section>

        <section id="faq" className="border border-[color:var(--border-strong)] bg-[color:var(--surface)] p-6">
          <h2 className="mb-4 text-lg font-bold border-b border-[color:var(--border-strong)] pb-2">
            [ MANUAL / FAQ ]
          </h2>
          <div className="space-y-4 text-xs">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <div className="font-bold text-[color:var(--text-strong)]">{faq.question}</div>
                <div className="text-[color:var(--text-muted)]">{faq.answer}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

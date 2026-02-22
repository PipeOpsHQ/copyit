"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Clock3,
  Link2,
  MoonStar,
  Server,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Terminal,
  Zap,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";

type Theme = "light" | "dark";

type Feature = {
  title: string;
  body: string;
  icon: LucideIcon;
};

const words = [
  "solar",
  "maple",
  "drift",
  "echo",
  "cinder",
  "meadow",
  "frost",
  "ember",
  "atlas",
  "harbor",
  "lumen",
  "vantage",
  "quartz",
  "summit",
  "anchor",
  "delta",
  "prairie",
  "beacon",
  "cobalt",
  "ridge",
  "forest",
  "signal",
  "vector",
  "relay",
  "orbit",
  "emberglow",
];

const features: Feature[] = [
  {
    title: "Paste anything",
    body: "Drop a token, shell snippet, VM note, or command sequence in one place.",
    icon: Zap,
  },
  {
    title: "Get a short path",
    body: "Copyit gives you a memorable 4-6 word path in seconds.",
    icon: Link2,
  },
  {
    title: "Curl on destination",
    body: "Run one curl command from Proxmox shell, SSH sessions, or CI runners.",
    icon: Server,
  },
];

const faqs = [
  {
    question: "Can I paste content directly on this page?",
    answer:
      "Yes. Paste into the textarea, set TTL and one-time mode if needed, then create a link.",
  },
  {
    question: "Does this work in Proxmox shell?",
    answer:
      "Yes. Generate the URL in browser, then run the curl command from your Proxmox host or VM.",
  },
  {
    question: "What if clipboard write is blocked?",
    answer:
      "Use fallback pipes: pbcopy on macOS, xclip on Linux X11, or wl-copy on Wayland.",
  },
  {
    question: "How long is data stored?",
    answer:
      "Current flow supports 10m, 1h, 24h, and 7d TTL presets with optional one-time links.",
  },
];

function pickPath() {
  const source = [...new Set(words)];
  for (let i = source.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = source[i];
    source[i] = source[j];
    source[j] = swap;
  }

  const count = 4 + Math.floor(Math.random() * 3);
  return source.slice(0, count).join("-");
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 105,
      damping: 19,
    },
  },
};

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

  // Instead of a fallback default path when null, simply show "Preview"
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
      setError("Paste some content first.");
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
        throw new Error(data.error || "Failed to create snippet");
      }

      setPath(data.path);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleTheme() {
    applyTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <main className="relative overflow-hidden pb-24 selection:bg-[color:var(--accent)]/25 selection:text-[color:var(--text-strong)]">
      <div className="pointer-events-none absolute inset-0 mesh-layer" />
      <div className="pointer-events-none absolute inset-0 noise-layer" />
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[color:var(--glow-cool)] blur-3xl" />
      <div className="pointer-events-none absolute left-[-7rem] top-[25rem] h-[20rem] w-[20rem] rounded-full bg-[color:var(--glow-warm)] blur-3xl" />

      <section className="mx-auto w-full max-w-6xl px-5 pt-10 md:px-8">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative z-10 flex items-center justify-between"
        >
          <div className="inline-flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)]">
              <Terminal className="h-4 w-4 text-[color:var(--accent)]" />
            </div>
            <div>
              <div className="font-heading text-2xl font-bold tracking-tight text-[color:var(--text-strong)]">
                Copyit
              </div>
              <div className="text-xs text-[color:var(--text-muted)]">
                terminal snippet relay
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm font-medium text-[color:var(--text-body)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-strong)]"
            >
              {theme === "dark" ? (
                <>
                  <SunMedium className="h-4 w-4" />
                  Light
                </>
              ) : (
                <>
                  <MoonStar className="h-4 w-4" />
                  Dark
                </>
              )}
            </button>
            <a
              href="#faq"
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm font-medium text-[color:var(--text-body)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-strong)]"
            >
              FAQ
            </a>
          </div>
        </motion.header>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.07fr_0.93fr] lg:items-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="relative z-10"
          >
            <motion.p
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--badge-border)] bg-[color:var(--badge-bg)] px-4 py-1.5 text-xs font-semibold tracking-wide text-[color:var(--badge-text)]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Built for Proxmox, SSH, and CI
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="mt-6 font-heading text-5xl font-black leading-[1.05] tracking-tight text-[color:var(--text-strong)] md:text-7xl"
            >
              Paste once.
              <br />
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(100deg, var(--accent), var(--accent-alt))",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                Curl anywhere.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--text-body)] md:text-xl"
            >
              Move short-lived snippets between laptops, hypervisors, and remote
              terminals without chat apps, file transfers, or messy copy hops.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a
                href="#create"
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(110deg, var(--accent), var(--accent-strong))",
                }}
              >
                Try Copyit
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>

              <a
                href="#examples"
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-6 py-3 text-sm font-semibold text-[color:var(--text-body)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-strong)]"
              >
                View Terminal Flow
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap gap-2"
            >
              {[
                "One command retrieval",
                "Short random paths",
                "TTL + one-time option",
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs text-[color:var(--text-muted)]"
                >
                  {chip}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            id="create"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="gradient-border relative z-10 rounded-3xl p-6 md:p-8"
          >
            <div className="glass-panel rounded-[1.4rem] p-6 md:p-7">
              <label
                htmlFor="paste-content"
                className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]"
              >
                Paste content
              </label>
              <textarea
                id="paste-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste your snippet, token, or command here..."
                className="h-36 w-full resize-none rounded-2xl border bg-[color:var(--surface-strong)] p-4 font-mono text-sm text-[color:var(--text-body)] outline-none placeholder:text-[color:var(--text-muted)] transition focus:border-[color:var(--border-strong)]"
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-[color:var(--text-body)]">
                  TTL
                  <select
                    value={ttl}
                    onChange={(event) => setTtl(event.target.value)}
                    className="rounded-xl border bg-[color:var(--surface-strong)] p-2.5 text-sm outline-none focus:border-[color:var(--border-strong)]"
                  >
                    <option value="600">10 minutes</option>
                    <option value="3600">1 hour</option>
                    <option value="86400">24 hours</option>
                    <option value="604800">7 days</option>
                  </select>
                </label>

                <label className="inline-flex items-center gap-3 self-end pb-2 text-sm font-medium text-[color:var(--text-body)]">
                  <input
                    type="checkbox"
                    checked={oneTime}
                    onChange={(event) => setOneTime(event.target.checked)}
                    className="h-4 w-4 rounded border"
                  />
                  One-time read
                </label>
              </div>

              {error ? (
                <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2.5">
                <motion.button
                  type="button"
                  onClick={createLink}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70 disabled:filter-none disabled:brightness-100"
                  style={{
                    background:
                      "linear-gradient(110deg, var(--accent), var(--accent-strong))",
                  }}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {path ? "Generate new link" : "Create link"}
                </motion.button>
                <div className={path ? "block" : "hidden"}>
                  <CopyButton text={cmd} label="Copy command" />
                </div>
                <div className={path ? "block" : "hidden"}>
                  <CopyButton text={url} label="Copy URL" />
                </div>
              </div>

              <div className="terminal-shell scan-line mt-5 overflow-hidden rounded-2xl">
                <div className="flex items-center gap-2 border-b border-[color:var(--border)] bg-[color:var(--shell-soft)] px-4 py-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <span className="ml-2 font-mono text-xs text-[color:var(--shell-muted)]">
                    TTL {ttlToLabel(ttl)}
                    {oneTime ? " • one-time" : ""}
                  </span>
                </div>
                <div className="px-4 py-4 font-mono text-sm leading-relaxed text-[color:var(--shell-text)]">
                  <div className="mb-1 text-xs text-[color:var(--shell-muted)]">
                    {path ? `/${activePath}` : "Preview"}
                  </div>
                  <code className="break-all">{cmd}</code>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 grid gap-3 sm:grid-cols-3"
        >
          {[
            { label: "Median create time", value: "< 5s", icon: Clock3 },
            { label: "Copy flow", value: "paste → path → curl", icon: Terminal },
            { label: "Safe defaults", value: "TTL + one-time", icon: ShieldCheck },
          ].map((item) => (
            <div
              key={item.label}
              className="glass-panel rounded-2xl px-4 py-3"
            >
              <div className="flex items-center gap-2 text-sm text-[color:var(--text-muted)]">
                <item.icon className="h-4 w-4 text-[color:var(--accent)]" />
                {item.label}
              </div>
              <div className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">
                {item.value}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      <section className="mx-auto mt-28 w-full max-w-6xl px-5 md:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-5 md:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.article
              key={feature.title}
              variants={fadeUp}
              className="glass-panel rounded-3xl p-7 transition hover:-translate-y-1"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-soft)]">
                <feature.icon className="h-5 w-5 text-[color:var(--accent)]" />
              </div>
              <h2 className="mt-4 font-heading text-2xl font-bold text-[color:var(--text-strong)]">
                {feature.title}
              </h2>
              <p className="mt-3 leading-relaxed text-[color:var(--text-body)]">
                {feature.body}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section
        id="examples"
        className="mx-auto mt-28 w-full max-w-6xl px-5 md:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="gradient-border rounded-[2rem] p-[1px]"
        >
          <div className="glass-panel rounded-[2rem] p-7 md:p-10">
            <div className="md:w-2/3">
              <h2 className="font-heading text-3xl font-bold text-[color:var(--text-strong)] md:text-4xl">
                Proxmox Workflow Example
              </h2>
              <p className="mt-3 text-lg text-[color:var(--text-body)]">
                Create from browser, run from remote shell, move content exactly
                where you need it.
              </p>
            </div>

            <div className="terminal-shell mt-7 overflow-hidden rounded-2xl">
              <div className="flex items-center gap-2 border-b border-[color:var(--border)] bg-[color:var(--shell-soft)] px-4 py-2">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                  <span className="h-3 w-3 rounded-full bg-green-400/80" />
                </div>
                <span className="ml-2 font-mono text-xs text-[color:var(--shell-muted)]">
                  root@pve:~
                </span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed">
                <code className="text-[color:var(--shell-muted)]"># URL from Copyit</code>
                <br />
                <code className="text-violet-300">{url}</code>
                <br />
                <br />
                <code className="text-[color:var(--shell-muted)]">
                  # run on Proxmox host or VM
                </code>
                <br />
                <code className="text-[color:var(--shell-text)]">{cmd}</code>
              </pre>
            </div>
            <div className="mt-5">
              <CopyButton text={cmd} label="Copy Proxmox command" />
            </div>
          </div>
        </motion.div>
      </section>

      <section id="faq" className="mx-auto mt-28 w-full max-w-6xl px-5 md:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-heading text-3xl font-bold text-[color:var(--text-strong)] md:text-4xl"
        >
          Frequently Asked Questions
        </motion.h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-10 grid gap-5 md:grid-cols-2"
        >
          {faqs.map((faq) => (
            <motion.article
              key={faq.question}
              variants={fadeUp}
              className="glass-panel rounded-3xl p-7"
            >
              <h3 className="font-heading text-lg font-bold text-[color:var(--text-strong)]">
                {faq.question}
              </h3>
              <p className="mt-3 leading-relaxed text-[color:var(--text-body)]">
                {faq.answer}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </section>
    </main>
  );
}

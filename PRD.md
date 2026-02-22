# Product Requirements Document (PRD)
## Product: Copyit
## Version: v1.0
## Date: February 22, 2026

## 1. Overview
Copyit lets a user paste any content, receive a short unique URL path, and retrieve that content from the terminal with one command.

Primary user promise:
- User pastes content.
- Copyit returns a short path made of 4-6 random unique words.
- User runs `curl -fsSL https://copyit.pipeops.app/<path>`.
- The content is copied to the user's local system clipboard (when terminal supports OSC52), with a clear fallback for unsupported terminals.

Example:
- Created URL: `https://copyit.pipeops.app/solar-maple-drift-echo`
- Retrieve: `curl -fsSL https://copyit.pipeops.app/solar-maple-drift-echo`

## 2. Problem Statement
Developers and operators frequently need to move short-lived text between systems and shells (tokens, snippets, commands, config fragments). Existing methods are slow, insecure, or require too many steps.

Copyit reduces this to one paste action and one retrieval command.

## 3. Goals
- Enable creation of a shareable short path from pasted content in under 5 seconds.
- Support one-command retrieval via `curl -fsSL`.
- Copy retrieved content to clipboard directly from terminal when possible.
- Provide secure default behavior with expiration and abuse controls.

## 4. Non-Goals (MVP)
- Long-term document storage.
- Team collaboration features.
- Rich text formatting or file uploads.
- End-to-end encrypted sharing between multiple recipients.

## 5. Target Users
- DevOps/SRE engineers.
- Backend developers.
- Platform engineers.
- Technical users working in terminal-first workflows.

## 6. User Stories
- As a user, I can paste text and instantly get a short URL path.
- As a user, I can run one `curl` command to retrieve that text on another machine.
- As a user, I can trust links to expire automatically.
- As a user, I can optionally create one-time links for sensitive content.

## 7. Functional Requirements

### FR-1: Create Snippet
- System must accept pasted plain text content from web UI.
- System must support content size from 1 byte up to 1 MB in MVP.
- System must return:
  - `url`
  - `path`
  - `expires_at`
  - `created_at`
- Default TTL must be 24 hours.
- User can optionally choose TTL presets: 10 minutes, 1 hour, 24 hours, 7 days.
- User can optionally mark link as one-time read.

### FR-2: Short Path Generation
- Path must be generated from 4-6 random words from a curated dictionary.
- Default length: 4 words.
- Path format: lowercase words joined by hyphens.
- Path must be globally unique among unexpired records.
- On collision, regenerate until unique.
- Path entropy target must be high enough to prevent practical guessing at internet scale.

### FR-3: Retrieval Endpoint
- `GET /<path>` must retrieve stored content if path exists and is not expired.
- For `curl` clients, response must be optimized for clipboard copy:
  - Return OSC52 sequence wrapping content, when size and terminal support constraints allow.
  - Return HTTP 200 on success.
- If terminal/flow does not support OSC52, user must be shown fallback command in docs:
  - macOS: `curl -fsSL <url> | pbcopy`
  - Linux (X11): `curl -fsSL <url> | xclip -selection clipboard`
  - Linux (Wayland): `curl -fsSL <url> | wl-copy`
- If one-time read is enabled, first successful retrieval invalidates the path.

### FR-4: Error Handling
- Expired or unknown path returns 404 with compact plain-text message.
- Deleted/consumed one-time path returns 410.
- Oversized create request returns 413.
- Rate-limited requests return 429.

### FR-5: Minimal Web UI
- Single input textarea for content paste.
- Optional controls:
  - TTL selector.
  - One-time read toggle.
- On submit, show generated URL and copy button.
- Show command preview:
  - `curl -fsSL https://copyit.pipeops.app/<path>`

## 8. API Draft (MVP)
### Create
- `POST /api/v1/snippets`
- Request JSON:
```json
{
  "content": "string",
  "ttl_seconds": 86400,
  "one_time": false
}
```
- Response JSON:
```json
{
  "path": "solar-maple-drift-echo",
  "url": "https://copyit.pipeops.app/solar-maple-drift-echo",
  "expires_at": "2026-02-23T12:37:00Z",
  "created_at": "2026-02-22T12:37:00Z"
}
```

### Retrieve
- `GET /:path`
- Returns clipboard-oriented payload for `curl` clients.

## 9. Security and Abuse Controls
- Enforce HTTPS only.
- Encrypt data at rest.
- Limit max content size to reduce abuse.
- Apply IP-based rate limiting for create and retrieve endpoints.
- Use abuse detection for high-frequency path scanning.
- Do not log full content bodies in application logs.
- Sanitize UI rendering to prevent XSS if content is shown in browser.

## 10. Non-Functional Requirements
- Availability target (MVP): 99.9% monthly.
- P95 create API latency: under 300 ms.
- P95 retrieval latency: under 200 ms (excluding network).
- Horizontal scalability for read-heavy traffic.

## 11. Analytics and Observability
Track:
- Snippets created per day.
- Retrieval success rate.
- Retrieval by client type (`curl` vs browser).
- Clipboard-success proxy metric (OSC52 delivered).
- Expiration and one-time consumption rates.
- Error rates by status code.

## 12. Success Metrics (First 60 Days)
- 90% of creates complete in under 5 seconds end-to-end.
- 95% retrieval success for valid links.
- At least 70% of terminal retrievals require no fallback command.
- Less than 1% abuse-related incident rate.

## 13. Risks and Mitigations
- Risk: Some terminals block OSC52 clipboard writes.
- Mitigation: Publish explicit OS-specific fallback pipe commands.

- Risk: Path guessing/bruteforce.
- Mitigation: High-entropy word dictionary plus strict rate limiting.

- Risk: Sensitive secrets leaked via shared links.
- Mitigation: Default expiry, one-time link option, and warning banner in UI.

## 14. Milestones
- M1 (Week 1): Data model, create API, path generation.
- M2 (Week 2): Retrieval endpoint with OSC52 mode and one-time links.
- M3 (Week 3): Minimal web UI and command preview.
- M4 (Week 4): Security hardening, rate limits, observability, launch checklist.

## 15. Acceptance Criteria
- User can paste content and get a unique 4-6 word path.
- `curl -fsSL https://copyit.pipeops.app/<path>` works for retrieval.
- On supported terminals, retrieval copies content to clipboard without additional commands.
- Expired and invalid paths return expected errors.
- One-time links are invalid after first successful retrieval.
- Basic abuse controls are active in production.

## 16. Open Questions
- Should default TTL be 24 hours or shorter (for safer defaults)?
- Should anonymous creation be allowed, or require lightweight auth for abuse control?
- Should path word count be fixed (4) or adaptive (4-6 based on traffic/collision rate)?
- Should browser access to `/<path>` show content, or always force terminal-oriented output?

## 17. Landing Page Plan
### Positioning
- Tagline: `Paste once. Curl anywhere.`
- Primary audience: terminal-first users on infra platforms (Proxmox, Linux servers, homelabs, CI runners).
- Core value: move text/snippets between systems in one command without opening editors or chat tools.

### Information Architecture
- Hero section:
  - Headline and one-line value proposition.
  - Primary CTA: `Try Copyit`.
  - Secondary CTA: `View Docs`.
  - Live command preview showing `curl -fsSL https://copyit.pipeops.app/<path>`.
- How it works (3 steps):
  - Paste content.
  - Get unique 4-6 word link.
  - Run `curl` on destination machine and copy to clipboard.
- Terminal examples section:
  - Proxmox host/VM workflow example.
  - SSH jump-host workflow example.
  - macOS/Linux clipboard fallback examples.
- Trust and safety section:
  - TTL expiration.
  - One-time links.
  - HTTPS and rate limiting.
- FAQ section:
  - Does this work in Proxmox shell?
  - What if OSC52 clipboard copy is blocked?
  - How long is content stored?
  - Is my content logged?
- Footer:
  - Status page, docs, privacy, terms, contact.

### Proxmox-Specific Example Block (on page)
```bash
# create on your laptop browser -> receive URL:
https://copyit.pipeops.app/solar-maple-drift-echo

# open Proxmox shell or SSH session, then run:
curl -fsSL https://copyit.pipeops.app/solar-maple-drift-echo
```

### UX Requirements
- Above-the-fold must show usable command within first viewport on desktop and mobile.
- Copy button for URL and command snippets.
- No sign-in required for MVP create flow.
- Page performance target: LCP under 2.5s on 4G for first-time visitor.

### SEO and Content
- Target keywords:
  - `copy text with curl`
  - `clipboard from terminal`
  - `pastebin for devops`
  - `proxmox clipboard terminal`
- Publish one docs article: `How to copy text to Proxmox shell with Copyit`.

### Conversion Events
- `landing_cta_click`
- `create_started`
- `create_succeeded`
- `copy_command_clicked`
- `docs_opened`

## 18. Recommended Technology Stack
### Frontend
- Framework: Next.js (App Router) + TypeScript.
- Styling: Tailwind CSS for fast MVP iteration.
- Hosting: Vercel for low-friction deploys and edge delivery.

Why:
- Fast shipping for landing page + app UI in one codebase.
- Built-in routing and server handlers simplify API surface.
- Good DX for rapid experiments on copy and onboarding flow.

### Backend/API
- Runtime: Node.js 20+ with Next.js route handlers (MVP) or Fastify if later split is needed.
- Data store: PostgreSQL (managed) for durability and queryability.
- Cache/rate limit: Redis (Upstash or managed Redis).
- Queue (optional post-MVP): lightweight job queue for cleanup/abuse pipelines.

Why:
- Postgres handles snippet metadata, expiry queries, and analytics events cleanly.
- Redis enables low-latency rate limiting and hot-path lookups.
- Single TypeScript stack reduces operational complexity at MVP stage.

### Clipboard Retrieval Strategy
- Primary: return OSC52-wrapped payload for compatible terminals.
- Fallback: documented `pbcopy`, `xclip`, and `wl-copy` pipelines.
- Client detection: inspect User-Agent and optionally query param (`?raw=1`) for troubleshooting.

### Infra and Operations
- CDN/WAF: Cloudflare in front of app domain.
- TLS: Cloudflare-managed certificates.
- Observability: OpenTelemetry + hosted logs/metrics (Datadog or Grafana Cloud).
- Error tracking: Sentry.
- CI/CD: GitHub Actions with lint, tests, and deploy pipeline.

### Security Defaults
- Encrypt sensitive fields at application layer (KMS-backed key management).
- Strict request size limits and validation.
- Rotating secret management via cloud secret store.
- Automated dependency and container scanning in CI.

### Suggested MVP Build Order
1. Next.js app shell + landing page + create form.
2. `POST /api/v1/snippets` with Postgres persistence.
3. `GET /:path` retrieval with expiry + one-time semantics.
4. Redis-backed rate limiting and abuse guardrails.
5. Telemetry, alerts, and launch hardening.

# Copyit Landing Page

Landing page for Copyit, a terminal-first snippet sharing tool:

1. Paste content in browser.
2. Receive a short 4-6 word path.
3. Run `curl -fsSL https://copyit.pipeops.app/<path>` from Proxmox/SSH/CI.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- React 19

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Checks

```bash
npm run lint
npm run build
```

## Key Files

- `src/app/page.tsx`: landing page sections and copy/command interactions
- `src/components/copy-button.tsx`: clipboard helper component
- `src/app/globals.css`: visual theme and entry animations
- `PRD.md`: product requirements document

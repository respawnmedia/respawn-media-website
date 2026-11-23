# Respawn Media website

React frontend using Lenis, GSAP, and React Bits components.

## Local development

Run `npm install` and `npm run dev` in this directory.

## Production

From the repository root, run `npm --prefix prototypes/respawn-motion ci` and `npm run build`.
The root build creates `dist/` with the homepage, portfolio pages, careers listing, and the existing careers application HTML.
Vercel uses the root configuration and the existing `api/careers` functions.

Public content is in `src/content.json` and `public/assets/`.
The careers listing loads current roles from `/api/careers/config`.
The original homepage source remains at the repository root for reference and rollback.

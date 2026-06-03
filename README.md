
# NuudelchinTrip

NuudelchinTrip is a React + Vite frontend prototype for a Mongolia-focused passenger-driver route sharing marketplace. Travelers find drivers for local/intercity trips, drivers publish routes and accept requests, and daivar achaa is a secondary add-on attached to driver routes.

## Running the code

Run `pnpm install` to install the dependencies.

Run `pnpm dev` to start the development server.

Run `pnpm build` to create a production build.

Copy `.env.example` to `.env.local` for local development and fill in:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Deploying

Netlify uses `netlify.toml`.

Vercel uses `vercel.json` with:

- Install command: `pnpm install`
- Build command: `pnpm build`
- Output directory: `dist`
- SPA rewrite: all routes go to `index.html`, so links like `/dashboard/traveler`, `/routes/1`, and `/admin/payments` work after refresh.
- Cache headers for built assets
- Basic security headers for public pages

Set these Vercel Environment Variables for Production, Preview, and Development:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
"# Nuudelchintrip" 

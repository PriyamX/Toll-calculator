# Toll Mock UPI - Deploying

## Vercel

1. Create `VITE_API_BASE` as empty or `/api` in Vercel project env vars if needed.
2. Deploy the project root `toll-mock-ui/toll-mock-upi` with the following settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Framework preset: Vite
3. The serverless API is available under `/api/*` and handled by `api/index.js`.

## Netlify

For Netlify Functions, wrap the Express app using `netlify-lambda` or `@netlify/functions`. Alternatively, host only the static frontend and point `VITE_API_BASE` to a deployed API on Vercel.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

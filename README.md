# Cameroon Baptist Theological Seminary — Kumba Campus

This Next.js site is exported as a static website and deployed to GitHub Pages.

## Run locally

Install [Node.js 22](https://nodejs.org/) and then run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to GitHub Pages

1. Push the project to a GitHub repository on the `main` branch.
2. In the repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
3. Push to `main`, or run the **Deploy to GitHub Pages** workflow from the **Actions** tab.

The workflow builds the static site and deploys it to the repository's GitHub Pages URL. For a project repository, the URL is `https://<owner>.github.io/<repository>/`; a repository named `<owner>.github.io` is deployed at the root domain.

This site uses static export; server-dependent Next.js features (such as API routes, Server Actions, and dynamic request data) are not supported by this deployment.

## Deploy to Cloudflare Workers

This project is a static Next.js export. The `wrangler.jsonc` configuration deploys the generated `out` directory as Worker static assets; it does not use the OpenNext adapter.

In the Cloudflare Workers build settings, use the repository root as the root directory, `npm run build` as the build command, and `npx wrangler deploy` as the deploy command. Keep the Worker name in `wrangler.jsonc` aligned with the Worker you want to update.

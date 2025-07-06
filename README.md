This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


📁 Project Structure & Summary
| Path                    | What It Does                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `.next/`                | Auto-generated build output by Next.js (ignored by Git)                                                                           |
| `node_modules/`         | Installed libraries via `npm install` (ignored by Git)                                                                            |
| **`public/`**           | Static assets served directly by the browser                                                                                      |
| ├── `backgrounds/`      | Contains one PNG used as the app’s universal background                                                                           |
| ├── `icons/`            | Social & platform icons (e.g., Discord, GitHub, X, Support)                                                                       |
| ├── *misc SVGs & logos* | Includes `file.svg`, `globe.svg`, `logo.png`, `next.svg`, `vercel.svg`, `window.svg` — used for general UI decoration or branding |
| **`src/app/`**          | Core application logic (Next.js App Router structure)                                                                             |
| ├── `components/`       | Shared UI components (e.g., header, nav)                                                                                          |
| ├── `create-token/`     | Core token creation page with form + logic                                                                                        |
| ├── `profile/`          | User profile page (token stats, wallet info, etc.)                                                                                |
| ├── `globals.css`       | Global styles that apply across all pages                                                                                         |
| ├── `layout.js`         | Root layout wrapper for theming, nav, etc.                                                                                        |
| ├── `page.js`           | Home/landing page                                                                                                                 |
| ├── `page.module.css`   | Scoped CSS module for `page.js` styling                                                                                           |
| **`wallet-connect/`**   | Handles wallet logic (Xverse, Leather, etc.)                                                                                      |
| `.gitignore`            | Specifies which files/folders Git should ignore                                                                                   |
| `eslint.config.mjs`     | Configures code style and linting rules                                                                                           |
| `jsconfig.json`         | Helps with import path resolution and project settings                                                                            |
| `next.config.mjs`       | Project-level config for Next.js behavior                                                                                         |
| `package.json`          | Declares dependencies and defines scripts                                                                                         |
| `package-lock.json`     | Locks exact versions of installed packages                                                                                        |
| `README.md`             | Documentation for this project (what you’re reading now)                                                                          |






🛠️ 1. Getting Started (for devs running your code locally)
## 🚀 Getting Started

1. Clone the repository:

```bash
git clone https://github.com/Teiko-Nakamoto/create-token-js.git
cd create-token-js

2.Install dependencies:

npm install


3.Start the development server:

npm run dev
Open in browser:
Visit http://localhost:3000 to view the app.


🛠️ Quick Script (1-liner) to List Your Dependencies
Run this in your terminal from the project root:


npm ls --depth=0

current output:
├── @emnapi/runtime@1.4.3 extraneous
├── @eslint/eslintrc@3.3.1
├── @stacks/connect@8.1.9
├── eslint-config-next@15.3.5
├── eslint@9.30.1
├── next@15.3.5
├── react-dom@19.1.0
└── react@19.1.0
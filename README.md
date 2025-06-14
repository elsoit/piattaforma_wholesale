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

## Environment Variables

Create a `.env` file based on `.env.example` and provide your database
connection details:

```bash
cp .env.example .env
```

The following variables are required:

- `DB_HOST` - database host
- `DB_USER` - database username
- `DB_NAME` - database name
- `DB_PASSWORD` - database password
- `DB_PORT` - database port

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Environment variables

Copy `env.example` to `.env.local` and fill in your Cloudflare R2 credentials before starting the server:

```bash
cp env.example .env.local
# edit .env.local and set:
# R2_ENDPOINT=<your R2 endpoint>
# R2_ACCESS_KEY_ID=<your access key id>
# R2_SECRET_ACCESS_KEY=<your secret access key>
# R2_BUCKET=<bucket name>
```

These variables are required at startup and the application will throw an error if any of them are missing.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Oravexa

A full-featured encyclopedia built with **JavaScript** (Node.js + Express + vanilla frontend).

## Features

- Browse a **1,000,000-article** encyclopedia across every main category
- Full bilingual content (English / Spanish) with a language toggle
- Sign in / create account with persistent sessions (auto login on return)
- Full-text search with live suggestions
- Create, edit, and delete articles (Markdown)
- Wiki links with `[[Article Title]]` syntax
- Automatic revision history and restore
- Categories, recent changes, random article
- Black / white theme toggle
- Sign up / sign in with persistent login sessions (auto sign-in when you return)
- Responsive UI with a reading-first design

## Quick start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### Permanent public link (iOS / Android / PC)

Temporary Cloudflare tunnels expire. For a **permanent** Oravexa URL, deploy once to Render (free):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/meylordearma56-web/Oravexa)

After deploy, Oravexa stays online at:

**https://oravexa.onrender.com**

(Free tier may sleep after idle time; the first visit can take ~30–60s to wake.)

### Temporary cloud session link

While developing in a cloud agent session you may also use a short-lived tunnel (changes when restarted):

Open on iOS / Android / PC: [Oravexa](https://null-feeding-connector-chem.trycloudflare.com)

On first launch the server seeds sample articles automatically.

### Useful scripts

| Command | Description |
| --- | --- |
| `npm start` | Run the Oravexa server |
| `npm run dev` | Run with Node `--watch` reload |
| `npm run seed` | Reset the database and reseed sample articles |

## API overview

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/articles` | List articles |
| `GET` | `/api/articles/:slug` | Get one article (Markdown + HTML) |
| `POST` | `/api/articles` | Create article |
| `PUT` | `/api/articles/:slug` | Update article |
| `DELETE` | `/api/articles/:slug` | Delete article |
| `GET` | `/api/search?q=` | Search |
| `GET` | `/api/categories` | List categories |
| `GET` | `/api/recent` | Recent revisions |
| `GET` | `/api/articles/random` | Random article |
| `POST` | `/api/auth/signup` | Create account + start session |
| `POST` | `/api/auth/login` | Sign in + start session |
| `POST` | `/api/auth/logout` | End session |
| `GET` | `/api/auth/me` | Current user (auto-login check) |

## Project layout

```
server/          Express API + JSON data store
public/          SPA frontend (HTML/CSS/JS)
data/            Runtime article database (auto-created)
```

## Editing tips

Articles are written in Markdown. Link between pages with wiki syntax:

```md
See also [[JavaScript]] and [[Solar System|our solar system]].
```

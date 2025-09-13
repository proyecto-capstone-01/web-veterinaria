# Astro

## Docs

- [Astro SSR](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Astro Server Islands](https://docs.astro.build/en/guides/server-islands/)
- [Astro i18n](https://docs.astro.build/en/guides/internationalization/)
- [Cloudflare's Astro guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)

## Project Structure

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── ?.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```
## Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |


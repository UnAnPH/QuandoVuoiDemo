# QuandoVuoi Demo

Standalone frontend demo built with Vite + React.

The app is self-contained in `src/App.jsx` and does not require Appwrite Database, Auth, or environment variables.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output is generated in `dist/`.

## Deploy to Appwrite Sites

Use the Appwrite Console as a static site host:

1. Create a Site.
2. Set Build Command to `npm run build`.
3. Set Output Directory to `dist`.
4. Deploy.

For SPA behavior, add a rewrite/fallback to `index.html` if your Site settings require it.

## Notes

- Mobile and desktop demo views are both available from inside the app.
- Toolbar now includes a large button using `src/Favicon (Dark).png`.

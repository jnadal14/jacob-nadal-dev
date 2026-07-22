# Jacob Nadal — portfolio

A dependency-free static portfolio for [jacobnadal.dev](https://jacobnadal.dev), hosted through GitHub Pages.

## Structure

- `index.html` — page content, metadata, and structured data
- `styles.css` — design tokens, responsive layout, and motion system
- `script.js` — navigation, reveals, project rendering, contact form, and analytics
- `projects.json` — portable copy of the project data in `script.js`
- `JACOB_NADAL_RESUME_2025.pdf` — resume linked from the site
- `og.png` — social sharing preview
- `manifest.json`, `robots.txt`, and `sitemap.xml` — installability and search metadata

The page loads `styles.min.css` and `script.min.js`. These are production mirrors, so copy the edited source files over them before publishing.

## Local preview

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Use a local server rather than opening `index.html` directly so form, manifest, and asset behavior match production more closely.

## Before publishing

1. Keep project copy synchronized between `script.js` and `projects.json`.
2. Refresh `styles.min.css` and `script.min.js` from their source counterparts.
3. Run `node --check script.js` and validate both JSON files.
4. Confirm every internal file reference exists.

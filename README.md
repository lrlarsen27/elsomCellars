# Elsom Cellars

Code for the winery. Each project lives in its own top-level directory with its
own dependencies and its own README — there is no shared build at the root, so
projects can use whatever they need without affecting each other.

## Projects

| Directory | What it is | Status |
| --- | --- | --- |
| [`menus/`](menus) | Sign in, edit menu text, export a print-ready PDF | Built from the Figma design, not yet run |

## Adding a project

Make a directory, put a README in it, add a row above. Nothing at the root
needs to know about it. The root [`.gitignore`](.gitignore) already covers the
usual build output and local secrets for any Node project.

## Working on `menus/`

```bash
cd menus
npm install
npm run dev
```

Full setup, including the environment variables it needs, is in
[`menus/README.md`](menus/README.md).

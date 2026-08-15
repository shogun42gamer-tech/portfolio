# Portfolio

A clean, aesthetic single-page portfolio template for freelancers. Everything is
static (HTML + CSS + JS) — no build tools or frameworks needed. Just open
`index.html` in a browser, or serve the folder with any static server.

## Quick start

1. Open `index.html` in your browser to preview.
2. To serve locally:
   - Python: `python -m http.server 8000` then visit `http://localhost:8000`
   - Or just double-click `index.html`.
3. Deploy for free on [Netlify](https://netlify.com), [Vercel](https://vercel.com), or
   [GitHub Pages](https://pages.github.com) by uploading/pointing at this folder.

## How to edit your details

Everything you need to change is marked in the HTML with **`<!-- EDIT ME -->`**
comments. Open `index.html` and search for `EDIT ME` to find every spot.

| Section | What to edit |
| --- | --- |
| `<title>` + meta description | Your name / brand and one-line SEO description |
| Navbar logo + links | Logo text and menu items |
| Hero | Your name, role, tagline, buttons, resume link |
| About | Your bio, photo, quick facts, social links |
| Skills | Skill cards, progress bar labels and `data-level` percentages |
| Projects | Replace each project card with your real work |
| Experience | Timeline entries and client testimonials |
| Contact | Your email address (in the form + note + socials) |
| Footer | Copyright name |

### Files

- **`index.html`** — all content lives here (this is the main file to edit).
- **`styles.css`** — look and feel. Colors are centralized in the `:root` block at
  the top, e.g. `--accent-1` and `--accent-2` control the gradient, `--bg` the
  background, `--text` the text color.
- **`script.js`** — small interactions (mobile menu, scroll animations, skill bars,
  contact form → opens the visitor's email app). Set your real email on the
  `mailto:` line in this file too.
- **`resume.pdf`** — placeholder file; replace it with your real resume.

### Things still to do

- Replace the placeholder photo in the About section.
- Replace the six project thumbnails (they're gray "Project N" blocks).
- Replace `resume.pdf`.
- To accept contact form submissions on a real backend, swap the submit handler in
  `script.js` for Formspree/Netlify Forms or your own API.

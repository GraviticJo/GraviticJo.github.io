# GRAIVITIC — Editorial website

The active website is the buildless `index.html`, `public/css/editorial.css` and `public/js/editorial.js`. Open `index.html` directly, or run `npm run dev` and visit http://127.0.0.1:5173. No installation or build step is required. `npm run check` validates JavaScript syntax, referenced assets, anchor targets and bilingual copy.

The older React source in `src/` and earlier CSS/JS files are preserved, but are not loaded by this entry point.

Refined in Claude Design with Fable 5.2: eased scroll choreography, clearer project cards and mobile typography. The final local version retains the original standalone mobile brand mark and visible motion control.

## Design and interaction

- Original vector logo extracted unchanged from the supplied editorial brand PDF; teal #43C6B5, charcoal #101214, Manrope and IBM Plex Sans Arabic.
- Hero artwork generated using Higgsfield, job `822ccf83-66e8-4b3a-bff2-b786e6ec08be`. The brand mark remains a separate SVG.
- Scroll-linked hero depth, progressive headline reveal, a responsive two-column project gallery and a three-stage process sequence.
- Stacked mobile projects, direct project links, service cards with teal hover and keyboard-focus states, accessible native project dialog and magnetic links.
- English/Arabic with mirrored hero, portfolio heading and details, process, and contact layouts; right-aligned RTL Arabic text and left-aligned LTR English text; query parameter `?lang=ar|en`, stored language preference and translated metadata.
- A motion toggle and support for the device's reduced-motion preference. Paused motion retains all project links and manual process controls.
- Existing project images, founder portraits, email and WhatsApp links retained. No invented testimonials or results.
- Founder profiles use balanced portrait framing, prominent Founder & CEO / Founder & CTO roles, and bilingual role-focused introductions.

## Editing

Bilingual copy lives in `data-en` and `data-ar` attributes in `index.html`. The `↵` character inserts a line break. Contact links are in the same file. Theme tokens and responsive rules are in `public/css/editorial.css`.

## Delivery

Upload `index.html` and its referenced `public/` assets to any static host. This work has not been published. Google Fonts requires an internet connection; local system fonts are the fallback.

The Python helper `scripts/package.py` packages the active site into `output/GRAIVITIC-design-source.zip`. The extraction helper requires pypdf and the original PDF at its documented local path; neither helper is needed to run the website.

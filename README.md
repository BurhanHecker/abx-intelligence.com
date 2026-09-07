# ABX Intelligence — website

Static site. No build step, no dependencies, no framework.

## Structure

```
public/            <- the website. This is what gets deployed.
  index.html  solutions.html  services.html  about.html  approach.html
  contact.html  privacy.html  terms.html  cookies.html  refunds.html
  404.html
  assets/css/style.css      design system (all tokens at the top)
  assets/css/fonts.css      @font-face for the self-hosted fonts
  assets/js/main.js         interaction layer, vanilla, no libraries
  assets/fonts/             woff2 + OFL.txt licence
  assets/img/               logo variants and favicons
  _headers                  Cloudflare Pages security + cache headers
  .htaccess                 Apache equivalent, inert on Cloudflare
  robots.txt  sitemap.xml  favicon.ico

design-source/     Original logo files. NOT deployed.
COMPLIANCE.md      Legal and risk review. NOT deployed. Read before launch.
```

Anything outside `public/` is never published. Keep it that way: `COMPLIANCE.md`
discusses matters that should not be on the public web.

## Local preview

```bash
python3 -m http.server 4321 --directory ~/ABX-Intelligence/public
```

Then open http://localhost:4321

## Deploying

The site deploys automatically from GitHub via Cloudflare Pages.

```bash
git add -A
git commit -m "describe the change"
git push
```

That is the whole process. Cloudflare rebuilds and the change is live in
roughly fifteen seconds. No zips, no file manager, no uploads.

**Cloudflare Pages project settings** (set once, at creation):

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | *(leave empty)* |
| Build output directory | `public` |

## Cache busting

`_headers` caches `/assets/*` for a year and forces HTML to revalidate. To make
sure returning visitors get CSS and JS changes, every reference carries a
version query, e.g. `style.css?v=20260907a`.

**After changing CSS or JS, bump it:**

```bash
cd ~/ABX-Intelligence/public && sed -i '' "s/?v=[0-9a-z]*/?v=$(date +%Y%m%d%H%M)/g" *.html
```

If you replace an image, rename the file rather than overwriting it.

## Still to do before launch

1. Add your Web3Forms access key in `public/contact.html` (free key from
   web3forms.com). Until then the form tells visitors to email instead.
2. Replace the `pending-note` blocks in the four legal pages with your real
   business details. Find them with:
   `grep -rn pending-note public/`
3. Read `COMPLIANCE.md`. Items 1 and 2 there matter more than anything on
   the site itself.
4. Once every placeholder is gone, delete the `.pending-note` rule from
   `public/assets/css/style.css`.

## Editing

Copy lives directly in the HTML. Colours, spacing and type scale are CSS custom
properties at the top of `style.css`; change them there and the whole site follows.

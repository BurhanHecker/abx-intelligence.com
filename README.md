# ABX Intelligence :  Website

Static multi-page marketing site. No build step, no dependencies, no WordPress.

## Files

```
index.html        Homepage (all 13 sections)
solutions.html    Four solutions in depth + the live platform
services.html     Full services catalogue with expandable detail
about.html        Founders, origin, principles, vision
approach.html     Four-stage process, partnership, FAQ
contact.html      Contact form  ← needs one setup step, see below
privacy.html      Privacy Policy
terms.html        Terms & Conditions
cookies.html      Cookie Policy
refunds.html      Payment & Refund Policy
assets/css/style.css
assets/css/fonts.css
assets/js/main.js
assets/img/favicon.svg
assets/fonts/          Self-hosted woff2 + OFL.txt license
robots.txt  sitemap.xml  .htaccess
```

`.claude/` is local tooling :  do not upload it.

---

## Deploying to Hostinger

**Do not put this in `wp-content/themes/`.** WordPress only recognises a folder as a
theme if it contains a `style.css` with a theme header and an `index.php`. This is a
plain static site, so it goes straight into the web root instead.

1. Hostinger control panel → **Files → File Manager**
2. Open **`public_html`**
3. If WordPress is currently installed there and you are replacing it, back it up first
   (Files → Backups), then remove the old WordPress files from `public_html`.
   If you want to keep WordPress running elsewhere, move it into a subfolder instead.
4. Upload **the contents** of this folder into `public_html` :  so that `index.html` sits
   directly in `public_html`, not inside a subfolder.
   Easiest route: zip this folder locally, upload the zip, then use File Manager's
   **Extract** option.
5. Confirm `.htaccess` uploaded. File Manager hides dotfiles by default : 
   enable **Settings → Show hidden files** to check.
6. Visit your domain. That's it.

`.htaccess` gives you optional extensionless URLs (`/solutions` also works),
gzip compression, cache headers, and basic security headers.

---

## One setup step: the contact form

The form on `contact.html` is wired but not connected yet. Static hosting can't send
email on its own, so it posts to [Web3Forms](https://web3forms.com) (free tier, no account).

1. Go to web3forms.com, enter the email address where you want enquiries to land
2. They email you an access key
3. Open `contact.html`, find:

   ```html
   <input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY">
   ```

4. Replace `YOUR_WEB3FORMS_ACCESS_KEY` with your key and re-upload the file

Until you do, submitting the form shows a message telling the visitor to email instead : 
it never fails silently.

## Other placeholders to replace

| Where | What |
|---|---|
| `contact.html`, `privacy.html`, `terms.html` | `burhan.dairkee@gmail.com` :  swap for your real address |
| `robots.txt`, `sitemap.xml` | `https://abx-intelligence.com` :  swap for your real domain |
| all four legal pages | Blocks marked `pending-note` need your real business details |
| `COMPLIANCE.md` | Read this before launch. Lists what is outstanding and why |

## Editing content

Copy lives directly in the HTML. Colours, spacing, and type scale are all CSS variables
at the top of `assets/css/style.css` :  change them in one place and the whole site follows.

## Local preview

```bash
python3 -m http.server 4321 --directory /Users/burhandairkee/ABX-Intelligence
```

Then open http://localhost:4321

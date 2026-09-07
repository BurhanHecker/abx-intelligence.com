# Working on the ABX Intelligence website

Everything you need to make a change and get it live. No build tools, no
frameworks, no dependencies to install.

## One-time setup

**1. Get access.** Burhan adds you as a collaborator on the GitHub repo.
You will get an email invitation. Accept it.

**2. Set up an SSH key** so you never deal with passwords or tokens:

```bash
ssh-keygen -t ed25519 -C "your@email.com" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Copy the line it prints, then paste it at
https://github.com/settings/ssh/new and click Add SSH key. That is the
public half of the key. The private half stays on your machine.

**3. Clone the repo:**

```bash
git clone git@github.com:BurhanHecker/abx-intelligence.com.git
cd abx-intelligence.com
```

## The layout

```
public/            THE WEBSITE. Only this folder is deployed.
  index.html            homepage
  solutions.html  services.html  about.html  approach.html  contact.html
  privacy.html  terms.html  cookies.html  refunds.html  404.html
  assets/css/style.css  design system, all tokens at the top
  assets/js/main.js     interaction layer, vanilla JS
  assets/fonts/         self-hosted woff2
  assets/img/           logo variants and favicons
  _headers              security and cache headers

design-source/     original logo files, NOT deployed
COMPLIANCE.md      legal review, NOT deployed, do not publish
serve.py           local preview server
wrangler.jsonc     Cloudflare deploy config
```

**Never move anything into `public/` that should not be public.**
`COMPLIANCE.md` in particular must stay out.

## Making a change

**1. Preview locally.** In one terminal:

```bash
python3 serve.py
```

Open http://localhost:4321. Leave it running; refresh the browser after each
edit.

Use `serve.py`, not `python3 -m http.server`. The site uses extensionless
links (`/solutions`, not `/solutions.html`) and only `serve.py` resolves
those the way Cloudflare does.

**2. Edit.** Copy lives directly in the HTML. Colours, spacing and type
scale are CSS custom properties at the top of `assets/css/style.css`. Change
a token there and the whole site follows.

**3. If you changed CSS or JS, bump the cache version.** Assets are cached
for a year, so without this returning visitors keep the old files:

```bash
cd public && sed -i '' "s/?v=[0-9a-z]*/?v=$(date +%Y%m%d%H%M)/g" *.html && cd ..
```

**4. Ship it:**

```bash
git add -A
git commit -m "describe what changed"
git push
```

## Confirming it worked

Pushing to `main` triggers a deploy automatically. Two ways to check:

**The dashboard.** Cloudflare > Workers & Pages > abx-intelligence-com >
Deployments. You will see the build appear and go green. Takes about 30
seconds.

**The site itself.** Wait ~30 seconds, then hard-refresh
https://abx-intelligence.com with Cmd+Shift+R. Or from the terminal:

```bash
curl -sI https://abx-intelligence.com | head -1     # expect: HTTP/2 200
```

If your change does not appear, it is almost always the cache version in
step 3.

## Rules that matter

- **Pull before you start.** `git pull` first, every time, or you will get
  conflicts when two people edit the same file.
- **Never commit secrets.** No API keys, passwords, or access tokens in the
  repo. It is a public-facing project.
- **Do not remove the `pending-note` blocks** in the legal pages by deleting
  them. They mark real business details that still need filling in.
- **Do not add third-party scripts** without saying so. `public/_headers`
  contains a Content Security Policy that blocks anything not served from
  our own domain. Adding an embed or analytics means updating that policy
  and the Cookie Policy page, which currently states we load nothing
  third-party.
- **Do not claim things that are not true.** No fake testimonials, metrics,
  client counts, or certifications. See COMPLIANCE.md.

## If you break something

Every deploy is a git commit, so nothing is unrecoverable:

```bash
git log --oneline          # find the last good commit
git revert <commit-hash>   # undo it safely
git push
```

Cloudflare also keeps previous deployments and can roll back from the
Deployments tab.

#!/usr/bin/env python3
"""Stamp the Assembly assets with a cache-busting version.

/assets/* is served `immutable, max-age=31536000`, and ES module imports are
fetched by the browser as ordinary requests — so an unversioned `./color.js`
inside a module is pinned for a year and no amount of bumping the page's ?v=
will dislodge it. Every relative import therefore carries the stamp too.

Run after editing anything under public/assets/js/assembly/:

    python3 stamp-assembly.py
"""
import io, re, glob, sys
from datetime import datetime

V = sys.argv[1] if len(sys.argv) > 1 else datetime.now().strftime("%Y%m%d%H%M")

n = 0
for f in glob.glob("public/assets/js/assembly/*.js"):
    s = io.open(f, encoding="utf-8").read()
    new = re.sub(r'(from\s+"\./[\w.-]+\.js)(\?v=[\w.-]+)?"', rf'\1?v={V}"', s)
    if new != s:
        io.open(f, "w", encoding="utf-8").write(new)
        n += len(re.findall(r'from\s+"\./', new))

h = io.open("public/assembly.html", encoding="utf-8").read()
h2 = re.sub(r'(assets/(?:js/assembly/app|css/assembly)\.(?:js|css))\?v=[\w.-]+', rf'\1?v={V}', h)
h2 = re.sub(r'(assets/css/(?:fonts|style)\.css)\?v=[\w.-]+', rf'\1?v={V}', h2)
io.open("public/assembly.html", "w", encoding="utf-8").write(h2)

print(f"stamped {V}: {n} module imports + assembly.html")

# Compliance and risk review

**This is not legal advice.** I am not a lawyer and not qualified in Oman. This is a
checklist of things that looked risky while building the site, written so you can take a
short, well-prepared list to an Omani lawyer rather than an open-ended question. Every
decree number below should be verified before you rely on it.

Reviewed: 6 September 2026. Applies to the website in this repository.

---

## 1. The most urgent item: you are not registered yet

You told me registration is in progress. Until it completes, this is the largest exposure
on the list, and it is not really a website problem.

- Trading, contracting, and invoicing under a business name that is not on the Commercial
  Register is a problem in Oman. Registration is handled by the **Ministry of Commerce,
  Industry and Investment Promotion (MOCIIP)**.
- I have removed every phrase on the site that implied ABX is a registered company. Do not
  put it back until it is true.
- Until you are registered, be careful how you word contracts and invoices. Ask your
  lawyer specifically: *can we lawfully contract with a school before registration
  completes, and if so, in whose name?*

**Action:** finish registration before signing anything further or taking payment.

## 2. Contractual capacity of the founders

I do not know your ages, and it matters.

In most jurisdictions, including Oman, a person under 18 has limited capacity to enter
binding contracts, and agreements they sign may be voidable. If either founder is a minor:

- Contracts you sign may not be enforceable, in either direction. That cuts both ways: it
  also means a client could walk away from an agreement you have already delivered on.
- Company registration usually requires adult shareholders or a guardian arrangement.

**Action:** if either of you is under 18, raise this with the lawyer first. It shapes how
the business must be structured, and there are normal solutions (a parent or guardian as
registered owner until majority). It is much cheaper to handle now than after a dispute.

## 3. Personal data: Oman's PDPL

Oman's **Personal Data Protection Law**, issued under **Royal Decree No. 6/2022**, is the
main law here. It came into force in **February 2023**, and Executive Regulations followed
in 2024 (I am not confident of the exact ministerial decision number: verify it). The
regulator is the **MTCIT**.

Broadly, it requires you to have a lawful basis for processing personal data (usually
consent), to collect only what you need, to tell people what you are doing, to honour their
rights over their data, to keep it secure, to restrict transfers abroad, and to report
breaches. Penalties for non-compliance are significant. **Do not take my word for the
amounts: ask.**

**What the website already does right:**

- Collects only name, email, optional organization, topic, and message.
- Takes explicit opt-in consent via a required, unticked checkbox that links to the policy.
- Sets no cookies, runs no analytics, and loads nothing from any third party.
- States plainly what happens to the data and who receives it.

**Still outstanding:**

- Confirm where Web3Forms and your host store data. If either is outside Oman, cross-border
  transfer conditions apply and you must be able to show you have met them.
- Decide and document how long you keep enquiry emails.
- Have a plan for what you do in the first 72 hours of a breach, before you need it.

## 4. Student data is the real risk in your business

This is the item I would worry about most in the long run, and it has nothing to do with
the marketing site. Your portals hold data about children.

- Children's personal data attracts heightened protection. Consent normally has to come
  from a parent or guardian, and it is the **school's** job to obtain it, not yours.
- In that relationship the school is the **controller** and ABX is the **processor**. That
  distinction has to be written down. You need a **data processing agreement** with every
  school, covering what you may do with the data, security measures, sub-processors,
  breach notification timelines, and what happens to the data when the engagement ends.
- If you host school data outside Oman, transfer rules apply to that too.
- A breach involving student data is a materially worse event than a breach of your
  enquiry inbox. Treat access control, backups, and logging as non-negotiable.

**Action:** get a data processing agreement template drafted properly and put it in place
with your existing school before you take on a second one. This is worth spending money on.

## 5. Do not claim security measures you do not have

I removed a line from the privacy policy claiming "encryption in transit, monitored
infrastructure, and routine backups", because I could not verify it.

Under the PDPL, and as a plain matter of misrepresentation, publishing security claims you
do not meet is worse than saying less. If a breach happened and you had advertised controls
you did not operate, that is the fact that would hurt you.

The privacy policy now states only what is demonstrably true and carries a marked
placeholder. Replace it with what you actually do, and then actually do it.

## 6. Intellectual property in the work you have already delivered

You built systems inside a school you attend. Worth asking your lawyer:

- Who owns that code? If it was built using school equipment, school accounts, school time,
  or as part of coursework, the school may have a claim on it.
- Do you have written permission to describe it publicly, as the site currently does?
- Can you reuse any of it as the basis for a product sold to other schools?

The site currently says you have "designed and deployed customized digital systems inside a
real school environment". That is accurate as far as I know, and I have deliberately not
named the school or shown its branding. **Do not name the school, use its logo, or publish
screenshots of real data without written permission.**

## 7. Other Omani law worth a mention

Verify all decree numbers.

- **Electronic Transactions Law (Royal Decree No. 69/2008)** governs electronic contracts
  and signatures. Relevant when you sign agreements electronically.
- **Cybercrime Law (Royal Decree No. 12/2011)** covers unauthorised access to systems. It
  matters in both directions: it protects you, and it constrains what you may do while
  testing or accessing client systems. Get written authorisation before touching anything.
- **Consumer Protection Law (Royal Decree No. 66/2014)** is mostly aimed at consumer sales.
  Your work is business-to-business under contract, so it is unlikely to bite now, but it
  would if you ever sell a product directly to individuals online.
- **Commercial Companies Law (Royal Decree No. 18/2019)** governs company forms. Relevant to
  how you register.

## 8. Things you should get, beyond legal documents

- **Professional indemnity insurance.** If a system you built causes a school to lose data
  or miss a statutory reporting deadline, you want cover. Ask what is available in Oman for
  a business your size.
- **A written services agreement template.** Scope, payment schedule, acceptance criteria,
  IP ownership, support terms, liability cap, termination. The liability cap matters most.
- **A backup and recovery routine you have actually tested.** An untested backup is not a
  backup.

---

## Website compliance status

| Item | Status |
|---|---|
| Privacy Policy | Rewritten, PDPL-aware, placeholders marked |
| Terms and Conditions | Rewritten, Oman governing law |
| Cookie Policy | Added, accurately states no cookies are set |
| Payment and Refund Policy | Added, written for contract work |
| Cookie consent banner | Not required: no cookies, no analytics, no third-party loads |
| Form consent | Required unticked checkbox, links to Privacy Policy |
| Data minimisation | Only name, email, optional organization, topic, message |
| Analytics and tracking | None |
| Third-party embeds | None on page load. Web3Forms only on submit |
| Fonts | Self-hosted, SIL OFL 1.1, license bundled |
| Image copyright | No photographs or stock images used anywhere |
| Alt text | No `<img>` elements exist; decorative SVG is `aria-hidden` |
| Colour contrast | All text meets WCAG 2.1 AA |
| Keyboard access | Full tab order, visible focus, skip link, no traps |
| Fake reviews, metrics, counters | None present |
| Business details | **Outstanding: needs CR number, address, phone** |

## Before you launch

1. Replace every `.pending-note` block. Search the repo for `pending-note` to find them.
2. Replace `burhan.dairkee@gmail.com` with the address you actually monitor.
3. Add your Web3Forms access key in `contact.html`.
4. Confirm the last-updated dates on the four legal pages.
5. Have the legal pages reviewed by an Omani lawyer.
6. Delete the `.pending-note` CSS rule from `assets/css/style.css` once all are gone.

---

# Appendix: choosing a company structure (researched 8 September 2026)

Still not legal or tax advice. Sources are listed at the end of each point.
Verify every figure before acting.

## Context

Both founders are expatriates resident in Oman, both under 18, operating a
software business whose client and revenue are in Oman.

## The two structures actually available

| | SPC (One-Person Company) | LLC |
|---|---|---|
| Shareholders | Exactly one | Two to fifty |
| Fits two co-founders | No | Yes |
| Foreign ownership | Permitted, but only for selected activities | Permitted in most open sectors |
| Minimum capital | None specified | None specified for most activities |
| Liability | Limited to company capital | Limited to company capital |

The Sole Proprietorship (المؤسسة الفردية) is **not available to you**.
It is restricted to Omani and GCC nationals, regardless of visa type or
years of residency.

Because there are two of you, the **LLC** is the structure that fits. An SPC
would mean one founder legally owns everything, with the other holding no
recorded stake.

## The cost nobody mentions up front

Companies that are **100% foreign-owned** must employ at least one Omani
national within one year of starting commercial activity, and register them
with the Social Protection Fund. Non-compliance brings a 30-day grace
period, extendable once.

For a two-person business with little revenue, one salaried employee plus
social contributions is the single largest ongoing cost of registering, and
it is easy to miss when reading a setup-cost table.

Sources disagree on the start date: Fragomen states 1 April 2024, another
source says April 2026. **Confirm the current position and whether it
applies at your size before committing.**

Ask the lawyer specifically: does bringing in an Omani shareholder above
some threshold remove this obligation, and what would that cost in equity?

## Indicative government fees

Registration roughly OMR 150 to 500; licence roughly OMR 250 to 3,000
depending on activity. Notarisation, translation and any premises
requirement are extra. Treat these as a starting range, not a quote.

## Age

Omani majority is 18. Neither founder can be expected to hold shares or sign
binding contracts directly. The realistic route is a parent or guardian as
registered owner or signatory until you reach majority, then transferring
shares. Get the transfer mechanism agreed in writing at the outset, so
ownership passing back to you later is not left to goodwill.

## Do not incorporate abroad

A company incorporated in the US, UK or Estonia but managed from Oman is
likely still tax-resident in Oman, so it adds obligations rather than
removing them, and it grants no visa or residency anywhere.

A US LLC in particular is a trap at your scale: foreign-owned single-member
LLCs must file IRS Form 5472 annually, and the penalty for failing to is
USD 25,000 per year, plus a further USD 25,000 for each 90-day period the
failure continues after notice.

## Sources

- Sole proprietorship restricted to Omani/GCC nationals: deel.com, omanbusinesssetup.com
- LLC shareholder range and capital: commitbiz.com, omanverified.com
- 100% foreign ownership: sovereigngroup.com, healyconsultants.com
- Omanisation rule for foreign-owned companies: fragomen.com
- Government fee ranges: omanverified.com, setupinoman.com
- Form 5472 penalty: llcuniversity.com, greenbacktaxservices.com

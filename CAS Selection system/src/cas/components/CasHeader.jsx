import { CAS_CONFIG } from '../config'

/**
 * The navy bar with the gold underline.
 *
 * `links` is an array of { label, href, onClick }. Passing `href` renders a
 * plain <a>; if the portal uses a client-side router, hand in its <Link>
 * component via the `LinkComponent` prop instead so navigation stays SPA.
 */
export function CasHeader({
  section,
  email,
  links = [],
  live = false,
  logoSrc = null,
  LinkComponent = null,
}) {
  const Anchor = LinkComponent || 'a'
  return (
    <header className="cas-header">
      <div className="cas-header__inner">
        <a className="cas-brand" href={CAS_CONFIG.routes.portal}>
          {logoSrc ? (
            <img className="cas-brand__logo" src={logoSrc} alt="ABA" />
          ) : (
            <span className="cas-brand__mark">ABA</span>
          )}
          <span className="cas-brand__name">{section}</span>
        </a>
        {live && (
          <>
            <span className="cas-live-dot" aria-hidden="true" />
            <span className="cas-sr-only">Updating live</span>
          </>
        )}

        <span className="cas-header__spacer" />

        {email && <span className="cas-header__email">{email}</span>}

        {links.map((link) =>
          link.onClick ? (
            <button
              key={link.label}
              type="button"
              className="cas-pill"
              onClick={link.onClick}
            >
              {link.label}
            </button>
          ) : (
            <Anchor
              key={link.label}
              className="cas-pill"
              href={link.href}
              to={link.href}
            >
              {link.label}
            </Anchor>
          )
        )}
      </div>
    </header>
  )
}

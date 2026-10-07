/**
 * Airframe briefs tab.
 *
 * These are standalone HTML documents in `public/afrotc/briefs/`, not React views. They have
 * their own typography, print styles and image galleries, and they are read start-to-finish
 * rather than interacted with - rebuilding them as components would buy nothing and lose the
 * print layout. `public/` is served byte-for-byte, so they are linked with a plain <a>, never
 * <Link> (a Link would route them into the SPA and 404).
 *
 * Reachable before this existed only by opening the file off disk, which is the same problem
 * the recitation sheet and rank drill had before they were routed.
 */
const BRIEFS = [
  {
    href: '/afrotc/briefs/roma.html',
    title: 'Roma',
    tag: 'Air Force', af: true,
    meta: 'U.S. Army Air Service · 1921–1922 · semi-rigid',
    desc: 'The brief to give. The only airframe here operated by a direct ancestor of the USAF. '
        + 'Covers the lineage case, what a semi-rigid is, the 21 Feb 1922 crash, and the three '
        + 'legacies still live today — the helium mandate, the first Cheney Award, and Roma Road '
        + 'at Langley AFB.',
  },
  {
    href: '/afrotc/briefs/sea-scout.html',
    title: 'Sea Scout (SS) class',
    tag: 'British · RNAS/RAF',
    meta: 'Royal Naval Air Service · 1915–1918 · non-rigid',
    desc: 'Deep dive. Why it is a "class", every SS variant, the three aeroplane-fuselage cars '
        + '(B.E.2c, Maurice Farman, Armstrong Whitworth), and a part-by-part anatomy built from '
        + 'Whale’s 1919 account. Not Air Force heritage — kept for the technical depth.',
  },
  {
    href: '/afrotc/briefs/airship-dossiers.html',
    title: 'Seven-airframe dossier',
    tag: 'Overview',
    meta: 'Sea Scout · Roma · Graf Zeppelin/Hindenburg · Akron/Macon · L · K · ZPG',
    desc: 'The original comparison set, with a side-by-side table and candidate images for each. '
        + 'Six of the seven are Navy or foreign; use it for context and contrast.',
  },
];

export default function AirframeBriefs() {
  return (
    <div className="afq-rotc-drill">
      <p className="afq-note">
        Full documents. They open in a new tab and print cleanly — each one is self-contained
        with its own sources and image credits.
      </p>

      <div className="afq-brief-list">
        {BRIEFS.map((b) => (
          <a key={b.href} className="afq-brief" href={b.href} target="_blank" rel="noopener noreferrer">
            <span className="afq-brief-top">
              <b>{b.title}</b>
              <span className={b.af ? 'tag af' : 'tag'}>{b.tag}</span>
            </span>
            <p><em>{b.meta}</em></p>
            <p>{b.desc}</p>
          </a>
        ))}
      </div>

      <div className="afq-brief-note">
        <strong>If the requirement is an Air Force airframe, brief the Roma.</strong> The Army and
        the Air Force were one service until 18 September 1947, and the Air Force traces its own
        lineage to 1 August 1907 — so an Army Air Service aircraft is Air Force heritage by the
        Air Force&rsquo;s own reckoning. The other six entries are U.S. Navy or foreign.
      </div>
    </div>
  );
}

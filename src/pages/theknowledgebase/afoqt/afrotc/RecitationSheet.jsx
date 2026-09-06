/**
 * "Forty Minutes to Recitation" — the AFROTC graded-recitation crash sheet.
 *
 * Built 3 September 2026 from five research passes against DAFPAM 34-1203, DAFI 36-2903 (as
 * amended through DAFGM 2026-02), AFROTCI 36-2011 Vols 1 and 3, AFROTCI 36-2008, 4 U.S.C. § 4,
 * and official .mil / DVIDS sources. Ported into the app 2026-09-05 so it lives beside the drill
 * instead of as a loose page.
 *
 * THE FLAGS ARE AS IMPORTANT AS THE FACTS. Several items here are recent enough that most course
 * material still teaches the superseded answer, and three of those sit inside the recite-from-
 * memory block. They are marked rather than silently corrected, because the move in the room is
 * to give what cadre teaches and show you know it changed - not to correct an instructor holding
 * a slide. Do not "tidy up" a flagged item by deleting its flag.
 *
 * Leadership names go stale. Anything under a `changed` marker or an "as of" date should be
 * spot-checked in a browser before a recitation, and the Ask Your Cadre section at the bottom is
 * a list of genuine conflicts, not padding.
 */

function Call({ kind, tag, children }) {
  return (
    <div className={`afq-rotc-call ${kind}`}>
      {tag && <span className="afq-rotc-tag">{tag}</span>}
      {children}
    </div>
  );
}

function Sec({ id, sob, title, clock, children }) {
  return (
    <section id={id} className="afq-rotc-sec">
      <div className="afq-rotc-sec-head">
        <span className="afq-rotc-sob">{sob}</span>
        <h3>{title}</h3>
        <span className="afq-rotc-clock">{clock}</span>
      </div>
      {children}
    </section>
  );
}

function Fact({ term, value, small }) {
  return (
    <div className="afq-rotc-fact">
      <dt>{term}</dt>
      <dd>{value}{small && <small>{small}</small>}</dd>
    </div>
  );
}

const BUDGET = [
  { id: 'chain', mins: 8, label: 'Chain of command', flex: 8, priority: true },
  { id: 'grades', mins: 12, label: 'Grade structure', flex: 12, priority: true },
  { id: 'customs', mins: 10, label: 'Customs & courtesies', flex: 10, priority: true },
  { id: 'dress', mins: 5, label: 'Dress & grooming', flex: 5, priority: false },
  { id: 'drill', mins: 5, label: 'Drill & POC', flex: 5, priority: false },
];

export default function RecitationSheet({ onGoToDrill }) {
  const jump = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="afq-rotc-sheet">
      <header className="afq-rotc-mast">
        <p className="afq-rotc-eyebrow">AFROTC · Samples of Behavior 1, 2, 4, 6, 7, 8</p>
        <h2>Forty Minutes to Recitation</h2>
        <p className="afq-rotc-sub">
          A crash sheet for the graded recitation. Ordered by what the syllabus says you must
          recite from memory, then by what is most likely to be asked. Every fact was verified
          against live sources on 3 September 2026 — the flags are as important as the answers.
        </p>
        <div className="afq-rotc-meta">
          <span>Verified 03 SEP 2026</span>
          <span>5 research passes · 1,696 lines of source notes</span>
        </div>
      </header>

      <div className="afq-rotc-budget">
        <div className="afq-rotc-budget-head">
          <strong>Suggested 40-minute split</strong>
          <span>Priority block = the three you must recite from memory</span>
        </div>
        <div className="afq-rotc-budget-bar" aria-hidden="true">
          {BUDGET.map((b) => (
            <i key={b.id} style={{ flex: b.flex }} className={b.priority ? 'pri' : ''} />
          ))}
        </div>
        <div className="afq-rotc-budget-legend">
          {BUDGET.map((b) => (
            <a key={b.id} href={`#${b.id}`} onClick={jump(b.id)}>
              <span className="mins">{b.mins} min</span>
              <span className="lbl">{b.label}</span>
            </a>
          ))}
        </div>
      </div>

      <Call kind="alert" tag="Read this before you memorize anything">
        <p>
          Four things in circulation right now are <strong>out of date</strong>, and three of them
          sit inside the recite-from-memory block. If your slide deck predates this year, it
          teaches the wrong answer:
        </p>
        <ol>
          <li><strong>CSAF is Gen. Kenneth S. Wilsbach</strong>, not Allvin. <strong>CMSAF is David R. Wolfe</strong>, not Flosi.</li>
          <li><strong>The Holm Center is no longer under Air University.</strong> Since 8 Oct 2024 it runs through Air Force Recruiting Service / the Air Force Accessions Center.</li>
          <li><strong>Chief of Space Operations changed on 3 Sep 2026</strong> — Gen. Douglas A. Schiess relieved Gen. Saltzman.</li>
          <li><strong>AFROTC has no cadet enlisted ranks.</strong> If you were taught &ldquo;Cadet Airman Basic,&rdquo; that is AFJROTC and Civil Air Patrol — not college AFROTC.</li>
        </ol>
        <p className="last">
          <strong>How to play it:</strong> know the current answer, but give what your cadre teaches
          and add &ldquo;…and I know it was reassigned in October 2024&rdquo; as a note. Demonstrate
          that you know both. Do not argue with an instructor holding a slide.
        </p>
      </Call>

      {/* ── CHAIN OF COMMAND ── */}
      <Sec id="chain" sob="SOB 2.1 · 2.2" title="Chain of Command" clock="8 min">
        <Call kind="gold" tag="Recite from memory">
          <p className="last">
            SOB 2.2 asks you to summarize the chain <em>from the President down to you as a
            cadet</em> — one continuous ladder, not two lists. Most instructors want the national
            half word-perfect and the local half by <em>position</em>, with your own det&rsquo;s
            names filled in.
          </p>
        </Call>

        <div className="afq-rotc-cols">
          <div className="afq-rotc-card">
            <h4>National / DAF</h4>
            <ol className="afq-rotc-ladder">
              <li><span className="role">President of the United States</span><span className="name">Donald J. Trump</span></li>
              <li><span className="role">Secretary of Defense</span><span className="name">The Hon. Pete Hegseth</span></li>
              <li><span className="role">Secretary of the Air Force</span><span className="name">The Hon. Dr. Troy E. Meink</span></li>
              <li><span className="role">Under Secretary of the Air Force</span><span className="name">The Hon. Matthew L. Lohmeier</span></li>
              <li className="changed"><span className="role">Chief of Staff of the Air Force</span><span className="name">Gen. Kenneth S. Wilsbach</span></li>
              <li className="changed"><span className="role">Chief Master Sgt of the Air Force</span><span className="name">CMSAF David R. Wolfe</span></li>
            </ol>
            <h5>Space Force parallel</h5>
            <ul className="last">
              <li><strong>Chief of Space Operations</strong> — Gen. Douglas A. Schiess <em>(assumed command 3 Sep 2026)</em></li>
              <li><strong>CMSSF</strong> — John F. Bentivegna</li>
            </ul>
          </div>

          <div className="afq-rotc-card">
            <h4>AFROTC</h4>
            <ol className="afq-rotc-ladder">
              <li><span className="role">Commander, AETC</span><span className="name">Lt Gen Clark J. Quinn</span></li>
              <li><span className="role">Cdr, AF Accessions Center / AFRS</span><span className="name">Maj Gen Jeffrey W. Nelson</span></li>
              <li className="changed"><span className="role">Commander, Holm Center</span><span className="name">Brig Gen Christopher T. Lay</span></li>
              <li className="changed"><span className="role">Commander, HQ AFROTC</span><span className="name">Col Michael G. Fleming</span></li>
              <li><span className="role">Detachment Commander (Det/CC)</span><span className="name"><em>fill in from your det</em></span></li>
              <li><span className="role">Operations Flight Commander</span><span className="name">Maj Smith <em>· per your routing sheet</em></span></li>
              <li><span className="role">Cadet Wing Commander</span><span className="name">C/Col Laird <em>· verify, dated Mar 2026</em></span></li>
              <li><span className="role">Cadet Squadron Commander</span><span className="name">C/Maj Bushman <em>· verify</em></span></li>
              <li><span className="role">Cadet Flight Commander</span><span className="name">C/Capt Hanna <em>· verify</em></span></li>
              <li className="you"><span className="role">The individual cadet</span><span className="name">You</span></li>
            </ol>
          </div>
        </div>

        <Call kind="alert" tag="The single most likely thing to catch you out">
          <p><strong>Old chain (what most study guides still say):</strong> AETC → <strong>Air University</strong> → Holm Center → AFROTC</p>
          <p><strong>Current chain:</strong> AETC → <strong>AF Recruiting Service / AF Accessions Center</strong> → Holm Center → AFROTC</p>
          <p className="last">
            The Holm Center was relieved from Air University on <strong>8 October 2024</strong> and
            the transition finished in October 2025. Air University still exists — Lt Gen Daniel H.
            Tulley commands it — it is simply not AFROTC&rsquo;s parent any more. Air University&rsquo;s
            own website still hosts a legacy Holm Center page, which is why the wrong answer keeps
            circulating.
          </p>
        </Call>

        <div className="afq-rotc-card">
          <h4>Three questions instructors like</h4>
          <h5>&ldquo;Is the Chairman of the Joint Chiefs in your chain of command?&rdquo;</h5>
          <p>
            <strong>No.</strong> Gen. Dan Caine is the <em>principal military advisor</em> to the
            President, SecDef, and the National Security Council. The operational chain runs
            <strong> President → SecDef → Combatant Commanders</strong>. The service chain you
            recite runs <strong>President → SecDef → SecAF → CSAF</strong>.
          </p>
          <h5>&ldquo;Is it the Department of War now?&rdquo;</h5>
          <p>
            Say <strong>&ldquo;Secretary of Defense.&rdquo;</strong> Executive Order 14347 (5 Sep 2025)
            authorized &ldquo;Department of War&rdquo; and &ldquo;Secretary of War&rdquo; as
            <strong> secondary titles only</strong>. The FY2026 NDAA did not codify it. Safe full
            answer: <em>&ldquo;Secretary of Defense — the Honorable Pete Hegseth. &lsquo;Department of
            War&rsquo; is a secondary title authorized by executive order; the statutory name is
            still the Department of Defense.&rdquo;</em>
          </p>
          <h5>&ldquo;Which region does your detachment report through?&rdquo;</h5>
          <p className="last">
            <strong>Ask your cadre — don&rsquo;t guess.</strong> AFROTC historically used four
            geographic regions, but every public source describing them is years old and the
            echelon could not be confirmed as still active. Do not assert a region unless cadre
            confirms it.
          </p>
        </div>
      </Sec>

      {/* ── GRADE STRUCTURE ── */}
      <Sec id="grades" sob="SOB 1.1 · 1.2 · 1.3" title="Grade Structure" clock="12 min">
        <Call kind="gold" tag="Recite from memory">
          <p className="last">
            The pub wording is &ldquo;identify <strong>all</strong> enlisted ranks by both insignia
            and name&rdquo; — and the same for officer and cadet ranks. Not a sample. All of them.
          </p>
        </Call>

        <h4>The one model that makes all nine enlisted grades memorizable</h4>
        <Call kind="blue" tag="Total stripes = pay grade − 1">
          <p className="last">
            Read every Air Force chevron in three parts: <strong>upper chevrons</strong> above the
            star, <strong>the star</strong> in the centre circle, <strong>rockers</strong> below it.
            Uppers build 1→2→3 across E-2/E-3/E-4 and freeze at 3 through E-7. Rockers then build
            1→2→3 across E-5/E-6/E-7 and freeze. E-8 and E-9 add a 4th and 5th chevron <em>on
            top</em>. If your stripe count isn&rsquo;t (E-number − 1), you drew it wrong.
          </p>
        </Call>

        <div className="afq-rotc-scroll">
          <table>
            <thead>
              <tr><th className="num">Grade</th><th>Title</th><th>Abbr</th><th>Tier</th><th className="num">Up</th><th className="num">Rockers</th><th className="num">Total</th></tr>
            </thead>
            <tbody>
              <tr><td className="num">E-1</td><td>Airman Basic</td><td>AB</td><td>Airman</td><td className="num">—</td><td className="num">—</td><td className="num">0 · no insignia</td></tr>
              <tr><td className="num">E-2</td><td>Airman</td><td>Amn</td><td>Airman</td><td className="num">1</td><td className="num">0</td><td className="num">1</td></tr>
              <tr><td className="num">E-3</td><td>Airman First Class</td><td>A1C</td><td>Airman</td><td className="num">2</td><td className="num">0</td><td className="num">2</td></tr>
              <tr><td className="num">E-4</td><td>Senior Airman</td><td>SrA</td><td>Airman — <strong>not an NCO</strong></td><td className="num">3</td><td className="num">0</td><td className="num">3</td></tr>
              <tr className="hi"><td className="num">E-5</td><td>Staff Sergeant</td><td>SSgt</td><td><strong>First NCO</strong></td><td className="num">3</td><td className="num">1</td><td className="num">4</td></tr>
              <tr><td className="num">E-6</td><td>Technical Sergeant</td><td>TSgt</td><td>NCO</td><td className="num">3</td><td className="num">2</td><td className="num">5</td></tr>
              <tr className="hi"><td className="num">E-7</td><td>Master Sergeant</td><td>MSgt</td><td><strong>First SNCO</strong></td><td className="num">3</td><td className="num">3</td><td className="num">6</td></tr>
              <tr><td className="num">E-8</td><td>Senior Master Sergeant</td><td>SMSgt</td><td>SNCO</td><td className="num">4</td><td className="num">3</td><td className="num">7</td></tr>
              <tr><td className="num">E-9</td><td>Chief Master Sergeant</td><td>CMSgt</td><td>SNCO</td><td className="num">5</td><td className="num">3</td><td className="num">8</td></tr>
            </tbody>
          </table>
        </div>

        <div className="afq-rotc-cols">
          <Call kind="alert" tag="There is no wreath at E-8 or E-9">
            <p className="last">
              Regular SMSgt and CMSgt insignia have <strong>no wreath</strong>. A laurel wreath
              appears on exactly one Air Force enlisted insignia — the <strong>CMSAF</strong>,
              encircling the star, plus the Great Seal and two stars in the upper field. Wreaths at
              E-8/E-9 are an Army, Marine, and Navy convention. If an answer key says SMSgt has a
              wreath, the key is wrong.
            </p>
          </Call>
          <div className="afq-rotc-card">
            <h4>Special insignia</h4>
            <ul className="last">
              <li><strong>First Sergeant</strong> — a <strong>diamond replaces the star</strong>. It is a <em>duty position, not a rank</em>, held at E-7, E-8, or E-9 (so three versions exist).</li>
              <li><strong>Command Chief (E-9)</strong> — standard CMSgt chevron plus <strong>an extra star in the upper field</strong>.</li>
              <li><strong>CMSAF</strong> — 8 stripes, wreath around the star, Great Seal + 2 stars up top.</li>
            </ul>
          </div>
        </div>

        <h4>Officer — Air Force and Space Force are identical</h4>
        <Call kind="gold" tag="Gold before silver">
          <p className="last">
            Within each pair, <strong>gold is junior, silver is senior</strong>. 2d Lt gold bar →
            1st Lt silver bar. Major gold oak leaf → Lt Col silver oak leaf. The two gold-wearers
            are a <strong>2d Lt and a Major</strong>; the two silver-wearers are a <strong>1st Lt
            and a Lt Col</strong>. Colonel&rsquo;s eagle is silver; all general stars are silver.
            There is no gold eagle.
          </p>
        </Call>

        <div className="afq-rotc-scroll">
          <table>
            <thead><tr><th className="num">Grade</th><th>Title</th><th>Abbr</th><th>Group</th><th>Insignia</th></tr></thead>
            <tbody>
              <tr className="hi"><td className="num">O-1</td><td>Second Lieutenant</td><td>2d Lt</td><td>Company grade</td><td>One <strong>gold</strong> bar</td></tr>
              <tr className="hi"><td className="num">O-2</td><td>First Lieutenant</td><td>1st Lt</td><td>Company grade</td><td>One <strong>silver</strong> bar</td></tr>
              <tr><td className="num">O-3</td><td>Captain</td><td>Capt</td><td>Company grade</td><td>Two silver bars</td></tr>
              <tr className="hi"><td className="num">O-4</td><td>Major</td><td>Maj</td><td>Field grade</td><td><strong>Gold</strong> oak leaf</td></tr>
              <tr className="hi"><td className="num">O-5</td><td>Lieutenant Colonel</td><td>Lt Col</td><td>Field grade</td><td><strong>Silver</strong> oak leaf</td></tr>
              <tr><td className="num">O-6</td><td>Colonel</td><td>Col</td><td>Field grade</td><td>Silver eagle</td></tr>
              <tr><td className="num">O-7</td><td>Brigadier General</td><td>Brig Gen</td><td>General officer</td><td>1 silver star</td></tr>
              <tr><td className="num">O-8</td><td>Major General</td><td>Maj Gen</td><td>General officer</td><td>2 silver stars</td></tr>
              <tr><td className="num">O-9</td><td>Lieutenant General</td><td>Lt Gen</td><td>General officer</td><td>3 silver stars</td></tr>
              <tr><td className="num">O-10</td><td>General</td><td>Gen</td><td>General officer</td><td>4 silver stars</td></tr>
            </tbody>
          </table>
        </div>
        <p><strong>Terms of address:</strong> all four general grades are &ldquo;General.&rdquo; Both lieutenant grades are &ldquo;Lieutenant.&rdquo; <strong>Lt Col is addressed as &ldquo;Colonel.&rdquo;</strong></p>

        <h4>Joint — the Navy traps are the whole test</h4>
        <div className="afq-rotc-scroll">
          <table>
            <thead><tr><th className="num">Grade</th><th>Air Force / Space Force</th><th>Army</th><th>Marine Corps</th><th>Navy / Coast Guard</th></tr></thead>
            <tbody>
              <tr><td className="num">O-1</td><td>Second Lieutenant</td><td>2LT</td><td>2ndLt</td><td><strong>Ensign (ENS)</strong></td></tr>
              <tr><td className="num">O-2</td><td>First Lieutenant</td><td>1LT</td><td>1stLt</td><td><strong>Lieutenant (Junior Grade) — LTJG</strong></td></tr>
              <tr className="hi"><td className="num">O-3</td><td>Captain</td><td>CPT</td><td>Capt</td><td><strong>Lieutenant (LT)</strong></td></tr>
              <tr><td className="num">O-4</td><td>Major</td><td>MAJ</td><td>Maj</td><td>Lieutenant Commander (LCDR)</td></tr>
              <tr><td className="num">O-5</td><td>Lieutenant Colonel</td><td>LTC</td><td>LtCol</td><td>Commander (CDR)</td></tr>
              <tr className="hi"><td className="num">O-6</td><td>Colonel</td><td>COL</td><td>Col</td><td><strong>Captain (CAPT)</strong></td></tr>
              <tr><td className="num">O-7</td><td>Brigadier General</td><td>BG</td><td>BGen</td><td>Rear Admiral Lower Half (RDML)</td></tr>
              <tr><td className="num">O-8</td><td>Major General</td><td>MG</td><td>MajGen</td><td>Rear Admiral Upper Half (RADM)</td></tr>
              <tr><td className="num">O-9</td><td>Lieutenant General</td><td>LTG</td><td>LtGen</td><td>Vice Admiral (VADM)</td></tr>
              <tr><td className="num">O-10</td><td>General</td><td>GEN</td><td>Gen</td><td>Admiral (ADM)</td></tr>
            </tbody>
          </table>
        </div>

        <Call kind="alert" tag="The five Navy answers you will be asked">
          <ol className="last">
            <li><strong>Navy O-6 &ldquo;Captain&rdquo; = Air Force Colonel.</strong> Three grades senior to an Air Force Captain. This is the #1 cross-service question.</li>
            <li><strong>Navy O-3 &ldquo;Lieutenant&rdquo; = Air Force Captain.</strong> A Navy Lieutenant is not a lieutenant-equivalent.</li>
            <li>Navy O-1 is <strong>Ensign</strong>, not Second Lieutenant. There is no Navy major, lieutenant colonel, or general.</li>
            <li>O-7 and O-8 are <em>both</em> &ldquo;Rear Admiral&rdquo; — <strong>Lower Half = RDML = 1 star</strong>, <strong>Upper Half = RADM = 2 stars</strong>.</li>
            <li>Coast Guard officer ranks are <strong>identical to the Navy&rsquo;s</strong>. Navy and CG flag officers are Admirals, never Generals.</li>
          </ol>
        </Call>
        <p><strong>The shortcut that makes this easy:</strong> the metal collar devices are the <em>same across all six services</em> for O-1 through O-10. A gold bar is an O-1 in every service. Only the titles change.</p>

        <h4>Space Force enlisted — one divergence matters</h4>
        <dl className="afq-rotc-facts">
          <Fact term="USAF E-1 → E-4" value="AB · Amn · A1C · SrA" />
          <Fact term="USSF E-1 → E-4" value="Specialist 1 – 4" />
          <Fact term="The only NCO-level split" value="E-5" small="USAF = Staff Sergeant. USSF = Sergeant. There is no USSF Staff Sergeant." />
          <Fact term="E-6 and above" value="Identical" small="Technical, Master, Senior Master, Chief Master Sergeant" />
        </dl>
        <p>
          Space Force officer titles are <strong>identical</strong> to the Air Force. Space Force
          members are <strong>Guardians</strong>; the hexagon insignia has six sides for the sixth
          branch. Treat <strong>First Sergeant and Command Chief as Air Force answers</strong> — the
          official chart shows them on the Air Force side only.
        </p>

        <h4>AFROTC cadet grades — there are exactly eight</h4>
        <Call kind="alert" tag="No cadet enlisted ranks exist">
          <p className="last">
            AFROTCI 36-2011 Vol 3, para 10.7.5, verbatim: <em>&ldquo;No cadet is authorized to hold
            &lsquo;enlisted&rsquo; cadet rank or any grade above Cadet Colonel (C/Col).&rdquo;</em>
            Cadet Airman Basic, Cadet Staff Sergeant and the rest belong to <strong>AFJROTC and
            Civil Air Patrol</strong>. Reciting a cadet enlisted ladder here loses you points.
          </p>
        </Call>

        <div className="afq-rotc-scroll">
          <table>
            <thead><tr><th>Cadet grade</th><th>Abbr</th><th>Course</th><th>Class</th><th>Insignia</th></tr></thead>
            <tbody>
              <tr><td>Cadet Fourth Class</td><td>C/4C</td><td>GMC</td><td>AS100</td><td><strong>Blue &amp; silver</strong> — 1 stripe</td></tr>
              <tr><td>Cadet Third Class</td><td>C/3C</td><td>GMC</td><td>AS200</td><td><strong>Blue &amp; silver</strong> — 2 stripes</td></tr>
              <tr><td>Cadet Second Lieutenant</td><td>C/2Lt</td><td>POC</td><td>AS300</td><td><strong>Black &amp; silver</strong> — 1 wide</td></tr>
              <tr><td>Cadet First Lieutenant</td><td>C/1Lt</td><td>POC</td><td>AS300</td><td>1 wide + 1 narrow</td></tr>
              <tr><td>Cadet Captain</td><td>C/Capt</td><td>POC</td><td>AS300/400</td><td>2 wide</td></tr>
              <tr><td>Cadet Major</td><td>C/Maj</td><td>POC</td><td>AS400</td><td>2 wide + 1 narrow between</td></tr>
              <tr><td>Cadet Lieutenant Colonel</td><td>C/Lt Col</td><td>POC</td><td>AS400</td><td>3 wide</td></tr>
              <tr className="hi"><td>Cadet Colonel</td><td>C/Col</td><td>POC</td><td>AS400</td><td>4 wide — normally the Cadet Wing Commander</td></tr>
            </tbody>
          </table>
        </div>

        <div className="afq-rotc-cols">
          <div className="afq-rotc-card">
            <h4>GMC vs POC</h4>
            <p className="last">
              <strong>GMC</strong> = General Military Course, AS100/AS200, grades C/4C and C/3C only.
              <strong> POC</strong> = Professional Officer Course, AS300/AS400, cadet officer grades.
              <strong> Field Training is the gate between them.</strong> POC is not &ldquo;point of contact.&rdquo;
            </p>
          </div>
          <div className="afq-rotc-card">
            <h4>Wear rules they quiz</h4>
            <ul className="last">
              <li><strong>GMC</strong> = blue &amp; silver, <strong>point toward the neck</strong>. <strong>POC</strong> = black &amp; silver, <strong>stripes parallel to the shoulder seam</strong>.</li>
              <li>Rank centred <strong>5/8 inch from the shoulder seam</strong>.</li>
              <li><strong>Everyone wears C/3C at Field Training</strong>, whatever their det rank. CTAs wear C/Col.</li>
              <li>&ldquo;Cadet&rdquo; always precedes the rank — <em>Cadet Captain Smith</em>, never <em>Captain Smith</em>.</li>
            </ul>
          </div>
        </div>

        <Call kind="ok" tag="Confirmed against the official chart">
          <p>
            The stripe patterns above were originally inferred — the authoritative figure is an
            embedded image no automated tool could read. <strong>The AFROTC rank chart has now been
            checked directly and confirms every one.</strong> Two corrections came out of it: the
            chart writes the abbreviations <strong>C/2Lt</strong> and <strong>C/1Lt</strong> (some
            pubs use C/2d Lt and C/1st Lt), and it groups C/3C and C/4C under an
            <strong> &ldquo;Airman&rdquo;</strong> heading — a tier label on the chart, <em>not</em>
            an enlisted rank. The eight grades are unchanged.
          </p>
          <p className="last">
            <strong>Drill them:</strong>{' '}
            <button type="button" className="afq-rotc-inline-link" onClick={onGoToDrill}>
              open the rank drill
            </button>{' '}
            — flashcards from insignia to name, then a name-to-insignia picker. Use its settings to
            cut the deck down to the two confusable pairs.
          </p>
        </Call>

        <Call kind="blue" tag="How to tell the confusable pairs apart">
          <ul className="last">
            <li><strong>C/1Lt vs C/Capt</strong> — both show two marks. C/1Lt&rsquo;s second stripe is <strong>narrow</strong>; C/Capt&rsquo;s are two <strong>equal wide</strong> stripes.</li>
            <li><strong>C/Maj vs C/Lt Col</strong> — both show three marks. C/Maj&rsquo;s <strong>middle stripe is narrow</strong>; C/Lt Col&rsquo;s are three <strong>equal wide</strong> stripes.</li>
            <li><strong>Count widths, not stripes.</strong> That single habit separates both pairs.</li>
          </ul>
        </Call>
      </Sec>

      {/* ── CUSTOMS & COURTESIES ── */}
      <Sec id="customs" sob="SOB 4.1 – 4.7" title="Customs & Courtesies" clock="10 min">
        <Call kind="gold" tag="Recite from memory">
          <p className="last">
            The reporting scripts below are <strong>exact words</strong>. Say them as written — this
            is a performance-graded objective (P1/P2/P3), not a knowledge one.
          </p>
        </Call>

        <h4>Reporting in and out — the verbatim scripts</h4>
        <div className="afq-rotc-cols">
          <div>
            <h5>Reporting in</h5>
            <div className="afq-rotc-script"><span className="who">If you were ordered to report</span>&ldquo;Sir/Ma&rsquo;am, Cadet [Last Name] reports as ordered.&rdquo;</div>
            <div className="afq-rotc-script"><span className="who">If you came on your own initiative</span>&ldquo;Sir/Ma&rsquo;am, Cadet [Last Name] reports.&rdquo;</div>
            <p className="afq-rotc-fine">
              Knock once firmly · wait for &ldquo;Enter&rdquo; · close the door without turning your
              back to the room · march by the most direct route to <strong>two paces in front of the
              desk</strong> · position of attention · <strong>salute</strong> and speak · hold the
              salute until it is returned.
            </p>
          </div>
          <div>
            <h5>Reporting out</h5>
            <div className="afq-rotc-script"><span className="who">When the meeting is winding down</span>&ldquo;Will that be all?&rdquo;</div>
            <div className="afq-rotc-script"><span className="who">Then, on the salute</span>&ldquo;Good morning / afternoon / evening, [Rank and Name].&rdquo;</div>
            <p className="afq-rotc-fine">
              Stand to attention · <strong>one step to the side, one step to the rear</strong> ·
              salute and speak · drop the salute once it is returned · most direct route out · close
              the door.
            </p>
            <p className="afq-rotc-fine last">
              <strong>Trap:</strong> if the officer has <em>already</em> said &ldquo;that will be
              all,&rdquo; do <strong>not</strong> ask &ldquo;Will that be all?&rdquo; — it has been answered.
            </p>
          </div>
        </div>

        <Call kind="blue" tag="Reporting is the exception to &ldquo;no salute indoors&rdquo;">
          <p className="last">
            You do not salute indoors — <strong>except when formally reporting</strong>, during a
            ceremony, or when under arms. That exception is itself a favourite question.
          </p>
        </Call>

        <h4>The salute</h4>
        <div className="afq-rotc-cols">
          <div className="afq-rotc-card">
            <h5>Mechanics</h5>
            <ul className="last">
              <li>Flat hand, fingers and thumb <strong>extended and joined</strong> — a straight unbroken line from <strong>fingertip to elbow</strong>. No cupping, no bent wrist.</li>
              <li>Palm tilted slightly toward the face. Upper arm horizontal, slightly forward.</li>
              <li><strong>Billed headgear</strong> → middle fingertip touches the <strong>right front corner of the headdress</strong>.</li>
              <li><strong>Non-billed or bareheaded</strong> → touches the <strong>outer corner of the right eyebrow</strong> (or corner of your glasses).</li>
              <li>Coming down, retrace the same path and <strong>cup the hand as it passes the waist</strong>.</li>
            </ul>
          </div>
          <div className="afq-rotc-card">
            <h5>Do <em>not</em> salute</h5>
            <ul className="last">
              <li>Indoors (unless reporting / ceremony / under arms)</li>
              <li>In formation — <strong>only the person in charge salutes</strong></li>
              <li>When both hands are full (carry items in the <strong>left</strong> hand so the right stays free)</li>
              <li>While <strong>driving</strong> a vehicle</li>
              <li>In crowds, public conveyances, on work details</li>
              <li>In designated no-salute areas or field/combat conditions</li>
            </ul>
          </div>
        </div>

        <dl className="afq-rotc-facts">
          <Fact term="Who initiates" value="The junior" small="The senior returns it; you then drop yours." />
          <Fact term="Distance" value="≈ 6 paces" small="Far enough to be seen and returned." />
          <Fact term="Passing the colors" value="6 paces" small="Salute at 6 out, hold until 6 past." />
          <Fact term="National Anthem" value="First → last note" small="Start on the first note, hold to the last." />
        </dl>

        <p>
          <strong>Who gets saluted:</strong> all commissioned and warrant officers, officers of
          friendly foreign nations, the President, and — <strong>regardless of their rank</strong> —
          <strong> Medal of Honor recipients</strong>. That last one is a real Air Force custom and a
          favourite question, because it can mean a senior officer salutes first.
        </p>

        <h4>Outdoor ceremonies — Reveille and Retreat</h4>
        <Call kind="blue" tag="The sequence is two-stage — this is the answer">
          <p className="last">
            The bugle call comes first (<strong>Reveille</strong> or <strong>Retreat</strong>) →
            stand at <strong>parade rest</strong>. Then <strong>&ldquo;To the Colors&rdquo;</strong>
            or the National Anthem plays as the flag actually moves → come to <strong>attention and
            salute</strong>. Reveille raises the flag; Retreat ends the duty day and precedes the lowering.
          </p>
        </Call>

        <div className="afq-rotc-scroll">
          <table>
            <thead><tr><th>Situation</th><th>During the bugle call</th><th>During To the Colors / Anthem</th></tr></thead>
            <tbody>
              <tr><td>In uniform, outdoors, not in formation</td><td>Parade rest, facing the flag</td><td><strong>Attention + salute</strong>, hold to the last note</td></tr>
              <tr><td>In civilian clothes</td><td>Attention, facing the flag</td><td>Attention, <strong>right hand over the heart</strong></td></tr>
              <tr><td>In a vehicle</td><td><strong>Pull over and stop</strong></td><td>Sit quietly at attention — do not get out, do not salute</td></tr>
              <tr><td>In formation</td><td>Formation at parade rest</td><td><strong>Only the formation commander salutes</strong></td></tr>
            </tbody>
          </table>
        </div>
        <p className="afq-rotc-fine">
          If the flag is not visible, face the direction of the music. Exact Reveille and Retreat
          clock times are set locally — they are not fixed by regulation, so don&rsquo;t quote a time
          unless your det posts one.
        </p>

        <h4>Indoor ceremonies</h4>
        <div className="afq-rotc-cols">
          <div className="afq-rotc-card">
            <h5>National Anthem indoors</h5>
            <ul className="last">
              <li><strong>Bareheaded</strong> — stand at attention, <strong>do not salute</strong>.</li>
              <li><strong>In formation wearing headgear</strong>, or <strong>under arms</strong> — salute.</li>
              <li>Face the flag if displayed, otherwise the music.</li>
            </ul>
          </div>
          <div className="afq-rotc-card">
            <h5>Headgear and &ldquo;Room, attention&rdquo;</h5>
            <ul className="last">
              <li><strong>Indoors = headgear off.</strong> Exception: <strong>under arms</strong> / armed duty.</li>
              <li>The first cadet to notice an officer enter calls <strong>&ldquo;Room, ATTENTION.&rdquo;</strong></li>
              <li><strong>Skip it</strong> if an equal or more senior officer is already in the room.</li>
              <li>The senior releases with <strong>&ldquo;Carry on&rdquo;</strong> or &ldquo;As you were.&rdquo;</li>
            </ul>
          </div>
        </div>

        <Call kind="alert" tag="Confirm this one with your cadre — sources genuinely conflict">
          <p className="last">
            <strong>Do you salute during the Pledge of Allegiance?</strong> The federal statute
            (<strong>4 U.S.C. § 4</strong>) is unambiguous: uniformed members <strong>stand at
            attention, face the flag, remain silent, and salute</strong> — indoors and outdoors. But
            several ROTC study guides teach &ldquo;attention only, no salute — the salute is reserved
            for the Anthem.&rdquo; This is one of the most commonly misreported points in ROTC
            material. <strong>The statute is the defensible answer; your det may teach otherwise. Ask
            before the test.</strong>
          </p>
        </Call>

        <div className="afq-rotc-card">
          <h4>Everyday courtesies</h4>
          <ul>
            <li><strong>Juniors walk on the left</strong> — the senior takes the right, the position of honour. <em>Exception:</em> during an inspection the senior walks on the left.</li>
            <li><strong>Juniors board first, seniors exit first</strong> for vehicles and aircraft. <em>(Well-established custom, but not tied to a specific AF regulation paragraph — flag it if the test wants a citation.)</em></li>
            <li>Officers: <strong>rank + last name</strong>, or Sir/Ma&rsquo;am. NCOs: <strong>rank + last name — never &ldquo;Sir&rdquo; or &ldquo;Ma&rsquo;am.&rdquo;</strong> Cadets: &ldquo;Cadet [Last Name].&rdquo;</li>
          </ul>
          <h5>The seven basic responses</h5>
          <p className="afq-rotc-responses last">
            &ldquo;Yes, Sir/Ma&rsquo;am.&rdquo; · &ldquo;No, Sir/Ma&rsquo;am.&rdquo; · &ldquo;No excuse,
            Sir/Ma&rsquo;am.&rdquo; · &ldquo;Sir/Ma&rsquo;am, I do not understand.&rdquo; ·
            &ldquo;Sir/Ma&rsquo;am, I do not know.&rdquo; · &ldquo;Sir/Ma&rsquo;am, may I make a
            statement?&rdquo; · &ldquo;Sir/Ma&rsquo;am, may I ask a question?&rdquo;
          </p>
        </div>
      </Sec>

      {/* ── DRESS & GROOMING ── */}
      <Sec id="dress" sob="SOB 6.1 · 6.2 · 6.3" title="Dress, Appearance & Grooming" clock="5 min">
        <Call kind="alert" tag="Tightened 31 January 2026 — old guides teach the loose version">
          <ul className="last">
            <li><strong>Sideburns</strong> must now stop <strong>above the ear opening</strong>. The old &ldquo;not below the ear opening&rdquo; wording is gone.</li>
            <li><strong>Mustaches</strong> must not extend <strong>beyond the corners of the mouth</strong>. The old ¼-inch grace beyond the mouth corner is <strong>gone</strong>.</li>
            <li>Handlebars, twists, curls and goatees are strictly prohibited.</li>
          </ul>
        </Call>

        <h4>6.1 — When <em>not</em> to wear the uniform</h4>
        <p>This is a discrete list objective, from DAFI 36-2903 para 1.4. The high-yield items:</p>
        <div className="afq-rotc-cols">
          <div className="afq-rotc-card">
            <ul className="last">
              <li>At meetings of organizations the <strong>Attorney General has named</strong> totalitarian, fascist, communist or subversive</li>
              <li>At <strong>public speeches, picket lines, marches, rallies or demonstrations</strong> that may imply Air Force sanction</li>
              <li>At any event whose purpose is to <strong>oppose the Armed Forces</strong></li>
              <li>When it would <strong>discredit the Armed Forces</strong></li>
              <li>After a <strong>bad-conduct or other-than-honorable discharge</strong></li>
            </ul>
          </div>
          <div className="afq-rotc-card">
            <ul className="last">
              <li>While furthering <strong>political activity, private employment or commercial interest</strong></li>
              <li>While working an <strong>off-duty civilian job</strong></li>
              <li><strong>Mixing civilian and military clothing</strong> <em>(tie tacks and lapel pins with business attire are OK)</em></li>
              <li>Uniform combinations <strong>not specifically prescribed</strong>, or items not meeting specification</li>
              <li><strong>OCP or FDU</strong> at bars, at establishments primarily serving alcohol, or where diners wear business attire</li>
              <li>When using <strong>frequent-flyer miles</strong> to upgrade to business or first class</li>
            </ul>
          </div>
        </div>

        <h4>6.2 — Grooming numbers</h4>
        <dl className="afq-rotc-facts">
          <Fact term="Men's hair bulk" value="2½ in" small="¼ in at the natural termination point" />
          <Fact term="Women's hair bulk" value="4 in" small="From the scalp; 6 in when gathered" />
          <Fact term="Ponytail / braid limit" value="Shoulder blades" small="Not below a line under the arms; never over the shoulder" />
          <Fact term="Fingernails" value="¼ in" small="Beyond the fingertip. Men: no polish at all." />
          <Fact term="Neck tattoo" value="1 in · one only" small="Within the band behind the ear-opening lines" />
          <Fact term="Ring tattoo" value="⅜ in" small="One per hand, plus one more hand tattoo up to 1 in" />
        </dl>
        <p>
          <strong>Never tattooed, in or out of uniform:</strong> head, face, tongue, lips, eyes,
          scalp. <strong>Earrings:</strong> men may not wear them in uniform or in civilian attire on
          official duty; women may wear one small (≤6 mm) conservative matching set in the lower
          earlobes only.
        </p>

        <Call kind="blue" tag="Beards and shaving waivers — the most volatile policy on this page">
          <p className="last">
            Beards are authorized only by <strong>medical</strong> or <strong>religious</strong>
            waiver; medically authorized facial hair may not exceed <strong>¼ inch</strong>. Medical
            (PFB) waivers are <strong>no longer indefinite</strong> — no single profile may exceed 6
            months, and accumulating <strong>more than 12 months of profile in a rolling 24
            months</strong> triggers commander referral and can now lead to separation.
            <strong> Religious accommodations are explicitly exempt from all of this.</strong> This
            policy changed three times in under a year, so re-verify if your test slips much past
            early September 2026.
          </p>
        </Call>

        <h4>6.3 — Dress and appearance</h4>
        <div className="afq-rotc-cols">
          <div className="afq-rotc-card">
            <h5>The tie rule is not &ldquo;no tie with short sleeves&rdquo;</h5>
            <ul className="last">
              <li><strong>Long-sleeve blues</strong> — tie is <strong>mandatory</strong>.</li>
              <li><strong>Short-sleeve worn alone</strong> — tie is <strong>optional</strong>.</li>
              <li><strong>Short-sleeve with the service coat</strong> — tie is <strong>required</strong>.</li>
            </ul>
          </div>
          <div className="afq-rotc-card">
            <h5>Rules that recently relaxed</h5>
            <ul className="last">
              <li><strong>Phone use and texting while walking in uniform is authorized</strong> — customs and courtesies still take precedence.</li>
              <li><strong>Drinking</strong> while walking is authorized; <strong>eating is not</strong>.</li>
              <li>Two-strap backpacks: <strong>left shoulder or both</strong>, as long as it doesn&rsquo;t block a salute.</li>
            </ul>
          </div>
        </div>
        <p>
          <strong>Headgear:</strong> worn outdoors at all times unless in a designated no-hat area;
          not worn indoors except by armed personnel on duty; never with mess dress.
          <strong> AFROTC:</strong> POC wear the Prop and Wings on the flight cap and silver sleeve
          braid on mess dress; GMC do not.
        </p>
        <p className="afq-rotc-fine">
          <strong>Three things that could not be confirmed in the current DAFI:</strong> the &ldquo;no
          hands in pockets&rdquo; rule (a bearing standard, not a citable paragraph), a
          headgear-in-a-vehicle rule, and any male-specific umbrella restriction — the current text
          gives the same colour and left-hand rule to everyone.
        </p>
      </Sec>

      {/* ── DRILL & POC ── */}
      <Sec id="drill" sob="SOB 7.1 · 7.2 · 8.3" title="Drill & POC-In-Charge" clock="5 min">
        <Call kind="blue" tag="Cite the right publication">
          <p className="last">
            The drill manual is <strong>DAFPAM 34-1203</strong> (13 Sep 2022). It <strong>superseded
            AFMAN 36-2203</strong>. If your study material says 36-2203, the content is probably still
            fine — the rewrite was mostly administrative — but the current designation is 34-1203.
          </p>
        </Call>

        <dl className="afq-rotc-facts">
          <Fact term="Quick time" value="100–120" small="steps per minute" />
          <Fact term="Double time" value="180" small="steps/min · 30-inch step" />
          <Fact term="Forward march step" value="24 in" />
          <Fact term="Half step" value="12 in" />
          <Fact term="Side step" value="12 in" small="From a halt only" />
          <Fact term="Attention — foot angle" value="45°" small="Knees straight, not locked" />
        </dl>

        <h4>Rest positions — the classic trap</h4>
        <div className="afq-rotc-scroll">
          <table>
            <thead><tr><th>Position</th><th>Right foot stays put?</th><th>Talking?</th><th>Mechanics</th></tr></thead>
            <tbody>
              <tr><td><strong>Parade Rest</strong></td><td>Left foot moves 12 in</td><td><strong>No</strong></td><td>Hands form an X in the small of the back, right in left palm; silent and immobile</td></tr>
              <tr className="hi"><td><strong>At Ease</strong></td><td><strong>Yes</strong></td><td><strong>No</strong> — silence</td><td>Relax standing; position in formation unchanged</td></tr>
              <tr className="hi"><td><strong>Rest</strong></td><td><strong>Yes</strong></td><td><strong>Yes</strong> — moderate speech</td><td><strong>Physically identical to At Ease</strong></td></tr>
              <tr><td><strong>Fall Out</strong></td><td>No — may break ranks</td><td>Yes</td><td>The only one where you may leave your position; stay in the immediate area</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          <strong>The distinction they will probe:</strong> At Ease and Rest are physically the same
          — right foot locked, position unchanged. <strong>The only difference is silence versus
          moderate speech.</strong> Fall Out is the only one that lets you break ranks. All rests are
          executed <em>only from the position of attention</em>.
        </p>

        <h4>Commands and movements</h4>
        <div className="afq-rotc-cols">
          <div className="afq-rotc-card">
            <h5>Anatomy of a command</h5>
            <ul className="last">
              <li><strong>Preparatory command</strong> — <em>what</em> the movement is (&ldquo;Forward&rdquo;). <strong>Rising inflection.</strong></li>
              <li><strong>Command of execution</strong> — <em>when</em> to do it (&ldquo;MARCH&rdquo;). <strong>No inflection, higher pitch, snap.</strong></li>
              <li>Ideal interval: <strong>one step</strong> between them (three for squadron or larger).</li>
              <li><strong>Combined commands</strong> — FALL IN, AT EASE, REST — one utterance, no separate parts.</li>
              <li><strong>&ldquo;AS YOU WERE&rdquo;</strong> revokes a preparatory command <em>before</em> execution. Once the movement has begun, use follow-on commands instead.</li>
              <li>If a command is given wrong, troops <strong>execute it as best they can</strong>.</li>
            </ul>
          </div>
          <div className="afq-rotc-card">
            <h5>Which foot</h5>
            <ul className="last">
              <li>General rule: given as the heel of the foot <strong>matching the direction</strong> of the movement strikes the ground.</li>
              <li><strong>Flight, HALT — either foot.</strong> Common trap.</li>
              <li><strong>To the Rear, MARCH — right foot.</strong> 12-inch step, 180° pivot right.</li>
              <li><strong>Change Step, MARCH — right foot.</strong> Corrects being out of step.</li>
              <li>Facing movements (Right/Left Face 90°, About Face 180°) are <strong>from a halt only</strong>, quick time, <strong>two counts</strong>.</li>
              <li><strong>Half step cannot be started from a halt.</strong></li>
            </ul>
          </div>
        </div>
        <p>
          <strong>Column vs flank:</strong> a <strong>flanking</strong> movement turns the whole rank
          <em> simultaneously</em> — quick, short-distance direction change. A <strong>column</strong>
          movement pivots element-by-element <em>in sequence</em> at a fixed pivot point, like a door
          on a hinge, so the column keeps its order.
        </p>

        <h4>8.3 — POC-In-Charge</h4>
        <div className="afq-rotc-cols">
          <div className="afq-rotc-card">
            <h5>What you are graded on</h5>
            <p>The <strong>POC-In-Charge Evaluation Form</strong> scores six areas, each Ineffective / Satisfactory / Highly Effective:</p>
            <p className="afq-rotc-six last">Planning · Communication · Decision-Making · Leadership · Mission · Debrief</p>
          </div>
          <div className="afq-rotc-card">
            <h5>Your routing sheet <em>is</em> the evidence</h5>
            <p className="last">
              The PLANNING criterion asks whether you developed thorough documentation and <strong>got
              the plan approved in advance</strong>. Your det&rsquo;s OPORD coordination sheet shows
              exactly that: the <strong>POCIC signs first</strong>, then coordination up through
              flight and squadron, then approval through the wing staff (A3, A4/5, FM, DS) to
              <strong> CW/CC</strong>, and finally to the <strong>Operations Flight Commander</strong>
              — with a <strong>nine-day lead time</strong>. Being able to describe that flow answers
              the question directly.
            </p>
          </div>
        </div>
        <p>
          <strong>Command voice</strong> comes from the diaphragm — the manual prescribes a &ldquo;huh
          and ha&rdquo; breathing drill to build volume without straining the vocal cords. Position
          yourself <strong>in front of and centred on the formation</strong>, stay in step, and give
          commands from the position of attention.
        </p>
      </Sec>

      {/* ── VERIFY ── */}
      <Sec id="verify" sob="Before the test" title="Ask Your Cadre" clock="—">
        <p>
          These could not be settled from public sources. Each is a real conflict or a genuine gap —
          not padding. Getting an answer on them is worth more than another pass over the tables.
        </p>
        <div className="afq-rotc-scroll">
          <table>
            <thead><tr><th>Question</th><th>Why it&rsquo;s open</th></tr></thead>
            <tbody>
              <tr><td><strong>Do we salute during the Pledge of Allegiance?</strong></td><td>Federal statute says yes; many ROTC guides say attention-only. Genuinely conflicting.</td></tr>
              <tr><td><strong>Which chain do you want — AU or AFAC above the Holm Center?</strong></td><td>The reassignment is real and dated Oct 2024, but most course material still teaches Air University.</td></tr>
              <tr><td><strong>Current AY 2026–27 cadet wing billets</strong></td><td>Your routing sheet is dated March 2026. Billets rotate at least annually.</td></tr>
              <tr><td><strong>Who is our Det/CC?</strong></td><td>Not on the routing sheet — an OPORD stops at the Operations Flight Commander.</td></tr>
              <tr><td><strong>Do we report through an AFROTC region?</strong></td><td>Every public source on the region echelon is pre-2020. Could not confirm it still exists.</td></tr>
              <tr><td><strong>Does 7.2 include marching, or is that 7.3?</strong></td><td>The current curriculum scopes 7.2 to stationary movements only; marching is 7.3.</td></tr>
            </tbody>
          </table>
        </div>
      </Sec>

      <footer className="afq-rotc-foot">
        <p>
          <strong>Built 3 September 2026</strong> from five parallel research passes against DAFPAM
          34-1203, DAFI 36-2903 (as amended through DAFGM 2026-02), AFROTCI 36-2011 Vols 1 and 3,
          AFROTCI 36-2008, 4 U.S.C. § 4, and official .mil and DVIDS sources.
        </p>
        <p className="last">
          <strong>One honest caveat.</strong> Several <code>.mil</code> domains blocked automated
          fetching, so a number of leadership names were confirmed through search indexing of those
          same pages plus official DVIDS ceremony captions rather than by loading the bio pages
          directly. Every name traces to an official source. <strong>Gen. Schiess and Brig Gen Lay
          are recent enough that you should spot-check them in a browser</strong> before staking a
          recitation on them.
        </p>
      </footer>
    </div>
  );
}

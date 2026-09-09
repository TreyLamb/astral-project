import { useNavigate } from 'react-router-dom';

// The lookup sheet — everything that is memorise-or-lose on Exam 1, on one page.
//
// SCOPED BY HIS OWN NOTES, not by what a textbook appendix would list. `Classnotes.md` in
// SupplementalCourseDocs is a list he wrote for himself: "KNOW: CM/MM, 2.5cm/1in, 100cm/1m,
// know unit conversions, work on sig figs, learned cubes, review polyatomic ions, ionic vs
// molecular compo ---> imp in naming, ate, ite, ade, etc". Every section below is one of those,
// plus the equalities his graded quizzes actually handed him.
//
// ⚠️ His note says "2.5cm/1in". It is 2.54, and his own Quiz 2 Q10 keys 2.54 — that one is
// called out in place rather than silently corrected, because the wrong number is the one he
// wrote down and would otherwise carry into the exam.
//
// TWO CONSUMERS, ONE SOURCE. Trey, 2026-09-09: "It's supposed to be available while taking a
// chem drill." A reference you have to LEAVE the run to read is not available during the run,
// so `ChemReferenceContent` is exported on its own and ChemDrillRunner renders it in a drawer
// over the live question. Duplicating the tables into the drawer would guarantee they drift.
export function ChemReferenceContent() {
  return (
    <>
      <h2>Chem 1210 — reference sheet</h2>
      <p className="chq-note">
        Everything that is memorise-or-lose for Exam 1 (Ch 1–2), in one place. Built from the
        equalities your own quizzes handed you and the list in your class notes.
      </p>

      {/* --- SI base units ------------------------------------------------- */}
      <section className="chq-res-block">
        <h3>SI base units</h3>
        <p className="chq-res-sub">Quiz 2 asked this outright. A unit with a prefix on it is never the base unit.</p>
        <table className="chq-res-table">
          <thead><tr><th>Quantity</th><th>Unit</th><th>Symbol</th></tr></thead>
          <tbody>
            <tr><td>Length</td><td>meter</td><td><code>m</code></td></tr>
            <tr><td>Mass</td><td>kilogram <span className="chq-res-flag">not the gram</span></td><td><code>kg</code></td></tr>
            <tr><td>Time</td><td>second</td><td><code>s</code></td></tr>
            <tr><td>Temperature</td><td>kelvin</td><td><code>K</code></td></tr>
            <tr><td>Amount of substance</td><td>mole</td><td><code>mol</code></td></tr>
            <tr><td>Electric current</td><td>ampere</td><td><code>A</code></td></tr>
            <tr><td>Luminous intensity</td><td>candela</td><td><code>cd</code></td></tr>
          </tbody>
        </table>
      </section>

      {/* --- Prefix ladder -------------------------------------------------- */}
      <section className="chq-res-block">
        <h3>Metric prefix ladder</h3>
        <p className="chq-res-sub">
          Read it as one ladder, not nine separate facts. Below the base unit the exponents go
          negative; past milli they step down by <strong>three</strong> at a time.
        </p>
        <table className="chq-res-table">
          <thead><tr><th>Prefix</th><th>Symbol</th><th>Factor</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr><td>giga</td><td><code>G</code></td><td>10<sup>9</sup></td><td>1 000 000 000</td></tr>
            <tr><td>mega</td><td><code>M</code></td><td>10<sup>6</sup></td><td>1 000 000</td></tr>
            <tr><td>kilo</td><td><code>k</code></td><td>10<sup>3</sup></td><td>1 000</td></tr>
            <tr className="chq-res-base"><td>— base —</td><td></td><td>10<sup>0</sup></td><td>1</td></tr>
            <tr><td>deci</td><td><code>d</code></td><td>10<sup>−1</sup></td><td>0.1</td></tr>
            <tr><td>centi</td><td><code>c</code></td><td>10<sup>−2</sup></td><td>0.01</td></tr>
            <tr><td>milli</td><td><code>m</code></td><td>10<sup>−3</sup></td><td>0.001</td></tr>
            <tr><td>micro</td><td><code>µ</code></td><td>10<sup>−6</sup></td><td>0.000 001</td></tr>
            <tr><td>nano</td><td><code>n</code></td><td>10<sup>−9</sup></td><td>0.000 000 001</td></tr>
            <tr><td>pico</td><td><code>p</code></td><td>10<sup>−12</sup></td><td>0.000 000 000 001</td></tr>
          </tbody>
        </table>
        <p className="chq-res-note">
          <strong>From your class notes:</strong> 100 cm = 1 m, and 10 mm = 1 cm. Both fall out of
          the ladder — centi is 10<sup>−2</sup>, milli is 10<sup>−3</sup>.
        </p>
      </section>

      {/* --- Volume equivalences -------------------------------------------- */}
      <section className="chq-res-block">
        <h3>Volume — the one free conversion</h3>
        <p className="chq-res-sub">
          <strong>1 mL = 1 cm³ exactly.</strong> This is a definition, not a measurement, so the
          factor is 1 and the number does not change. It is the step people drop.
        </p>
        <table className="chq-res-table">
          <thead><tr><th>This</th><th>equals</th><th>Note</th></tr></thead>
          <tbody>
            <tr><td>1 mL</td><td>1 cm³ (1 cc)</td><td>identical volume, two names</td></tr>
            <tr><td>1 L</td><td>1000 mL = 1000 cm³</td><td></td></tr>
            <tr><td>1 kL</td><td>1000 L = 10<sup>6</sup> cm³</td><td>review sheet Q12</td></tr>
            <tr><td>1 m³</td><td>10<sup>6</sup> cm³ = 1000 L</td><td>a cubed unit — see below</td></tr>
            <tr><td>1 dm³</td><td>1 L</td><td></td></tr>
          </tbody>
        </table>
      </section>

      {/* --- English <-> metric ---------------------------------------------- */}
      <section className="chq-res-block">
        <h3>English ↔ metric</h3>
        <p className="chq-res-sub">
          Exam questions usually hand you the odd ones. <strong>2.54 cm = 1 in is the one to know
          cold</strong> — it is exact by definition, and your Quiz 2 keyed it.
        </p>
        <table className="chq-res-table">
          <thead><tr><th>Quantity</th><th>Equality</th><th>Where it showed up</th></tr></thead>
          <tbody>
            <tr><td>Length</td><td><strong>2.54 cm = 1 in</strong> (exact)</td><td>Quiz 2 Q10, review sheet Q13</td></tr>
            <tr><td>Length</td><td>1 mi = 1.609 km</td><td></td></tr>
            <tr><td>Mass</td><td>453.6 g = 1 lb</td><td></td></tr>
            <tr><td>Mass</td><td><strong>16 oz = 1 lb</strong></td><td>within the English system</td></tr>
            <tr><td>Mass</td><td>28.35 g = 1 oz</td><td></td></tr>
            <tr><td>Mass</td><td>1 kg = 2.205 lb</td><td></td></tr>
            <tr><td>Volume</td><td>1 L = 0.2642 gal</td><td>review sheet Q9</td></tr>
            <tr><td>Volume</td><td>1 qt = 0.9464 L</td><td>4 qt = 1 gal</td></tr>
            <tr><td>Volume</td><td>29.57 mL = 1 fl oz</td><td>fluid oz ≠ weight oz</td></tr>
          </tbody>
        </table>
        <p className="chq-res-warn">
          ⚠️ Your notes say <strong>“2.5 cm/1 in”</strong>. It is <strong>2.54</strong>. Your own
          quiz marked 2.54 correct and offered 2.5-style traps as wrong answers.
        </p>
        <p className="chq-res-warn">
          ⚠️ An <strong>ounce of weight</strong> (28.35 g) and a <strong>fluid ounce</strong> of
          volume (29.57 mL) are different quantities that share a name. 16 fl oz = 1 pint;
          16 oz = 1 lb.
        </p>
      </section>

      {/* --- Squared and cubed units ------------------------------------------ */}
      <section className="chq-res-block">
        <h3>Squared and cubed units — “learned cubes”</h3>
        <p className="chq-res-sub">
          The whole factor gets the exponent, <em>number included</em>. This is the single most
          reliable way to lose a point on this exam.
        </p>
        <div className="chq-res-formula">
          <div>(12 in / 1 ft)<sup>2</sup> = <strong>144</strong> in<sup>2</sup> / 1 ft<sup>2</sup></div>
          <div className="chq-res-good">144 in² ÷ 144 = <strong>1 ft²</strong> ✓</div>
          <div className="chq-res-bad">144 in² ÷ 12 = 12 ft² ✗ &nbsp;(squared the unit, not the factor)</div>
        </div>
        <table className="chq-res-table">
          <thead><tr><th>Linear</th><th>Squared</th><th>Cubed</th></tr></thead>
          <tbody>
            <tr><td>100 cm = 1 m</td><td>10<sup>4</sup> cm² = 1 m²</td><td>10<sup>6</sup> cm³ = 1 m³</td></tr>
            <tr><td>10 mm = 1 cm</td><td>100 mm² = 1 cm²</td><td>1000 mm³ = 1 cm³</td></tr>
            <tr><td>12 in = 1 ft</td><td>144 in² = 1 ft²</td><td>1728 in³ = 1 ft³</td></tr>
            <tr><td>3 ft = 1 yd</td><td>9 ft² = 1 yd²</td><td>27 ft³ = 1 yd³</td></tr>
          </tbody>
        </table>
      </section>

      {/* --- Sig figs -------------------------------------------------------- */}
      <section className="chq-res-block">
        <h3>Significant figures</h3>
        <div className="chq-res-two">
          <div>
            <h4>Counting them</h4>
            <ul className="chq-res-list">
              <li>Every non-zero digit counts.</li>
              <li><strong>Captive</strong> zeros (between digits) always count — <code>1005</code> → 4.</li>
              <li><strong>Leading</strong> zeros never count — <code>0.00420</code> → 3.</li>
              <li><strong>Trailing</strong> zeros count only if a decimal point is shown —
                <code>45.60</code> → 4, <code>1200</code> → 2, <code>1200.</code> → 4.</li>
              <li>Scientific notation: only the coefficient — <code>6.022 × 10²³</code> → 4.</li>
            </ul>
          </div>
          <div>
            <h4>Using them</h4>
            <ul className="chq-res-list">
              <li><strong>× and ÷</strong> → fewest <em>significant figures</em>.<br />
                <code>2.02 g / 0.013 mL</code> → 2 sf → <code>1.6 × 10² g/mL</code></li>
              <li><strong>+ and −</strong> → fewest <em>decimal places</em>.<br />
                <code>1.02 L − 0.010 L = 1.010</code> → 2 dp → <code>1.01 L</code></li>
              <li>Exact counts and defined factors are infinitely precise and never limit the answer.</li>
              <li><strong>Carry the units.</strong> g ÷ mL → g/mL; cm × cm → cm². Your professor
                bolded this twice.</li>
            </ul>
          </div>
        </div>
        <p className="chq-res-warn">
          ⚠️ Mixing the two rules up is the most common sig-fig mistake there is. Addition does
          <strong> not</strong> use significant figures.
        </p>
      </section>

      {/* --- Density --------------------------------------------------------- */}
      <section className="chq-res-block">
        <h3>Density</h3>
        <div className="chq-res-formula">
          <div><strong>d = m / V</strong> &nbsp;→&nbsp; m = d × V &nbsp;→&nbsp; V = m / d</div>
          <div className="chq-res-sub">Let the units pick the operation: g/cm³ × cm³ leaves g, so multiply.</div>
        </div>
        <ul className="chq-res-list">
          <li>A box's volume is <strong>L × W × H</strong> — build it before density is any use.</li>
          <li>A submerged object displaces a volume equal to <strong>its own volume</strong>.</li>
          <li>Water is 1.00 g/mL. Nothing else is — do not assume g and mL interchange.</li>
          <li>Density is <strong>intensive</strong>: a nugget and a bar of gold have the same density.</li>
        </ul>
      </section>

      {/* --- Polyatomic ions -------------------------------------------------- */}
      <section className="chq-res-block">
        <h3>Polyatomic ions</h3>
        <p className="chq-res-sub">
          Your notes flag these. Learn the <strong>-ate</strong> form, then derive the rest: one
          fewer oxygen is <strong>-ite</strong>, <strong>per-</strong> adds one, <strong>hypo-</strong> removes another.
        </p>
        <table className="chq-res-table">
          <thead><tr><th>1−</th><th>2−</th><th>3−</th><th>Positive</th></tr></thead>
          <tbody>
            <tr>
              <td>nitrate NO₃⁻</td><td>sulfate SO₄²⁻</td><td>phosphate PO₄³⁻</td><td>ammonium NH₄⁺</td>
            </tr>
            <tr>
              <td>nitrite NO₂⁻</td><td>sulfite SO₃²⁻</td><td>phosphite PO₃³⁻</td><td>hydronium H₃O⁺</td>
            </tr>
            <tr>
              <td>hydroxide OH⁻</td><td>carbonate CO₃²⁻</td><td></td><td></td>
            </tr>
            <tr>
              <td>acetate C₂H₃O₂⁻</td><td>chromate CrO₄²⁻</td><td></td><td></td>
            </tr>
            <tr>
              <td>cyanide CN⁻</td><td>dichromate Cr₂O₇²⁻</td><td></td><td></td>
            </tr>
            <tr>
              <td>permanganate MnO₄⁻</td><td>peroxide O₂²⁻</td><td></td><td></td>
            </tr>
            <tr>
              <td>bicarbonate HCO₃⁻</td><td>oxalate C₂O₄²⁻</td><td></td><td></td>
            </tr>
          </tbody>
        </table>
        <p className="chq-res-note">
          <strong>The chlorine series, as the pattern:</strong> hypochlorite ClO⁻ · chlorite ClO₂⁻ ·
          chlorate ClO₃⁻ · perchlorate ClO₄⁻. Every one is 1−; only the oxygen count moves.
        </p>
      </section>

      {/* --- Naming ---------------------------------------------------------- */}
      <section className="chq-res-block">
        <h3>Naming — “ionic vs molecular is important in naming”</h3>
        <p className="chq-res-sub">
          One question decides which system you are in: <strong>does the formula contain a metal?</strong>
        </p>
        <table className="chq-res-table">
          <thead><tr><th></th><th>IONIC</th><th>MOLECULAR (covalent)</th></tr></thead>
          <tbody>
            <tr><td>Made of</td><td>metal + nonmetal</td><td>nonmetal + nonmetal</td></tr>
            <tr><td>Electrons are</td><td>transferred</td><td>shared</td></tr>
            <tr><td>Naming</td><td>cation, then anion. No prefixes ever.</td><td>Greek prefixes on both</td></tr>
            <tr><td>Example</td><td>CaCl₂ = calcium chloride</td><td>N₂O₄ = dinitrogen tetroxide</td></tr>
            <tr><td>Roman numeral?</td><td>only if the metal is <strong>Type II</strong> — see below</td><td>never</td></tr>
          </tbody>
        </table>

        {/* Trey supplied this on 2026-09-09 and asked for it saved as a reference note. It is
            his course's own vocabulary for the split, and the terms are what an exam question
            will actually use — the sheet described the rule ("only if the metal has more than
            one charge") without ever naming it, which is no help if the question says "Type II".
            It also lines up exactly with how the naming templates are split: the fixed-charge
            metals below are the CATIONS table in templates/toolbox.js, and the variable ones are
            VARIABLE_METALS in templates/rev1-ch00-toolbox.js. */}
        <div className="chq-res-two">
          <div>
            <h4>Type I cations — fixed charge</h4>
            <p className="chq-res-inline">
              Form <strong>one</strong> charge only, so the name is unambiguous without help.
              <strong> No Roman numeral, ever.</strong>
            </p>
            <ul className="chq-res-list">
              <li>Group 1 → <strong>1+</strong> · Group 2 → <strong>2+</strong></li>
              <li>Aluminium Al³⁺, zinc Zn²⁺, silver Ag⁺ <span className="chq-res-flag">transition metals but still fixed</span></li>
              <li>NaCl → sodium chloride</li>
              <li>MgBr₂ → magnesium bromide</li>
            </ul>
          </div>
          <div>
            <h4>Type II cations — variable charge</h4>
            <p className="chq-res-inline">
              Form <strong>more than one</strong> charge, so the name must say which.
              <strong> Roman numeral required.</strong> Most transition metals: Fe, Cu, Co, Cr,
              Mn, Ni, Sn, Pb, Os, Mo.
            </p>
            <ul className="chq-res-list">
              <li>FeCl₂ → iron(<strong>II</strong>) chloride · FeCl₃ → iron(<strong>III</strong>) chloride</li>
              <li>Cu₂O → copper(<strong>I</strong>) oxide · CuO → copper(<strong>II</strong>) oxide</li>
            </ul>
          </div>
        </div>
        <p className="chq-res-warn">
          ⚠️ The numeral is the charge on <strong>one metal ion</strong>, worked out from the
          anion — <em>not</em> a subscript copied off the formula. They coincide in FeCl₃ (3 and
          III) and that coincidence is what teaches the wrong habit: in Fe₂O₃ the subscripts are
          2 and 3, and the answer is still iron(III).
        </p>
        <div className="chq-res-two">
          <div>
            <h4>Greek prefixes (covalent only)</h4>
            <p className="chq-res-inline">
              1 mono · 2 di · 3 tri · 4 tetra · 5 penta · 6 hexa · 7 hepta · 8 octa · 9 nona · 10 deca
            </p>
            <p className="chq-res-note">
              “Mono-” is only ever used on the <strong>second</strong> element. CO₂ is carbon
              dioxide, never <em>mono</em>carbon dioxide.
            </p>
          </div>
          <div>
            <h4>Stock (Roman numeral) system</h4>
            <p className="chq-res-inline">
              The numeral is the charge on <strong>one metal ion</strong>, and you work it out from
              the anion — it is not a subscript you can read off.
            </p>
            <p className="chq-res-note">
              OsO₂: two oxides at 2− is 4− total, on one Os → <strong>osmium(IV) oxide</strong>.<br />
              CoCO₃: one carbonate at 2−, on one Co → <strong>cobalt(II) carbonate</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* --- Acids ------------------------------------------------------------ */}
      <section className="chq-res-block">
        <h3>Acid naming — “ate, ite, ade, etc”</h3>
        <p className="chq-res-sub">Name the acid from its ANION. Whether it has oxygen picks the pattern.</p>
        <table className="chq-res-table">
          <thead><tr><th>Anion ends in</th><th>Acid becomes</th><th>Example</th></tr></thead>
          <tbody>
            <tr><td><code>-ide</code> (no oxygen)</td><td><strong>hydro</strong>-…-<strong>ic</strong> acid</td><td>Cl⁻ chloride → HCl, hydro<strong>chlor</strong>ic acid</td></tr>
            <tr><td><code>-ate</code></td><td>…-<strong>ic</strong> acid (no “hydro”)</td><td>CO₃²⁻ carbonate → H₂CO₃, carbon<strong>ic</strong> acid</td></tr>
            <tr><td><code>-ite</code></td><td>…-<strong>ous</strong> acid (no “hydro”)</td><td>NO₂⁻ nitrite → HNO₂, nitr<strong>ous</strong> acid</td></tr>
          </tbody>
        </table>
        <p className="chq-res-note">
          Hydrogen count is whatever cancels the charge: phosphate is 3−, so phosphoric acid is
          H₃PO₄. Memory hook — <em>-ate</em> becomes <em>-ic</em> (“<strong>ate</strong> an
          <strong> ic</strong>ky one”), <em>-ite</em> becomes <em>-ous</em>.
        </p>
        <p className="chq-res-warn">
          ⚠️ Never put “hydro-” on an oxyacid. H₂S is hydrosulfuric acid; H₂SO₄ is sulfuric acid.
          Different substances.
        </p>
      </section>

      {/* --- Charges ---------------------------------------------------------- */}
      <section className="chq-res-block">
        <h3>Predictable ion charges</h3>
        <table className="chq-res-table">
          <thead><tr><th>Group</th><th>Charge</th><th>Examples</th></tr></thead>
          <tbody>
            <tr><td>1 — alkali metals</td><td>1+</td><td>Li⁺ Na⁺ K⁺ Rb⁺ Cs⁺</td></tr>
            <tr><td>2 — alkaline earth</td><td>2+</td><td>Mg²⁺ Ca²⁺ Sr²⁺ Ba²⁺</td></tr>
            <tr><td>13</td><td>3+</td><td>Al³⁺ Ga³⁺</td></tr>
            <tr><td>15</td><td>3−</td><td>N³⁻ P³⁻</td></tr>
            <tr><td>16 — chalcogens</td><td>2−</td><td>O²⁻ S²⁻</td></tr>
            <tr><td>17 — halogens</td><td>1−</td><td>F⁻ Cl⁻ Br⁻ I⁻</td></tr>
            <tr><td>18 — noble gases</td><td>none</td><td>already full</td></tr>
          </tbody>
        </table>
        <p className="chq-res-note">
          <strong>Type I / always one charge:</strong> Ag⁺, Zn²⁺, Cd²⁺, Al³⁺ — never given a
          Roman numeral. <strong>Type II / variable:</strong> Fe, Cu, Co, Cr, Mn, Pb, Sn, Ni,
          Os, Mo — always given one. Full breakdown in the naming section above.
        </p>
        <p className="chq-res-note">
          <strong>Diatomic elements</strong> (they never appear alone): H₂ N₂ O₂ F₂ Cl₂ Br₂ I₂ —
          “Have No Fear Of Ice Cold Beer”.
        </p>
      </section>

      {/* --- Atomic structure -------------------------------------------------- */}
      <section className="chq-res-block">
        <h3>Reading an atom</h3>
        <div className="chq-res-formula">
          <div><sup>A</sup><sub>Z</sub>X<sup>charge</sup> — <strong>A</strong> = mass number (p + n), <strong>Z</strong> = atomic number (p)</div>
        </div>
        <ul className="chq-res-list">
          <li><strong>Protons</strong> = Z. Fixed by the element symbol — change it and it is a different element.</li>
          <li><strong>Neutrons</strong> = A − Z. Change it and it is a different <em>isotope</em>.</li>
          <li><strong>Electrons</strong> = Z − charge. The charge touches nothing else.
            <br />²¹F⁻ → 9 p, 12 n, <strong>10</strong> e⁻.</li>
          <li><strong>Average atomic mass</strong> = Σ (isotope mass × fractional abundance). It is
            a weighted average, so it sits nearer the more abundant isotope — a free sanity check.</li>
          <li><strong>Law of definite proportions:</strong> a compound's composition by mass is
            fixed, so the <em>fraction</em> scales between samples. The absolute masses do not.</li>
        </ul>
      </section>

      <p className="chq-hint">
        Sources: your Ch 1–2 review sheet, Quizzes 2–4, your AcademiQ text and your own class
        notes. Nothing here is guessed at.
      </p>
    </>
  );
}

/** The standalone page at /TKB/courses/chem/resources. */
export default function ChemResources() {
  const navigate = useNavigate();
  return (
    <div className="chq-res">
      <header className="chq-res-top">
        <button className="chq-btn chq-ghost" onClick={() => navigate('/TKB/courses/chem')}>← Chem</button>
        <div className="chq-res-actions">
          <button className="chq-btn" onClick={() => navigate('/TKB/courses/chem/exam')}>🎯 Exam prep</button>
          <button className="chq-btn chq-ghost" onClick={() => window.print()}>🖨 Print</button>
        </div>
      </header>
      <ChemReferenceContent />
    </div>
  );
}

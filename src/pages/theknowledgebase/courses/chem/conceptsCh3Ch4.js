// "Go deeper" pages for course chapters 3-4 — the Exam 2 half. Same contract as concepts.js (read
// its header): one page per SECTION, every quote copied from a document actually opened in-session,
// worked math with each number labelled, traps named. Written 2026-10-06, the night before Exam 2.
//
// Sources opened for these pages: `CHEM 1210/_academiq/ch03-composition-of-substances-and-solutions.md`
// and `ch04-stoichiometry-of-chemical-reactions.md` (the assigned AcademiQ text) — each section's
// "Key Concepts and Summary", its worked examples, and its Additional Exercises. Worked numbers below
// are the book's own where it gives them, recomputed; where the book's ANSWER KEY was wrong (see
// engine/templates/academiq-ch03-ch04.js), the page uses the recomputed value and says so.

/** @type {import('./concepts').ConceptPage[]} */
export const CH3_CH4_PAGES = [
  {
    section: '3-2',
    title: 'Formula Mass and the Mole',
    summary: 'Add atomic masses for the formula mass; the same number in g/mol is the molar mass — the bridge between grams and particles.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch03, §3-2 Key Concepts and Summary',
        quote: 'Atomic masses are measured relative to carbon-12, and the mole connects this atomic-scale mass idea to lab measurements: 1 mol = 6.022 × 10^23 particles (Avogadro’s number). From a chemical formula, you find formula mass by adding average atomic masses (molecular mass for covalent compounds; formula mass per formula unit for ionic compounds), and the same numerical value becomes the molar mass in g/mol, which lets you convert between grams and moles.',
      },
    ],
    body: `## The three quantities and the two bridges

    grams  ⇄  moles  ⇄  particles (atoms, molecules, formula units)
          ÷ molar mass      × 6.022 × 10²³
          × molar mass      ÷ 6.022 × 10²³

- **Formula mass** (amu) = every atom in the formula, each times its average atomic mass, added up.
- **Molar mass** (g/mol) = the *same number*, read as grams per mole.
- **Molecular mass** is the name when the substance is molecules (covalent); **formula mass** is the
  name for an ionic formula unit. NaCl has no "molecules" — 58.44 amu is per *formula unit*.

## Worked: molar mass of acetaminophen, C₈H₉NO₂

    C  8 × 12.01 = 96.08
    H  9 × 1.008 =  9.072
    N  1 × 14.01 = 14.01
    O  2 × 16.00 = 32.00
                  -------
                  151.16 g/mol

**Parentheses multiply everything inside.** Al₂(SO₄)₃ is Al₂S₃O₁₂ — 3 S and 12 O, not 1 and 4.

## Worked: grams ⇄ moles (decide multiply vs divide by the units)

**2.50 mol Ca₃(PO₄)₂ (310.18 g/mol) → grams**

    2.50 mol × 310.18 g/mol = 775 g        (mol cancels — multiply)

**1.204 × 10²⁴ molecules of aspirin → moles**

    1.204 × 10²⁴ ÷ 6.022 × 10²³ per mol = 2.00 mol

**0.750 mol CHCl₃ → moles of Cl atoms**

    3 Cl per molecule → 0.750 × 3 = 2.25 mol Cl

## Traps

- **Dividing when you should multiply.** g ÷ (g/mol) = mol ✓. g × (g/mol) = g²/mol — the units
  tell you it's wrong. Write the units every time.
- **"1 mol of natural carbon is exactly 12 g."** No — only carbon-12 is exactly 12; natural carbon
  is a mix of isotopes, average 12.01.
- **Counting atoms in a molecule as moles of molecules.** 1 mol of C₁₃H₁₈O₂ contains 33 mol of atoms.`,
  },
  {
    section: '3-3',
    title: 'Percent Composition, Empirical and Molecular Formulas',
    summary: 'Mass percent of each element; masses → moles → smallest whole-number ratio; molar mass picks the multiple.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch03, §3-3 Percent Composition',
        quote: '%H=mass H/mass compound×100% … If analysis of a 10.0-g sample of this gas showed it to contain 2.5 g H and 7.5 g C, the percent composition would be calculated to be 25% H and 75% C',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch03, §3-3 Key Concepts and Summary',
        quote: "An empirical formula is determined by converting each element's measured mass to moles, then dividing all mole amounts by the smallest to obtain the simplest whole-number ratio of atoms. If the ratios contain decimals (such as 1.5 or 3.5), all subscripts are multiplied by the smallest integer that converts them to whole numbers while preserving the ratio. A molecular formula may be identical to the empirical formula or may be a whole-number multiple; it is found by comparing the compound's molar mass to the empirical formula mass and multiplying all empirical subscripts by the resulting integer.",
      },
    ],
    body: `## Percent composition — by MASS, not by atom count

    %X = (mass of X) / (mass of the whole compound) × 100

**From a formula — NH₃:** formula mass 17.03; N = 14.01 → 14.01 / 17.03 × 100 = **82.27 % N**.
H is 3 of the 4 atoms, but only 17.76 % of the mass — counting atoms is the classic error.

## Empirical formula from masses or percents — the four steps

1. **Percents → grams:** assume a 100 g sample, so 40.0 % C means 40.0 g C.
2. **Grams → moles:** divide each by its atomic mass. *Never take the ratio of the grams.*
3. **Divide by the smallest** mole value.
4. **Fix decimals by multiplying, never rounding:** x.5 → ×2, x.33 or x.67 → ×3, x.25 → ×4.

**Worked: 0.150 mol Cl and 0.525 mol O**

    0.525 / 0.150 = 3.5    → Cl₁O₃.₅ → ×2 → Cl₂O₇

**Worked: C 0.250 mol, H 0.500 mol, O 0.125 mol** *(the book's key says CH₂O — wrong)*

    ÷ 0.125 → C 2, H 4, O 1 → C₂H₄O

## Molecular formula — find the multiplier n

    n = molar mass ÷ empirical formula mass, then multiply EVERY subscript by n

**Worked: empirical C₅H₇N (81.1 g/mol), molar mass 162.3 g/mol**

    n = 162.3 / 81.1 = 2 → C₁₀H₁₄N₂

**Worked: CH₂O (30.0 g/mol), molar mass 180 g/mol** → n = 6 → C₆H₁₂O₆ (glucose)

## Traps

- Rounding 2.5 to 2 or 3 instead of doubling (gives NO₂ or N₂O₃ instead of N₂O₅).
- Multiplying only the first subscript by n.
- Reporting C₂H₄ when CH₂ was asked for — the empirical formula is the *simplest* ratio.`,
  },
  {
    section: '3-4',
    title: 'Molarity and Dilution',
    summary: 'M = mol ÷ L of SOLUTION. Dilution adds solvent, never solute — the moles stay put.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch03, §3-4 Key Concepts and Summary',
        quote: 'Because balanced chemical equations use mole ratios, solution stoichiometry is easiest with molarity, M = mol solute/L solution, which lets you convert between solution volume and moles of solute. The section also introduces dilution as adding solvent to lower concentration while keeping the moles of solute constant, leading to the dilution relationship M₁V₁ = M₂V₂ (or C₁V₁ = C₂V₂).',
      },
    ],
    body: `## The definition does all the work

    M = mol solute / L solution        mol = M × L        L = mol ÷ M

**0.25 M means 0.25 mol per LITER** — never per mL.

**Worked: 0.180 mol in 150.0 mL**

    150.0 mL = 0.1500 L  → 0.180 / 0.1500 = 1.20 M

**Worked: moles in 18.0 mL of 0.375 M**

    0.375 mol/L × 0.0180 L = 6.75 × 10⁻³ mol

**Worked: 5.85 g NaCl (58.44 g/mol) in 200.0 mL** — two steps

    5.85 / 58.44 = 0.100 mol;  0.100 / 0.2000 L = 0.500 M

## Dilution: M₁V₁ = M₂V₂

Moles before = moles after, because only solvent was added. Volumes just have to be in the *same*
unit on both sides.

**Worked: 250.0 mL of 0.120 M from a 1.50 M stock**

    V₁ = (0.120)(250.0) / 1.50 = 20.0 mL of stock, then add water to 250.0 mL

**Worked: 0.0500 mol in 500.0 mL, diluted to 1.000 L** *(book key says 0.0250 M — wrong)*

    moles stay 0.0500 → 0.0500 / 1.000 L = 0.0500 M

## Mixing two solutions of the same solute — add moles, add volumes

**100.0 mL of 0.200 M + 200.0 mL of 0.0500 M** *(book key says 0.0833 M — wrong)*

    0.0200 mol + 0.0100 mol = 0.0300 mol;  0.3000 L → 0.100 M

## Traps

- Dividing by mL (makes the answer 1000× too small).
- "Remove solvent → lower molarity." Backwards: less solvent, same moles → *higher* M.
- Averaging the two molarities when mixing (gives 0.125 M above — wrong unless the volumes match).`,
  },
  {
    section: '4-2',
    title: 'Writing and Balancing Equations; Ionic Equations',
    summary: 'Coefficients, never subscripts. Then: split soluble ionic compounds into ions and cancel the spectators.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch04, §4-2 Key Concepts and Summary',
        quote: 'Chemical equations show reactants and products and the fixed mole ratios between them; reactants are on the left, products on the right, and you change coefficients (not subscripts) to represent amounts. Balancing by inspection applies conservation of matter by making the number of each type of atom equal on both sides using careful atom counting. The section also explains state symbols and reaction conditions, and it shows how to write complete ionic and net ionic equations by dissociating soluble salts and canceling spectator ions.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch04, §4-2 Equations for Ionic Reactions',
        quote: 'CaCl₂(aq) + 2 AgNO₃(aq) ⟶ Ca(NO₃)₂(aq) + 2 AgCl(s) … Ca²⁺(aq) + 2 Cl⁻(aq) + 2 Ag⁺(aq) + 2 NO₃⁻(aq) ⟶ Ca²⁺(aq) + 2 NO₃⁻(aq) + 2 AgCl(s)',
      },
    ],
    body: `## Balancing by inspection

1. Balance the element that appears in the fewest formulas first (usually the metal or C).
2. Then H. **Then O last** — it is usually in the most places.
3. A fraction is fine mid-way; multiply everything at the end to clear it.
4. Reduce to the smallest whole numbers (3N₂ + 9H₂ → 6NH₃ is balanced, but write N₂ + 3H₂ → 2NH₃).

**Worked: ethane, C₂H₆ + O₂ → CO₂ + H₂O**

    C:  C₂H₆ + O₂ → 2 CO₂ + H₂O
    H:  6 H on the left → 3 H₂O
    O:  right side has 2(2) + 3 = 7 O  →  7/2 O₂
    ×2: 2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O

**Never change a subscript** — H₂O → H₂O₂ makes hydrogen peroxide, a different substance.

## What an equation tells you

- Coefficients are ratios of **particles or moles**, never grams.
- (s) solid, (l) liquid, (g) gas, (aq) dissolved in water. **Δ over the arrow = heat it.**

## Molecular → complete ionic → net ionic

1. **Molecular:** whole formulas, with states.
2. **Complete ionic:** split every **(aq) ionic** compound into its ions. Leave (s), (l), (g) intact.
3. **Net ionic:** cancel any species that is *identical* on both sides (formula, charge, state).

    CaCl₂(aq) + 2 AgNO₃(aq) → Ca(NO₃)₂(aq) + 2 AgCl(s)
    Ca²⁺ + 2 Cl⁻ + 2 Ag⁺ + 2 NO₃⁻ → Ca²⁺ + 2 NO₃⁻ + 2 AgCl(s)
    spectators: Ca²⁺, NO₃⁻    net: 2 Cl⁻ + 2 Ag⁺ → 2 AgCl(s)   (= Ag⁺ + Cl⁻ → AgCl)

## Traps

- Splitting the precipitate (AgCl(s)) into ions — solids stay whole.
- Cancelling a species from one side only.
- Reading coefficients as grams ("1 g CH₄ + 2 g O₂").`,
  },
  {
    section: '4-3',
    title: 'Precipitation and Acid-Base Reactions',
    summary: 'Ions swap partners (AB + CD → AD + CB); a precipitate forms only if a new pairing is insoluble. Acids give H⁺, bases give OH⁻, together: salt + water.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch04, §4-3 Precipitation Reactions and Solubility Rules',
        quote: 'To predict a precipitation reaction, list the ions present after mixing two soluble ionic solutions, then check whether any new cation-anion pairing forms an insoluble compound using the solubility rules. For AgNO₃(aq) + NaCl(aq), the ions are Ag⁺, NO₃⁻, Na⁺, and Cl⁻; NaNO₃ remains soluble, but AgCl is insoluble, so AgCl(s) precipitates.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch04, §4-3 Acid-Base Reactions',
        quote: 'A neutralization reaction is a specific type of acid-base reaction in which the reactants are an acid and a base (but not water), and the products are often a salt and water. acid + base → salt + water',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch04, §4-3 Key Concepts and Summary',
        quote: 'Combustion reactions involve an organic compound reacting with O₂(g) to form CO₂(g) and H₂O(l) or H₂O(g).',
      },
    ],
    body: `## Will a precipitate form? — the book's procedure

1. Write the four ions present after mixing.
2. Make the two *new* pairings (AD and CB).
3. If either is insoluble → it precipitates. If both are soluble → **no reaction**.

**Worked: K₂SO₄(aq) + Ba(NO₃)₂(aq)**

    new pairs: KNO₃ (soluble), BaSO₄ (insoluble) → BaSO₄(s)
    net ionic: Ba²⁺(aq) + SO₄²⁻(aq) → BaSO₄(s)

**Worked: KI(aq) + Pb(NO₃)₂(aq)** → PbI₂(s); spectators K⁺ and NO₃⁻.

The solubility rules most of these hinge on *(standard rules — the book's own table is a figure;
check against it)*: nitrates, acetates, and Group 1 / ammonium compounds are soluble; most
chlorides, bromides and iodides are soluble **except** with Ag⁺, Pb²⁺, Hg₂²⁺; most sulfates are
soluble **except** Ba²⁺, Pb²⁺, Ca²⁺, Sr²⁺; carbonates, phosphates and most hydroxides are
**insoluble** except with Group 1 / ammonium.

## Acids, bases, neutralization

- **Acid** → H⁺ (really H₃O⁺) in water. **Base** → OH⁻.
- **The six strong acids** (ionize completely): HCl, HBr, HI, HNO₃, HClO₄, H₂SO₄. Everything else
  here — HF, acetic acid, HNO₂, H₂CO₃, H₃PO₄, HCN — is weak. NH₃ is a weak base.
- **acid + base → salt + water.** The salt is the base's cation + the acid's anion, charges balanced:

      2 HNO₃ + Ca(OH)₂ → Ca(NO₃)₂ + 2 H₂O       Ca²⁺ needs two NO₃⁻

## Combustion

Organic compound + O₂ → CO₂ + H₂O. C₈H₁₈ + O₂ → CO₂ + H₂O (then balance it).

## Traps

- "Two products can be written, so a precipitate forms." Only if one is *insoluble*.
- Writing the salt without balancing charges (CaNO₃, MgCl).
- Calling HF strong because fluorine is reactive — strength is about ionizing, not danger.`,
  },
  {
    section: '4-4',
    title: 'Reaction Stoichiometry',
    summary: 'Everything goes through moles: grams → moles → (coefficient ratio) → moles → grams.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch04, §4-4 Key Concepts and Summary',
        quote: 'A balanced chemical equation may be used to describe a reaction’s stoichiometry (the relationships between amounts of reactants and products). Coefficients from the equation are used to derive stoichiometric factors that subsequently may be used for computations relating reactant and product masses, molar amounts, and other quantitative properties.',
      },
    ],
    body: `## The one chain

    g A  → ÷ M(A) →  mol A  → × (coef B / coef A) →  mol B  → × M(B) →  g B
                                                          → × 6.022 × 10²³ → particles B

The ratio is **wanted over given**, from the coefficients — never from the masses.

## Worked (book numbers, recomputed — several printed keys are wrong)

**N₂ + 3 H₂ → 2 NH₃: grams of H₂ for 14.0 g N₂**

    14.0 g ÷ 28.02 = 0.500 mol N₂
    × 3/1          = 1.50 mol H₂
    × 2.016        = 3.02 g ≈ 3.00 g        (book key: 6.00 g — wrong)

**Same reaction: NH₃ molecules from 0.250 mol N₂**

    0.250 × 2/1 = 0.500 mol NH₃ × 6.022 × 10²³ = 3.01 × 10²³    (key: 6.02 × 10²³ — wrong)

**Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂: grams of CO₂ from 25.13 g Fe₂O₃**

    25.13 ÷ 159.70 = 0.1574 mol × 3/1 = 0.4721 mol × 44.01 = 20.8 g

**2 C₈H₁₈ + 25 O₂ → …: O₂ molecules for 0.200 mol C₈H₁₈**

    0.200 × 25/2 = 2.50 mol × 6.022 × 10²³ = 1.51 × 10²⁴      ← don't forget the "/2"

## Traps

- **Upside-down ratio** (given over wanted): 2 Al : 3 I₂ used as 3/2 instead of 2/3.
- **Skipping the ratio** entirely (pretending every coefficient is 1).
- Converting to particles and then forgetting the formula count (2 H per H₂).`,
  },
  {
    section: '4-5',
    title: 'Limiting Reactant and Percent Yield',
    summary: 'The reactant that runs out first sets the theoretical yield; percent yield = actual ÷ theoretical × 100.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch04, §4-5 Key Concepts and Summary',
        quote: 'The limiting reactant is the reactant that is completely consumed first and therefore determines the maximum amount of product that can form, while the other reactant(s) are in excess and remain partially unreacted; you can identify the limiting reactant by comparing mole ratios to the balanced equation or by calculating how much product each reactant could produce.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch04, §4-5 Key Equations',
        quote: 'percent yield=(actual yield/theoretical yield)×100',
      },
    ],
    body: `## Finding the limiting reactant — the product-amount method (hardest to get wrong)

Work out how much product **each** reactant could make on its own. The **smaller** answer is the
real one, and the reactant that gave it is limiting.

**Worked: H₂ + Cl₂ → 2 HCl with 4.50 mol H₂ and 3.20 mol Cl₂**

    from H₂:  4.50 × 2 = 9.00 mol HCl
    from Cl₂: 3.20 × 2 = 6.40 mol HCl  ← smaller → Cl₂ limits; 6.40 mol HCl forms

**Worked: 2 Al + 3 I₂ → 2 AlI₃ with 0.429 mol Al and 0.500 mol I₂** *(book key wrong)*

    from Al:  0.429 × 2/2 = 0.429 mol AlI₃
    from I₂:  0.500 × 2/3 = 0.333 mol AlI₃ ← I₂ limits
    0.333 mol × 407.69 g/mol = 136 g

⚠ **More moles does not mean "in excess."** Above, there are more moles of I₂ than Al, and I₂
still runs out first — because the equation needs 1.5 I₂ per Al.

## How much excess is left

**2 CO + O₂ → 2 CO₂ with 5.00 mol CO and 2.40 mol O₂**

    O₂ needs 2.40 × 2 = 4.80 mol CO → O₂ limits; 5.00 − 4.80 = 0.200 mol CO left over

## Percent yield

    percent yield = actual / theoretical × 100      (same units on top and bottom)

**Worked: 1.274 g CuSO₄ → 0.392 g Cu collected (CuSO₄ + Zn → Cu + ZnSO₄)**

    theoretical: 1.274 / 159.62 × 63.55 = 0.507 g Cu
    0.392 / 0.507 × 100 = 77.3 %

## Traps

- Theoretical ÷ actual (gives >100 %).
- Over 100 % is not a great reaction — it means a wet or impure product, or a measuring error.
- Computing the theoretical yield from the reactant in excess.`,
  },
  {
    section: '4-6',
    title: 'Titration, Gravimetric and Combustion Analysis',
    summary: 'Three ways to measure an unknown with stoichiometry: a volume of known solution, the mass of a precipitate, or the masses of CO₂ and H₂O.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch04, §4-6 Titration',
        quote: 'In a titration, a solution with known concentration (the titrant) is added gradually to a solution with unknown concentration (the analyte) until the reaction is complete at the equivalence point.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch04, §4-6 worked example',
        quote: '35.23 mL NaOH × (1 L / 1000 mL) × (0.250 mol NaOH / 1 L) × (1 mol HCl / 1 mol NaOH) = 8.81 × 10⁻³ mol HCl … M = 0.176 M',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch04, §4-6 combustion analysis worked example',
        quote: 'mol C = 0.00394 g CO2 × (1 mol CO2 / 44.01 g CO2) × (1 mol C / 1 mol CO2) = 8.95 × 10^−5 mol C; mol H = 0.00161 g H2O × (1 mol H2O / 18.02 g H2O) × (2 mol H / 1 mol H2O) = 1.79 × 10^−4 mol H … the empirical formula for polyethylene is CH2.',
      },
    ],
    body: `## Titration — the chain

    mL titrant → L → × M(titrant) → mol titrant → × ratio → mol analyte → ÷ L analyte → M analyte

**Worked (the book's): 35.23 mL of 0.250 M NaOH titrates 50.00 mL of HCl (1 : 1)**

    0.03523 L × 0.250 = 8.81 × 10⁻³ mol NaOH = mol HCl
    8.81 × 10⁻³ ÷ 0.05000 L = 0.176 M

**When the ratio isn't 1:1 — this is where the points are:**

    HNO₃ by Ba(OH)₂:   2 HNO₃ per Ba(OH)₂ (it gives 2 OH⁻)  → multiply mol base by 2
    H₂C₂O₄ by NaOH:    1 H₂C₂O₄ per 2 NaOH                  → divide mol base by 2

**Worked: 25.00 mL HNO₃, 18.40 mL of 0.1200 M Ba(OH)₂** *(book key wrong)*

    0.01840 × 0.1200 = 2.208 × 10⁻³ mol Ba(OH)₂ × 2 = 4.416 × 10⁻³ mol HNO₃
    ÷ 0.02500 L = 0.1766 M

**Equivalence point** = reacted in the equation's ratio. **Endpoint** = the indicator's color change,
chosen to land as close to equivalence as possible. They are not the same thing, and pH 7 is not
the definition of either.

## Gravimetric analysis

Turn the analyte into a solid, dry it, weigh it, then stoichiometry back to the analyte.

**Worked (the book's): 0.4550 g mixture → 0.6168 g BaSO₄; % MgSO₄?**

    0.6168 ÷ 233.43 = 2.642 × 10⁻³ mol BaSO₄ = mol MgSO₄ (1 : 1)
    × 120.37 = 0.3181 g MgSO₄;  0.3181 / 0.4550 × 100 = 69.91 %

## Combustion analysis

Burn it; every C leaves as CO₂, every H as H₂O. **Two H per water.**

    0.00394 g CO₂ ÷ 44.01 = 8.95 × 10⁻⁵ mol C
    0.00161 g H₂O ÷ 18.02 × 2 = 1.79 × 10⁻⁴ mol H
    H : C = 2 : 1 → CH₂ (polyethylene)

## Traps

- Forgetting mL → L (answer 1000× off).
- Treating every titration as 1 : 1.
- Using the precipitate's mass as if it were the analyte's.
- One H per H₂O in combustion analysis (gives CH instead of CH₂).`,
  },
];

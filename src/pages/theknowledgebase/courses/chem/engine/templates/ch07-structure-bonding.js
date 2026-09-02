// Structure and Bonding. Original questions, informed by (never copied from) the ACS study
// guide's own "Knowledge Required" tags for this chapter — see courses/PLAN.md's 2026-08-28
// entry for the source and courses/chem/PLAN.md for the doctrine this follows.
//
// No drawing capability in this engine (plain-text choices only) — Lewis-structure / VSEPR /
// geometry questions describe electron-domain counts and connectivity in WORDS instead of
// assuming an ASCII diagram, per the assignment's hard constraint #4.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-07-structure-bonding';

// ---------------------------------------------------------------------------------------------
// 1. Lattice energy — definition
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-lattice-energy-definition',
  chapterId: CH,
  section: '7-3',
  band: 1,
  name: 'Lattice energy: definition',
  concepts: ['lattice-energy-definition'],
  generate: (rng, h) => {
    const SALTS = ['NaCl', 'MgO', 'KBr', 'CaF₂', 'LiCl', 'Al₂O₃'];
    const salt = h.pick(SALTS);
    return {
      stem: `Lattice energy for the ionic solid ${salt} is best defined as the energy change for which process?`,
      ...h.choices(
        { value: `1 mol of solid ${salt} separating into its gaseous ions`, error: null, why: null },
        [
          { value: `1 mol of solid ${salt} dissolving in water`, error: 'confused-with-dissolution', why: 'described dissolving in water (a hydration/solution process), not separating the solid into gaseous ions' },
          { value: `1 mol of gaseous ${salt} atoms combining to form the solid`, error: 'confused-with-formation-from-atoms', why: 'described neutral gaseous atoms combining, not the solid separating into its gaseous ions' },
          { value: `1 mol of solid ${salt} melting into a liquid`, error: 'confused-with-melting', why: 'described melting (a phase change to liquid), not separation into gaseous ions' },
        ],
      ),
      explanation: `Lattice energy is defined as the energy required to separate 1 mol of a solid ionic compound into its gaseous ions (an endothermic process for the solid): ${salt}(s) → gaseous ions.`,
    };
  },
});

// ---------------------------------------------------------------------------------------------
// 2. Lattice energy — ordering by charge and size (Coulomb's law reasoning)
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-lattice-energy-ordering',
  chapterId: CH,
  section: '7-3',
  band: 2,
  name: 'Lattice energy: ordering by charge and ionic size',
  concepts: ['lattice-energy-definition'],
  generate: (rng, h) => {
    // Pairs chosen so exactly one variable (charge OR size) differs, so the comparison is clean.
    const CHARGE_PAIRS = [
      { lower: 'NaCl', higher: 'MgO', note: 'Mg²⁺/O²⁻ carry twice the charge of Na⁺/Cl⁻' },
      { lower: 'KCl', higher: 'CaO', note: 'Ca²⁺/O²⁻ carry twice the charge of K⁺/Cl⁻' },
      { lower: 'NaBr', higher: 'MgS', note: 'Mg²⁺/S²⁻ carry twice the charge of Na⁺/Br⁻' },
    ];
    const SIZE_PAIRS = [
      { higher: 'LiF', lower: 'CsF', note: 'Li⁺ is a much smaller cation than Cs⁺, so the ions in LiF pack closer together' },
      { higher: 'NaF', lower: 'NaI', note: 'F⁻ is a much smaller anion than I⁻, so the ions in NaF pack closer together' },
      { higher: 'MgO', lower: 'BaO', note: 'Mg²⁺ is a much smaller cation than Ba²⁺, so the ions in MgO pack closer together' },
    ];
    const useCharge = rng() < 0.5;
    const pair = useCharge ? h.pick(CHARGE_PAIRS) : h.pick(SIZE_PAIRS);
    const reason = useCharge
      ? `higher ionic charge magnitude increases lattice energy more strongly than ionic size does`
      : `smaller ionic radii (shorter distance between ion centers) increase lattice energy`;
    return {
      stem: `Which compound has the LARGER lattice energy magnitude: ${pair.lower} or ${pair.higher}? (${pair.note}.)`,
      ...h.choices(
        { value: pair.higher, error: null, why: null },
        [
          { value: pair.lower, error: 'inverted-lattice-trend', why: 'picked the compound with smaller charge / larger ionic radii, which gives the SMALLER lattice energy by Coulomb\'s law' },
          { value: 'They are exactly equal', error: 'assumed-no-difference', why: `ignored that ${reason}` },
          { value: 'Lattice energy cannot be compared without a table of measured values', error: 'refused-qualitative-reasoning', why: 'the trend can be reasoned out from charge and size alone, via Coulomb\'s law' },
        ],
      ),
      explanation: `Coulomb's law: E ∝ Q₊Q₋ / r. Lattice energy increases with the MAGNITUDE of the ionic charges (a bigger effect) and decreases as ionic radii (r) increase (a smaller effect). Here, ${reason}, so ${pair.higher} has the larger lattice energy.`,
    };
  },
});

// ---------------------------------------------------------------------------------------------
// 3. Bond type from electronegativity difference
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-bond-type-electronegativity',
  chapterId: CH,
  section: '7-2',
  band: 1,
  name: 'Classifying bond type from electronegativity difference',
  concepts: ['bond-type-electronegativity'],
  generate: (rng, h) => {
    // (element pair, approx EN difference, correct classification)
    const PAIRS = [
      { pair: 'Na and Cl', en: 2.1, correct: 'ionic' },
      { pair: 'K and F', en: 3.2, correct: 'ionic' },
      { pair: 'Ca and O', en: 2.4, correct: 'ionic' },
      { pair: 'H and Cl', en: 0.9, correct: 'polar covalent' },
      { pair: 'C and O', en: 1.0, correct: 'polar covalent' },
      { pair: 'N and H', en: 0.9, correct: 'polar covalent' },
      { pair: 'C and H', en: 0.4, correct: 'nonpolar covalent' },
      { pair: 'Cl and Cl', en: 0.0, correct: 'nonpolar covalent' },
      { pair: 'N and N', en: 0.0, correct: 'nonpolar covalent' },
    ];
    const item = h.pick(PAIRS);
    const ALL = ['ionic', 'polar covalent', 'nonpolar covalent'];
    const wrong = ALL.filter((v) => v !== item.correct);
    return {
      stem: `The electronegativity difference between ${item.pair} is about ${item.en.toFixed(1)}. Is the bond between them best classified as ionic, polar covalent, or nonpolar covalent?`,
      ...h.choices(
        item.correct,
        wrong.map((v) => ({
          value: v,
          error: 'misclassified-bond-type',
          why: v === 'ionic'
            ? 'called it ionic even though the electronegativity difference is too small for one atom to fully take the shared electrons'
            : v === 'nonpolar covalent'
              ? 'called it nonpolar even though there is a real electronegativity difference, which unevenly shares the bonding electrons'
              : 'called it polar covalent even though the electronegativity difference is large enough (or zero) for a different classification',
        })),
      ),
      explanation: `Rough electronegativity-difference cutoffs: Δ ≈ 0 → nonpolar covalent (electrons shared evenly), small-to-moderate Δ (roughly 0.5–1.7) → polar covalent (shared unevenly), large Δ (greater than about 1.7-2.0, especially metal + nonmetal) → ionic (electrons essentially transferred). Δ = ${item.en.toFixed(1)} → ${item.correct}.`,
    };
  },
});

// ---------------------------------------------------------------------------------------------
// 4. Lewis dot structures — counting valence electrons / lone pairs
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-lewis-valence-count',
  chapterId: CH,
  section: '7-5',
  band: 2,
  name: 'Lewis structures: total valence electrons',
  concepts: ['lewis-dot-structures'],
  generate: (rng, h) => {
    const MOLECULES = [
      { formula: 'H₂O', total: 8 },
      { formula: 'NH₃', total: 8 },
      { formula: 'CH₄', total: 8 },
      { formula: 'CO₂', total: 16 },
      { formula: 'BF₃', total: 24 },
      { formula: 'N₂', total: 10 },
      { formula: 'O₂', total: 12 },
      { formula: 'HCN', total: 10 },
      { formula: 'CO', total: 10 },
    ];
    const m = h.pick(MOLECULES);
    return {
      stem: `How many total valence electrons must be placed when drawing the Lewis dot structure of ${m.formula}?`,
      ...h.choices(
        String(m.total),
        [
          { value: String(m.total - 2), error: 'omitted-a-lone-pair', why: 'came up 2 electrons short, as if a lone pair (or a bonding pair) was left out of the count' },
          { value: String(m.total + 2), error: 'double-counted-a-pair', why: 'came up 2 electrons over, as if an atom\'s core (non-valence) electrons were included, or a pair was counted twice' },
          { value: String(m.total - 4), error: 'omitted-two-lone-pairs', why: 'came up 4 electrons short, consistent with skipping two lone pairs while summing valence electrons' },
        ],
      ),
      explanation: `Sum each atom's valence electrons (group number for main-group elements) and multiply by how many atoms of it are present, then add: for ${m.formula} the total is ${m.total}.`,
    };
  },
});

// ---------------------------------------------------------------------------------------------
// 5. Formal charge calculation
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-formal-charge-calc',
  chapterId: CH,
  section: '7-5',
  band: 2,
  name: 'Formal charge calculation',
  concepts: ['formal-charge-calculation'],
  generate: (rng, h) => {
    // (atom, valence electrons, lone-pair electrons, number of bonds it forms) — all real,
    // chemically sound single atoms drawn from common Lewis structures.
    const ATOMS = [
      { label: 'the nitrogen atom in NH₄⁺ (4 N–H bonds, 0 lone pairs)', valence: 5, lonePairE: 0, bonds: 4 },
      { label: 'the oxygen atom in H₃O⁺ (3 O–H bonds, 1 lone pair)', valence: 6, lonePairE: 2, bonds: 3 },
      { label: 'the nitrogen atom in NH₃ (3 N–H bonds, 1 lone pair)', valence: 5, lonePairE: 2, bonds: 3 },
      { label: 'a terminal oxygen in the correct Lewis structure of the nitrate ion, NO₃⁻, single-bonded to N (1 bond, 3 lone pairs)', valence: 6, lonePairE: 6, bonds: 1 },
      { label: 'the central nitrogen in the correct Lewis structure of NO₃⁻ (4 bonds total: one double bond + two single bonds, 0 lone pairs)', valence: 5, lonePairE: 0, bonds: 4 },
      { label: 'the central oxygen atom in ozone, O₃ (major resonance structure: 1 double bond + 1 single bond to the two outer oxygens, 1 lone pair)', valence: 6, lonePairE: 2, bonds: 3 },
      { label: 'the carbon atom in CO, triple-bonded to oxygen (1 lone pair)', valence: 4, lonePairE: 2, bonds: 3 },
      { label: 'the oxygen atom in CO, triple-bonded to carbon (1 lone pair)', valence: 6, lonePairE: 2, bonds: 3 },
    ];
    const a = h.pick(ATOMS);
    const fc = a.valence - a.lonePairE - a.bonds; // bonds already counts bonding electrons/2, i.e. # of bonds = shared pairs
    const fmt = (n) => (n > 0 ? `+${n}` : String(n));
    // Common wrong-method values, computed from the same numbers:
    const forgotHalf = a.valence - a.lonePairE - (a.bonds * 2); // used bonding ELECTRONS instead of bonding PAIRS/2
    const droppedLone = a.valence - a.bonds; // forgot to subtract lone-pair electrons entirely
    const signFlip = -fc;
    const distractors = [
      { value: fmt(forgotHalf), error: 'forgot-half-bonding-electrons', why: 'subtracted the full bonding-electron count instead of half of it (forgot the ÷2 on bonding electrons)' },
      { value: fmt(droppedLone), error: 'dropped-lone-pair-electrons', why: 'left the nonbonding (lone-pair) electrons out of the subtraction entirely' },
    ];
    if (fc !== 0) distractors.push({ value: fmt(signFlip), error: 'sign-error', why: 'flipped the sign of the final formal charge' });
    return {
      stem: `What is the formal charge on ${a.label}? (Formal charge = valence electrons − nonbonding electrons − ½ × bonding electrons.)`,
      ...h.choices({ value: fmt(fc) }, distractors),
      explanation: `FC = ${a.valence} − ${a.lonePairE} − ½(${a.bonds * 2}) = ${a.valence} − ${a.lonePairE} − ${a.bonds} = ${fmt(fc)}.`,
    };
  },
});

// ---------------------------------------------------------------------------------------------
// 6. Formal charge -> picking the best Lewis structure
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-formal-charge-best-structure',
  chapterId: CH,
  section: '7-5',
  band: 2,
  name: 'Using formal charge to pick the best Lewis structure',
  concepts: ['formal-charge-calculation', 'lewis-dot-structures'],
  generate: (rng, h) => {
    const CASES = [
      {
        molecule: 'CO₂',
        good: 'O=C=O, with formal charges of 0 on every atom',
        badA: 'O≡C–O, with formal charges of +1 on the terminal single-bonded O and −1 on the double... (formal charges of −1, +1, and 0 spread across the three atoms)',
        badB: 'a structure with formal charges of +2 on carbon and −1 on each oxygen',
      },
      {
        molecule: 'the thiocyanate-style ion SCN⁻ (S–C≡N arrangement)',
        good: 'the resonance structure that puts formal charge 0 on S, 0 on C, and −1 on N',
        badA: 'a structure that puts formal charge −1 on S, +1 on C, and −1 on N',
        badB: 'a structure that puts formal charge −2 on S and +1 on N with 0 on C',
      },
      {
        molecule: 'NO₃⁻ (nitrate)',
        good: 'the resonance structure with one N=O double bond and two N–O single bonds, formal charges 0/0/−1/+1 arranged so the negative charges sit on the more electronegative oxygens',
        badA: 'a structure with three N=O double bonds and a formal charge of +2 on nitrogen',
        badB: 'a structure with three N–O single bonds and a formal charge of −3 on nitrogen with +2 on N... (an internally inconsistent, unbalanced charge assignment)',
      },
    ];
    const c = h.pick(CASES);
    return {
      stem: `For ${c.molecule}, which guideline correctly describes how to choose the best of several valid Lewis structures using formal charge?`,
      ...h.choices(
        { value: `Prefer the structure where formal charges are as close to 0 as possible, and any negative formal charge sits on the more electronegative atom`, error: null, why: null },
        [
          { value: `Prefer whichever structure has the largest formal charges, since that shows the strongest bonding`, error: 'maximized-formal-charge', why: 'formal charge magnitude should be MINIMIZED, not maximized, when choosing the best structure' },
          { value: `Formal charge cannot be used to distinguish between valid Lewis structures`, error: 'dismissed-formal-charge-method', why: 'formal charge is exactly the tool used to rank otherwise-valid Lewis structures' },
          { value: `Prefer the structure that puts any negative formal charge on the LEAST electronegative atom`, error: 'inverted-electronegativity-preference', why: 'a negative formal charge is more reasonable on the MORE electronegative atom, not the least, since that atom holds electron density more comfortably' },
        ],
      ),
      explanation: `Best-structure guidelines: (1) minimize the magnitude of formal charges (as close to 0 as possible), (2) when charge separation is unavoidable, put negative formal charge on the more electronegative atom, and (3) avoid same-sign formal charges on adjacent atoms.`,
    };
  },
});

// ---------------------------------------------------------------------------------------------
// 7. Resonance structures
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-resonance-structures',
  chapterId: CH,
  section: '7-6',
  band: 2,
  name: 'Resonance structures',
  concepts: ['resonance-structures'],
  generate: (rng, h) => {
    const IONS = ['the nitrate ion, NO₃⁻', 'the carbonate ion, CO₃²⁻', 'the ozone molecule, O₃', 'the acetate ion, CH₃COO⁻'];
    const ion = h.pick(IONS);
    return {
      stem: `${ion} can be drawn with more than one valid, equally reasonable Lewis structure that differ only in which bond is the double bond. What does this tell you about its actual bonding?`,
      ...h.choices(
        { value: 'The molecule/ion is best described as an average (a resonance hybrid) of the contributing structures, with the bonding electrons delocalized rather than fixed in one arrangement', error: null, why: null },
        [
          { value: 'The molecule rapidly flips back and forth between the different Lewis structures over time', error: 'resonance-as-flipping', why: 'described resonance as the molecule physically oscillating between structures over time, rather than as one delocalized hybrid structure that never actually flips' },
          { value: 'One of the structures must be correct and the others are simply wrong attempts', error: 'picked-one-structure-as-real', why: 'treated resonance structures as competing right/wrong answers rather than as equally valid contributors to one real, blended structure' },
          { value: 'The molecule exists as a mixture of separate molecules, each with one of the different structures', error: 'resonance-as-mixture-of-molecules', why: 'described a physical mixture of distinct molecules, rather than delocalized electrons within every single molecule/ion' },
        ],
      ),
      explanation: `When multiple valid Lewis structures differ only in electron placement (not atom positions), the real structure is a single resonance hybrid: the bonding electrons are delocalized over the involved bonds, giving bond lengths/orders that are an average of the contributing structures — not a molecule flickering between them or a mix of different molecules.`,
    };
  },
});

// ---------------------------------------------------------------------------------------------
// 8. Bond enthalpy -> estimating reaction enthalpy
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-bond-enthalpy-reaction',
  chapterId: CH,
  section: '8-5',
  band: 3,
  name: 'Estimating reaction enthalpy from bond enthalpies',
  concepts: ['bond-enthalpy-reaction-enthalpy'],
  generate: (rng, h) => {
    // Simple made-up-but-plausible bond-enthalpy magnitudes (kJ/mol), kept as round numbers so
    // the arithmetic is exact and the sign is unambiguous.
    const brokenTotal = h.int(4, 9) * 100; // energy to break bonds in reactants (always costs energy: +)
    const formedTotal = brokenTotal + (h.pick([-1, 1]) * h.int(1, 4) * 50); // energy released forming bonds in products
    const dH = brokenTotal - formedTotal; // ΔH = bonds broken - bonds formed
    const sign = dH < 0 ? 'exothermic' : dH > 0 ? 'endothermic' : 'thermoneutral';
    const fmt = (n) => (n > 0 ? `+${n}` : String(n));
    return {
      stem: `For a reaction, the sum of bond enthalpies of all bonds BROKEN in the reactants is ${brokenTotal} kJ/mol, and the sum of bond enthalpies of all bonds FORMED in the products is ${formedTotal} kJ/mol. Using ΔH ≈ (bonds broken) − (bonds formed), what is ΔH for the reaction, and is it exothermic or endothermic?`,
      ...h.choices(
        { value: `ΔH ≈ ${fmt(dH)} kJ/mol (${sign})` },
        [
          { value: `ΔH ≈ ${fmt(-dH)} kJ/mol (${dH < 0 ? 'endothermic' : dH > 0 ? 'exothermic' : 'thermoneutral'})`, error: 'sign-error', why: 'flipped the sign, i.e. computed (bonds formed) − (bonds broken) instead of (bonds broken) − (bonds formed)' },
          { value: `ΔH ≈ ${fmt(brokenTotal + formedTotal)} kJ/mol (reported as endothermic regardless of the numbers)`, error: 'added-instead-of-subtracted', why: 'added the two totals instead of subtracting bonds formed from bonds broken' },
          { value: `ΔH cannot be estimated from bond enthalpies alone`, error: 'dismissed-bond-enthalpy-method', why: 'bond enthalpies are exactly what is used to estimate ΔH when standard enthalpies of formation are not given' },
        ],
      ),
      explanation: `Breaking bonds always costs energy (endothermic, +); forming bonds always releases energy (exothermic, so it's subtracted). ΔH ≈ (bonds broken) − (bonds formed) = ${brokenTotal} − ${formedTotal} = ${fmt(dH)} kJ/mol, which is ${sign} (negative ΔH = exothermic, more energy released forming bonds than spent breaking them).`,
    };
  },
});

// ---------------------------------------------------------------------------------------------
// 9. Covalent bond concepts — bond order vs. bond length/strength
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-bond-order-length-strength',
  chapterId: CH,
  section: '7-4',
  band: 2,
  name: 'Bond order vs. bond length and bond strength',
  concepts: ['covalent-bond-concepts'],
  generate: (rng, h) => {
    const PAIRS = [
      { a: 'the C–C single bond in ethane (C₂H₆)', b: 'the C≡C triple bond in ethyne/acetylene (C₂H₂)', aOrder: 1, bOrder: 3 },
      { a: 'the N–N single bond in hydrazine (N₂H₄)', b: 'the N≡N triple bond in N₂', aOrder: 1, bOrder: 3 },
      { a: 'the O–O single bond in hydrogen peroxide (H₂O₂)', b: 'the O=O double bond in O₂', aOrder: 1, bOrder: 2 },
      { a: 'the C–O single bond in methanol (CH₃OH)', b: 'the C=O double bond in formaldehyde (CH₂O)', aOrder: 1, bOrder: 2 },
    ];
    const p = h.pick(PAIRS);
    const higher = p.bOrder > p.aOrder ? p.b : p.a;
    const lower = p.bOrder > p.aOrder ? p.a : p.b;
    return {
      stem: `Compare ${p.a} (bond order ${p.aOrder}) to ${p.b} (bond order ${p.bOrder}). Which bond is SHORTER and STRONGER?`,
      ...h.choices(
        { value: higher, error: null, why: null },
        [
          { value: lower, error: 'inverted-bond-order-trend', why: 'picked the lower bond-order bond as shorter/stronger; higher bond order means MORE shared electron pairs pulling the nuclei closer together, which is shorter and stronger, not longer/weaker' },
          { value: 'They are the same length and strength since both are covalent bonds', error: 'ignored-bond-order', why: 'ignored that bond order (the number of shared electron pairs) directly changes both bond length and bond strength' },
          { value: 'Bond length and bond strength cannot both be predicted from bond order', error: 'dismissed-bond-order-correlation', why: 'bond order predicts both together: higher order correlates with shorter length AND greater strength' },
        ],
      ),
      explanation: `Higher bond order (more shared electron pairs) pulls the bonded nuclei closer together (shorter bond) and takes more energy to break (stronger bond). Bond order ${Math.max(p.aOrder, p.bOrder)} > bond order ${Math.min(p.aOrder, p.bOrder)}, so "${higher}" is shorter and stronger.`,
    };
  },
});

// ---------------------------------------------------------------------------------------------
// 10. VSEPR molecular geometry from electron-domain count
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-vsepr-geometry',
  chapterId: CH,
  section: '8-2',
  band: 2,
  name: 'VSEPR molecular geometry',
  concepts: ['molecular-geometry-vsepr'],
  generate: (rng, h) => {
    // (bonding domains, lone pairs, molecular geometry name) — all real, common textbook cases.
    const CASES = [
      { bonding: 2, lone: 0, geometry: 'linear', example: 'CO₂' },
      { bonding: 3, lone: 0, geometry: 'trigonal planar', example: 'BF₃' },
      { bonding: 4, lone: 0, geometry: 'tetrahedral', example: 'CH₄' },
      { bonding: 3, lone: 1, geometry: 'trigonal pyramidal', example: 'NH₃' },
      { bonding: 2, lone: 2, geometry: 'bent', example: 'H₂O' },
      { bonding: 2, lone: 1, geometry: 'bent', example: 'SO₂' },
    ];
    const c = h.pick(CASES);
    const ALL_GEOMS = ['linear', 'trigonal planar', 'tetrahedral', 'trigonal pyramidal', 'bent'];
    const wrong = ALL_GEOMS.filter((g) => g !== c.geometry);
    // shuffle-independent stable pick of 3 wrong ones via rng-driven choices helper below
    const distractorPool = wrong.map((g) => ({
      value: g,
      error: 'misassigned-vsepr-geometry',
      why: `named "${g}" instead of the geometry that actually matches ${c.bonding} bonding domain(s) and ${c.lone} lone pair(s) around the central atom`,
    }));
    return {
      stem: `A central atom (as in ${c.example}) has ${c.bonding} bonding domain(s) and ${c.lone} lone pair(s) of electrons around it. According to VSEPR theory, what is the resulting MOLECULAR geometry (the shape described by the atoms, not the electron-domain arrangement)?`,
      ...h.choices(c.geometry, distractorPool),
      explanation: `VSEPR: electron domains (bonding + lone pairs) arrange to minimize repulsion, but molecular geometry describes only where the ATOMS end up. ${c.bonding} bonding domain(s) + ${c.lone} lone pair(s) → ${c.geometry} (as in ${c.example}). Lone pairs occupy space and push bonding domains closer together, which is why lone pairs change the name even though electron-domain geometry alone wouldn't.`,
    };
  },
});

// ---------------------------------------------------------------------------------------------
// 11. Molecular polarity (bond polarity + symmetry)
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-molecular-polarity',
  chapterId: CH,
  section: '8-3',
  band: 3,
  name: 'Molecular polarity: bond polarity and symmetry together',
  concepts: ['molecular-polarity', 'molecular-geometry-vsepr'],
  generate: (rng, h) => {
    const CASES = [
      {
        molecule: 'CO₂',
        geometry: 'linear',
        correct: 'nonpolar overall, because the two identical, oppositely-directed C=O bond dipoles cancel by symmetry even though each individual C=O bond is polar',
      },
      {
        molecule: 'BF₃',
        geometry: 'trigonal planar',
        correct: 'nonpolar overall, because the three identical B–F bond dipoles are symmetric around the central atom and cancel, even though each individual B–F bond is polar',
      },
      {
        molecule: 'CCl₄',
        geometry: 'tetrahedral',
        correct: 'nonpolar overall, because the four identical C–Cl bond dipoles are symmetrically arranged and cancel, even though each individual C–Cl bond is polar',
      },
      {
        molecule: 'H₂O',
        geometry: 'bent',
        correct: 'polar overall, because the bent (asymmetric) shape means the two O–H bond dipoles do NOT cancel',
      },
      {
        molecule: 'NH₃',
        geometry: 'trigonal pyramidal',
        correct: 'polar overall, because the pyramidal (asymmetric) shape means the three N–H bond dipoles do NOT cancel',
      },
    ];
    const c = h.pick(CASES);
    const isPolar = c.correct.startsWith('polar');
    return {
      stem: `${c.molecule} has ${c.geometry} molecular geometry and contains individually polar bonds. Is ${c.molecule} a polar or nonpolar molecule overall, and why?`,
      ...h.choices(
        { value: c.correct },
        [
          { value: `${isPolar ? 'nonpolar' : 'polar'} overall, for the opposite reason given above`, error: 'inverted-polarity-conclusion', why: 'reached the opposite conclusion about whether the bond dipoles cancel for this particular geometry' },
          { value: `polar overall, because any molecule containing polar bonds must itself be polar`, error: 'bonds-polar-implies-molecule-polar', why: 'assumed individually polar bonds always make the whole molecule polar; symmetric arrangements can cancel the dipoles even when every bond is polar' },
          { value: `nonpolar overall, because polarity only depends on electronegativity difference, not molecular shape`, error: 'ignored-molecular-symmetry', why: 'ignored molecular geometry entirely; overall polarity depends on BOTH bond polarity and how symmetrically those bond dipoles are arranged' },
        ],
      ),
      explanation: `Overall molecular polarity depends on two things together: whether the bonds are individually polar (electronegativity difference), AND whether the molecular geometry is symmetric enough for those bond dipoles to cancel. ${c.molecule} (${c.geometry}): ${c.correct}.`,
    };
  },
});

// ---------------------------------------------------------------------------------------------
// 12. Valence bond theory — sigma vs. pi bonds from orbital overlap
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-vb-sigma-pi-overlap',
  chapterId: CH,
  section: '8-4',
  band: 2,
  name: 'Valence bond theory: sigma vs. pi bonds',
  concepts: ['valence-bond-theory-orbital-overlap'],
  generate: (rng, h) => {
    const askSigma = rng() < 0.5;
    const target = askSigma ? 'sigma (σ) bond' : 'pi (π) bond';
    const correctDesc = askSigma
      ? 'direct, head-on (end-to-end) overlap of orbitals along the axis connecting the two bonded nuclei'
      : 'sideways, side-on overlap of parallel unhybridized p orbitals, above and below (or in front of and behind) the internuclear axis';
    const wrongDesc = askSigma
      ? 'sideways, side-on overlap of parallel unhybridized p orbitals, above and below the internuclear axis'
      : 'direct, head-on (end-to-end) overlap of orbitals along the axis connecting the two bonded nuclei';
    const EXAMPLES = [
      { molecule: 'N₂ (triple bond)', sigma: 1, pi: 2 },
      { molecule: 'O₂ (double bond)', sigma: 1, pi: 1 },
      { molecule: 'CO₂ (each C=O double bond)', sigma: 1, pi: 1 },
      { molecule: 'C₂H₂ / acetylene (C≡C triple bond)', sigma: 1, pi: 2 },
    ];
    const ex = h.pick(EXAMPLES);
    return {
      stem: `In valence bond theory, a ${target} forms from what kind of orbital overlap? (For context: in ${ex.molecule}, that bond is made of ${ex.sigma} sigma bond(s) and ${ex.pi} pi bond(s).)`,
      ...h.choices(
        { value: correctDesc },
        [
          { value: wrongDesc, error: 'swapped-sigma-pi-overlap', why: `described the OTHER bond type's overlap geometry (swapped sigma and pi)` },
          { value: 'overlap of two full, filled inner-shell (core) orbitals', error: 'used-core-orbitals', why: 'covalent bonding overlap involves valence orbitals, not filled core (inner-shell) orbitals' },
          { value: 'a bond formed by complete transfer of an electron from one atom to the other, with no orbital overlap', error: 'described-ionic-bond', why: 'described electron transfer (ionic bonding), not the orbital-overlap picture that valence bond theory uses for covalent bonds' },
        ],
      ),
      explanation: `Sigma (σ) bonds come from direct, head-on overlap along the internuclear axis — every single bond has exactly one, and it's the first bond in any multiple bond. Pi (π) bonds come from sideways overlap of parallel unhybridized p orbitals; a double bond adds one π bond, a triple bond adds two. Here, a ${target} is: ${correctDesc}.`,
    };
  },
});

// ---------------------------------------------------------------------------------------------
// 13. Molecular orbital diagrams and bond order for diatomics
// ---------------------------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-07-mo-bond-order',
  chapterId: CH,
  section: '8-5',
  band: 3,
  name: 'Molecular orbital bond order for diatomics',
  concepts: ['molecular-orbital-diagrams-bond-order'],
  generate: (rng, h) => {
    // Well-known simple diatomics with settled MO bond orders (2nd-period homonuclear/CO).
    const DIATOMICS = [
      { formula: 'N₂', bonding: 8, antibonding: 2, order: 3 },
      { formula: 'O₂', bonding: 8, antibonding: 4, order: 2 },
      { formula: 'F₂', bonding: 8, antibonding: 6, order: 1 },
      { formula: 'CO', bonding: 8, antibonding: 2, order: 3 },
      { formula: 'B₂', bonding: 6, antibonding: 4, order: 1 },
    ];
    // Ne₂ (bonding == antibonding, order 0) is deliberately excluded: at that value both the
    // "forgot to divide by 2" and "inverted bonding/antibonding" wrong-method results collapse
    // onto the same number as the correct answer, which no sweep over this fixed data can fix —
    // see the Phase 3 "degenerate draws" rule in the AFOQT doctrine this engine's QC mirrors.
    const d = h.pick(DIATOMICS);
    const forgotHalf = d.bonding - d.antibonding; // forgot the /2
    const inverted = (d.antibonding - d.bonding) / 2; // swapped bonding/antibonding
    const summed = (d.bonding + d.antibonding) / 2; // added instead of subtracted
    const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
    return {
      stem: `A molecular orbital diagram for ${d.formula} places ${d.bonding} electrons in bonding molecular orbitals and ${d.antibonding} electrons in antibonding molecular orbitals. What is the bond order? (Bond order = (bonding electrons − antibonding electrons) / 2.)`,
      ...h.choices(
        { value: fmt(d.order) },
        [
          { value: fmt(forgotHalf), error: 'forgot-divide-by-two', why: 'subtracted antibonding from bonding electrons but forgot to divide the result by 2' },
          { value: fmt(inverted), error: 'inverted-bonding-antibonding', why: 'swapped which electron count was bonding and which was antibonding' },
          { value: fmt(summed), error: 'added-instead-of-subtracted', why: 'added the bonding and antibonding electron counts instead of subtracting' },
        ].filter((dist) => Number(dist.value) !== d.order),
      ),
      explanation: `Bond order = (bonding e⁻ − antibonding e⁻) / 2 = (${d.bonding} − ${d.antibonding}) / 2 = ${fmt(d.order)}.${d.order === 0 ? ' A bond order of 0 means the molecule is not expected to exist (as for Ne₂).' : ''}`,
    };
  },
});

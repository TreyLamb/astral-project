# Structure and Bonding

This chapter is where "what's the formula" turns into "what does the molecule actually look
like, and why." Everything here — lattice energy, Lewis structures, formal charge, resonance,
bond enthalpy, VSEPR, polarity, valence bond theory, and molecular orbital theory — is really one
question asked from eight different angles: *where are the electrons, and what does that do to
the atoms around them?*

---

## Lattice energy

**Lattice energy** is the energy required to separate 1 mol of a solid ionic compound into its
gaseous ions:

> NaCl(s) → Na⁺(g) + Cl⁻(g)

Pulling a crystal apart into isolated ions costs energy — the ions were held together by
electrostatic attraction, and breaking that attraction is endothermic for the solid. (You may also
see lattice energy defined with the reverse sign, as the energy *released* when gaseous ions come
together to form the solid — same physics, opposite bookkeeping. This chapter uses the
separate-the-solid convention.)

The size of that energy is governed by **Coulomb's law**:

> E ∝ Q₊Q₋ / r

- **Ionic charge dominates.** Doubling either ion's charge roughly quadruples the attraction
  (since both Q₊ and Q₋ appear in the product). This is why MgO's lattice energy dwarfs NaCl's —
  Mg²⁺/O²⁻ carry twice the charge of Na⁺/Cl⁻ at a similar ion size.
- **Ionic size matters less, but still matters.** Smaller ions can approach each other more
  closely (smaller r), which increases the attraction. Comparing LiF to CsF, the much smaller Li⁺
  gives LiF the larger lattice energy even though both compounds are 1+/1− salts.

> **The trap:** treating charge and size as equally important. Charge is the bigger lever — a
> charge difference will usually outrank a size difference when you're ranking several compounds
> at once.

## Bond type from electronegativity difference

Every bond between two atoms sits somewhere on a spectrum from "electrons shared perfectly evenly"
to "electrons transferred completely." Where a bond falls is estimated from the **electronegativity
difference (ΔEN)** between the two atoms:

| ΔEN (rough) | Bond type | What's happening to the electrons |
|---|---|---|
| ~0 | Nonpolar covalent | Shared evenly (same element, or very similar electronegativity) |
| small–moderate (~0.5–1.7) | Polar covalent | Shared, but unevenly — one atom pulls harder |
| large (greater than ~1.7–2.0), especially metal + nonmetal | Ionic | Essentially transferred, not shared |

These cutoffs are a guideline, not a hard boundary chemistry enforces at a decimal point — but the
reasoning behind them is real: a big electronegativity mismatch means one atom's pull on the shared
electrons overwhelms the other's, which is functionally closer to full transfer than to sharing.

## Lewis dot structures

A Lewis structure is a bookkeeping diagram: every valence electron in the molecule gets placed,
either as a bonding pair (shared, drawn as a line or two dots between atoms) or a lone pair
(unshared, drawn on one atom).

**The procedure:**
1. **Count total valence electrons** — sum each atom's valence electron count (its main group
   number for main-group elements), multiplied by how many atoms of it are present. For an ion,
   add one electron per negative charge or subtract one per positive charge.
2. **Arrange atoms** — the least electronegative atom (other than H, which is always terminal)
   is usually central.
3. **Place a bonding pair between every connected pair of atoms**, then **fill in lone pairs**
   to satisfy octets (or duets, for H), starting from the outer atoms.
4. **If the central atom is short an octet**, convert a lone pair on a neighboring atom into an
   additional bonding pair (forming a double or triple bond) instead of leaving anyone electron-
   deficient.

> **The trap:** losing track of the running total. Every electron placed — bonding or lone —
> has to come out of the total counted in step 1. Coming up short (or over) by exactly 2 usually
> means one lone pair got dropped (or double-counted) somewhere in the structure.

## Formal charge

Once a Lewis structure is drawn, **formal charge** checks whether the electron bookkeeping for
each individual atom looks reasonable — it's a diagnostic, not a real physical charge sitting on
the atom.

> **Formal charge = (valence electrons) − (nonbonding electrons) − ½(bonding electrons)**

Walk through it atom by atom: start from that atom's own valence electron count, subtract every
electron in its lone pairs (it "owns" those fully), and subtract half of every electron it shares
in a bond (it only gets credit for half of a shared pair). Two mistakes account for nearly every
formal-charge error: forgetting the **½** on the bonding-electron term (subtracting the full
bonding electron count instead of half of it), and forgetting to subtract the lone-pair electrons
at all.

**Using formal charge to pick between valid Lewis structures**, when more than one honors the
octet rule:
- Prefer the structure where formal charges are **closest to zero**.
- When some charge separation is unavoidable, put the **negative** formal charge on the **more
  electronegative** atom — it's more physically reasonable for the atom that pulls harder on
  electrons to end up looking electron-rich.
- Avoid structures with the same-sign formal charge on adjacent atoms (like charges next to each
  other is a red flag, not a rule violation by itself).

## Resonance structures

Sometimes a molecule or ion has more than one valid Lewis structure that differ only in *where*
a double bond is drawn — the atoms don't move, only the electron placement changes. The classic
case is the nitrate ion, NO₃⁻: any one of its three oxygens could be the one holding the double
bond, and all three structures are equally valid by every rule above.

When that happens, none of the individual structures is "the" real structure. The actual molecule
is a **resonance hybrid** — a single, real structure where the bonding electrons involved are
**delocalized** (spread out) across all the resonance-related positions rather than fixed in any
one arrangement. This isn't the molecule flickering between structures over time, and it isn't a
mixture of different molecules each frozen in one structure — every single molecule of nitrate has
identical, delocalized bonding, which is why all three N–O bonds in nitrate measure the same
length experimentally (in between a single and a double bond), not two long ones and one short one.

## Bond enthalpy and reaction enthalpy

**Bond enthalpy** is the energy needed to break one mole of a particular bond in the gas phase.
Breaking a bond always *costs* energy; forming a bond always *releases* energy. That gives a quick
way to estimate a reaction's enthalpy change without needing tabulated enthalpies of formation:

> **ΔH ≈ (bond enthalpies of bonds broken in reactants) − (bond enthalpies of bonds formed in
> products)**

If more energy is released forming the new bonds than was spent breaking the old ones, ΔH comes
out negative — **exothermic**. If breaking the old bonds cost more than forming the new ones
recovers, ΔH is positive — **endothermic**.

> **The trap:** flipping the subtraction. "Broken minus formed" is the whole rule; reversing it
> flips the sign of ΔH and reports an exothermic reaction as endothermic or vice versa.

## Covalent bond concepts: bond order, length, and strength

**Bond order** is simply how many electron pairs are shared between two atoms — 1 for a single
bond, 2 for a double bond, 3 for a triple bond. Bond order isn't just a label; it directly predicts
two measurable properties:

- **Higher bond order → shorter bond.** More shared pairs pull the two nuclei closer together.
- **Higher bond order → stronger bond.** More shared pairs means more energy required to pull the
  atoms apart.

So a C≡C triple bond is both shorter *and* stronger than a C–C single bond between the same two
elements — length and strength move together with bond order, not against each other.

## VSEPR: molecular geometry

**Valence Shell Electron Pair Repulsion (VSEPR)** theory predicts a molecule's 3D shape from one
idea: electron domains (bonding pairs *and* lone pairs) around a central atom repel each other and
spread out to be as far apart as possible.

Two related but distinct things come out of this:
- **Electron-domain geometry** — the arrangement of *all* the domains, including lone pairs.
- **Molecular geometry** — the shape described only by where the *atoms* end up (what you'd
  actually see if you could look at the molecule). This is the one usually asked about, and it's
  the one that changes name when lone pairs are present even though the underlying electron-domain
  arrangement doesn't.

| Bonding domains | Lone pairs | Molecular geometry | Example |
|---|---|---|---|
| 2 | 0 | Linear | CO₂ |
| 3 | 0 | Trigonal planar | BF₃ |
| 4 | 0 | Tetrahedral | CH₄ |
| 3 | 1 | Trigonal pyramidal | NH₃ |
| 2 | 2 | Bent | H₂O |
| 2 | 1 | Bent | SO₂ |

Since you won't always be handed a drawing, get comfortable reading "a central atom with 3 bonding
domains and 1 lone pair" as a sentence and translating it straight into "trigonal pyramidal" —
that's exactly how the reasoning has to work without a picture in front of you.

## Molecular polarity

A molecule's overall polarity depends on **two separate things at once**, and missing either one
is the single most common mistake in this section:

1. **Are the individual bonds polar?** (from electronegativity difference, as above)
2. **Do those bond dipoles cancel by symmetry, or not?**

A molecule can have every one of its bonds be individually polar and still be **nonpolar overall**,
if the molecular geometry is symmetric enough that the bond dipoles point in directions that cancel.
CO₂ is the textbook case: each C=O bond is polar, but the molecule is linear and the two dipoles
point in exactly opposite directions, so they cancel and CO₂ is nonpolar overall. The same logic
makes BF₃ (trigonal planar) and CCl₄ (tetrahedral) nonpolar despite having polar bonds.

Contrast that with H₂O: also has polar O–H bonds, but the bent geometry means the two bond dipoles
do *not* point in opposite directions — they partially reinforce instead of cancelling, so water is
polar overall.

> **The trap:** "it has polar bonds, so the molecule is polar" skips the symmetry check entirely.
> Always ask both questions.

## Valence bond theory: sigma and pi bonds

**Valence bond theory** describes a covalent bond as forming from the overlap of atomic orbitals
between two atoms — the more the orbitals overlap, the stronger the bond. Two distinct geometries
of overlap give two distinct bond types:

- **Sigma (σ) bonds** form from **direct, head-on (end-to-end) overlap** along the axis connecting
  the two nuclei. Every single bond is a σ bond, and every bond — single, double, or triple —
  contains exactly one σ bond as its first bond.
- **Pi (π) bonds** form from **sideways, side-on overlap** of parallel, unhybridized p orbitals,
  above/below or in front/behind the internuclear axis (not along it). A double bond adds one π
  bond on top of the σ bond; a triple bond adds two π bonds.

So N₂'s triple bond is 1 σ + 2 π, O₂'s double bond is 1 σ + 1 π, and every single bond anywhere is
just the 1 σ, alone.

## Molecular orbital theory and bond order

**Molecular orbital (MO) theory** takes a different approach than valence bond theory: instead of
overlapping atomic orbitals locally at one bond, it combines atomic orbitals across the *whole*
molecule into new molecular orbitals that belong to the molecule as a whole — some **bonding**
(lower energy, electrons here stabilize the molecule) and some **antibonding** (higher energy,
electrons here destabilize it).

Electrons fill the molecular orbitals from lowest energy up, same as atomic orbitals fill by the
Aufbau principle. Once filled, MO theory defines bond order directly from the electron count:

> **Bond order = (bonding electrons − antibonding electrons) / 2**

This single formula explains real, measurable differences that simple Lewis structures can't: O₂
has 8 bonding and 4 antibonding electrons, giving bond order (8−4)/2 = 2 — matching its double
bond — but MO theory also correctly predicts O₂ is *paramagnetic* (has unpaired electrons), which a
plain Lewis structure misses entirely. A bond order of 0 (equal bonding and antibonding electrons)
means the molecule isn't expected to exist at all, which is exactly what happens for a hypothetical
Ne₂.

---

**Before you move on:** you should be able to rank two ionic compounds by lattice energy from
charge and size alone, classify a bond as ionic/polar covalent/nonpolar covalent from an
electronegativity difference, draw a Lewis structure and compute formal charge on any atom in it,
explain what a resonance hybrid actually is, estimate ΔH from bond enthalpies, name a molecular
geometry from a bonding-domain/lone-pair count described in words, decide whether a molecule is
polar by checking both bond polarity and symmetry, and state what makes a bond σ vs. π and how MO
theory defines bond order.

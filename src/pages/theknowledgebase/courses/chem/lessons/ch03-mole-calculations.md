# Formula Calculations and the Mole

Everything in this chapter is one idea wearing different clothes: **the mole is a counting unit**,
the way "dozen" is a counting unit, except it counts particles too small to count any other way.
Once you can move between grams, moles, and particle counts without hesitating, the rest of the
course — stoichiometry, solutions, gas laws — is just this chapter applied to a new setting.

---

## Average atomic mass — where it lives and what it actually is

Every element's box on the periodic table carries two numbers that are easy to mix up:

- The **atomic number** (usually top, small) — a whole number, the count of protons. It's the
  element's identity, not a mass.
- The **average atomic mass** (usually below the symbol, with decimals) — this is the one you
  use for mole calculations. It's in **amu**, and it's numerically identical to the element's
  **molar mass in g/mol**.

That second number is a *weighted average* across every isotope of the element as it occurs
naturally — not the mass of the most common isotope, and not a round whole number. Chlorine's
average atomic mass, 35.45, isn't the mass of any single chlorine atom (every chlorine atom has a
whole-number mass number: 35 or 37). It's what you get from averaging ³⁵Cl and ³⁷Cl weighted by
how often each shows up in nature.

> **The trap:** reaching for the atomic number, or for the mass number of "the" isotope, because
> both are whole numbers and feel more like a normal mass than a number with two decimal places.
> The decimal is the tell that you're looking at the right value.

## Molar mass — summing a formula

**Molar mass** is the mass of one mole of a substance, in g/mol. For a compound, you get it by
adding up the average atomic mass of every atom in the formula — and a formula's subscripts tell
you how many times each element's mass counts:

molar mass = Σ (average atomic mass of element × its subscript)

For water, H₂O: 2 × (1.008) + 1 × (16.00) = 2.016 + 16.00 = **18.02 g/mol**. The subscript on H is
doing real work there — dropping it (adding hydrogen's mass only once) is the single most common
mistake in this calculation, and it's invisible unless you deliberately check that every atom in
the formula got counted.

> **The trap:** treating the formula as a list of elements to add once each, instead of a list of
> *atoms* to add one at a time. Cross off subscripts as you use them if you have to.

## Grams to moles, and back

Molar mass is also a **conversion factor** between mass and moles — the same role density plays
between mass and volume:

- **mass → moles:** divide by molar mass. `moles = mass (g) ÷ molar mass (g/mol)`
- **moles → mass:** multiply by molar mass. `mass (g) = moles × molar mass (g/mol)`

The two are inverses of the same relationship, which is exactly why it's easy to flip one for the
other under time pressure. The units are the check: grams divided by (grams/mole) leaves you with
moles; moles times (grams/mole) leaves you with grams. If your answer's units don't match what the
question asked for, you divided when you should have multiplied, or the reverse.

> **The trap:** doing the division upside-down. A sample with a mass *smaller* than its molar mass
> is *less than one mole* — if your answer comes out bigger than 1 for a small sample of a heavy
> compound, that's a sign to recheck which number you divided into which.

## Avogadro's number — moles to a particle count

A mole isn't just a mass-conversion trick — it's a literal count: **6.022 × 10²³** particles,
exactly the way "one dozen" is a count of 12. That number is **Avogadro's number**, and it's the
conversion factor between moles and individual atoms, molecules, or formula units:

number of particles = moles × 6.022 × 10²³ particles/mol

One mole of helium is 6.022 × 10²³ helium *atoms*. One mole of water is 6.022 × 10²³ water
*molecules*. One mole of NaCl (an ionic compound, not molecular) is 6.022 × 10²³ *formula units* —
same number, different word for what's being counted, because NaCl doesn't exist as discrete
molecules.

> **The trap:** dividing by Avogadro's number instead of multiplying, which is the mass-to-moles
> mistake showing up again in a new spot — moles is always the *smaller* number here, particle
> count is always the *enormous* one.

## Mole ratios from a formula

A chemical formula is also a ratio of moles, not just a ratio of individual atoms. **1 mol of
CO₂ contains 2 mol of O atoms and 1 mol of C atoms** — the subscript tells you the mole ratio
directly, no unit conversion needed:

moles of element = moles of compound × (element's subscript in the formula)

This is exactly the same subscript-counting idea from molar mass, just applied to counting moles
of atoms instead of summing mass. In 3 mol of Al₂O₃, there are 3 × 2 = 6 mol of Al atoms and
3 × 3 = 9 mol of O atoms — the compound's own mole count scales every element inside it by that
element's subscript.

> **The trap:** using the *total* number of atoms in the formula (5, for Al₂O₃) instead of the
> subscript of the *specific* element the question is asking about, or grabbing the subscript that
> belongs to the wrong element entirely.

## Atomic ratios and equal-mass comparisons

Because molar mass differs from compound to compound, **equal mass does not mean equal moles —
and it does not mean equal atom count.** A gram of a light compound made of few, light atoms
packs in more moles (and more total atoms) than a gram of a heavy compound.

To compare, you need two things per compound: its molar mass, and how many atoms sit in one
formula unit. The number of moles of *atoms* in a fixed mass is:

moles of atoms = (atoms per formula unit ÷ molar mass) × mass

Given equal-mass samples of several compounds, the one with the smallest molar mass *relative to*
its atom count per formula unit ends up with the most atoms — this is the same reasoning that
underlies finding an empirical formula from mass data, just run in the comparison direction
instead of the "solve for the formula" direction.

> **The trap:** assuming equal grams means equal "stuff" in the counting sense. Ten grams of
> water and ten grams of iron(III) oxide do not contain the same number of particles, because a
> gram of each buys you a very different number of moles.

---

**Before you move on:** you should be able to read an average atomic mass off a periodic table
entry without grabbing the atomic number by mistake, sum a formula's molar mass while accounting
for every subscript, convert cleanly between grams and moles in either direction, use Avogadro's
number to go from moles to a particle count, pull a mole ratio of atoms straight out of a
formula's subscripts, and explain why two equal-mass samples of different compounds don't contain
the same number of atoms.

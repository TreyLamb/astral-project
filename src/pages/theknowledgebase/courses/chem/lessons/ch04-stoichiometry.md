# Stoichiometry

Everything in this chapter is one skill applied four times: a balanced equation is a recipe, and
moles are the units the recipe is written in. Once you can read the recipe correctly, converting
it into masses, molecule counts, or "who runs out first" is just bookkeeping.

---

## Balancing chemical equations

A chemical equation has to obey conservation of mass — every atom on the left has to show up on
the right, just rearranged into new molecules. Balancing means finding the smallest set of
whole-number coefficients (the big numbers in front of each formula) that make every element's
count match on both sides.

Work one element at a time, and save anything that appears alone (like O₂ in a combustion
reaction) for last — it's the easiest to fix once everything else is locked in. For combustion of
a hydrocarbon (CₙH₂ₙ₊₂ + O₂ → CO₂ + H₂O), balance carbon first (it fixes the CO₂ coefficient),
then hydrogen (it fixes the H₂O coefficient), then count up all the oxygen atoms you've committed
to on the right and choose the O₂ coefficient to match — doubling every coefficient if that
comes out fractional, since you can't have "6.5 O₂" in a balanced equation.

> **The trap:** coefficients are not subscripts. `2H₂O` means two whole water molecules; changing
> a subscript instead (`H₄O`) invents a different, nonexistent compound instead of balancing the
> equation. Only the big numbers out front are yours to adjust.

## Mole ratios from coefficients

Once an equation is balanced, its coefficients are a direct mole ratio between every species in
the reaction — nothing more exotic than that. In `N₂ + 3H₂ → 2NH₃`, the "3" and the "2" mean
*exactly* 3 mol H₂ reacts for every 2 mol NH₃ produced, in any amount of the reaction you run.
Doubling the whole reaction gives 6 mol H₂ and 4 mol NH₃ — same ratio, different scale.

To convert an amount of one species into an amount of another, multiply by the ratio of their
coefficients, target over given:

```
mol(target) = mol(given) × [coefficient of target / coefficient of given]
```

> **The trap:** flipping that fraction. If you want moles of NH₃ from moles of H₂, the ratio is
> 2/3 (NH₃'s coefficient over H₂'s), not 3/2. Writing the target's coefficient in the numerator,
> every time, avoids this by habit instead of by re-deriving it per problem.

## Moles-to-mass (and mass-to-mass) stoichiometry

This is the mole ratio idea with one extra step on each end: molar mass is what lets you cross
between "how many moles" and "how many grams" of *the same substance*, and the mole ratio is the
only thing that lets you cross between *two different substances*. A full mass-to-mass problem
chains both:

```
grams(A) → moles(A) → moles(B) → grams(B)
         ÷ molar mass(A)   × mole ratio   × molar mass(B)
```

The mole ratio step is the only place the *reaction* enters the calculation — the two molar-mass
steps are just unit conversions for whichever single substance you're looking at in that moment.
Keep track of which molar mass belongs to which substance; using A's molar mass at the end (after
you've already converted to moles of B) is a common, entirely avoidable mistake.

> **The trap:** stopping at moles of B and reporting that number as if it were already in grams.
> The mole ratio step gets you moles of the target — it never skips the final multiplication by
> that target's own molar mass.

## Limiting reactant and theoretical yield

Real reactions rarely start with reactants in the *exact* ratio the equation calls for. Whichever
reactant runs out first is the **limiting reactant**, and it — not the amount of the other
reactant you started with — determines how much product can actually form (the **theoretical
yield**).

Find it by converting every reactant's given amount to moles, then dividing each by its own
coefficient in the balanced equation:

```
mol(reactant) / coefficient(reactant)
```

Whichever result is **smaller** belongs to the limiting reactant — think of it as "how many
times can the equation run using only this reactant's supply," and the smaller number is the one
that runs out first and shuts the reaction down. The leftover reactant is "in excess." Once you've
identified the limiting reactant, theoretical yield is just a mole-ratio-to-mass calculation (the
previous section) starting from *that* reactant's moles — never the excess reactant's.

> **The trap:** using the ratio of the two given *masses* to decide which reactant is limiting.
> The comparison has to happen in moles-per-coefficient, not raw grams and not raw moles without
> dividing by the coefficient — a reactant can be present in a smaller mass and still be the one
> in excess, if its molar mass is small enough.

## Molecules, moles, and Avogadro's number

A mole is just a very large counting number (6.022 × 10²³, Avogadro's number) the same way
"dozen" is a counting number for 12 — it lets chemists talk about actual particle counts
(molecules, formula units, ions) in numbers small enough to write down. Converting molecules to
moles of the *same* substance is a straight division or multiplication by Avogadro's number.

Combined with a mole ratio, this lets you answer "how many molecules of product form" starting
from moles (or a particle count) of a reactant — it's the mass-stoichiometry chain from two
sections ago, with "× molar mass" swapped for "× Avogadro's number" at the end:

```
mol(A) → mol(B) → molecules(B)
       × mole ratio   × 6.022 × 10²³/mol
```

> **The trap:** doing the mole-ratio conversion correctly and then reporting that mole value as
> the molecule count. Moles and molecule counts differ by a factor of 6.022 × 10²³ — a "reasonable
> looking" small decimal number is almost never actually a molecule count.

---

**Before you move on:** you should be able to balance a simple combustion or synthesis equation
by hand, read a mole ratio straight off the coefficients without flipping it, chain a full
grams-to-grams stoichiometry calculation through both molar masses, identify a limiting reactant
by comparing moles-per-coefficient (not raw amounts), and convert a mole quantity into a molecule
count with Avogadro's number.

# Heat and Enthalpy

This chapter is really one skill wearing several outfits: track energy in, energy out, and get
the sign right every single time. Get the signs right and the arithmetic underneath is simple.

---

## Specific heat

Specific heat (*c*) is the energy needed to raise **1 gram** of a substance by **1°C** —
per gram, not per mole. Water's specific heat (4.184 J/(g·°C)) is unusually high, which is why
it resists temperature change; a metal like gold (0.129 J/(g·°C)) heats up almost instantly with
the same energy input.

> **The trap:** confusing specific heat (per gram) with molar heat capacity (per mole). They're
> different numbers for the same substance, and a problem that gives you one but expects the
> other will quietly produce a wrong answer that still "looks" reasonable.

## q = mcΔT

The core equation linking heat, mass, specific heat, and temperature change:

**q = m × c × ΔT**, where ΔT = T_final − T_initial.

This equation also answers *comparison* questions without needing to compute an actual number.
If two equal masses absorb the **same heat**, the one with the **smaller** specific heat ends up
**hotter** (ΔT = q/(mc), so smaller *c* → bigger ΔT). If two equal masses need to reach the
**same final temperature**, the one with the **larger** specific heat needs **more heat**
(q = mcΔT directly). Same equation, read in two different directions.

## The first law of thermodynamics

**ΔE = q + w**. The entire difficulty here is sign convention — get these four rules memorized
cold, because every first-law question is really just testing whether you remember them:

| Quantity | Positive means | Negative means |
|---|---|---|
| q (heat) | system **absorbs** heat | system **releases** heat |
| w (work) | work done **ON** the system | work done **BY** the system |

> **The trap:** these two rules are easy to swap with each other, or to apply backwards under
> time pressure. Write "absorbs = +, releases = −" and "on system = +, by system = −" as a
> literal margin note before you touch the numbers.

## Energy per mole of reaction

A calorimetry result often reports **total** heat released or absorbed for however much sample
you actually used — but a reaction's energetics are usually reported **per mole**. The move is
always the same two steps: convert your given mass to moles using molar mass, then divide the
total heat by that mole count. Skipping the mass→mole conversion (dividing straight by grams) is
the single most common mistake here.

## Bomb calorimetry

A bomb calorimeter holds **constant volume**, which means **no work term** (w = 0, since work in
a chemistry context is usually pressure-volume work, and volume isn't changing). So the entire
energy change shows up as heat: whatever heat the calorimeter and its water bath absorb
(q_cal = C_cal × ΔT, always positive since the bath warms up) is exactly the heat the reaction
released — with the sign flipped: **q_rxn = −q_cal**. A combustion reaction that raises the
water bath's temperature is, from the *reaction's* point of view, always releasing energy
(exothermic, negative q), even though the number you calculate for the calorimeter itself is
positive.

## Enthalpy of formation, and the two rules for manipulating ΔH

The standard enthalpy of formation (ΔH°f) is the enthalpy change for forming **1 mole** of a
compound from its elements in their standard states. Two rules let you reuse a known ΔH for a
*different* version of the same reaction:

1. **Reversing** a reaction flips the **sign** of ΔH.
2. **Scaling** a reaction's coefficients by some factor scales ΔH by that **same factor**.

Both can apply to the same problem at once — reverse AND scale — and the order doesn't matter,
but forgetting either one independently is the trap: get the scaling right but forget the sign
flip (or vice versa) and you'll land on a plausible-looking wrong number.

## Hess's Law

Hess's Law says that if you can combine (add, reverse, and/or scale) a set of known reactions so
their intermediates cancel and the result equals your target reaction, then the target's ΔH is
just the sum of the (possibly reversed, possibly scaled) known ΔH values.

The mechanical process:
1. Look at what needs to cancel between the given reactions to leave exactly the target equation.
2. For each given reaction, decide: does it need to be **reversed** (flip ΔH's sign)? Does it
   need to be **scaled** (multiply ΔH by the same factor)?
3. Sum the (adjusted) ΔH values.

> **The trap:** doing the reversal/scaling correctly in your head but then just adding up the
> *original* ΔH values instead of the *adjusted* ones. Write down each reaction's adjusted ΔH
> contribution explicitly before summing — don't try to track the sign flips mentally while
> also doing the addition.

---

**Before you move on:** you should be able to state the sign convention for q and w without
hesitating, correctly identify when a work term is zero (constant volume), and combine two or
three given reactions via Hess's Law without losing track of a sign flip or a scaling factor.

# Solutions and Aqueous Reactions, Part 1

Most of general chemistry after this point happens in water. Reactions get run in beakers of
aqueous solution, not gas jars — so before you can predict what a reaction *does*, you need a
vocabulary for what's actually swimming around in that beaker, and a way to put a number on how
much of it there is.

---

## Electrolytes: what actually happens when something dissolves

Not every substance that dissolves does the same thing once it's in the water. The distinction
that matters is **does it break apart into ions, and how completely?**

- A **strong electrolyte** ionizes essentially 100%. Every formula unit that goes into solution
  comes back out as free ions, and none of the original molecule survives intact. Three families
  are strong electrolytes: the strong acids (HCl, HBr, HI, HNO₃, H₂SO₄, HClO₄ — worth
  memorizing this short list directly, since there's no rule that derives it), the strong bases
  (Group 1 hydroxides and Ca(OH)₂/Ba(OH)₂), and soluble ionic compounds in general (see the
  solubility rules below).
- A **weak electrolyte** only partially ionizes — at any instant, most of the dissolved substance
  is still sitting there as intact, un-ionized molecules, with only a small fraction split into
  ions. Weak acids (acetic acid, HF, HNO₂) and weak bases (NH₃) are the main examples.
- A **nonelectrolyte** dissolves without producing any ions at all — it stays as intact,
  neutral molecules the whole time. Most molecular compounds that aren't acids or bases fall
  here: sugars (glucose, sucrose) and alcohols (ethanol, methanol) are the classic examples.

> **The trap:** "dissolves in water" and "ionizes in water" are NOT the same fact. Sugar
> dissolves readily and is still a nonelectrolyte, because dissolving doesn't require breaking
> any bonds inside the molecule — it just separates sugar molecules from each other. Ionizing
> means the molecule (or ionic lattice) actually comes apart into charged pieces.

A **particulate diagram** — a picture of the dissolved particles as dots/circles — tests this
directly. A strong electrolyte's diagram shows only ions, none of the original molecule. A weak
electrolyte's diagram shows *mostly* intact molecules with a *few* ion pairs mixed in. A
nonelectrolyte's diagram shows only intact molecules, no ions anywhere.

## Molar concentration (molarity)

Once you know something ionizes, or even if it doesn't, you need a way to say *how much* of it
is in the solution. **Molarity (M)** is the standard unit:

$$M = \dfrac{\text{mol of solute}}{\text{L of solution}}$$

Two things about that definition are easy to get backwards:

- It's moles of solute per liter of **solution** — not per liter of *solvent* (water) added.
  If you dissolve something in some water and then add more water until the *total* volume hits
  a mark, that total volume is what goes in the denominator.
- Molarity is a ratio, so it scales with amount but doesn't care about the total size of the
  sample by itself — 1 L of a 2 M solution and 500 mL of a 2 M solution are the same
  concentration, just different total quantities.

### Getting molarity from a measured mass

In the lab you usually don't measure out moles directly — you measure out **grams** on a
balance. So a molarity problem starting from a mass is really two steps stapled together:

1. Convert mass to moles using the substance's molar mass: `mol = g ÷ (g/mol)`.
2. Divide by the solution volume in liters: `M = mol ÷ L`.

Skipping step 1 — dividing grams straight by liters — is the single most common mistake here,
and it's easy to miss because the arithmetic still runs and produces *a* number, just one with
the wrong units hiding inside it.

### Dilution: M₁V₁ = M₂V₂

Diluting a solution — adding more solvent to lower its concentration — doesn't change how many
moles of solute are present, only how spread out they are. That's the whole idea behind the
dilution equation:

$$M_1 V_1 = M_2 V_2$$

where subscript 1 is the concentrated ("stock") solution before dilution and subscript 2 is the
solution after. Because both sides equal the same fixed quantity (moles of solute), you can
solve for whichever one of the four values you don't already have — final volume, final
concentration, or how much stock solution to start with.

> **The trap:** confusing "volume of water added" with "final total volume." If you dilute
> 20 mL of stock up to a *final* volume of 100 mL, you added 80 mL of water — but the V₂ in the
> equation is 100 mL, not 80 mL. Read dilution problems carefully for which one is being given
> or asked for.

## Solubility rules and precipitation

When you mix two solutions of soluble ionic compounds, the ions get shuffled — and sometimes
the new pairing is a compound that *isn't* soluble, so it drops out of solution as a solid
**precipitate**. Predicting this from a short set of memorized rules is a core aqueous-reactions
skill:

- **Soluble, essentially without exception:** all Group 1 metal salts, all ammonium (NH₄⁺)
  salts, all nitrate (NO₃⁻) salts.
- **Soluble, with named exceptions:** chlorides, bromides, and iodides are soluble *except* when
  paired with Ag⁺, Pb²⁺, or Hg₂²⁺. Sulfates are soluble *except* with Ba²⁺, Pb²⁺, Ca²⁺, or Sr²⁺.
- **Insoluble, with named exceptions:** carbonates, phosphates, and hydroxides are insoluble
  *except* when paired with Group 1 metals or NH₄⁺ (hydroxides also dissolve with Ba²⁺).

The Group 1/ammonium/nitrate rule always wins — it's why, for example, sodium carbonate is
soluble even though carbonates are "usually insoluble."

### Net ionic equations

A full molecular equation for a precipitation reaction writes out every ion as if it were still
paired with its original partner, even though in solution everything is already dissociated.
The **net ionic equation** strips that away and shows only what's actually reacting:

1. Split every soluble, strong-electrolyte reactant into its free ions.
2. Identify **spectator ions** — ions that show up unchanged on both the reactant and product
   side, i.e. they never actually do anything.
3. Cancel the spectators and write only the ions that combine to form the precipitate.

For mixing AgNO₃ and NaCl, the full equation is
`AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)`. Na⁺ and NO₃⁻ appear on both sides unchanged — they're
spectators. What's left is the net ionic equation: `Ag⁺(aq) + Cl⁻(aq) → AgCl(s)`.

> **The trap:** don't reduce the equation so far that you cancel the ions that are actually
> reacting, and don't stop halfway and leave spectator ions in the final answer. The precipitate
> itself is never split into ions (it's a solid, not dissolved), and the spectators are never
> kept.

### Reading a weak acid's particulate diagram

This ties electrolyte strength back to a picture. If you're shown a beaker diagram of a
dissolved acid with **mostly intact molecules and only a few ion pairs**, that's a weak acid —
the diagram is showing you partial ionization directly, particle by particle. A strong acid's
diagram, by contrast, would show *zero* intact molecules — every single one ionized.

## Oxidation numbers

An **oxidation number** (also called oxidation state) is a bookkeeping charge assigned to an
atom as if every bond it's in were fully ionic — it's a tool for tracking electron
"ownership" through a reaction, not necessarily a real physical charge. Assign them with these
rules, roughly in priority order:

1. An atom in its elemental form (Zn, O₂, N₂) is **0**.
2. A monatomic ion's oxidation number equals its charge (Na⁺ is +1, Cl⁻ is −1).
3. **Oxygen is usually −2** (except in peroxides, where it's −1, and a few other rare cases).
4. **Hydrogen is usually +1** (except when bonded to a metal, where it's −1).
5. The oxidation numbers in a neutral compound must **sum to zero**; in a polyatomic ion, they
   must sum to the ion's **overall charge**.

Working a formula like H₂SO₄: H is +1 (two of them, +2 total), O is −2 (four of them, −8
total), and the whole molecule is neutral, so sulfur has to make up the difference:
`+2 + x − 8 = 0 → x = +6`.

> **The trap:** for a polyatomic *ion* (like CO₃²⁻), the sum has to equal the ion's charge
> (−2), not zero. Forgetting that the compound isn't neutral is the most common oxidation-number
> mistake once ions with a charge are involved.

## Oxidation and reduction

A reaction is a **redox** (reduction-oxidation) reaction whenever at least one atom's oxidation
number changes. The two halves always happen together — you cannot have one without the other,
because the electrons one atom loses are exactly the electrons another atom gains.

- **Oxidation** = **loss** of electrons = oxidation number **increases**.
- **Reduction** = **gain** of electrons = oxidation number **decreases**.

A memory hook some people use: *"OIL RIG"* — Oxidation Is Loss, Reduction Is Gain (of electrons).

### Oxidizing and reducing agents

Every redox reaction has two named participants, and the naming is deliberately backwards from
what your first instinct says:

- The **oxidizing agent** is the species that *causes* oxidation in something else — which means
  the oxidizing agent itself gets **reduced**.
- The **reducing agent** is the species that *causes* reduction in something else — which means
  the reducing agent itself gets **oxidized**.

For `Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)`: zinc goes from 0 to +2 (loses electrons, is
oxidized), so zinc is the *reducing* agent. Copper(II) goes from +2 to 0 (gains electrons, is
reduced), so Cu²⁺ is the *oxidizing* agent.

> **The trap:** matching the agent's name to what happens *to it*, rather than what it *does to
> the other species*. The oxidizing agent doesn't get oxidized — it gets reduced. This backwards
> naming trips up almost everyone the first few times.

---

**Before you move on:** you should be able to classify a dissolved substance as a strong
electrolyte, weak electrolyte, or nonelectrolyte from a description or a particulate diagram;
calculate molarity from moles or from a measured mass, and work a dilution problem in either
direction; use the solubility rules to predict a precipitate and write its net ionic equation;
and assign oxidation numbers to identify which species is oxidized, which is reduced, and which
is the oxidizing vs. reducing agent.

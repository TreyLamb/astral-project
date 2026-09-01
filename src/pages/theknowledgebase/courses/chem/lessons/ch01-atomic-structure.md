# Atomic Structure

Everything in this chapter is about reading an atom's identity card correctly — how many
protons, neutrons, and electrons it has, and what that tells you about where it sits on the
periodic table and how it bonds.

---

## Isotopes and ions: what stays fixed, what changes

An atom is defined by three particle counts: protons (in the nucleus, positive), neutrons (in
the nucleus, neutral), and electrons (surrounding the nucleus, negative).

- **Protons never change for a given element.** The number of protons *is* the element — change
  it, and you have a different element, not a variant of the same one.
- An **isotope** is a version of an element with a different number of *neutrons*. Same protons,
  different neutrons, so a different mass and a different mass number — but still the same
  element, because the proton count didn't move.
- An **ion** is a version of an atom with a different number of *electrons* than protons, which
  gives it a net charge. Gain electrons and you get a net negative charge (an **anion**); lose
  electrons and you get a net positive charge (a **cation**).

> **The trap:** isotopes and ions change *different* particles. Isotopes never touch electron
> count, and ions never touch proton or neutron count. Mixing the two up — saying two isotopes
> "have different numbers of protons," or that an ion "has a different number of neutrons" — is
> the single most common error in this chapter.

## Nuclear symbol notation

An isotope is written as a symbol with two numbers attached:

```
 mass number  →  ¹⁴
 atomic number →  ₆C
```

Read as ¹⁴₆C — carbon-14. The **mass number** (superscript, top-left) is the total count of
protons + neutrons. The **atomic number** (subscript, bottom-left) is the proton count alone,
which is also the element's fixed position on the periodic table. The same information is often
written out as "carbon-14," with the mass number trailing the element name.

> **The trap:** the two numbers are easy to swap, especially since the atomic number is smaller
> and "feels" like it should go on top. It doesn't — mass number is always the superscript.

## Atomic number vs. mass number

- **Atomic number (Z)** = number of protons = number of electrons in a *neutral* atom. It never
  changes for isotopes of the same element.
- **Mass number (A)** = protons + neutrons. It's specific to one isotope, not the element as a
  whole.
- **Neutrons = mass number − atomic number.** This subtraction is the whole skill — there's no
  separate "neutron number" written anywhere, you always derive it.

## Ion charge, electrons, and protons

Protons don't move when an atom becomes an ion — only electrons do. That gives one formula that
works for both cations and anions, as long as you keep the charge's sign:

```
electrons = protons − charge
```

A cation like Al³⁺ has a *positive* charge, so you subtract a positive number and lose
electrons: 13 protons − 3 = 10 electrons. An anion like Cl⁻ has a *negative* charge, so
subtracting it adds electrons back: 17 protons − (−1) = 18 electrons.

> **The trap:** for an anion, "subtracting a negative charge" reads like it should reduce the
> electron count. It doesn't — do the arithmetic instead of trusting the shape of the sentence.

## Average atomic mass as a weighted average

The atomic mass on the periodic table isn't any single isotope's mass — it's the **weighted
average** of every naturally occurring isotope's mass, weighted by how common (abundant) each
one is:

```
average mass = (mass₁ × fraction₁) + (mass₂ × fraction₂) + ...
```

Abundances are given as percentages, so convert to a decimal fraction first (75.77% → 0.7577)
before multiplying — skipping that step doesn't just round wrong, it inflates the answer by a
factor of 100.

> **The trap:** a plain, unweighted average of the isotope masses ((mass₁ + mass₂) / 2) is
> tempting and almost always wrong, because natural isotopes are rarely split 50/50. Chlorine's
> two isotopes (mass ≈ 35 and ≈ 37) are split roughly 76%/24%, which is why chlorine's atomic
> mass (35.45) sits much closer to 35 than to the halfway point of 36.

## The periodic table: families and diatomic elements

Elements in the same **family** (vertical column/group) share a name and similar chemical
behavior because they share the same number of valence electrons:

| Family | Examples | Trait |
|---|---|---|
| Alkali metals | Li, Na, K | Very reactive, form +1 ions |
| Alkaline earth metals | Be, Mg, Ca | Reactive, form +2 ions |
| Halogens | F, Cl, Br, I | Very reactive nonmetals, form −1 ions |
| Noble gases | He, Ne, Ar, Kr | Essentially unreactive |
| Transition metals | Fe, Cu, Zn, Ag | Many form more than one possible ion charge |

Separately — and this trips people up because it feels like it should follow from family
membership, but it doesn't — exactly **seven elements** exist as two-atom (diatomic) molecules
in their pure elemental form, never as lone atoms: **H₂, N₂, O₂, F₂, Cl₂, Br₂, I₂**. Every other
element's elemental form is either single atoms (like the noble gases and most metals) or a
larger cluster (S₈, P₄). There's no shortcut pattern across the table for this list — it's
memorized as its own fact.

## Classifying elements: metal, nonmetal, or metalloid

The periodic table is divided into three physical/chemical classes by position:

- **Metals** — left and center of the table. Shiny, malleable, conduct heat and electricity,
  tend to lose electrons to form cations.
- **Nonmetals** — upper right. Dull, brittle if solid, poor conductors, tend to gain electrons
  to form anions.
- **Metalloids** — the staircase boundary between the two (boron, silicon, germanium, arsenic,
  antimony, tellurium). Share properties of both, which is exactly why they're a separate class
  rather than a subtype of one or the other.

## Predicting a neutral ionic compound's formula

An ionic compound has to be electrically neutral overall — the positive and negative charges
must cancel exactly. The **crisscross rule** gets you there fast: the cation's charge magnitude
becomes the anion's subscript, and the anion's charge magnitude becomes the cation's subscript,
then reduce both subscripts by their greatest common factor.

Calcium (Ca²⁺) and chloride (Cl⁻): crisscross gives Ca₁Cl₂, already in lowest terms → **CaCl₂**.
Magnesium (Mg²⁺) and oxide (O²⁻): crisscross gives Mg₂O₂ — but that reduces (divide both by 2)
to **MgO**.

> **The trap:** forgetting the reduction step. Mg₂O₂ isn't *wrong* in the sense of violating
> charge balance, but it's not how the formula is actually written — always reduce to the
> smallest whole-number ratio.

---

**Before you move on:** you should be able to read ¹⁴₆C off the page and say "6 protons, 8
neutrons," explain in one sentence why two isotopes are still the same element, compute an ion's
electron count from its charge, and predict the formula CaCl₂ or MgO from the ions' charges
alone — without looking either compound up.

# Toolbox: Foundational Concepts

These aren't their own exam topic — they're the mechanics every later chapter assumes you
already have. Get shaky here and every stoichiometry problem in Chapter 4 gets shakier too.

---

## Unit conversions and metric prefixes

Chemistry problems live and die on unit conversions. The trick isn't memorizing every prefix —
it's treating each prefix as a ratio you multiply or divide by, and always writing the unit
next to the number so a wrong flip is visible before you finish the problem.

| Prefix | Symbol | Value |
|---|---|---|
| mega | M | 10⁶ |
| kilo | k | 10³ |
| (base) | — | 10⁰ |
| centi | c | 10⁻² |
| milli | m | 10⁻³ |
| micro | µ | 10⁻⁶ |
| nano | n | 10⁻⁹ |

> **The trap:** going from a small prefix to a large one (µ → k) means you're dividing by a
> *huge* number, and the instinct to just move the decimal the "same way" every time produces an
> answer off by a factor of a million. Write the conversion factor as a fraction — `1 kJ / 1000 J`
> — and check that the units you don't want actually cancel.

## Significant figures

A measurement is only as precise as the tool that made it. Significant figures communicate that
precision, and they follow two jobs at once: reading an instrument, and reporting a calculation.

- **Reading an instrument** (like a graduated cylinder): you read down to one digit *past* the
  smallest marked increment, and that last digit is an estimate. A cylinder marked in 1 mL
  increments gets read to the tenths place — not the hundredths.
- **Reporting a calculation:** multiplication/division answers keep as many sig figs as your
  *least* precise input; addition/subtraction answers keep as many decimal places as your least
  precise input. These are different rules — mixing them up is the single most common sig-fig
  mistake.

> **The trap:** counting digits instead of counting precision. `100` has an ambiguous number of
> sig figs unless you're told otherwise or it's written in scientific notation (`1.00 × 10²` is
> unambiguously 3).

## Scientific notation

`a × 10ⁿ`, where `1 ≤ a < 10`. It exists to make very large or very small numbers legible and to
make sig figs unambiguous. Converting between decimal and scientific notation is just counting
how many places the decimal point moved, and which direction — moving it left makes the exponent
more positive, moving it right makes it more negative.

## Nomenclature: ionic vs. covalent compounds

Two different naming systems, and the first move is figuring out *which one applies*.

- **Ionic compounds** (metal + nonmetal, or a polyatomic ion): name the cation first, then the
  anion. Anions get an `-ide` suffix (chloride, oxide) unless they're already polyatomic
  (sulfate, nitrate — memorize the common ones). If the metal can have more than one charge
  (most transition metals), you name the charge with a Roman numeral: Fe³⁺ is "iron(III)."
  Figure the charge from **charge balance** — the compound overall must be neutral.
- **Covalent (molecular) compounds** (nonmetal + nonmetal): name both elements with Greek
  numerical prefixes (mono-, di-, tri-...) showing exactly how many atoms of each — `CO₂` is
  "carbon dioxide," not "carbon oxide." The first element only gets a prefix if there's more
  than one atom of it.

> **The trap:** using Roman numerals on a metal that only ever has one charge (sodium is never
> "sodium(I)"), or forgetting that the charge on a metal in a formula is determined by what it
> takes to balance the anion's charge, not looked up directly.

## Density

`density = mass / volume`. It's a physical property that lets you convert between how much
*mass* of something you have and how much *space* it takes up — which is why it shows up
constantly as a hidden conversion factor in stoichiometry and gas-law problems, not just as its
own topic.

## Classification of matter

| | Pure substance | Mixture |
|---|---|---|
| **Uniform composition** | Element or compound | Homogeneous mixture (solution) |
| **Non-uniform composition** | — | Heterogeneous mixture |

An **element** can't be broken down by a chemical reaction. A **compound** is two or more
elements chemically bonded in a fixed ratio (and *can* be broken down chemically). A **mixture**
is two or more substances physically combined in a *variable* ratio — no new bonds formed, so it
can be separated by physical means (filtering, distilling).

## Properties and representations of matter

- A **physical property** can be observed without changing what the substance *is* (color,
  density, melting point). A **chemical property** describes how it reacts to become something
  else (flammability, reactivity with acid).
- A **particulate representation** (a picture of atoms/molecules as dots or circles) is how these
  ideas get tested visually — you're expected to read a diagram and identify whether it shows an
  element, compound, or mixture, and whether a process shown is physical or chemical, from the
  picture alone.

---

**Before you move on:** you should be able to convert between metric prefixes without a
calculator holding your hand, name a simple ionic or covalent compound correctly, and look at a
particulate diagram and say "element, compound, or mixture" with a reason.

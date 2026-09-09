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

### Counting significant figures in a number you are handed

The rules, in the order you apply them:

1. Every non-zero digit counts.
2. Zeros **between** non-zero digits (captive zeros) always count: `1005` has 4.
3. Zeros **in front** never count - they only locate the decimal point: `0.00420` has 3.
4. Zeros **at the end** count only if there is a decimal point somewhere in the number.
   `45.60` has 4; `1200` has 2; `1200.` has 4.
5. In scientific notation, only the coefficient carries them: `6.022 × 10²³` has 4.

### Units are part of the answer

Both rules above are about how many digits to write. Neither of them is the whole answer. A
measurement without a unit is not an answer, and in multiplication and division the unit
**changes**: g ÷ mL gives g/mL, cm × cm gives cm². Carry the units through the algebra
alongside the numbers - they are also the cheapest error check you have, because a setup that
ends in the wrong unit was wrong before you touched the calculator.

## Accuracy and precision are two different measurements

They are used interchangeably in ordinary speech and they are not interchangeable here.

- **Accurate** = close to the TRUE value.
- **Precise** = your repeated measurements are close to EACH OTHER.

A set of results can be either, both, or neither, and the four cases each mean something
different about your equipment:

| | Precise | Not precise |
|---|---|---|
| **Accurate** | The instrument is working and you are using it correctly. | Random error - a shaky hand, a draughty balance. The average is fine, individual readings are not. |
| **Not accurate** | **Systematic error** - a balance that was never zeroed, a mis-calibrated pipette. Every reading is wrong by the same amount, and no number of repeats will reveal it. | Both problems at once. |

> **The trap:** treating "precise" as a compliment. Precise-but-inaccurate is the *dangerous*
> case, because tight agreement between readings looks like evidence that they are right.
> Significant figures express precision, never accuracy - writing more digits does not make a
> reading truer.

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

### Acids get a third system

An acid (an H⁺ donor, written with H first) is named from its ANION, and which pattern you use
depends on whether that anion contains oxygen.

| Anion ends in | Acid is named | Example |
|---|---|---|
| `-ide` (no oxygen) | **hydro**-(stem)-**ic** acid | Cl⁻ chloride → HCl, hydrochloric acid |
| `-ate` | (stem)-**ic** acid, no "hydro" | CO₃²⁻ carbonate → H₂CO₃, carbonic acid |
| `-ite` | (stem)-**ous** acid, no "hydro" | NO₂⁻ nitrite → HNO₂, nitrous acid |

The number of hydrogens is whatever cancels the anion's charge - phosphate is 3−, so phosphoric
acid is H₃PO₄.

> **The trap:** putting "hydro-" on an oxyacid. There is no such thing as hydrocarbonic acid, and
> "hydrosulfuric acid" is H₂S, a completely different substance from H₂SO₄ (sulfuric acid).

## Density

`density = mass / volume`. It's a physical property that lets you convert between how much
*mass* of something you have and how much *space* it takes up — which is why it shows up
constantly as a hidden conversion factor in stoichiometry and gas-law problems, not just as its
own topic.

Read it as a conversion factor and it stops being a formula to memorise: 2.70 g/cm³ literally
says "2.70 grams per 1 cubic centimetre", so multiplying by a volume leaves grams and dividing a
mass by it leaves cm³. Watch for the volume being hidden - a rectangular block's is
length × width × height, and you have to build it before density is any use.

## Conversion factors, and units that carry an exponent

**Every conversion factor equals 1.** `12 in = 1 ft` is a statement that the two sides are the
same length, so `12 in / 1 ft` is 1, and so is `1 ft / 12 in`. That is exactly why multiplying by
one never changes the quantity, only the units it is written in - and why the only decision you
ever make is which side goes on top (the one that cancels the unit you are leaving).

When the unit is squared or cubed, **the whole factor gets squared or cubed, number included**:

> (12 in / 1 ft)² = 144 in² / 1 ft², so 144 in² = 1 ft² - not 12 ft².

Three volume equalities are worth knowing outright, because one of them is free:

- 1 mL = 1 cm³ **exactly** (this is a definition, not a measurement)
- 1 L = 1000 mL = 1000 cm³
- 1 m³ = 1000 L

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
  picture alone. Whether it is drawn or described in words, the reasoning is the same: look at
  one particle at a time and count how many DIFFERENT elements are bonded inside it. Two atoms
  of the same element bonded together is still an element, not a compound — that single point is
  the most common way these are missed.

> **A phase change never changes the substance.** Melting, boiling and subliming move particles
> further apart; they do not break the bonds inside a molecule. The gas above subliming dry ice
> is still CO₂, not carbon and oxygen. The white cloud you can see is water condensing out of the
> room air, which is a different substance from the one doing the subliming.

---

**Before you move on:** you should be able to convert between metric prefixes without a
calculator holding your hand, square a conversion factor when the unit is squared, count the
significant figures in a number you are handed, name a simple ionic, covalent or acid formula
correctly, say what separates accuracy from precision, and look at a particulate diagram — or a
sentence describing one — and say "element, compound, or mixture" with a reason.

// Per-section "go deeper" pages for the Exam 1 item pools — the ? button on a missed question
// lands here. Built 2026-09-08 at Trey's request: "in place of where we would normally put
// curriculum i want to do more learning there... on a missed question have a little button like a
// ? that explains further than whatever is already there... in many cases i need to see the math
// broken down."
//
// SCOPE RULES, from the same request:
//   - One page per course SECTION, not per question. Related questions share a page (every item
//     already carries its `section`, so no extra tagging was needed), and a section is small
//     enough that a page stays readable — his constraint was "a page shouldn't get TOO big or
//     else it defeats the point."
//   - Every page MUST show the real source material it was built from: "if you make a page for
//     'classifying elements' i want to see the source material you pulled from - since you should
//     be using 99.9% only course material from we've discussed and not your memory beyond when
//     necessary."
//
// 🔴 SOURCING DISCIPLINE — read before adding a page. Every `quote` below is copied from a
// document actually read in-session, and `where` names the file + section it came from. The only
// documents quoted here are ones that were genuinely opened:
//   - `CHEM 1210/_academiq/ch01-essential-ideas.md` and `ch02-atoms-molecules-and-ions.md`
//     (the assigned AcademiQ text, captured 2026-09-02)
//   - `chem/Classnotes.md` (Trey's own class notes)
//   - his own quiz PDF exports in `CHEM 1210/`
// The ACS study guide is deliberately NOT quoted: it wasn't re-read this session, and inventing a
// citation for it would be exactly the "using your memory" failure this rule exists to prevent.
// If you add an ACS quote later, open the PDF and copy it — do not reconstruct it.

import { CH3_CH4_PAGES } from './conceptsCh3Ch4.js';

/**
 * @typedef {Object} ConceptSource
 * @property {string} doc    human-readable document name
 * @property {string} where  section/page within that document
 * @property {string} quote  text actually copied from it
 *
 * @typedef {Object} ConceptPage
 * @property {string} section   course section id, matching every item's `section` field
 * @property {string} title
 * @property {string} summary   one line, shown under the heading
 * @property {ConceptSource[]} sources
 * @property {string} body      markdown
 */

/** @type {ConceptPage[]} */
const CH1_CH2_PAGES = [
  {
    section: '1-2',
    title: 'Chemistry in Context — the three domains, and how science is built',
    summary: "Macroscopic vs. microscopic vs. symbolic, and the hypothesis/law/theory distinction.",
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-2 Chemistry in Context',
        quote: 'Chemistry relies on observations and experiments that other people can repeat. You propose a hypothesis, test it with data, and revise it as needed. Patterns seen repeatedly may be summarized as laws, while broad explanations supported by lots of evidence are theories that can change when new evidence appears.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-2 — flagged "⚑ Graded checkpoint on this section"',
        quote: 'Chemistry is called the "central science" because it connects many STEM fields (Science, Technology, Engineering, and Mathematics) and gives a common way to describe matter and how it changes.',
      },
    ],
    body: `
## The three domains — the distinction that trips people up

Chemists describe the same event at three different levels at once. A question is really asking
"which level is this?"

| Domain | What it is | Example (water boiling) |
|---|---|---|
| **Macroscopic** | What you can directly observe with your senses | You see bubbles, feel steam, watch the pot empty |
| **Microscopic (particulate)** | The atoms/molecules themselves — reasoned about, not seen | H₂O molecules gain energy and break away from each other |
| **Symbolic** | The notation chemists write it in | H₂O(l) → H₂O(g) |

**The tell:** if the answer involves a *formula, equation, or symbol*, it's symbolic. If it involves
*individual particles*, it's microscopic. If you could have observed it without knowing any
chemistry, it's macroscopic.

## Hypothesis vs. law vs. theory

These are not "levels of confidence" — they're different *kinds* of statement.

- **Hypothesis** — a tentative, testable explanation, proposed *before* the evidence is in.
  "I think salt raises water's boiling point because the salt gets in the way."
- **Law** — a statement of *what* happens, a pattern observed so consistently it's summarized as a
  rule. It does **not** explain why. (Boyle's law: pressure and volume are inversely proportional.)
- **Theory** — a broad *explanation* of why, backed by a large body of evidence, and revisable if
  new evidence demands it. (Atomic theory.)

A theory never "graduates" into a law. They answer different questions: **laws describe, theories
explain.**
`.trim(),
  },

  {
    section: '1-3',
    title: 'Phases and Classification of Matter',
    summary: 'The classification flowchart, states of matter, and conservation of matter.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-3 Phases and Classification of Matter',
        quote: 'A pure substance has a constant composition. All specimens of a pure substance have exactly the same makeup and properties... So, pure substances may be divided into two classes: elements and compounds.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-3 — figure caption for the classification flowchart',
        quote: 'This flow chart begins with matter at the top and the question: does the matter have constant properties and composition? If no, then it is a mixture. This leads to the next question: is it uniform throughout? If no, it is heterogeneous. If yes, it is homogenous. If the matter does have constant properties and composition, it is a pure substance. This leads to the next question: can it be simplified chemically? If no, it is an element. If yes, then it is a compound.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-3 — law of conservation of matter',
        quote: 'The law of conservation of matter states that in a chemical change or a physical change, matter is not created or destroyed: you do not gain or lose matter (mass).',
      },
    ],
    body: `
## Run the flowchart — it answers every classification question

The textbook's own decision tree, in order. Ask these two questions and you cannot get it wrong:

**1. Does it have constant composition throughout?**
- **No** → it's a **MIXTURE**. Then ask: *is it uniform?*
  - Uniform (can't see the parts) → **homogeneous mixture** (salt water, air, brass)
  - Not uniform (can see the parts) → **heterogeneous mixture** (sand in water, granite, salad)
- **Yes** → it's a **PURE SUBSTANCE**. Then ask: *can it be broken down chemically?*
  - No → **ELEMENT** (Cu, Au, O₂, Fe — one kind of atom only)
  - Yes → **COMPOUND** (H₂O, CO₂, NaCl — two or more elements chemically bonded)

## The two traps that show up on quizzes

**Trap 1: "is O₂ a compound?"** No. It's two atoms of the *same* element bonded — that makes it a
**molecule**, but still an **element**. A compound needs *different* elements. The book says this
outright: *"Be careful not to confuse 'molecular' with 'diatomic element': O2 and N2 are molecules,
but they are elements, not compounds."*

The seven diatomic elements to memorize: **H₂, N₂, O₂, F₂, Cl₂, Br₂, I₂.**

**Trap 2: particle-diagram boxes.** When a question shows boxes of light/dark circles:
- Two circles of the *same* shade bonded = an element (as a molecule)
- Two circles of *different* shades bonded = a compound
- Unbonded loose circles of different shades = a mixture

Count what's actually bonded, not what's merely in the same box.

## States of matter

| State | Shape | Volume |
|---|---|---|
| Solid | Fixed | Fixed |
| Liquid | Takes container's shape | Fixed |
| Gas | Takes container's shape | Expands to fill container |

Which state a substance is in comes down to a competition: **particle kinetic energy (temperature)
pushes particles apart; attractive forces between particles pull them together.**

## Conservation of matter

Mass is never created or destroyed in a physical *or* chemical change — it's only rearranged. If a
reaction seems to "lose" mass, a gas escaped. This is why a sealed battery weighs exactly the same
charged and discharged, even though the substances inside changed completely.
`.trim(),
  },

  {
    section: '1-4',
    title: 'Physical and Chemical Properties (and Changes)',
    summary: 'The one question that separates physical from chemical, plus extensive vs. intensive.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-4 Physical and Chemical Properties',
        quote: 'A physical change is a change in the state or properties of matter without any accompanying change in the chemical identities of the substances contained in the matter.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-4',
        quote: 'The ability to change from one type of matter into another (or the inability to change) is a chemical property. Examples of chemical properties include flammability, toxicity, acidity, and many other types of reactivity.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-4 — extensive vs. intensive',
        quote: 'extensive properties depend on the amount present and scale with it (like mass and volume, so a gallon of milk has more mass than a cup), while intensive properties do not depend on amount (like temperature, so combining a cup and a gallon of milk that are both 20 °C still gives 20 °C).',
      },
    ],
    body: `
## One question decides it: is a NEW substance formed?

- **New substance formed → CHEMICAL change.** Rust is not iron. Ash is not wood. CO₂ from burning
  is not the coal.
- **Same substance, different form → PHYSICAL change.** Melted gold is still gold. Dissolved sugar
  is still sugar. Steam is still water.

The textbook makes this concrete with equations — a chemical change *has* one, a physical change
doesn't:

**Physical changes (no chemical equation applies):**
- H₂O(s) → H₂O(l) — melting
- CO₂(s) → CO₂(g) — dry ice subliming
- NaCl(s) → NaCl(l) — molten salt

**Chemical changes (a real equation, new substances on the right):**
- 4Fe(s) + 3O₂(g) → 2Fe₂O₃(s) — rusting
- CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(g) — combustion

## The dissolving trap

**Dissolving is PHYSICAL.** Sugar in water is still sugar — the molecules are dispersed, not
changed. This one is missed constantly because it *looks* like something happened. Nothing new was
made; you could evaporate the water and get the sugar back.

Same logic for **sublimation** (dry ice → CO₂ gas): the substance never changed identity, only its
state. A question asking "what gas forms as dry ice sublimes?" is answered "carbon dioxide gas"
precisely *because* nothing chemical happened.

## Properties: which kind is it?

| | Depends on how much you have? | Examples |
|---|---|---|
| **Extensive** | **Yes** | mass, volume, length, total heat energy |
| **Intensive** | **No** | density, temperature, color, melting/boiling point, hardness |

**Quick check:** cut the sample in half. Did the value change? Extensive. Still the same? Intensive.

Half a bar of gold has half the *mass* (extensive) but exactly the same *density* (intensive).

**Physical vs. chemical PROPERTY** follows the same logic as changes: a physical property can be
measured without destroying the substance (color, density, melting point); a chemical property can
only be observed by letting it react (flammability, toxicity, acidity, reactivity).
`.trim(),
  },

  {
    section: '1-5',
    title: 'Measurements — SI units, prefixes, and conversions',
    summary: 'The base units, the prefix ladder, and how to run a conversion without guessing.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-6 Key Concepts and Summary',
        quote: 'Scientists primarily use SI (International System) units such as meters, seconds, and kilograms, as well as derived units, such as liters (for volume) and g/cm^3 (for density). In many cases, it is convenient to use prefixes that yield fractional and multiple units, such as microseconds (10^−6 seconds) and megahertz (10^6 hertz), respectively.',
      },
      {
        doc: "Trey's class notes",
        where: 'chem/Classnotes.md',
        quote: 'KNOW : CM / MM · 2.5cm/1in · 100cm/1m · know unit conversions',
      },
    ],
    body: `
## The prefix ladder — memorize this, it's most of the section

| Prefix | Symbol | Factor |
|---|---|---|
| tera- | T | 10¹² |
| giga- | G | 10⁹ |
| mega- | M | 10⁶ |
| kilo- | k | 10³ |
| **(base unit)** | — | 10⁰ |
| deci- | d | 10⁻¹ |
| centi- | c | 10⁻² |
| milli- | m | 10⁻³ |
| micro- | µ | 10⁻⁶ |
| nano- | n | 10⁻⁹ |
| pico- | p | 10⁻¹² |

The quiz asks this two ways: fill in a prefix table, or "what is the SI prefix for 10⁻²?" (centi).
The most-missed one is **micro- = 10⁻⁶** (people say 10⁶ — wrong sign *and* wrong magnitude).

## SI base units (the seven, but these four matter here)

| Quantity | Base unit | Symbol |
|---|---|---|
| Mass | kilogram | kg |
| Length | meter | m |
| Time | **second** | s |
| Amount of substance | mole | mol |

⚠ **Second, not minute or hour.** And note the *liter* is NOT a base unit — it's derived. Same for
the newton and joule.

## Doing a conversion without guessing the direction

Set it up so the unwanted unit cancels. Never "just multiply or divide and see if it looks right."

**Worked: 0.025 m = ? mm**

    0.025 m × (1000 mm / 1 m) = 25 mm
              ↑ m on the bottom cancels the m you started with

**Worked: 0.025 m = ? cm**

    0.025 m × (100 cm / 1 m) = 2.5 cm

**Worked: 10,000 mm = ? cm** — going from a *smaller* prefix to a *bigger* one, so the number gets
smaller:

    10,000 mm × (1 cm / 10 mm) = 1000 cm

**Worked: 4.50 × 10⁻³ s in an SI prefix.** Match the exponent to the table: 10⁻³ is *milli-*, so
this is **4.50 milliseconds**. No arithmetic needed — just read the ladder.

## The conversions Trey's own notes say to know cold

- **1 in = 2.54 cm** (exact, by definition)
- **100 cm = 1 m**
- **1000 mm = 1 m**, so **10 mm = 1 cm**
`.trim(),
  },

  {
    section: '1-6',
    title: 'Significant Figures, Accuracy, and Precision',
    summary: 'The four sig-fig rules, and why precise ≠ accurate.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-6 Significant Figures',
        quote: 'All nonzero digits are significant. Zeros between nonzero digits are significant because they are part of the measured value (for example, 3,486,002 has interior zeros that count). Leading zeros to the left of the first nonzero digit are not significant; they only locate the decimal point (for example, 0.0613 has three significant figures). Trailing zeros at the end of a number are significant only if a decimal point is shown (for example, 17.0 has three significant figures, and 10000.0 indicates that all digits, including zeros, are significant). In scientific notation, the power of 10 never affects significant figures; only the digits in the coefficient count (for example, 9.74150 × 10^−4 has six significant figures, and 2 × 10^18 has one).',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-6 Accuracy and Precision',
        quote: 'Accuracy describes how close a measured value is to the true or accepted value, while precision describes how closely repeated measurements agree with one another.',
      },
      {
        doc: "Trey's class notes",
        where: 'chem/Classnotes.md',
        quote: 'work on sig figs. . . .',
      },
    ],
    body: `
## The four rules, in the order you apply them

1. **Every nonzero digit is significant.** \`38.7\` → 3 sig figs.
2. **Zeros BETWEEN nonzero digits are significant.** \`0.0306\` → the middle 0 counts → 3 sig figs.
   \`3,486,002\` → 7 sig figs.
3. **Leading zeros are NEVER significant** — they only place the decimal. \`0.0613\` → 3 sig figs.
   \`0.0126\` → 3. \`0.0020\` → 2.
4. **Trailing zeros count only if there's a decimal point shown.** \`17.0\` → 3. \`0.01400\` → 4
   (leading zeros don't count, but both trailing zeros do). \`10000.0\` → 6. But bare \`1500\` → 2.

**Scientific notation:** only the coefficient counts. \`2 × 10¹⁸\` → **1 sig fig** (the exponent is
not a measured digit). \`9.74150 × 10⁻⁴\` → 6.

### Worked examples straight off the quizzes

| Value | Sig figs | Why |
|---|---|---|
| 38.7 g | 3 | all nonzero |
| 0.0306 g | 3 | leading zeros out, interior zero in |
| 0.0126 kg | 3 | leading zeros out |
| 0.0613 cm³ | 3 | leading zeros out |
| 0.01400 g/mL | 4 | 1, 4, and both trailing zeros (decimal shown) |
| 0.0020 kg | 2 | leading zeros out, one trailing zero in |
| 0.00242 kg | 3 | leading zeros out |
| 2 × 10¹⁸ m | 1 | coefficient only |
| 0.07080 m | 4 | interior zero + trailing zero both count |

## Exact numbers have INFINITE sig figs

A counted quantity ("12 tablets") or a defined conversion (1 in = 2.54 cm exactly) is **exact** —
it never limits your answer's precision. This is a real quiz question and the wrong answer people
pick is "2 sig figs."

## Implied uncertainty lives in the last digit

A balance reading of **6.72 g** implies **± 0.01 g** — the last digit shown is the hundredths
place, so that's where the uncertainty sits. Not ±0.1, not ±0.001.

## Scientific notation format

One nonzero digit before the decimal, times a power of 10.

- ✅ 8.4 × 10³
- ❌ 530 × 10⁴ (coefficient too big)
- ❌ 0.85 × 10² (coefficient too small)

**Worked: 0.0000000651 → ?** Move the decimal right 8 places to get 6.51, so the exponent is
**−8**: \`6.51 × 10⁻⁸\`. (Moving right = negative exponent. Small number, negative power.)

**Worked: 22086 → ?** Move the decimal left 4 places to get 2.2086: \`2.2086 × 10⁴\`.

**Worked: 0.05499 → ?** Four sig figs must survive: \`5.499 × 10⁻²\`. Writing \`5.50 × 10⁻²\` throws
away a sig fig; \`5.4990 × 10⁻²\` invents one.

## Accuracy vs. precision — they are independent

- **Accuracy** = close to the *true value*.
- **Precision** = the repeated measurements are close to *each other*.

You can have either without the other:

| Data | True value | Verdict |
|---|---|---|
| 5.12, 5.15, 5.14 cm | 5.90 cm | **Precise, not accurate** — tight cluster, wrong place |
| 296.1, 295.9, 296.1, 296.0, 296.1 mL | 296 mL | **Both** — tight cluster, right place |
| 8.0, 10.0, 12.0, 10.0 mL | 10.0 mL | **Accurate on average, not precise** — mean is perfect, spread is terrible |

**Archer questions:** "most precise" = the tightest cluster *anywhere* on the target, even in the
outer ring. "Most accurate" = closest to the bullseye, even if scattered. Read which word the
question actually used — that's the whole question.
`.trim(),
  },

  {
    section: '1-7',
    title: 'Mathematical Treatment — sig-fig arithmetic, density, dimensional analysis',
    summary: 'The two different rounding rules, and how to set up any conversion so it cannot go wrong.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-7 Math Using Significant Figures',
        quote: 'For multiplication and division, the number of significant figures in the final answer is limited by the measurement in the calculation that has the fewest significant figures... For addition and subtraction, the rule is different because these operations combine absolute uncertainty. The final answer is limited by the least precise decimal place among the values being added or subtracted (not by the total number of significant figures).',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-7 Conversion Factors and Dimensional Analysis',
        quote: 'Dimensional analysis is based on this premise: the units of quantities must be subjected to the same mathematical operations as their associated numbers.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch01-essential-ideas.md, §1-6 Key Equations',
        quote: 'density = mass/volume',
      },
    ],
    body: `
## Two rules, and they are NOT the same rule

This is the single most-missed idea in the section. Which rule applies depends on the *operation*.

### × and ÷ → count SIGNIFICANT FIGURES

The answer gets as many sig figs as the input with the **fewest sig figs**.

**Worked: 0.0023 m × 3150 m**

    0.0023  → 2 sig figs   ← the limiter
    3150    → 3 sig figs
    0.0023 × 3150 = 7.245
    Round to 2 sig figs → 7.2 m²

**Worked: (3.14 × 2.751) / 0.64**

    3.14   → 3 sig figs
    2.751  → 4 sig figs
    0.64   → 2 sig figs   ← the limiter
    (3.14 × 2.751) / 0.64 = 13.497...
    Round to 2 sig figs → 13

### + and − → count DECIMAL PLACES

The answer gets rounded to the **least precise decimal place**, regardless of total sig figs.

**Worked: 1.00 L − 0.0100 L**

    1.00    → 2 decimal places   ← the limiter
    0.0100  → 4 decimal places
    1.00 − 0.0100 = 0.9900
    Round to 2 decimal places → 0.99 L

**Worked: 12.11 mL + 0.3 mL + 1.005 mL** (the book's own example)

    0.3 is only good to the tenths place ← the limiter
    12.11 + 0.3 + 1.005 = 13.415
    Round to tenths → 13.4 mL

⚠ Notice that in the subtraction example the answer (0.99) has *fewer* sig figs than either input.
That's correct and expected — applying the multiplication rule here is the classic error.

## Density

    density = mass / volume        mass = density × volume        volume = mass / density

**Worked: density 2.70 g/cm³, volume 15.0 cm³ → mass?**

    mass = 2.70 g/cm³ × 15.0 cm³ = 40.5 g
    (3 sig figs × 3 sig figs → 3 sig figs ✓)

**Worked: mass 17.88 g, volume 22.35 cm³ → density?**

    density = 17.88 g ÷ 22.35 cm³ = 0.8000 g/mL

**Worked: mass 45.6 g, volume 36.4 mL → density?**

    density = 45.6 ÷ 36.4 = 1.2527... → 1.25 g/mL (3 sig figs)

**Worked (two-step, water displacement): mass 157 g, water goes 50.00 mL → 67.25 mL**

    Step 1 — displaced volume = 67.25 − 50.00 = 17.25 mL
    Step 2 — density = 157 g ÷ 17.25 mL ≈ 9.10 g/mL

## Water displacement — what it does and doesn't tell you

An object displaces **its own volume** of water. So:

- Given a **volume** (203 mL of silver in) → it displaces **203 mL**. Density is irrelevant.
- Given only a **mass** (203 g of silver) → you *cannot* get volume without the density.
  (Silver is 10.49 g/cm³, so 203 g would really displace ≈ 19.4 cm³.)

## Dimensional analysis — write the units, let them cancel

The rule: **whatever you do to the numbers, do to the units.** If the units don't cancel down to
your target unit, the setup is wrong — that's the check, and it's why you write them out.

**Worked: 155 g of gold (density 19.32 g/mL) → volume in m³**

    Step 1 — g to mL:   155 g × (1 mL / 19.32 g) = 8.02 mL
                              ↑ g cancels g
    Step 2 — mL to m³:  1 mL = 1 cm³ = 10⁻⁶ m³
                        8.02 mL × (10⁻⁶ m³ / 1 mL) = 8.02 × 10⁻⁶ m³

**Worked: 4.00 qt of antifreeze weighing 9.26 lb → density in g/mL**

    Mass:    9.26 lb × (453.6 g / 1 lb) = 4200 g
    Volume:  4.00 qt × (946.4 mL / 1 qt) = 3786 mL
    Density: 4200 g ÷ 3786 mL = 1.11 g/mL

Note the trap answer on that one: 4.20 g/mL comes from converting the mass and then *forgetting to
divide by the volume at all*.

**Worked: soccer ball, 27-28 in circumference and 14-16 oz → cm and g**

    27 in × 2.54 cm/in = 68.6 cm  →  68-71 cm
    14 oz × 28.35 g/oz = 397 g    →  400-450 g
`.trim(),
  },

  {
    section: '2-2',
    title: 'Early Ideas in Atomic Theory — the proportion laws',
    summary: "Dalton's postulates, and the mass-ratio math for identifying an unknown element.",
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-2 Early Ideas in Atomic Theory',
        quote: 'The law of definite proportions states that a pure compound always contains the same elements in the same mass ratio, regardless of where the sample comes from or how large the sample is.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-2',
        quote: 'The law of multiple proportions states that when the same two elements form more than one compound, a fixed mass of one element combines with different masses of the other element in ratios of small, whole numbers.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-2 — worked Example, "A compound has the formula X2O"',
        quote: 'Step 1: Use the formula to connect "mass per atom" to "mass ratio." X2O means: 2 atoms of X for every 1 atom of O. So the mass ratio should be: (mass of 2 X atoms) : (mass of 1 O atom)',
      },
    ],
    body: `
## Dalton's postulates, and what each one explains

- Matter is made of atoms; an atom is the smallest unit of an element in a chemical change.
- All atoms of one element share the same characteristic mass; different elements differ.
- A compound combines atoms of 2+ elements in a **small, whole-number ratio**.
- Atoms are **neither created nor destroyed** in a chemical change, only rearranged.
  → this postulate is what explains the **law of conservation of mass**.

## The two proportion laws — don't mix them up

| Law | Applies to | Says |
|---|---|---|
| **Definite proportions** | ONE compound, any sample size | Same elements, same mass ratio, always |
| **Multiple proportions** | TWO different compounds of the SAME element pair | The masses combining with a fixed mass of the other are in small whole-number ratios |

Definite: every sample of water is 0.125 g H per 1.00 g O, whether the sample is 10 g or 40 g.
Multiple: CuCl vs. CuCl₂ — per fixed copper, the chlorine masses are in a clean **2:1** ratio.

## The "identify element X" problem — the whole method

These all look different but are one procedure. The formula tells you the *atom* ratio; you convert
that to a *mass* ratio and solve for X's atomic mass.

**Worked: X₂O contains 0.126 g of X per 1.00 g of O. What is X?**

    Step 1 — read the formula as a mass relationship.
             X₂O = 2 atoms X : 1 atom O
             so   (mass of 2 X) : (mass of 1 O) = 0.126 : 1.00

    Step 2 — put in oxygen's atomic mass (16.00).
             (2X) / 16.00 = 0.126

    Step 3 — solve.
             2X = 0.126 × 16.00 = 2.016
             X  = 2.016 / 2 = 1.008

    Step 4 — look it up on the periodic table.
             1.008 → hydrogen.  The compound is H₂O.

**Worked, when you're given SAMPLE MASSES instead of a ratio: X₂O, 9.60 g sample, 7.12 g is X.**

    Step 1 — get the other mass by subtraction.
             mass O = 9.60 − 7.12 = 2.48 g

    Step 2 — form the ratio, then proceed identically.
             (2X) / 16.00 = 7.12 / 2.48 = 2.871
             2X = 45.9  →  X = 22.97  →  sodium (Na₂O)

**Worked, with a different formula shape: X₂O₃, 40.0 g sample, 18.8 g is oxygen.**

    mass X = 40.0 − 18.8 = 21.2 g
    X₂O₃ = 2 atoms X : 3 atoms O
    (2X) / (3 × 16.00) = 21.2 / 18.8
    (2X) / 48.00 = 1.128
    2X = 54.1  →  X = 27.0  →  aluminum (Al₂O₃)

**The one step people skip:** dividing by the subscript at the end. \`2X = 2.016\` is *not* the
answer — X = 1.008 is. Getting exactly double the right atomic mass means you forgot this.
`.trim(),
  },

  {
    section: '2-3',
    title: 'Atomic Structure and Symbolism',
    summary: 'Protons/neutrons/electrons, isotope notation, ion charge, and average atomic mass.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-3 Atomic Structure and Symbolism',
        quote: 'Atomic number Z is the number of protons (and equals the number of electrons in a neutral atom), while mass number A is protons + neutrons, so neutrons = A − Z. If protons and electrons are not equal, the atom is an ion and its charge = (# protons) − (# electrons).',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-3 Atomic Mass',
        quote: 'The atomic mass listed on the periodic table is a weighted average of the naturally occurring isotopes, calculated as (fractional abundance) × (isotopic mass) summed over all isotopes. For boron, 0.199(10.0129 amu) + 0.801(11.0093 amu) = 10.81 amu, so no individual boron atom has a mass of 10.81 amu.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-3 Isotopes',
        quote: 'All magnesium atoms have 12 protons in their nucleus. They differ only because a ^24Mg atom has 12 neutrons in its nucleus, a ^25Mg atom has 13 neutrons, and a ^26Mg has 14 neutrons.',
      },
    ],
    body: `
## The three equations that answer almost every question here

    Z (atomic number) = number of protons      ← this defines WHICH element it is
    A (mass number)   = protons + neutrons
    neutrons          = A − Z
    charge            = protons − electrons

Rearranged for the direction questions usually ask:

    electrons = protons − charge     (note the minus: a 2+ charge means TWO FEWER electrons)

## Reading and writing the symbol

    A  ⎡ 56    ⎤ charge
       ⎢   Fe  ⎥  2+          →   ⁵⁶Fe²⁺
    Z  ⎣ 26    ⎦

- Mass number **A** = top-left
- Atomic number **Z** = bottom-left (often omitted — the element symbol already tells you)
- Charge = top-right

**Worked: mass number 56, 24 electrons, 26 protons → symbol?**

    26 protons → iron (Fe)
    charge = 26 − 24 = 2+
    → ⁵⁶Fe²⁺

**Worked: 17 protons, 20 neutrons, charge 1− → electrons and symbol?**

    17 protons → chlorine
    A = 17 + 20 = 37
    charge 1− means one MORE electron than protons: 17 + 1 = 18 electrons
    → ³⁷Cl⁻

**Worked: ⁸⁰Br⁻, Z = 35 → p, n, e?**

    protons  = 35 (given by Z)
    neutrons = 80 − 35 = 45
    electrons = 35 + 1 = 36   (1− charge = one extra electron)

## Cations vs. anions — the sign trap

- **Lose** electrons → **fewer** electrons than protons → **positive** → **cation** (Na → Na⁺)
- **Gain** electrons → **more** electrons than protons → **negative** → **anion** (Cl → Cl⁻)

"Gaining something negative makes you more negative" is the way to keep it straight. To turn
neutral ³¹P into ³¹P³⁻ you **gain 3 electrons** — you never change protons, because changing protons
would change what element it is.

## Isotopes

Same element (same protons), **different neutron count**, therefore different mass number. That's
the entire definition. What's *always* true of two isotopes: same number of protons. What's *not*
guaranteed: same neutrons, same mass number, same electrons (if one is an ion).

## Average atomic mass — the weighted-average calculation

The periodic table value is a weighted average across natural isotopes, so **no single atom
actually has that mass**. That's the concept question; here's the math one:

    average = Σ (fractional abundance × isotopic mass)

**Worked: 60.0% ¹⁰X at 10.013 amu, 40.0% ¹¹X at 11.009 amu**

    (0.600 × 10.013) + (0.400 × 11.009)
    = 6.008 + 4.404
    = 10.41 amu

**Worked: chlorine — 75.77% ³⁵Cl (34.969 amu), 24.23% ³⁷Cl (36.966 amu)**

    (0.7577 × 34.969) + (0.2423 × 36.966)
    = 26.496 + 8.957
    = 35.45 amu     ← matches the periodic table exactly

⚠ **Convert percentages to decimals first** (75.77% → 0.7577). Forgetting is the most common error,
and it gives an answer ~100× too large.

## Relative sizes, for the conceptual questions

The nucleus holds nearly all the **mass** but almost none of the **volume** — the atom is about
10⁻¹⁰ m across, the nucleus about 10⁻¹⁵ m, roughly 100,000× smaller. The book's image: *"If the
nucleus were the size of a blueberry, the atom would be about the size of a football stadium."*
Electrons are the reverse: nearly all the volume, negligible mass (0.00055 amu).
`.trim(),
  },

  {
    section: '2-4',
    title: 'Chemical Formulas — molecular, empirical, structural',
    summary: 'Subscripts vs. coefficients, reducing to empirical formulas, and isomers.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-4 Chemical Formulas',
        quote: 'An empirical formula shows which elements are present and the simplest whole-number ratio of their atoms (or ions) in the compound... Note that a molecular formula is always a whole-number multiple of an empirical formula.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-4',
        quote: 'It is important to note that a subscript following a symbol and a number in front of a symbol do not represent the same thing; for example, H2 and 2H represent distinctly different species.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-4',
        quote: 'Compounds with the same molecular formula can have different bonding and structures (isomers); for example, C2H4O2 can be either acetic acid or methyl formate.',
      },
    ],
    body: `
## Subscript vs. coefficient — read them in this order

- A **subscript** (the small number *after* a symbol) counts atoms **inside one unit**.
- A **coefficient** (the number *in front*) counts **how many separate units** there are.
- A coefficient multiplies **everything** in the formula behind it.

| Notation | Means |
|---|---|
| H | one hydrogen atom |
| 2H | two separate, unbonded hydrogen atoms |
| H₂ | one molecule of two bonded hydrogen atoms |
| 2H₂ | two molecules, each of two bonded atoms (4 atoms total) |

**Worked: how many of each atom in 4Mg(OH)₂?**

    Inside the parentheses: (OH) = 1 O + 1 H
    Parenthesis subscript ₂ doubles it:  2 O + 2 H, plus the 1 Mg  →  Mg₁O₂H₂ per unit
    Coefficient 4 multiplies everything: Mg = 4,  O = 8,  H = 8

**Worked: 2Fe₂O₃?**  →  Fe = 2 × 2 = **4**, O = 2 × 3 = **6**.

## Molecular vs. empirical formula

- **Molecular** = the *actual* atom counts in one real molecule. (Benzene: C₆H₆)
- **Empirical** = the *simplest whole-number ratio*. (Benzene: CH)

To get empirical from molecular: **divide every subscript by their greatest common factor.**

    C₆H₁₂O₆  ÷6  →  CH₂O        (glucose)
    C₈H₁₆O₄  ÷4  →  C₂H₄O       (metaldehyde)
    C₂H₄O₂   ÷2  →  CH₂O        (acetic acid — same empirical formula as glucose!)

That last line is worth sitting with: **empirical formula does not identify a compound.** Glucose
and acetic acid share CH₂O. Only the molecular formula tells them apart.

The two are identical whenever the molecular formula can't be reduced any further — H₂O is already
2:1 with no common factor.

## Isomers

**Same molecular formula, different connectivity → different compound, different properties.**

C₂H₄O₂ is either acetic acid (vinegar) or methyl formate, depending on where the oxygen sits. Same
atoms, same counts, completely different substance — which is why a structural formula (showing
bonds as lines) carries information a molecular formula cannot.

Don't confuse **isomers** (same formula, different structure) with **isotopes** (same element,
different neutron count). They sound alike and test alike.
`.trim(),
  },

  {
    section: '2-5',
    title: 'The Periodic Table — classification and families',
    summary: 'Metals/nonmetals/metalloids, groups vs. periods, and the named families.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-5 The Periodic Table',
        quote: 'Metals are typically shiny, malleable and ductile, and good conductors of heat and electricity; nonmetals are usually dull and poor conductors. Metalloids have intermediate properties, conducting moderately well and showing a mix of metal and nonmetal characteristics.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-5 Key Concepts and Summary',
        quote: 'The elements in group 1 are known as the alkali metals; those in group 2 are the alkaline earth metals; those in 15 are the pnictogens; those in 16 are the chalcogens; those in 17 are the halogens; and those in 18 are the noble gases.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-3 (representative elements and ion charges)',
        quote: 'Representative (main-group) elements are the elements in Groups 1, 2, and 13-18 of the periodic table. Their location is useful because the group number tells you how many valence electrons they have... Transition metals... commonly form more than one ion, so their position on the table does not reliably predict a single ionic charge the way it does for representative elements.',
      },
    ],
    body: `
## Two axes, two words

- **Group** = a **column** (1-18). Same group → similar chemical behavior.
- **Period** = a **row** (1-7).

Questions like *"the halogen in the same period as lithium"* are asking you to intersect the two:
lithium is period 2, halogens are group 17 → **fluorine**.

## The three classes

| Class | Properties | Where |
|---|---|---|
| **Metals** | shiny, malleable, ductile, good conductors | left ~⅔ of the table |
| **Nonmetals** | dull, poor conductors | upper right (plus H) |
| **Metalloids** | intermediate — moderate conductivity, mixed behavior | the diagonal staircase between the two |

## The named families

| Group | Name |
|---|---|
| 1 (except H) | **Alkali metals** |
| 2 | **Alkaline earth metals** |
| 15 | Pnictogens |
| 16 | Chalcogens |
| 17 | **Halogens** |
| 18 | **Noble gases** |

## The other classification axis (this is the one questions double up on)

- **Representative / main-group** = groups 1, 2, and 13-18
- **Transition metals** = groups 3-12
- **Inner transition metals** = the two detached rows at the bottom
  (**lanthanides** on top, **actinides** below)

A question asking *"which element is a metal AND an inner transition metal?"* wants an element from
those bottom two rows — e.g. **Am** (americium, an actinide). *"A nonmetal and a representative
element"* wants something like **S** (sulfur, group 16).

## Why main-group position predicts ion charge (and transition metals don't)

Main-group atoms gain or lose electrons to reach the nearest **noble-gas** electron count — a full
octet (or 2, for helium's row). That makes their common charge predictable straight off the group:

| Group | Valence e⁻ | Typical ion |
|---|---|---|
| 1 | 1 | 1+ |
| 2 | 2 | 2+ |
| 13 | 3 | 3+ |
| 15 | 5 | 3− |
| 16 | 6 | 2− |
| 17 | 7 | 1− |
| 18 | 8 (full) | forms none |

**Transition metals break this** — iron is Fe²⁺ *or* Fe³⁺, copper Cu⁺ *or* Cu²⁺, chromium Cr²⁺/Cr³⁺/Cr⁶⁺.
That's exactly why their names need a Roman numeral (see section 2-7) and main-group names don't.
`.trim(),
  },

  {
    section: '2-6',
    title: 'Ionic and Molecular Compounds — ions, charge balance, polyatomics',
    summary: 'Telling ionic from molecular, predicting charges, and building formulas that balance.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-6 Ionic and Molecular Compounds',
        quote: 'Ionic compounds usually include a metal + nonmetal, while molecular compounds contain only nonmetals.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-6',
        quote: 'One important exception to the "look for a metal" shortcut is the ammonium ion, NH₄⁺: it is a polyatomic cation made entirely of nonmetals, but it behaves like a metal cation in ionic compounds. As a result, compounds such as NH₄Br or (NH₄)₂SO₄ are ionic even though they contain no metal atoms.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-6',
        quote: 'In every ionic compound, the total number of positive charges of the cations equals the total number of negative charges of the anions. Thus, ionic compounds are electrically neutral overall.',
      },
      {
        doc: "Trey's class notes",
        where: 'chem/Classnotes.md',
        quote: 'review polyhatomic ions · ionic vs molecular compo ---> imp in naming',
      },
    ],
    body: `
## Ionic or molecular? Check the elements first

- **metal + nonmetal → IONIC** (NaCl, CaCl₂, MgO, K₂SO₄)
- **nonmetal + nonmetal → MOLECULAR / covalent** (CO₂, SO₃, PCl₅, NF₃, ICl)

**The exception you will be tested on: NH₄⁺ (ammonium).** It's built entirely from nonmetals but
acts like a metal cation, so **NH₄Br and (NH₄)₂CO₃ are ionic** despite containing no metal. That's
the "which compound is ionic even though it contains no metal atoms?" question.

| | Ionic | Molecular |
|---|---|---|
| Made of | cations + anions in a lattice | discrete molecules |
| Formula means | simplest **ratio** of ions | **actual** atoms in one molecule |
| Melting point | high | generally low |
| Conducts electricity | **only when molten or dissolved** | no |

That conductivity line is a real question: ionic solids don't conduct because the ions are **locked
in the lattice**; melting or dissolving frees them to move, and moving charges are what current is.

## Predicting the charge

Main-group elements go to the nearest noble-gas count (see 2-5's table). Metals lose electrons
(cations, +), nonmetals gain (anions, −).

    Group 1  → 1+      Group 15 → 3−
    Group 2  → 2+      Group 16 → 2−
    Group 13 → 3+      Group 17 → 1−

**Worked: 13 protons, 10 electrons → what ion?**

    13 protons → aluminum (Z = 13)
    charge = 13 − 10 = 3+   →   Al³⁺

## Polyatomic ions — the memorization Trey's notes flag

A **polyatomic ion** is a bonded group of atoms carrying one overall charge, acting as a **single
unit**. An **oxyanion** is a polyatomic ion containing oxygen.

The ones worth knowing cold:

| Ion | Formula | Charge |
|---|---|---|
| Ammonium | NH₄⁺ | 1+ |
| Hydroxide | OH⁻ | 1− |
| Nitrate | NO₃⁻ | 1− |
| Nitrite | NO₂⁻ | 1− |
| Acetate | C₂H₃O₂⁻ | 1− |
| Carbonate | CO₃²⁻ | 2− |
| Sulfate | SO₄²⁻ | 2− |
| Sulfite | SO₃²⁻ | 2− |
| Phosphate | PO₄³⁻ | 3− |

(The **-ate/-ite** pattern in that list is section 2-7's territory — see that page.)

## Building a formula: make the charges cancel

The compound must come out **electrically neutral**. Take the charges and cross them down as
subscripts, then reduce if possible.

**Worked: Al³⁺ + O²⁻**

    Al³⁺  O²⁻
      ╲  ╱          Al gets O's charge (2), O gets Al's charge (3)
       ╳
    →  Al₂O₃        check: 2(3+) = 6+ ,  3(2−) = 6−  ✓ balanced

**Worked: Ca²⁺ + PO₄³⁻** — polyatomic ion, so it needs parentheses:

    Ca²⁺  PO₄³⁻   →   Ca₃(PO₄)₂
    check: 3(2+) = 6+ ,  2(3−) = 6−  ✓

**Worked: NH₄⁺ + PO₄³⁻**

    Three 1+ ions balance one 3− ion  →  (NH₄)₃PO₄

**Parentheses rule:** use them whenever you need **more than one** of a polyatomic ion. Ca(H₂PO₄)₂,
not CaH₂PO₄₂ — without the parentheses the subscript would attach to the wrong atom.

## The formula you must NOT reduce

Sodium oxalate is **Na₂C₂O₄**, not "NaCO₂" — even though the subscripts look reducible. You may
never reduce *through* a polyatomic ion: **C₂O₄²⁻ (oxalate) is one real ion**, and splitting it
would describe a substance that doesn't exist.
`.trim(),
  },

  {
    section: '2-7',
    title: 'Chemical Nomenclature — naming rules',
    summary: 'The -ide/-ate/-ite/-ic/-ous system, Roman numerals, Greek prefixes, and hydrates.',
    sources: [
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-7 Chemical Nomenclature',
        quote: 'The name of a binary ionic compound containing monatomic ions consists of the name of the cation (the name of the metal) followed by the name of the anion (the name of the nonmetallic element with its ending replaced by the suffix –ide).',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-7 Compounds Containing a Metal Ion with a Variable Charge',
        quote: 'Many transition metals (and some main-group metals) form more than one cation, so the metal\'s charge must be included in the compound name as a Roman numeral in parentheses after the metal name... For example, FeCl₂ is iron(II) chloride and FeCl₃ is iron(III) chloride, so the name "iron chloride" alone is ambiguous.',
      },
      {
        doc: 'AcademiQ (assigned text)',
        where: 'ch02-atoms-molecules-and-ions.md, §2-7 Oxyacids',
        quote: 'To name oxyacids: Omit "hydrogen"; Start with the root name of the anion; Replace –ate with –ic, or –ite with –ous; Add "acid"',
      },
      {
        doc: "Trey's class notes",
        where: 'chem/Classnotes.md',
        quote: 'ate, ite , ade ,etc · ionic vs molecular compo ---> imp in naming',
      },
    ],
    body: `
## First: decide which naming SYSTEM applies

Naming is a decision tree, and picking the wrong branch is what makes it feel arbitrary.

    Is it ionic (has a metal, or NH₄⁺)?
      ├── YES → does the metal have a variable charge (transition metal, Pb, Sn)?
      │         ├── YES → name + Roman numeral, e.g. iron(III) chloride
      │         └── NO  → just name it, e.g. sodium chloride
      └── NO (all nonmetals) → does it start with H (an acid)?
                ├── YES → acid rules (hydro-…-ic, or -ate→-ic / -ite→-ous)
                └── NO  → Greek prefixes, e.g. dinitrogen trioxide

## Ionic compounds

**Binary (two monatomic ions):** cation name (unchanged) + anion name with **-ide**.

    NaCl  → sodium chlorIDE
    K₂S   → potassium sulfIDE
    Mg₃N₂ → magnesium nitrIDE
    Al₄C₃ → aluminum carbIDE

**With a polyatomic ion:** same structure, but use the ion's own name (do NOT add -ide).

    CaSO₄       → calcium sulfate
    NH₄Cl       → ammonium chloride
    Mg₃(PO₄)₂   → magnesium phosphate

⚠ Notice there are **no Greek prefixes** in ionic names. "Ca₃(PO₄)₂" is not "tricalcium
diphosphate" — the charges already fix the ratio, so prefixes would be redundant.

## Variable-charge metals — where the Roman numeral comes from

You **work it out from the anion**, because the compound must be neutral.

**Worked: Fe₂S₃ → ?**

    S is always 2−, and there are 3 of them  →  total negative = 6−
    That must be balanced by 2 Fe  →  each Fe is 3+
    →  iron(III) sulfide

**Worked: Cu₂CO₃ → ?**

    Carbonate is CO₃²⁻ → 2− total
    Balanced by 2 Cu → each Cu is 1+
    →  copper(I) carbonate

**Worked backwards: chromium(VI) oxide → formula?**

    Cr⁶⁺ and O²⁻  →  cross: Cr₂O₆  →  reduce: CrO₃

## -ate vs. -ite (the one Trey's notes call out)

Same element, same charge, **different oxygen count**:

    -ATE = MORE oxygen        -ITE = one FEWER oxygen

| -ate | -ite |
|---|---|
| sulfate SO₄²⁻ | sulfite SO₃²⁻ |
| nitrate NO₃⁻ | nitrite NO₂⁻ |
| phosphate PO₄³⁻ | phosphite PO₃³⁻ |

Mnemonic: **"-ate" is the bigger word and has more oxygen.**

## Acids — two different rules, decided by the oxygen

**Binary acid** (H + one nonmetal, no oxygen): **hydro-** + root + **-ic** + "acid"

    HCl  → hydrochloric acid
    H₂S  → hydrosulfuric acid

**Oxyacid** (H + an oxygen-containing polyatomic ion): drop "hydrogen," then swap the suffix:

    -ate → -ic acid          -ite → -ous acid

    H₂CO₃ (carbonate)  → carbonic acid
    HNO₃  (nitrate)    → nitric acid
    HNO₂  (nitrite)    → nitrous acid

Known exceptions the book flags: **H₂SO₄ is sulfuric** acid (not "sulfic"), **H₂SO₃ is sulfurous**
(not "sulfous").

## Molecular (covalent) compounds — Greek prefixes

Because two nonmetals can combine in many ratios (CO *and* CO₂), the name must state the counts.

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|
| mono- | di- | tri- | tetra- | penta- | hexa- | hepta- | octa- | nona- | deca- |

Name the less-nonmetallic element first, change the second element's ending to **-ide**, and add
prefixes. **Drop "mono-" on the first element only.**

    CO     → carbon monoxide          (not "monocarbon monoxide")
    CO₂    → carbon dioxide
    SF₆    → sulfur hexafluoride
    N₂O₃   → dinitrogen trioxide
    Cl₂O₇  → dichlorine heptoxide
    P₄O₆   → tetraphosphorus hexoxide

## Hydrates

Water locked into the crystal in a fixed ratio. Name the compound, then a Greek prefix + "hydrate";
write it with a centered dot.

    CuSO₄·5H₂O   → copper(II) sulfate pentahydrate
    Na₂CO₃·10H₂O → sodium carbonate decahydrate
    MgSO₄·7H₂O   → magnesium sulfate heptahydrate
`.trim(),
  },
];

/** Every page, in course order. Ch 3-4 (the Exam 2 half) live in conceptsCh3Ch4.js. */
export const CONCEPT_PAGES = [...CH1_CH2_PAGES, ...CH3_CH4_PAGES];

/** Look up the page for a section id ('1-4', '2-6', …). Returns null when none exists yet. */
export const conceptPageFor = (section) =>
  CONCEPT_PAGES.find((p) => p.section === String(section)) ?? null;

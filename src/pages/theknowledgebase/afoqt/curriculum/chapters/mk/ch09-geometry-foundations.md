# Geometry I — angles, lines and triangles

This chapter and the two after it are taught **from the ground up**, not refreshed. You named
geometry as your weakest area, so these three do not assume you will test out of them, and the
test-out gate is set at 5 out of 5 rather than 4 — a lucky four is exactly how a weak area gets
skipped.

There are no formulas in this chapter. It is the set of facts that every later geometry
question quietly assumes you already have.

---

## 1. Angles and the two numbers that matter

Every angle question on this test resolves to one of two totals:

> **Complementary angles sum to 90°.**
> **Supplementary angles sum to 180°.**

The complement of 34° is 56°, because 34 + 56 = 90. The supplement of 34° is 146°, because
34 + 146 = 180.

> **The trap:** these two get swapped more than any other pair in the subtest, and whenever a
> question asks for one of them the *other* one is sitting in the answer choices waiting to be
> picked. **C** before **S** in the alphabet, **90** before **180** on the number line. That
> mnemonic is worth the four seconds it takes to run.

Two more, which are just special cases. Both of them are about what happens when two straight
lines cross, and the figure below shows both at once:

![Two crossing lines, with the vertical pairs and the linear pairs marked](figure:angle-pairs)

- **Vertical angles** are the two angles sitting **diagonally opposite each other** across the
  crossing point — the top and bottom wedges of the X, or the left and right ones. They are
  **always equal.** In the picture, the two 38° angles face each other, and so do the two 142°
  angles.
- **A linear pair** is any two angles sitting **next to each other**, which together make up one
  straight line. A straight line is 180°, so a linear pair **always sums to 180°.** In the
  picture, any 38° and the 142° beside it are a linear pair.

The difference between the two is only *where the second angle is*: straight across the crossing
(equal) or immediately beside it (adds to 180).

A full turn is 360°, a straight line is 180°, a right angle is 90°. Angles are **acute**
(< 90°), **right** (90°), **obtuse** (90–180°) or **reflex** (> 180°).

---

## 2. Parallel lines cut by a transversal

A **transversal** is one straight line cutting across two parallel lines. Where it crosses them it
makes eight angles. Here is the entire section in one rule:

> **Every small angle in the figure is equal to every other small angle. Every large angle is
> equal to every other large angle. And any small one plus any large one makes 180°.**

That is not a rough guide, it is the complete truth about the picture — there are eight angles and
only **two numbers** among them.

![Two parallel lines cut by a transversal, with all eight angles labelled](figure:transversal)

So these items involve almost no arithmetic. If the question text prints 55°, every angle in that figure is
either 55° or `180 − 55 = 125°`, and the only decision left is **which of the two** is being asked
for. Compare the angle you were given with the angle the question is pointing at: if one looks
small and the other looks large, take the supplement. If they look alike, they *are* alike. That
check answers most of these on sight.

Why there are only two values, if it helps to know: the two lines are parallel, so the transversal
meets both at exactly the same slant. One crossing makes a small angle and a large angle, twice
each. The second crossing is the identical situation, so it repeats the same two numbers.

### The relationship names, for when nothing is drawn

Some items describe the pair in words rather than showing a figure — *"if angle 3 and angle 5 are
alternate interior angles…"* — and then the small-versus-large check has nothing to look at. That
is the only reason these names are worth learning:

| Relationship | Where the two angles sit | Value |
|---|---|---|
| **Corresponding** | the same corner at each crossing | **equal** |
| **Alternate interior** | opposite sides of the transversal, both between the parallels | **equal** |
| **Alternate exterior** | opposite sides of the transversal, both outside the parallels | **equal** |
| **Vertical** | straight across from each other at one crossing | **equal** |
| **Same-side interior** (co-interior) | the same side of the transversal, both between the parallels | **supplementary** |
| **Linear pair** | side by side along one straight line | **supplementary** |

Tap the names under the figure above to see where each pair actually lives — the table can tell you
a relationship is "opposite sides, between the parallels" but it cannot show you where that is.

The pattern is worth more than the table: **only the two "same-side" relationships are
supplementary.** Anything with **alternate**, **corresponding** or **vertical** in its name is
equal.

---

## 3. Triangle angles

> **The three interior angles of any triangle sum to 180°.**

Angles of 63° and 48° leave `180 − 63 − 48 = **69°**`.

> **The trap:** 360°. That is the sum for a *quadrilateral*. For any polygon it is
> `(n − 2) × 180` — for a triangle, `(3 − 2) × 180 = 180`.

### The exterior angle theorem

> **An exterior angle equals the SUM of the two remote (non-adjacent) interior angles.**

An **exterior angle** is what you get by extending one side of the triangle past a corner and
measuring the angle outside. **Remote** interior angles are the two corners at the *far* end of
the triangle — the two that the exterior angle does not touch.

![A triangle with one side extended, forming an exterior angle](figure:exterior-angle)

If an exterior angle is 118° and one of its two remote interior angles is 47°, then the second
remote interior angle is `118 − 47 = **71°**`.

Why it works: the exterior angle and the interior angle it touches sit side by side on a straight
line, so they are a linear pair — the touching interior angle is `180 − 118 = 62°`. All three
interior angles total 180°, so the other two corners must total `180 − 62 = 118°`, which is the
exterior angle again. The theorem just lets you skip that detour.

> **The trap:** using the interior angle the exterior angle **touches** (62° in the picture) as
> one of the remote pair. It is the one corner the theorem excludes — that is the entire meaning
> of "remote".

---

## 4. Types of triangle

| Type | Sides | Angles |
|---|---|---|
| **Equilateral** | all three equal | all 60° |
| **Isosceles** | two equal | the two **base angles** (opposite the equal sides) are equal |
| **Scalene** | none equal | none equal |
| **Right** | — | one 90° angle |

**Isosceles is the one that gets asked**, because it needs a step. The **vertex angle** is the
angle between the two equal sides; the **base angles** are the other two, and they are equal to
each other.

![An isosceles triangle with a 40 degree vertex angle and two 70 degree base angles](figure:isosceles-halving)

> A vertex angle of 40° leaves `180 − 40 = 140°` to be **shared equally** by the two base
> angles → each base angle is `140 ÷ 2 = **70°**`.

> **The trap:** answering 140. That is what the two base angles come to **added together**; the
> question asks for **one** of them. Halving is the step the item is testing.

Two facts that pair with this:

- **Equal sides sit opposite equal angles**, and vice versa. So the largest angle faces the
  longest side.
- **Triangle inequality:** any two sides must sum to more than the third. Sides of 3, 4 and 9
  cannot form a triangle.

---

## 5. Similar and congruent

> **Congruent** — same shape **and** same size. Identical.
> **Similar** — same shape, different size. Angles equal, sides **proportional**.

Similarity is what gets tested, because it needs a calculation.

![Two similar triangles drawn to scale, the second three times the size of the first](figure:similar-triangles)

> Triangle ABC ~ triangle DEF. `AB = 6`, `BC = 8`, `DE = 18`. Find `EF`.
>
> Scale factor `= DE/AB = 18/6 = 3`, and it applies to **every** corresponding side.
> `EF = 8 × 3 = **24**`

> ⭐ **The trap:** treating similarity as **additive**. DE is 12 more than AB, so EF must be 12
> more than BC → 20. Wrong. Similar figures scale by a **ratio**, never by a difference. That
> planted wrong answer is among the answer choices every time.

Two consequences worth carrying:

- The **order of the letters names the correspondence.** In `ABC ~ DEF`, A matches D, B matches
  E, C matches F. Match sides by their letters, not by their appearance in the figure.
- If the scale factor for lengths is `k`, the factor for **areas** is `k²`. Double the sides,
  quadruple the area. That comes back in Chapter 10.

---

## 6. Polygons

> **Sum of interior angles = (n − 2) × 180°**
> **Each interior angle of a REGULAR polygon = (n − 2) × 180° / n**
> **Each exterior angle of a regular polygon = 360° / n**

Here `n` is the number of sides. **Regular** means every side and every angle is the same, which
is the only case where dividing by `n` makes sense.

A regular octagon: sum `= 6 × 180 = 1080°`, each interior angle `= 1080 ÷ 8 = **135°**`, each
exterior angle `= 360 ÷ 8 = 45°`.

![A regular octagon with one interior angle and its exterior angle marked](figure:polygon-angles)

Note `135 + 45 = 180` — at every corner, the interior angle and the exterior angle lie along one
straight line, so they are a linear pair. That is the fastest check and the fastest route: work
out the exterior angle (`360/n`, which is easy arithmetic) and subtract it from 180 to get the
interior one.

> **The trap:** the two formulas look alike enough that `360/n` gets used for the *interior*
> angle, and the *sum of all the angles* gets given when **one** angle was asked for. Both of
> those wrong numbers appear in the answer choices. **The exterior angles of ANY polygon always
> total 360°** — walk right round the shape and you have turned through one full circle — and
> that is where `360/n` comes from.

---

## Before you move on

1. Complement 90, supplement 180.
2. On a transversal: only the **same-side** relationships are supplementary.
3. Triangle interior angles sum to 180; an exterior angle equals the two **remote** interiors.
4. Isosceles base angles: subtract the vertex angle from 180, then **halve**.
5. Similar figures scale by a **ratio**, never a difference. Areas scale by `k²`.
6. `(n − 2) × 180` is the **sum**; divide by n for one angle of a regular polygon.

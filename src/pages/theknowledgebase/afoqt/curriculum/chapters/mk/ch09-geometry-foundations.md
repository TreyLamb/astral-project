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

The complement of 34° is 56°. Its supplement is 146°.

> **The trap:** these two are the most-swapped pair in the subtest, and each one's answer is
> always on the other's slate. **C** before **S** in the alphabet, **90** before **180** on the
> number line. That mnemonic is worth the four seconds it takes to run.

Two more, which are just special cases:

- **Vertical angles** — the pair opposite each other where two lines cross. **Always equal.**
- **A linear pair** — two angles side by side on a straight line. **Always supplementary.**

A full turn is 360°, a straight line is 180°, a right angle is 90°. Angles are **acute**
(< 90°), **right** (90°), **obtuse** (90–180°) or **reflex** (> 180°).

---

## 2. Parallel lines cut by a transversal

One line crossing two parallel lines creates eight angles — and only **two distinct values**,
which are supplementary to each other. So every angle in the figure is either *your* angle or
`180 − your angle`.

The entire question is knowing **which**:

| Relationship | Where it is | Value |
|---|---|---|
| **Corresponding** | same corner at each intersection | **equal** |
| **Alternate interior** | opposite sides, between the parallels | **equal** |
| **Alternate exterior** | opposite sides, outside the parallels | **equal** |
| **Vertical** | opposite at one intersection | **equal** |
| **Same-side interior** (co-interior) | same side, between the parallels | **supplementary** |
| **Linear pair** | adjacent, on a straight line | **supplementary** |

The shortcut worth memorising: **only the "same-side" relationships are supplementary.**
Everything with "alternate", "corresponding" or "vertical" in its name is equal.

Visual check that never fails: **all the acute angles are equal, all the obtuse angles are
equal, and any acute plus any obtuse makes 180°.** If your answer is obtuse and the given
angle was acute, you needed the supplement.

---

## 3. Triangle angles

> **The three interior angles of any triangle sum to 180°.**

Angles of 63° and 48° leave `180 − 63 − 48 = **69°**`.

> **The trap:** 360°. That is the sum for a *quadrilateral*. For any polygon it is
> `(n − 2) × 180` — for a triangle, `(3 − 2) × 180 = 180`.

### The exterior angle theorem

> **An exterior angle equals the SUM of the two remote (non-adjacent) interior angles.**

If an exterior angle is 118° and one remote interior angle is 47°, the other is
`118 − 47 = **71°**`.

Why it works: the exterior angle and its adjacent interior angle are a linear pair, so the
interior one is `180 − 118 = 62°`, and the remaining two must total `180 − 62 = 118°` — the
exterior angle. The theorem just skips a step.

> **The trap:** using the **adjacent** interior angle (62° here) as one of the remote ones.
> "Remote" means the two angles that do *not* touch the exterior angle.

---

## 4. Types of triangle

| Type | Sides | Angles |
|---|---|---|
| **Equilateral** | all three equal | all 60° |
| **Isosceles** | two equal | the two **base angles** (opposite the equal sides) are equal |
| **Scalene** | none equal | none equal |
| **Right** | — | one 90° angle |

**Isosceles is the one that gets asked**, because it needs a step:

> A vertex angle of 40° leaves `180 − 40 = 140°` to be **shared equally** by the two base
> angles → each is `140 ÷ 2 = **70°**`.

> **The trap:** answering 140. That is the two base angles *together*; the question asks for
> one of them. Halving is the step the item is testing.

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

> Triangle ABC ~ triangle DEF. `AB = 6`, `BC = 8`, `DE = 18`. Find `EF`.
>
> Scale factor `= DE/AB = 18/6 = 3`, and it applies to **every** corresponding side.
> `EF = 8 × 3 = **24**`

> ⭐ **The trap:** treating similarity as **additive**. DE is 12 more than AB, so EF must be 12
> more than BC → 20. Wrong. Similar figures scale by a **ratio**, never by a difference. That
> distractor is on the slate every time.

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

A regular octagon: sum `= 6 × 180 = 1080°`, each interior angle `= 1080 ÷ 8 = **135°**`, each
exterior angle `= 360 ÷ 8 = 45°`.

Note `135 + 45 = 180` — an interior angle and its exterior angle are always a linear pair. That
is the fastest check, and the fastest route: if you know the exterior angle, the interior one
is `180 −` it.

> **The trap:** the two formulas are close enough that `360/n` gets used for the interior angle,
> and the *sum* gets given when one angle was asked for. Both are on the slate. **The exterior
> angles of ANY polygon always sum to 360°** — that is where `360/n` comes from.

---

## Before you move on

1. Complement 90, supplement 180.
2. On a transversal: only the **same-side** relationships are supplementary.
3. Triangle interior angles sum to 180; an exterior angle equals the two **remote** interiors.
4. Isosceles base angles: subtract the vertex angle from 180, then **halve**.
5. Similar figures scale by a **ratio**, never a difference. Areas scale by `k²`.
6. `(n − 2) × 180` is the **sum**; divide by n for one angle of a regular polygon.

# Coordinate geometry

Five formulas, and four of them are the same idea: **subtract the coordinates**. Almost every
error here is an orientation error — run over rise, x and y swapped, a sign lost on the way
down — which is why the wrong answers are the same numbers arranged differently rather than
different numbers.

A point is `(x, y)`: across first, then up. The four quadrants run counter-clockwise from the
top right, with signs `(+,+)`, `(−,+)`, `(−,−)`, `(+,−)`.

---

## 1. Slope

> **slope = rise / run = (y₂ − y₁) / (x₂ − x₁)**

**Rise** is how far the line goes *up*; **run** is how far it goes *across*. Slope is the rise
divided by the run — how much height you gain per step sideways.

Through `(2, 3)` and `(7, 15)`: `(15 − 3)/(7 − 2) = 12/5`

The next three sections are all the same picture read three different ways, so here it is once.
Switch between the three readings with the buttons underneath it:

![Two points on a grid, with the run and rise drawn as a right triangle](figure:slope-midpoint-distance)

> **The trap:** run over rise. `5/12` is among the answer choices, and so is `−12/5`.
>
> **Subtract in the same order on top and bottom.** If you start with the second point's y,
> start with the second point's x. Swapping one of them flips the sign of the whole slope.

Reading a slope at sight:

| Slope | The line |
|---|---|
| positive | rises left to right |
| negative | falls left to right |
| zero | horizontal |
| undefined | vertical (the run is zero — division by zero) |

That is a real check: if the two points clearly go *down* as you move right, a positive answer
is wrong before you compute anything.

---

## 2. Midpoint

> **midpoint = ( (x₁ + x₂)/2 , (y₁ + y₂)/2 )**

Between `(−3, 8)` and `(9, −2)`: `((−3+9)/2, (8−2)/2) = **(3, 3)**`

> **The trap:** subtracting instead of averaging, or forgetting to halve.
>
> **Midpoint AVERAGES. Slope and distance SUBTRACT.** That is the only thing to keep straight
> in this chapter, and it separates section 2 from sections 1 and 3.

Sanity check: a midpoint must sit **between** the two endpoints in both coordinates. If it does
not, you subtracted.

---

## 3. Distance

> **distance = √( (x₂ − x₁)² + (y₂ − y₁)² )**

This is not a new formula. It is **Pythagoras** on the horizontal and vertical differences —
they are the two legs, and the distance is the hypotenuse.

From `(1, 2)` to `(9, 17)`: differences 8 and 15 → `√(64 + 225) = √289 = **17**`

Which is the 8-15-17 triple from Chapter 11. **Real items are usually built on triples**, so
recognising one saves the whole calculation.

> **The trap:** adding the differences (`8 + 15 = 23`) or forgetting the square root
> (`289`). Both are among the answer choices. Note also that the signs vanish — everything gets squared, so
> a distance is never negative and the order you subtract in does not matter here.

---

## 4. The equation of a line

> **Slope-intercept: y = mx + b** — `m` is the slope, `b` is the y-intercept.

From two points: find `m`, then substitute one point to get `b`.

> Through `(−4, −13)` and `(3, 8)`:
> 1. `m = (8 − (−13)) / (3 − (−4)) = 21/7 = 3`
> 2. `8 = 3(3) + b` → `b = −1`
> 3. `**y = 3x − 1**`

> **The trap:** swapping `m` and `b`. `y = −x + 3` is among the answer choices. In `y = mx + b`, `m`
> multiplies x and `b` stands alone — they are not interchangeable.

Two other forms you may meet:

- **Point-slope:** `y − y₁ = m(x − x₁)` — fastest when you have a point and the slope.
- **Standard:** `Ax + By = C` — the form intercept questions come in.

---

## 5. Intercepts

> **x-intercept:** where the line crosses the x-axis, so **y = 0**.
> **y-intercept:** where it crosses the y-axis, so **x = 0**.

Each one is found by zeroing *the other* variable, which is the piece that gets reversed.

> `4x + 7y = 84`
> - x-intercept: set `y = 0` → `4x = 84` → `x = **21**`
> - y-intercept: set `x = 0` → `7y = 84` → `y = **12**`

![A line crossing both axes, with the x-intercept and y-intercept marked](figure:intercepts)

> **The trap:** computing the y-intercept when the x-intercept was asked. Both numbers are one
> step away and both are among the answer choices. It is a reading question as much as an algebra one.

In `y = mx + b` the y-intercept is just `b`, free of charge.

---

## 6. Parallel and perpendicular

> **Parallel lines have the SAME slope.**
> **Perpendicular lines have NEGATIVE RECIPROCAL slopes** — flip the fraction upside down and
> change the sign.

![Two perpendicular lines with their step triangles drawn](figure:perpendicular-slopes)

The picture makes both halves one motion: the second line's step triangle is the first one's
turned a quarter turn. Turning it swaps the run and the rise (that is the flip) and turns the
climb into a fall (that is the sign).

| Line's slope | Parallel | Perpendicular |
|---|---|---|
| `3` | `3` | `−1/3` |
| `−2/5` | `−2/5` | `5/2` |
| `1` | `1` | `−1` |

The test: two slopes are perpendicular exactly when they **multiply to −1**. `3 × (−1/3) = −1` ✓

> **The trap:** giving the parallel slope, which is the most common miss, or doing only half the
> operation — flipping without negating, or negating without flipping. All three are among the answer choices, which is why "flip **and** change the sign" has to be one action, not two.

---

## 7. Missing vertices

Some items give you three corners of a shape and ask for the fourth. There is no new formula: each
shape has **one fact** that does the whole job. The figure can be squared to the axes or **tilted**,
and the missing corner can be **any** of the four, so name the shape first and use its fact.

**Rectangle with sides parallel to the axes.** Its four corners use only **two different x-values and
two different y-values**. Among the three points you are given, one x appears once and one y appears
once. The missing corner takes **the x that is alone and the y that is alone.**

> Given `(2, 1)`, `(8, 1)` and `(8, 6)`: x = 8 appears twice, x = 2 once; y = 1 twice, y = 6 once.
> The fourth corner is `**(2, 6)**`.

**Parallelogram, and so rectangle, rhombus and square too, tilted or not.** The diagonals **bisect each
other**, so opposite corners have the same sum. For corners lettered in order, the missing one is

> **missing = (the two corners next to it, added) − (the corner opposite it)**

Given A `(1, 1)`, B `(6, 3)`, C `(9, 7)` of parallelogram ABCD: D = A + C − B = `(1 + 9 − 6, 1 + 7 − 3) = **(4, 5)**`.
It works the same on a tilted rectangle: A `(1, 0)`, B `(4, 4)`, C `(−4, 10)` gives D = `(1 − 4 − 4, 0 + 10 − 4) = **(−7, 6)**`.

> **The trap:** subtracting the wrong corner. `B + C − A` and `A + B − C` are both among the answer
> choices, and so is the **center** (where the diagonals cross), which is not a vertex.

**Square from one diagonal.** The center is the midpoint of the diagonal. From the center, a corner is a
step; the next corner is that step **turned a quarter turn**. Turn **counterclockwise** (x, y) → (−y, x), or
**clockwise** (x, y) → (y, −x). With the letters going counterclockwise, the next letter is the counterclockwise turn.

> Square ABCD, counterclockwise, A `(5, 1)`, C `(−1, −3)`. Center `(2, −1)`; A is the step `(3, 2)` from it.
> B = center + (−2, 3) = `**(0, 2)**`, and D = center + (2, −3) = `(4, −4)`.

> **The trap:** turning the wrong way. The other corner is always among the answer choices.

**Symmetric figures: use the mirror.**

- **Isosceles triangle**, equal sides from the apex: the apex is above the **midpoint of the base**. Base from
  `(2, 0)` to `(10, 0)`, apex `(x, 7)`: x = **6**. Half the base *length* (4) is a distance, not a coordinate.
- **Isosceles trapezoid**: symmetric about the vertical line through the middle of its bases. With A `(−1, −1)`,
  B `(7, −1)`, C `(5, 2)`: the mirror line is x = 3, so D is C reflected across it, `**(1, 2)**`.
  Do **not** use the parallelogram rule here: it would give `(−1 + 5 − 7, 2)` = `(−3, 2)`, which is not isosceles.
- **Kite** with a vertical axis of symmetry x = 3 through A `(3, 6)` and C `(3, −1)`: B `(0, 2)` has the mirror
  image D = `**(6, 2)**`. Reflecting across a vertical line keeps y and changes only x.

**Right triangle with a horizontal leg and a vertical leg.** A horizontal side keeps its **y**; a vertical side
keeps its **x**. A `(1, 2)`, B `(7, 9)`, right angle at C, AC horizontal, BC vertical → C = `**(7, 2)**`.

> **The trap:** the other corner of the box, `(1, 9)`, is among the answer choices. Read **which** side
> was called horizontal. If the legs are **equal** (right isosceles), the second leg has the same length as the first.

**Where the diagonals meet.** The midpoint of either diagonal. A rectangle with `(0, −5)` and `(8, −11)`
opposite: `(4, −8)`. Using the other diagonal gives the same point, which is a free check.

**When in doubt, sketch it.** Five seconds with a rough grid shows whether your answer is the corner that
closes the shape or the one on the wrong side.

---

## 8. Reading a triangle from its vertices

**Classify it with squared side lengths.** Use `(Δx)² + (Δy)²` for each side. No square roots are needed:

- two equal → **isosceles**; none equal → **scalene**
- the two smaller add up to the largest → **right** (Pythagoras)

`(0, 0)`, `(3, 4)`, `(−4, 3)`: squared sides 25, 25, 50. Two equal, and 25 + 25 = 50, so **right and isosceles**.

> **A fact worth knowing:** a triangle on whole-number grid points is **never equilateral**, so "equilateral" is
> never the answer for such points.

**Centroid** (where the three medians meet): the **average of the three vertices**, coordinate by coordinate.
`(0, 0)`, `(6, 3)`, `(3, 9)` → `((0 + 6 + 3)/3, (0 + 3 + 9)/3) = **(3, 4)**`.

> **The trap:** dividing by 2 (that is the midpoint) or not dividing at all.

---

## 9. Perimeter and area from coordinates

**Perimeter uses LENGTHS, not steps.** A tilted side with steps (3, 4) has length 5, not 3 + 4.
Parallelogram `(0, 0)`, `(3, 4)`, `(9, 4)`, `(6, 0)`: sides 5 and 6, perimeter **2(5 + 6) = 22**.
Adding the steps (2 × (3 + 4 + 6 + 0) = 26) is the standard wrong answer.

**Area.** When a side is horizontal or vertical, the lengths are differences of coordinates:

| Shape | Area | Note |
|---|---|---|
| rectangle | across × up | `(2, 1)` and `(9, 5)` opposite → 7 × 4 = **28** |
| triangle | **½** × base × height | base horizontal or vertical; height is the **perpendicular** distance |
| parallelogram | base × **vertical** height | **not** base × slanted side |
| trapezoid | **½** (b₁ + b₂) × height | bases 8 and 4, height 3 → **18** |
| rhombus or kite | **½** × d₁ × d₂ | diagonals 10 and 6 → **30** |

For a triangle, where the third vertex sits *along* the base does not change the area. For the parallelogram above,
base 6 and vertical height 4 give **24**, not 6 × 5 = 30.

> **The traps:** forgetting the ½ (it is among the answer choices every time), multiplying the slanted side,
> and multiplying the coordinates instead of subtracting them.

---

## 10. Moving a point: reflections, rotations, translations

For a point (x, y), each move is a rule. Learn the table once:

| Move | New point | For (3, 2) |
|---|---|---|
| reflect across the **x-axis** | (x, −y) | (3, −2) |
| reflect across the **y-axis** | (−x, y) | (−3, 2) |
| reflect across the line **y = x** | (y, x) | (2, 3) |
| reflect across the line **y = −x** | (−y, −x) | (−2, −3) |
| rotate **90° counterclockwise** about the origin | (−y, x) | (−2, 3) |
| rotate **90° clockwise** about the origin | (y, −x) | (2, −3) |
| rotate **180°** about the origin | (−x, −y) | (−3, −2) |
| translate **a** right and **b** up | (x + a, y + b) | |

To **name** the move from a before-and-after pair, test the table on the point: swapping with no sign change is a
reflection in y = x; swapping with one sign change is a quarter turn; changing the sign of only one coordinate is a
reflection in an axis. A rotation keeps the distance from the origin, and a reflection keeps the distance from the mirror.

---

## 11. Collinear points

Points on one line share **one slope**. To find a missing coordinate k, find the slope from the two known points,
then apply it the right number of steps. `(1, 2)`, `(3, 8)`, `(5, k)`: the slope is 6/2 = 3, so one more run of 2 adds 6:
k = 8 + 6 = **14**.

> **The trap:** adding the slope once instead of once **per step**, and using the previous y by itself.

---

## Before you move on

1. Subtract in the **same order** top and bottom, or the slope's sign flips.
2. Midpoint **averages**; slope and distance **subtract**.
3. Distance is Pythagoras: look for a triple before you square anything.
4. In `y = mx + b`, `m` multiplies x. `b` stands alone.
5. x-intercept sets **y** to zero. Read which one was asked.
6. Perpendicular = flip **and** negate; check that the two slopes multiply to −1.
7. Missing corner of an axis-parallel rectangle: the x that is **alone** and the y that is **alone**.
8. Parallelogram, rectangle, rhombus, square: **missing = the two neighbours added, minus the opposite corner**.
9. Symmetric figures (isosceles triangle, isosceles trapezoid, kite): the missing point is a **mirror image**.
10. Triangle type: compare **squared** sides. Centroid: **average**, divide by **3**.
11. Perimeter uses **lengths**, not steps. Area: subtract coordinates; triangles and trapezoids get the **½**.
12. Reflections and rotations are rules on (x, y): know the table.
13. Collinear: one slope, applied **per step**.

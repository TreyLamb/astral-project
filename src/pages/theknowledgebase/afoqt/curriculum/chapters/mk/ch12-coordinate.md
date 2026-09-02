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

## Before you move on

1. Subtract in the **same order** top and bottom, or the slope's sign flips.
2. Midpoint **averages**; slope and distance **subtract**.
3. Distance is Pythagoras — look for a triple before you square anything.
4. In `y = mx + b`, `m` multiplies x. `b` stands alone.
5. x-intercept sets **y** to zero. Read which one was asked.
6. Perpendicular = flip **and** negate; check that the two slopes multiply to −1.

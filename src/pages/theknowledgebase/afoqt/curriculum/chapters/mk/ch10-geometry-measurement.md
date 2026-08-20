# Geometry II — perimeter, area and circles

Every formula in this chapter has **exactly one thing people drop**. Those omissions are not
random — they are the distractors, on every item. Learning the formula and learning what gets
dropped from it are the same job.

Start with the two words, because mixing them up is free marks lost:

- **Perimeter** — the distance **around** the outside. One dimension, so units like cm.
- **Area** — the space **inside**. Two dimensions, so square units, cm².

If the answer choices are in cm² and you computed a perimeter, you can rule out four of them
instantly. **Read the units on the options.**

---

## 1. Rectangles and squares

> **Perimeter = 2(l + w)**  ·  **Area = l × w**

A 24 × 9 rectangle: perimeter `2(33) = 66`, area `216`.

> **The trap:** answering with the area when the perimeter was asked, or the reverse. They are
> always both on the slate. A square is just the case `l = w`: perimeter `4s`, area `s²`.

---

## 2. Parallelograms

> **Area = base × HEIGHT**

The height is the **perpendicular** distance between the two parallel sides — straight up, at
a right angle. It is *not* the slanted side.

> Base 20, slant side 13, perpendicular height 9 → area `20 × 9 = **180**`

> ⭐ **The trap:** `20 × 13 = 260`. The slant side is printed in the stem **precisely so you can
> use it by mistake.** It belongs to the perimeter, never to the area.

Whenever a figure gives you three lengths and the area needs two, ask which one is
perpendicular. That question is the item.

---

## 3. Triangles

> **Area = ½ × base × height**

Base 26, height 11 → `½ × 26 × 11 = **143**`

> **The trap:** forgetting the ½ and answering 286. It is the most common single error in
> geometry, and 286 is always an option.

Same rule about the height as parallelograms: **perpendicular** to the base. In an obtuse
triangle the height can fall *outside* the triangle, which is legal and occasionally drawn
that way to unsettle you.

A triangle is exactly half of the parallelogram with the same base and height — that is where
the ½ comes from, and remembering *why* makes it harder to drop.

---

## 4. Trapezoids

> **Area = ((b₁ + b₂) / 2) × h**

The two parallel sides are the bases; average them, then multiply by the perpendicular height.

Bases 9 and 15, height 8 → `((9 + 15)/2) × 8 = 12 × 8 = **96**`

> **The trap:** forgetting to halve, giving 192.

The formula is less arbitrary than it looks: a trapezoid is a rectangle whose width is the
**average** of the two bases. Once you see it that way, the ÷2 is not something to remember.

---

## 5. Circles

Everything comes from the **radius**. The **diameter** is twice it.

> **Circumference = 2πr = πd**  ·  **Area = πr²**

> ⭐ **The trap, and it is the one to watch for:** a stem that gives you the **diameter**.
>
> "A circle has a diameter of 26. What is its area?"
> Halve it first: `r = 13`, area `= π(13²) = **169π**`.
> Using 26 as the radius gives `676π`, which is on the slate. So is `26π`, which is the
> circumference.

**Halve the diameter before you do anything else.** Write the radius down.

Which formula is which: **area is the squared one**, because area is two-dimensional.
Circumference is a distance, so it is linear in r.

`π ≈ 3.14`, but AFOQT answers are usually left "in terms of π" — meaning you never multiply it
out. If the options all carry a π, do not reach for 3.14.

---

## 6. Arcs and sectors

A sector is a slice of the circle; an arc is the curved edge of that slice. Both are the same
**fraction** of the whole circle, and the fraction is `angle / 360`.

> **Sector area = (θ/360) × πr²**  ·  **Arc length = (θ/360) × 2πr**

A radius-6 circle with a 120° sector:
- Sector area `= (120/360) × 36π = ⅓ × 36π = **12π**`
- Arc length `= (120/360) × 12π = **4π**`

> **The trap:** giving the arc length when the area was asked, or vice versa. Both are on the
> slate. Area comes off `πr²`, arc comes off `2πr` — the same distinction as section 5, applied
> to a slice.

---

## 7. Composite figures

Two moves, and only two: **add the pieces**, or **take the whole and subtract the hole**.

> A circle of diameter 12 is cut out of a 12 × 12 square. What area remains?
>
> - Square: `12² = 144`
> - The circle's diameter is 12, so its **radius is 6** → area `36π`
> - Remaining: `**144 − 36π**`

> **The trap:** using 12 as the radius, giving `144 − 144π` — a negative area, which is
> impossible and worth noticing. Halve the diameter. Again.

Look for the shared dimension: the circle's diameter equalling the square's side is what makes
these figures work, and spotting it is what turns a 60-second problem into a 15-second one.

Common decompositions: a house shape is a rectangle plus a triangle; a running track is a
rectangle plus two half-circles; an L-shape is two rectangles, or one big rectangle minus a
small one.

---

## Formula sheet

| Shape | Perimeter / circumference | Area |
|---|---|---|
| Rectangle | `2(l + w)` | `lw` |
| Square | `4s` | `s²` |
| Triangle | sum of the sides | `½bh` |
| Parallelogram | `2(a + b)` | `bh` (perpendicular h) |
| Trapezoid | sum of the sides | `((b₁+b₂)/2)h` |
| Circle | `2πr` | `πr²` |
| Sector | arc `= (θ/360)2πr` | `(θ/360)πr²` |

## Before you move on

1. Check the **units** on the options — cm vs cm² eliminates half the slate.
2. Parallelogram and triangle heights are **perpendicular**, never the slant side.
3. The ½ on a triangle and the ÷2 on a trapezoid are what get dropped.
4. **Halve the diameter first.** Then square it.
5. Area is the squared formula; circumference and arc length are not.
6. Composite = whole minus hole.

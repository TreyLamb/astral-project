# Geometry II — perimeter, area and circles

Every formula in this chapter has **exactly one thing people drop**. Those omissions are not
random — they are the planted wrong answers, on every item. Learning the formula and learning what gets
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
> always both among the answer choices. A square is just the case `l = w`: perimeter `4s`, area `s²`.

---

## 2. Parallelograms

> **Area = base × HEIGHT**

The height is the **perpendicular** distance between the two parallel sides — straight up, at
a right angle. It is *not* the slanted side.

![A parallelogram with its perpendicular height and its slant side both marked](figure:parallelogram-height)

Drag the figure over and watch what happens: the slant side gets longer and longer, and the area
never changes. That is the proof that the slant side has nothing to do with the area.

> Base 20, slant side 13, perpendicular height 9 → area `20 × 9 = **180**`

> ⭐ **The trap:** `20 × 13 = 260`. The slant side is printed in the question text **precisely so you can
> use it by mistake.** It belongs to the perimeter, never to the area.

Whenever a figure gives you three lengths and the area needs two, ask which one is
perpendicular. That question is the item.

---

## 3. Triangles

> **Area = ½ × base × height**

Base 26, height 11 → `½ × 26 × 11 = **143**`

> **The trap:** forgetting the ½ and answering 286. It is the most common single error in
> geometry, and 286 is always an option.

A triangle is exactly half of the parallelogram with the same base and height — that is where
the ½ comes from, and remembering *why* makes it much harder to drop.

![A parallelogram split along its diagonal into two identical triangles](figure:triangle-is-half)

Same rule about the height as parallelograms: it must be **perpendicular** to the base. In an
obtuse triangle the height can land *outside* the triangle entirely. That is legal, not a
misprint, and it is occasionally drawn that way to unsettle you — so it is worth seeing once
before it turns up in a timed section.

![An obtuse triangle whose height falls outside the triangle](figure:obtuse-height)

---

## 4. Trapezoids

> **Area = ((b₁ + b₂) / 2) × h**

The two parallel sides are the bases; average them, then multiply by the perpendicular height.

Bases 9 and 15, height 8 → `((9 + 15)/2) × 8 = 12 × 8 = **96**`

> **The trap:** forgetting to halve, giving 192.

The formula is less arbitrary than it looks: a trapezoid has exactly the same area as a
**rectangle whose width is the average of the two bases**. The corners it sticks out at the wide
end are the same size as the gaps it leaves at the narrow end, so they cancel out.

![A trapezoid with a rectangle of the average width drawn over it](figure:trapezoid-average)

Once you see it that way, the ÷ 2 stops being something to remember.

---

## 5. Circles

Everything comes from the **radius**. The **diameter** is twice it.

> **Circumference = 2πr = πd**  ·  **Area = πr²**

> ⭐ **The trap, and it is the one to watch for:** a question that gives you the **diameter**.
>
> "A circle has a diameter of 26. What is its area?"
> Halve it first: `r = 13`, area `= π(13²) = **169π**`.
> Using 26 as the radius gives `676π`, which is one of the answer choices. So is `26π`, which is
> the circumference rather than the area.

![A circle of radius 13 next to the much larger circle you get by using the diameter as the radius](figure:radius-diameter)

The picture is worth more than the warning: on paper `676π` looks no stranger than `169π`, but
drawn, the mistake claims a circle **twice as wide and four times the area** of the one the
question described.

**Halve the diameter before you do anything else.** Write the radius down.

Which formula is which: **area is the squared one**, because area is two-dimensional.
Circumference is a distance, so it is linear in r.

`π ≈ 3.14`, but AFOQT answers are usually left "in terms of π" — meaning you never multiply it
out. If the options all carry a π, do not reach for 3.14.

---

## 6. Arcs and sectors

A **sector** is a slice of the circle, like a slice of pizza. An **arc** is only the curved crust
along the outside edge of that slice. Both are the same **fraction** of the whole circle, and that
fraction is `angle / 360` — the slice's angle out of the full turn.

> **Sector area = (θ/360) × πr²**  ·  **Arc length = (θ/360) × 2πr**

(`θ` is just a letter standing for the slice's angle in degrees.)

![A 120 degree sector, with the slice area and the curved arc distinguished](figure:sector-arc)

A radius-6 circle with a 120° sector:
- Sector area `= (120/360) × 36π = ⅓ × 36π = **12π**`
- Arc length `= (120/360) × 12π = **4π**`

> **The trap:** giving the arc length when the area was asked, or vice versa. Both are among the answer choices. Area comes off `πr²`, arc comes off `2πr` — the same distinction as section 5, applied
> to a slice.

---

## 7. Composite figures

Two moves, and only two: **add the pieces**, or **take the whole and subtract the hole**.

> A circle of diameter 12 is cut out of a 12 × 12 square. What area remains?
>
> - Square: `12² = 144`
> - The circle's diameter is 12, so its **radius is 6** → area `36π`
> - Remaining: `**144 − 36π**`

![A circle inscribed in a square, with the leftover corner area shaded](figure:composite-square-circle)

> **The trap:** using 12 as the radius, giving `144 − 144π` — a negative area, which is
> impossible and worth noticing. Halve the diameter. Again.

Look for the **shared dimension**. Here it is the 12: the circle touches all four sides of the
square, so the circle's diameter and the square's side have to be the same length. Spotting that
one shared number is what turns a 60-second problem into a 15-second one.

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

1. Check the **units** on the options — cm vs cm² eliminates half the answer choices.
2. Parallelogram and triangle heights are **perpendicular**, never the slant side.
3. The ½ on a triangle and the ÷2 on a trapezoid are what get dropped.
4. **Halve the diameter first.** Then square it.
5. Area is the squared formula; circumference and arc length are not.
6. Composite = whole minus hole.

# Geometry III — right triangles and solids

The last geometry chapter, and the one with the best return per minute. **Pythagorean triples
and the two special triangles turn a 40-second problem into a 5-second one**, and on a subtest
that gives you 52.8 seconds a question, that is the difference between finishing and guessing
the last four.

---

## 1. The Pythagorean theorem

> **a² + b² = c²**, where **c is always the hypotenuse** — the side opposite the right angle,
> and always the longest.

**Finding the hypotenuse** — add:

> Legs 9 and 12 → `81 + 144 = 225` → `c = **15**`

**Finding a leg** — subtract:

> Hypotenuse 25, one leg 7 → `625 − 49 = 576` → `b = **24**`

> ⭐ **The trap:** adding when you were given the hypotenuse. Running the "find c" version on a
> "find a leg" question produces a number *larger* than the hypotenuse — which is impossible,
> since the hypotenuse is the longest side. **That size check catches it every time.**

And the other one: `c` is `√(a² + b²)`, never `a + b`. `9 + 12 = 21` is on the slate and it is
not even close, but under time pressure it gets marked.

### Triples worth recognising on sight

If two of the numbers match a triple, the third is free — no arithmetic at all.

| Triple | Multiples you will meet |
|---|---|
| **3-4-5** | 6-8-10, 9-12-15, 12-16-20, 15-20-25 |
| **5-12-13** | 10-24-26, 15-36-39 |
| **8-15-17** | 16-30-34 |
| **7-24-25** | — |
| **9-40-41** | — |

The 3-4-5 family is by far the most common. Seeing "9 and 12" and answering **15** without
squaring anything is worth ten seconds, and ten seconds is two more questions attempted.

---

## 2. The two special right triangles

These have **fixed side ratios**, so one side gives you the other two instantly.

### 45-45-90 — the isosceles right triangle

> **x : x : x√2** — the two legs are equal, the hypotenuse is a leg times √2.

Legs of 7 → hypotenuse `**7√2**`. Hypotenuse of 10 → each leg is `10/√2 = 5√2`.

It is half a square cut along its diagonal, which is why the legs match.

### 30-60-90 — half an equilateral triangle

> **x : x√3 : 2x** — shorter leg, longer leg, hypotenuse.

- The **hypotenuse is twice the SHORTER leg.**
- The **longer leg is the shorter leg times √3.**
- Shortest side faces the smallest angle (30°); the √3 side faces the 60°.

Shorter leg 6 → longer leg `6√3`, hypotenuse `12`.

> **The trap:** mixing the two ratios. `√2` belongs to 45-45-90, `√3` to 30-60-90, and each
> one's numbers appear on the other's answer slate. The other half of the trap is doubling the
> **longer** leg — the hypotenuse is twice the **shorter** one.

Rough sizes for sanity: `√2 ≈ 1.41`, `√3 ≈ 1.73`. So in a 30-60-90 with a shorter leg of 6, the
longer leg is about 10.4 and the hypotenuse is 12. Any answer far from that is wrong.

---

## 3. Volume

Every prism and cylinder follows one rule:

> **Volume = (area of the base) × height**

| Solid | Volume |
|---|---|
| Rectangular box | `l × w × h` |
| Cube | `s³` |
| Cylinder | `πr²h` |
| **Cone** | **`⅓πr²h`** |
| **Pyramid** | **`⅓ × (base area) × h`** |
| **Sphere** | **`4/3 πr³`** |

> ⭐ **The trap, and it is the biggest one in solid geometry: the ⅓ on cones and pyramids.**
> A cone is *exactly one third* of the cylinder that contains it — same base, same height. Same
> for a pyramid inside its prism. Forgetting it triples your answer, and the cylinder's volume
> is sitting on the slate waiting for you.

Radius 5, height 12: cylinder `300π`, cone `100π`. Both will be options.

And the diameter trap follows you here: if a stem gives a cylinder's **diameter**, halve it
before squaring.

For the sphere, note the powers: **volume is r³** (`4/3 πr³`) while **surface area is r²**
(`4πr²`). Volume is three-dimensional, so it is cubed. If you cubed something and the question
asked for surface area, you used the wrong one.

---

## 4. Surface area

Surface area is the total area of all the faces — an **area**, so square units.

> **Rectangular box = 2(lw + lh + wh)**

A 5 × 3 × 4 box: `2(15 + 20 + 12) = 2(47) = **94**`

> **The trap:** forgetting the 2 and answering 47. A box has three *pairs* of identical faces —
> front/back, left/right, top/bottom — so every face area is counted twice.

| Solid | Surface area |
|---|---|
| Box | `2(lw + lh + wh)` |
| Cube | `6s²` |
| Cylinder | `2πr² + 2πrh` (two circles plus the wrapper) |
| Sphere | `4πr²` |

The cylinder formula is worth understanding rather than memorising: two circular ends `2πr²`,
plus a rectangle that unrolls from the side whose width is the circumference and whose height
is `h` → `2πrh`.

> **The other trap:** answering with the **volume**. Both are always on the slate, and the units
> tell you which the question wanted — cm² for surface area, cm³ for volume.

---

## Before you move on

1. `c` is the hypotenuse and the longest side. Given it, **subtract**.
2. Recognise 3-4-5 and 5-12-13 multiples on sight — it is pure free time.
3. `√2` is 45-45-90; `√3` is 30-60-90; the hypotenuse doubles the **shorter** leg.
4. Prism and cylinder: base area × height. **Cone and pyramid: × ⅓.**
5. Sphere: volume is cubed `4/3 πr³`, surface area is squared `4πr²`.
6. Box surface area has three pairs of faces — do not drop the 2.
7. Check the units: cm² is a surface, cm³ is a volume.

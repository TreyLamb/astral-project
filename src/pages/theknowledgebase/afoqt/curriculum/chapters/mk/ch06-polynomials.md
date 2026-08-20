# Polynomials and factoring

⭐ **This is the deepest chapter in the math track, and it is deliberate.** Of the ten official
Air Force sample Math Knowledge questions, **two are AC-method factoring** — `6y² − 19y − 7`
and `6a² + a − 12`. That is the hardest algebra the real test asks, and it is over-represented
in the official material relative to everything else.

Factoring is also the only topic here where a wrong answer *looks* completely reasonable until
you multiply it back out. Which is exactly why multiplying it back out is the whole strategy.

---

## 1. Adding and subtracting polynomials

Combine like terms — same variable, same exponent.

`(9x² + 11x + 14) − (4x² + 3x + 6)`

> **The trap:** the minus sign applies to **every** term in the second bracket, not just the
> first. Distribute it before you do anything else:
>
> `9x² + 11x + 14 − 4x² − 3x − 6 = **5x² + 8x + 8**`

Distributing it to the first term only gives `5x² + 14x + 20`, which will be on the slate.
When you see a minus in front of a bracket, rewrite the bracket with every sign flipped
*first*, then combine. It costs three seconds and removes the error entirely.

---

## 2. Multiplying binomials — FOIL

`(x + p)(x + q) = x² + (p + q)x + pq`

**The middle coefficient is the SUM. The constant is the PRODUCT.** Everything in this chapter
comes back to that one line.

`(x + 3)(x − 7) = x² − 4x − 21` — sum `3 + (−7) = −4`, product `3 × (−7) = −21`.

Two patterns worth recognising on sight, because they save the whole FOIL:

| Pattern | Result |
|---|---|
| `(a + b)²` | `a² + 2ab + b²` — **not** `a² + b²` |
| `(a − b)²` | `a² − 2ab + b²` |
| `(a + b)(a − b)` | `a² − b²` — the middle term cancels |

---

## 3. Factoring: always check the GCF first

Before anything else, pull out what every term shares — the number *and* the lowest power of
the variable.

`12x³ + 18x² = **6x²(2x + 3)**`

> **The trap:** pulling out the 6 and forgetting to divide it back out of the bracket, giving
> `6x²(12x + 18)`. Multiply your answer back out. It takes two seconds and it is definitive.

"Factor **completely**" means the GCF comes out first and the bracket may still factor further.

---

## 4. Difference of squares

`a² − b² = (a + b)(a − b)`

`25x² − 4 = **(5x + 2)(5x − 2)**`

Two conditions, both required: **both terms are perfect squares**, and they are **subtracted**.

> A *sum* of squares — `25x² + 4` — does not factor at all over the real numbers. Recognising
> which one you are looking at is the entire question.

---

## 5. Factoring x² + bx + c (leading coefficient 1)

Find two numbers that **multiply to c** and **add to b**. Both conditions, not one.

`x² − 2x − 35` → need product `−35`, sum `−2` → `−7` and `+5` → `**(x − 7)(x + 5)**`

Signs, decided before you hunt:

| c | b | The two numbers |
|---|---|---|
| positive | positive | both positive |
| positive | negative | both negative |
| negative | either | opposite signs; the larger takes b's sign |

> **The trap:** stopping at the first pair that multiplies correctly. `−35` also comes from
> `−35 × 1` and `−1 × 35`, and `(x + 1)(x − 35)` will be on the slate. It multiplies to the
> right constant and gives the wrong middle term.

---

## 6. ⭐ Factoring ax² + bx + c — the AC method

This is the one. When the leading coefficient is not 1, guessing gets expensive fast, so use a
method that terminates.

**Worked, with the official item: `6y² − 19y − 7`**

1. **A times C.** `6 × (−7) = −42`.
2. **Find two numbers that multiply to −42 and add to −19.** → `−21` and `+2`.
3. **Split the middle term using them.** `6y² − 21y + 2y − 7`
4. **Factor by grouping, two terms at a time.**
   `3y(2y − 7) + 1(2y − 7)`
5. **The bracket now repeats — that is the confirmation you did it right.** Pull it out:
   `**(2y − 7)(3y + 1)**`

If the bracket in step 4 does not come out identical, your pair in step 2 was wrong or a sign
slipped. That built-in check is why AC beats guess-and-check under a clock.

**Second official item, same five steps: `6a² + a − 12`**

`6 × (−12) = −72`; two numbers multiplying to −72 and adding to +1 → `9` and `−8`;
`6a² + 9a − 8a − 12`; `3a(2a + 3) − 4(2a + 3)`; → `**(2a + 3)(3a − 4)**`

> ⭐ **The distractor this item is built around: the SWAPPED constants.**
> For `6y² − 19y − 7`, the option `(2y + 1)(3y − 7)` uses the same four numbers, multiplies to
> the same `−7`, and produces the wrong middle term. Checking `a` and `c` will not catch it.
> **Only multiplying out the outer and inner terms will.**

So: **always verify the middle term.** Outer + inner. It is one multiplication and one
addition, and it is the difference between two right answers and one.

---

## Before you move on

1. A minus in front of a bracket flips **every** sign inside it.
2. FOIL: middle is the sum, constant is the product.
3. GCF comes out first, every time.
4. Perfect squares **subtracted** → difference of squares. Added → does not factor.
5. Two numbers must satisfy **both** conditions, not just the product.
6. AC method: multiply a·c, split the middle, group, and confirm the repeated bracket.
7. Check the **middle term** of your answer before you mark it.

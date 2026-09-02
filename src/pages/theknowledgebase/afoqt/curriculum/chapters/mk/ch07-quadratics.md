# Quadratics

Three separate skills that look like one topic. Knowing which one a question is asking for is
most of the speed here — "solve it", "how many solutions" and "where is the vertex" have
different answers and different amounts of work.

A quadratic is anything of the form `ax² + bx + c = 0` with `a ≠ 0`. It has at most two
solutions, also called **roots** or **zeros**.

---

## 1. Solving by factoring

Factor, then set **each** factor to zero. That step is the **zero-product property**: if two
things multiply to zero, at least one of them is zero.

`x² − 2x − 35 = 0`
→ `(x − 7)(x + 5) = 0`
→ `x − 7 = 0` or `x + 5 = 0`
→ `x = **7** or x = **−5**`

> **The trap:** reading the roots straight off the factors as `−7` and `5`. The roots are the
> values that make each factor **zero**, which are the *negatives* of the constants inside.
> Both sign patterns will be among the answer choices.

Check by substituting one root back in. `49 − 14 − 35 = 0` ✓

### Going the other way

If a question gives you the roots and asks for the equation, use:

> `x² − (sum of roots)x + (product of roots) = 0`

Roots 3 and −5 → sum `−2`, product `−15` → `x² + 2x − 15 = 0`.

Note the **minus** in front of the sum in the formula, which is why a sum of `−2` produces a
`+2x`. That sign is the whole question.

---

## 2. The quadratic formula

When nothing factors cleanly, this always works:

> **x = ( −b ± √(b² − 4ac) ) / 2a**

For `2x² + 3x − 4 = 0`: `a = 2, b = 3, c = −4`

- `b² − 4ac = 9 − 4(2)(−4) = 9 + 32 = 41`
- `x = (−3 ± √41) / 4`

Three places people lose it, all among the answer choices:

1. **`−b` means the opposite of b.** If `b = 3`, the numerator starts `−3`. If `b = −3`, it
   starts `+3`.
2. **`−4ac` with a negative c becomes addition.** `−4(2)(−4) = +32`, not `−32`.
3. **The whole numerator sits over `2a`**, not over `a`, and not just the radical part.

Write the three values down before you substitute. Under time pressure that is faster than
re-deriving a sign you rushed.

---

## 3. The discriminant

The part under the radical, `b² − 4ac`, answers "how many real solutions?" **without finishing
the formula.** It is a genuine shortcut, and questions ask for it directly.

| `b² − 4ac` | Real solutions |
|---|---|
| **positive** | **two** |
| **zero** | **one** (a repeated root) |
| **negative** | **none** — the parabola never crosses the x-axis |

For `3x² + 4x + 8 = 0`: `16 − 4(3)(8) = 16 − 96 = −80` → **no real solutions.**

> **The trap:** a sign error on `−4ac` flips the sign of the discriminant, which flips the
> *conclusion*. That is why the answer choices pair wrong numbers with wrong counts — getting
> the arithmetic right and the reading wrong lands you on a different planted wrong answer.

It also tells you something useful: a **positive** discriminant that is a **perfect square**
means the quadratic factors over the integers. If you compute it and it is 49, stop using the
formula and factor.

---

## 4. The vertex

A parabola's turning point sits on its axis of symmetry:

> **x = −b / 2a**

For `y = 3x² − 12x + 5`: `x = −(−12) / (2 × 3) = **2**`. Substitute back for the y-coordinate:
`3(4) − 24 + 5 = −7`, so the vertex is `(2, −7)`.

- `a > 0` → the parabola opens **upward**, and the vertex is the **minimum**.
- `a < 0` → it opens **downward**, and the vertex is the **maximum**.

That is what makes it worth asking: "what is the maximum height" and "what is the vertex" are
the same question.

> **The trap:** dropping the minus sign, or dividing by `a` instead of `2a`. Both answers are
> among the answer choices, and both are the right magnitude.

---

## Before you move on

1. Zero-product: the roots are the **negatives** of the factor constants.
2. Building from roots: `x² − (sum)x + (product)`.
3. `−b` is the opposite of b; `−4ac` with a negative c is an addition; everything is over `2a`.
4. Discriminant positive / zero / negative → two / one / none.
5. Vertex at `−b/2a`; `a`'s sign says maximum or minimum.

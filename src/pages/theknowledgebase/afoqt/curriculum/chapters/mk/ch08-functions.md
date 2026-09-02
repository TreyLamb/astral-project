# Functions and sequences

A short chapter with three narrow traps: a **sign** trap in substitution, a **direction** trap
in composition, and an **off-by-one** trap in sequences.

Nothing here goes beyond what the AFOQT actually asks. There is **no calculus and no
trigonometry** on this test — that is confirmed against the official OATTS curriculum, the
AFPC pamphlet items and every official Knowledge Check. If a practice source is giving you
limits or sine rules, it is not an AFOQT source.

---

## 1. Function notation

`f(x)` is not multiplication. It means "the rule f, applied to x". Substitute the input
everywhere x appears.

> `f(x) = 3x² − 5x + 7`, find `f(−4)`
>
> `3(−4)² − 5(−4) + 7 = 3(16) + 20 + 7 = **75**`

> **The trap:** `(−4)² = +16`, not −16. The parentheses mean the whole number is squared.
> `−4²` without them would be `−16`, because the exponent binds tighter than the minus sign.
> Two of the five options exist purely to catch that.

Substituting a negative? **Write the parentheses in.** Every time.

---

## 2. Composition

`f(g(x))` means: run **g first**, then feed its result into **f**. Work from the inside out,
exactly like parentheses.

> `f(x) = 2x + 5`, `g(x) = x² − 3`, find `f(g(4))`
>
> 1. `g(4) = 16 − 3 = 13`
> 2. `f(13) = 26 + 5 = **31**`

> ⭐ **The trap:** running it backwards. `g(f(4)) = g(13) = 169 − 3 = 166`. Composition is not
> commutative — the two answers are usually nowhere near each other, and both are among the answer choices.

The innermost function goes first. If it helps, read `f(g(x))` right to left.

---

## 3. Domain restrictions

The domain is every input the function can legally take. Two things are illegal:

- **Division by zero** — so a denominator's zeros are excluded.
- **The square root of a negative** — so what is under a radical must be `≥ 0`.

> For what values is `f(x) = (x + 3) / (x² − 2x − 15)` undefined?
>
> Factor the **denominator**: `(x − 5)(x + 3)` → zero at `x = **5** and x = **−3**`.

> **The trap:** solving the numerator. `x = −3` from the top is where the function equals
> **zero**, not where it is undefined. Undefined means the *denominator* died. (They coincide
> here, which is exactly the kind of overlap the test likes.)

---

## 4. Arithmetic sequences

Each term adds a constant **common difference** `d`.

> **nth term = a₁ + (n − 1)d**

> `7, 16, 25, 34, ...` — what is the 13th term?
>
> `d = 9`, so `7 + (13 − 1)(9) = 7 + 108 = **115**`

> ⭐ **The trap:** using `n` instead of `n − 1`, giving 124. Getting to the 13th term takes
> **twelve** steps — the first term is already there before you take any. Count the gaps
> between fence posts, not the posts.

---

## 5. Geometric sequences

Each term multiplies by a constant **common ratio** `r`.

> **nth term = a₁ · r^(n−1)**

> `3, 12, 48, 192, ...` — what is the 6th term?
>
> `r = 4`, so `3 × 4⁵ = 3 × 1024 = **3072**`

Same off-by-one, same reason: five multiplications to reach the sixth term.

**Telling them apart:** subtract consecutive terms — if the difference is constant it is
arithmetic. Divide consecutive terms — if the ratio is constant it is geometric. Arithmetic
grows in a straight line; geometric grows explosively.

---

## Before you move on

1. Wrap a negative input in parentheses before you square it.
2. `f(g(x))` runs g first. Inside out.
3. Undefined comes from the **denominator**; zero comes from the numerator.
4. Both sequence formulas use `n − 1`. Count the gaps, not the terms.

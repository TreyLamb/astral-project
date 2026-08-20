# Fluency and the traps inside it

You do not need to be taught this chapter. You need to be *reminded* of the five places the
AFOQT sets a trap in arithmetic you already know, because at **52.8 seconds a question** a
trap you fall into costs the same as a topic you never learned.

Test out of this one if you can. If you miss a question, the miss tells you which trap still
has your name on it.

---

## 1. Order of operations

**PEMDAS**, with two clarifications that cause most of the damage:

- **Multiplication and division rank equally**, left to right. So `12 ÷ 3 × 2` is `8`, not `2`.
- **Addition and subtraction rank equally**, left to right. So `10 − 4 + 3` is `9`, not `3`.

> **The trap:** `(c − d)²` is **not** `c² − d²`.
> `(12 − 8)² = 4² = 16`. But `12² − 8² = 144 − 64 = 80`.
> An exponent applies to the *result* inside the parentheses, never term by term.

**Worked:** `11 + 7(12 − 8)²`
1. Parentheses → `12 − 8 = 4`
2. Exponent → `4² = 16`
3. Multiply → `7 × 16 = 112`
4. Add → `11 + 112 = **123**`

Working strictly left to right gives 5184. That is not a rounding error; it is a different
question.

---

## 2. Signed numbers and absolute value

`|x|` is the distance from zero, so it is never negative. But the bars bind **before** any
operation outside them.

> **The trap:** `|a − b| − |c − d|` can absolutely be negative.
> `|15 − 27| − |9 − 22| = 12 − 13 = **−1**`.
> The bars make each *piece* positive. They do not make the *answer* positive.

Two sign rules worth saying out loud, because they cause silent errors under time:

- Subtracting a negative adds: `7 − (−3) = 10`.
- A negative squared is positive: `(−5)² = 25`. But `−5² = −25`, because without parentheses
  the exponent binds tighter than the minus sign. This one reappears in Chapter 8 when you
  evaluate `f(−4)`.

---

## 3. Fractions

**Adding or subtracting** needs a common denominator. Multiplying the two denominators always
works and is faster than hunting for the least one when the clock is running.

`4/9 + 7/10` → common denominator 90 → `40/90 + 63/90 = **103/90**`

> **The trap:** `4/9 + 7/10 ≠ 11/19`.
> Adding numerators *and* denominators is never a valid operation on fractions. It is,
> however, always one of the five options.

**Multiplying** needs no common denominator — straight across. **Dividing** means multiplying
by the reciprocal: flip the *second* fraction only.

**Mixed numbers must be converted first.** `2⅓ × 1½` is not `2 × 1` plus `⅓ × ½`.

`2 1/5 × 4 3/5` → `11/5 × 23/5 = 253/25 = **10 3/25**`

Multiplying the whole parts and the fraction parts separately gives `8 3/25`, and it is wrong
because it silently throws away the two cross terms — `2 × 3/5` and `4 × 1/5`.

---

## 4. Decimals and percents

Percent means *per hundred*. Converting is only ever a decimal-point move:

| From | To | Move |
|---|---|---|
| decimal → percent | `0.072 → 7.2%` | two places **right** |
| percent → decimal | `7.2% → 0.072` | two places **left** |
| fraction → percent | `3/8 → 0.375 → 37.5%` | divide, then two right |

> **The trap:** the answer slate will contain `0.072%`, `0.72%`, `72%` and `720%`. Every one
> of them is the right digits with the wrong shift. Counting the places deliberately costs
> two seconds and is the only defence.

---

## 5. Factors and multiples

- **GCF** — the biggest number that divides *both*. It is never larger than the smaller number.
- **LCM** — the smallest number *both* divide into. It is never smaller than the larger number.

`GCF(63, 81)`: both are `9 × something` (`9 × 7` and `9 × 9`), and 7 and 9 share nothing, so
the GCF is **9**.
`LCM(63, 81) = (63 × 81) / 9 = **567**`.

> **The trap:** the two questions look identical and each one's answer is on the other's
> answer slate. Read which word is in the stem before you compute anything. The size check
> above catches it instantly: an answer bigger than both numbers cannot be a GCF.

`a × b = GCF × LCM` always. It is the fastest route to the LCM once you have the GCF.

---

## 6. Turning words into an expression

Official OATTS calls this "Math Terms". It is the first move in most Arithmetic Reasoning
questions too, so it earns its place even though nothing about it is hard.

| Phrase | Means |
|---|---|
| the **sum** of | `+` |
| the **difference** of | `−` |
| the **product** of | `×` |
| the **quotient** of | `÷` |
| **is / equals** | `=` |
| **of** (with a percent or fraction) | `×` |

> **The trap — these three phrases REVERSE the order you read them in:**
> - "5 **less than** twice a number" → `2n − 5`, not `5 − 2n`
> - "8 **subtracted from** a number" → `n − 8`
> - "a number **decreased by** 4" → `n − 4` (this one does *not* reverse — the subject comes first)

And watch what a multiplier is attached to:

- "3 times the **sum** of a number and 6" → `3(n + 6)`
- "3 times a number, **plus** 6" → `3n + 6`

One comma apart, two different expressions.

---

## Before you move on

If you missed anything in the drill, it was almost certainly one of these six:

1. Distributing an exponent across a subtraction
2. Letting an absolute value make the final answer positive
3. Adding denominators
4. Multiplying mixed numbers part by part
5. Shifting a decimal the wrong number of places
6. Answering GCF when the question said LCM

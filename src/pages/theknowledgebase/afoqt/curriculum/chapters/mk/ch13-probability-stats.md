# Probability, counting and statistics

A small chapter with four sharp traps. None of the arithmetic is hard; all of the difficulty is
in reading the stem precisely.

---

## 1. Simple probability

> **P = favourable outcomes / TOTAL outcomes**

A bag with 5 red, 7 blue and 4 green: `P(red) = 5/16`.

> **The trap:** `5/11` — favourable over the **rest**. That is the **odds**, a different
> quantity, and it is on every slate. Probability is part over **whole**; odds are part to part.

Two facts that come up:

- **P(not A) = 1 − P(A)**. When a question asks "at least one", computing "none" and
  subtracting is nearly always faster.
- Every probability sits between 0 and 1. An answer greater than 1 is wrong on sight.

---

## 2. Two events

**Independent** — the first does not change the second. Multiply.
**Dependent** — the first *does* change the second. Multiply, but update the numbers.

> ⭐ **"Without replacement" is the entire question.** Both the numerator and the denominator
> drop by one on the second draw.

> A box holds 6 defective and 9 good parts. Two are drawn **without replacement**. Both
> defective?
>
> - First: `6/15`
> - Second: only 5 defective left, and only 14 parts left → `5/14`
> - `6/15 × 5/14 = 30/210 = **1/7**`

> **The trap:** `6/15 × 6/15` — the *with*-replacement answer, which will be on the slate. Also
> there: dropping the numerator but not the denominator, and vice versa. **Both numbers change.**

For "A **or** B" with mutually exclusive events, add. If they can overlap, add and subtract the
overlap.

---

## 3. Counting: order or no order

This is the only decision in the section. The arithmetic follows from it.

> **Permutation — order MATTERS.** `P(n,r) = n! / (n−r)!`
> **Combination — order does NOT matter.** `C(n,r) = n! / (r!(n−r)!)`

Ask: *if I swap two of the chosen items, is it a different outcome?*

| Situation | Which |
|---|---|
| Committee, team, group, handshakes | **Combination** — a committee of Ann and Bob is the same committee |
| Finishing order, president/VP, seating, a password | **Permutation** — first and second is not the same as second and first |

> Choose 3 from 8 for a committee: `C(8,3) = 8!/(3!5!) = 56`
> Award gold/silver/bronze to 3 of 8: `P(8,3) = 8 × 7 × 6 = 336`

The permutation is always the bigger number — by exactly `r!`, since each combination can be
ordered `r!` ways. `56 × 6 = 336` ✓

> **The trap:** the two are each other's distractors, which is the honest way to write this
> item. The mistake is never the factorials; it is the decision.

Practical note: do not expand the factorials. `P(8,3)` is just `8 × 7 × 6` — start at n and
multiply down r terms. For `C`, do the same and divide by `r!`.

---

## 4. Mean, median and mode

- **Mean** — the average. Add them all, divide by how many.
- **Median** — the middle value **after sorting**.
- **Mode** — the value that appears most often.
- **Range** — largest minus smallest.

> ⭐ **The trap: the median requires SORTING first.** In `35, 41, 23, 60, 12, 56, 22`, the
> middle *as written* is 60. Sorted, it is `12, 22, 23, 35, 41, 56, 60`, and the median is
> **35**. The unsorted middle is always on the slate.

With an even count, the median is the **average of the two middle values**.

### Working backwards from a mean

> **Turn the mean back into a TOTAL first.** That single move solves the whole family.

> The mean of 5 numbers is 62. Four of them are 71, 48, 90 and 55. What is the fifth?
>
> - Total must be `62 × 5 = 310`
> - The four known sum to `264`
> - The fifth is `310 − 264 = **46**`

---

## 5. Weighted average

> **The average of two averages is only correct when the groups are the same size.**

> A class of 40 averaged 75; another of 50 averaged 93. Combined average?
>
> `(40 × 75 + 50 × 93) / 90 = (3000 + 4650) / 90 = 7650 / 90 = **85**`

> ⭐ **The trap:** `(75 + 93)/2 = 84`. It is close enough to look right and it is wrong, because
> the bigger class pulls the average toward its own. The answer must land nearer the average of
> the **larger** group — here nearer 93 than 75, and 85 is.

That "which side should it lean?" check catches the error without redoing the arithmetic, and
it is the fastest tool in this section.

---

## Before you move on

1. Probability is part over **whole**. Part over rest is odds.
2. "Without replacement" changes **both** numbers on the second draw.
3. Order matters → permutation. It is the bigger number, by `r!`.
4. **Sort before you take a median.**
5. A mean is a total in disguise — multiply it back out.
6. A weighted average leans toward the larger group.

# Percent in context

Math Knowledge asks "what is 30% of 240?" Arithmetic Reasoning buries the same arithmetic under a
paragraph whose real question is WHICH NUMBER IS THE BASE - and then, more often than not, asks
for a quantity one step past the one the percent actually hands you.

The recurring trap throughout this chapter is the STAGE-ONE RESULT: a real number, correctly
computed, that answers the question you stopped reading halfway through.

---

## 1. Percent of a percent

When a stem applies one percent, and then applies a second percent to the RESULT of the first,
the second base is not the original number - it is whatever the first stage produced.

> A squadron has 400 airmen, of whom 25% are qualified on a new system. If 80% of those qualified
> airmen have completed the annual review, how many of them have NOT completed it?

Stage 1: `25%` of `400` = `100` qualified airmen. Stage 2: the base for the second percent is
that 100, not the original 400 - and the question asks for the ones who have NOT completed the
review, which is `20%` of `100` = `20`.

**The trap:** stopping at stage one and reporting 100, or taking the second percent of the
ORIGINAL 400 instead of the 100 the first stage produced. Both are common, and both are correctly
computed answers to a question that was not asked. Work the stages strictly in order, and take
each new percent of whatever number the PREVIOUS sentence produced.

---

## 2. Percent back to a count

A score expressed as a percentage and a score expressed as a raw count are different units, and
they only happen to be the same number when a test has exactly 100 questions on it.

> A test has 40 questions, all worth the same. How many questions can be answered incorrectly and
> still leave a score of 90%?

`90%` of `40` = `36` correct, so `40 - 36 = 4` can be missed.

**The trap:** reporting `100 - 90 = 10` as the answer. Ten is the percentage of questions missed,
not the NUMBER of questions missed - on a 40-question test those are different numbers, and only
one of them is a count of actual questions. Convert the percentage to a count first (find the
number correct, then subtract from the total), and only trust "the percentage IS the count" on a
test that happens to have exactly 100 items.

---

## 3. Discount as an equivalence

Some items describe a purchase that is PART full price and PART discounted, and ask for the whole
thing expressed as a single count of full-price items.

> You buy 3 shirts at full price and 4 more shirts at 25% off. In total, you have paid the
> equivalent of how many shirts at full price?

At 25% off you still pay 75% of the price, so each discounted shirt is worth 0.75 of a full-price
one: `4 × 0.75 = 3` full-price-equivalent shirts. Add the 3 bought outright: `3 + 3 = 6`.

**The trap:** applying the discount to the WHOLE purchase, all 7 shirts, instead of only the 4
that were actually discounted - or the reverse, counting every shirt at full price and ignoring
the discount entirely. The percentage only touches the items the stem says were discounted; the
full-price items pass through untouched, and both groups get added at the end, not before.

---

## 4. Tax and tip, forwards and backwards

Sales tax and a restaurant tip are both "the price PLUS a percent of the price" - and the test
asks you to run that relationship in both directions.

> A jacket costs $84 including 5% sales tax. What was the price before tax?

The total is the pre-tax price times `1.05`, so to undo it you DIVIDE: `$84 / 1.05 = $80`.

**The trap:** taking 5% OFF the total instead - `$84 × 0.95 = $79.80` - which uses the total as
the base when the tax was actually 5% of the smaller, pre-tax price. Check by going forward:
`$80 + 5%` should land back on `$84`, and it does; `$79.80 + 5%` does not get you back to `$84`.

Splitting a bill with a tip runs the same relationship the other direction - add the percent
first, then divide by the number of people:

> Four colleagues share a meal costing $120 before a 20% tip. If they add the tip and split the
> total evenly, how much does each person pay?

`$120 × 1.20 = $144`, and `$144 / 4 = $36` each. The trap here is splitting the ORIGINAL bill
first and forgetting the tip - `$120 / 4 = $30` - which is a real number and simply the wrong
one, because it never accounts for the tip at all.

---

## 5. A fall followed by a rise

Percent changes apply to whatever amount is THERE AT THE TIME, which means two changes in a row
MULTIPLY - they never simply add or cancel.

> A company employs 200 people. Staffing is cut by 20%, and the following year the reduced staff
> is increased by 20%. How many people does it employ then?

`200 × 0.80 = 160` after the cut, then `160 × 1.20 = 192` after the rise - not back to 200.

**The trap:** assuming a 20% cut and a 20% rise cancel out, or adding the two percentages as a
net `0%` change. The rise is 20% of the REDUCED number, 160, which is a smaller base than the
original 200 - so the recovery is always smaller than the drop that preceded it. The only way a
percent decrease and a percent increase truly cancel is if the second one is bigger, and by more
than you would guess.

The same rule keeps working past two changes - three years of growth is three multiplications,
not one bigger one. That is exactly what **compound interest** is: `$2,000` at 10% compounded
annually is `2000 × 1.10 × 1.10 = $2,420` after two years, because year two's interest is charged
on `$2,200`, not on the original `$2,000`. **Simple** interest would charge 10% of the original
`$2,000` each year and reach only `$2,400`. Watch for the word "compounded" - it is the whole
question, and the simple-interest figure will be sitting on the answer sheet next to the right
one.

---

## Before you move on

| Question type | Do this |
|---|---|
| A percent applied to a percent's result | Take each stage's percent of the PREVIOUS stage's answer, never the original |
| A test score as a percent | Convert to a count of correct answers first, then subtract from the total |
| Part of a purchase discounted, part full price | Discount only the discounted items; add the untouched full-price ones after |
| "Price including tax" and you need the pre-tax price | DIVIDE by (1 + rate), don't subtract the rate from the total |
| A tip or markup to be split among people | Add the percent to the base FIRST, then split |
| A percent decrease followed by a percent increase | Multiply the two factors in sequence - they never cancel evenly |

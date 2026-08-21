# Averages, totals and combined work

One idea carries this whole chapter: **an average is a disguised total.** The definition runs
both ways, and the useful direction is the one almost nobody reaches for on their own:

> average = total / count, so **total = average × count**

Recover the total first, and every question in this chapter turns into one subtraction, one
weighted sum, or one balance point. Skip that step and you are guessing - because averages do not
combine by averaging. Two groups of different sizes, two categories of a signed total, and two
workers of different speeds all weight their parts differently, and in every case the naive mean
is a plausible, wrong number sitting on the answer sheet.

---

## 1. An average is a disguised total

> The average of 4 numbers is 15. Three of them are 9, 14, and 18. What is the fourth?

Turn the average into a total first: `15 × 4 = 60`. The three known values add to `41`, so the
missing one is `60 - 41 = 19`.

**The trap:** assuming the missing value must equal the average itself, or averaging only the
known values instead of using ALL of them. There is no shortcut through the average - the
missing value only happens to equal 15 in the special case where everything else already averages
15.

The same "recover the total" move handles a harder version: raising an average that already
exists.

> After 3 tests your average is 80. What must you score on the next test to bring your average up
> to 84?

Work in totals throughout. You currently hold `3 × 80 = 240` points. To average 84 over 4 tests
you need `4 × 84 = 336` points total. The score required is the difference: `336 - 240 = 96`.
Note that 96 is well above the 84 you are aiming for - the 4-point gap between 80 and 84 has to
be made up on EVERY one of the previous three tests as well as the new one, not just the new
one.

---

## 2. Averages don't combine by averaging

> One class of 10 students averaged 70 on an exam, and a second class of 30 students averaged 90.
> What was the average for both classes combined?

Go back to totals: `10 × 70 = 700` points and `30 × 90 = 2,700` points, so `3,400` points across
`40` students gives `3,400 / 40 = 85`.

**The trap:** averaging the two averages - `(70 + 90) / 2 = 80` - which is on the answer sheet
and is wrong whenever the groups differ in size. The true combined average is pulled toward
whichever group has MORE people in it - here that is the class of 30, which is why the answer
lands much closer to 90 than to the simple midpoint of 80.

---

## 3. A net total from signed changes

Wins and losses, deposits and withdrawals, gains and deficits - any time a total is built from
values that count in OPPOSITE directions, each one keeps its own sign through the whole
calculation.

> A team won 6 games by an average of 12 points and lost 4 games by an average of 7 points. Over
> all 10 games, how many more points did the team score than its opponents?

The wins contribute `+6 × 12 = +72`, and the losses contribute `-4 × 7 = -28`. The net is
`72 - 28 = 44`.

**The trap:** adding the two figures instead of subtracting - `72 + 28 = 100` - which treats
points given away in a loss as though they helped the team's total. Points conceded count AGAINST
the net, not toward it; each average only applies to its own set of games, and the sign has to
survive to the final step.

---

## 4. Mixture problems: balance around the target

A blend of two prices settling on a target price is a balance problem, not an averaging problem -
whichever ingredient is FARTHER from the target needs LESS of it, not more.

> Coffee worth $4 a pound is mixed with 6 pounds of coffee worth $9 a pound. How many pounds of
> the cheaper coffee are needed to make a blend worth $7 a pound?

The $9 coffee sits $2 ABOVE the $7 target, and the $4 coffee sits $3 BELOW it. The mixture
balances when those two distances pull equally: `6 pounds × $2 = x pounds × $3`, so
`x = 12/3 = 4` pounds.

**The trap:** assuming the answer is however many pounds happen to already be given (6), which
quietly assumes an equal-parts blend. The two distances from the target - here $2 and $3 - are
not equal, so the amounts needed are not equal either: the ingredient closer to the target ($9
coffee, only $2 away) needs MORE weight on the other side to balance it, which is why 6 pounds of
the $9 coffee only takes 4 pounds of the $4 coffee to balance, not 6.

---

## 5. Combined work: add rates, never times

Two workers (or two machines, or two pipes) doing the same job together finish FASTER than either
one alone - and the arithmetic that gets there adds their RATES, not their times.

> Working alone, one printer can finish a job in 6 hours and a second printer can finish the same
> job in 3 hours. Working together, how long does the job take?

The first printer does `1/6` of the job an hour, and the second does `1/3`. Together:
`1/6 + 1/3 = 1/2` of the job per hour, so the job takes `1 ÷ (1/2) = 2` hours.

**The trap:** averaging the two times - `(6 + 3) / 2 = 4.5` hours - which is slower than the
faster printer acting alone, and cannot possibly be right: adding a second worker can only speed
a job up, never slow it down. That sanity check is free and eliminates most of a slate at a
glance - any answer at or above the faster worker's solo time (3 hours here) is wrong before you
compute anything.

---

## Before you move on

| Question type | Do this |
|---|---|
| A known average, one missing value | Multiply average × count to get the total FIRST, then subtract the knowns |
| A target average not yet reached | Find the total needed at the target, subtract the total you already have |
| Two groups of different sizes, each with its own average | Weight by group size - never average the two averages |
| Wins/losses, gains/deficits, or any signed total | Keep the sign through the whole calculation; losses subtract, wins add |
| A blend of two prices aimed at a target | Balance the two DISTANCES from the target, not the two raw amounts |
| Two workers/machines finishing one job together | Add their rates (1/time), then invert - never average the two times |

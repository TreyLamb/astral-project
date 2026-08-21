# Proportion, scale and similar figures

Math Knowledge hands you `3/7 = x/28` already written down and asks you to solve it. Arithmetic
Reasoning hands you a paragraph and asks you to notice a proportion is in there at all - and then
to set it up so it does not come out upside down.

One habit fixes almost every error in this chapter: **write the units into the fraction.**

> pounds / crates = pounds / crates

not

> pounds / crates = crates / pounds

Match units on top with units on top, and units on the bottom with units on the bottom, and an
inverted setup becomes visible before you multiply - instead of after, when it is just a wrong
answer that looks exactly as clean as the right one.

---

## 1. Scaling a quantity written in prose

> 4 identical crates weigh 60 pounds. At that rate, how much do 7 crates weigh?

Find ONE first: `60 / 4 = 15` pounds per crate. Then `7` crates weigh `7 × 15 = 105` pounds.

**The trap:** treating the jump from 4 crates to 7 as an ADDITION rather than a scaling. Going
from 4 to 7 crates is a multiplication by 7/4 - adding the difference in crates (3) as though
each extra crate weighed exactly one pound gives `60 + 3 = 63`, a number with no connection to
the actual weight of a crate. The same idea scales a recipe, a work order, or any other "N of a
thing gives this much, how much does M of it give" - find the unit amount, then multiply by the
new count.

---

## 2. Similar figures: matching ratios

Two objects lit by the same sun cast shadows in the same proportion as their heights - that
single fact is "similar figures" in its most common AFOQT form.

> At the same time of day, a flagpole casts a shadow 40 feet long, and a 5-foot fence post beside
> it casts a shadow 8 feet long. How tall is the flagpole?

Height and shadow are in the same ratio for both objects: `height / shadow = 5 / 8` for the fence
post, and it must hold for the flagpole too. So `flagpole height / 40 = 5 / 8`, giving
`flagpole height = 40 × 5 / 8 = 25 feet`.

**The trap:** multiplying the two given lengths together and never dividing - `40 × 5 = 200` is a
real product, and it is not a height. Writing height OVER shadow on both sides of the equation,
as in section rule above, is what stops that slip: the units line up, and a leftover
multiplication stands out immediately.

---

## 3. Reading a fractional scale drawing

A scale like "one quarter inch to the foot" means one thing on paper stands for a much bigger
thing in reality - and the smaller the fraction, the BIGGER the real object is per inch drawn.

> On a floor plan drawn to a scale of one quarter inch to the foot, a wall measures 3 inches on
> the plan. How long is the actual wall?

One quarter inch stands for one foot, so every whole inch on the plan stands for 4 feet. Three
inches is `3 × 4 = 12` feet.

**The trap:** going the wrong direction - dividing by 4 instead of multiplying, or reading the
drawn inches straight off as feet. This is the one kind of scale where the real object is BIGGER
by the denominator of the fraction: "one quarter inch to the foot" means the drawing shrinks
everything by a factor of 4, so coming back out to the real world, you multiply by that same 4.

---

## 4. Converting through a chain of rates

Some items make you cross TWO unit conversions in one problem, and each crossing is a separate
chance to invert something.

> A leaking tank loses 5 quarts of water every hour. How many GALLONS does it lose in 2 days?

Run the chain one link at a time, converting as you go: `5 quarts/hour × 24 hours/day × 2 days =
240 quarts`, and then convert the final unit: `240 / 4 = 60 gallons`.

**The trap:** stopping after only one of the conversions - working out the quarts lost per day
and forgetting to also convert quarts to gallons, or converting to gallons but forgetting the
24-hours-in-a-day step. A quick size check catches an inverted step: a gallon is BIGGER than a
quart, so the gallon figure has to come out SMALLER than the quart figure, not larger.

---

## 5. Best buy: compare by the unit, not the total

Comparing two differently-sized packages means reducing both to the same unit FIRST - comparing
the sticker prices compares two different quantities and answers nothing.

> A bag of rice comes in two sizes: 16 ounces for $3.20, or 24 ounces for $4.32. Which is the
> better deal, and by how much per ounce?

Reduce both to a price per ounce: `$3.20 / 16 = 20 cents/ounce`, and `$4.32 / 24 = 18
cents/ounce`. The 24-ounce bag is cheaper, by `20 - 18 = 2 cents` an ounce.

**The trap:** comparing the two sticker totals ($3.20 vs. $4.32) and concluding the smaller bag
is the deal because it costs less overall. The bigger package costs more in total and can STILL
be the better buy - total price says nothing until it is divided down to a common unit.

---

## Before you move on

| Question type | Do this |
|---|---|
| "N of a thing weighs/costs/measures X, what about M of them?" | Find the amount for ONE, then multiply by the new count |
| Two similar objects (shadows, heights, distances) | Write height/shadow (or the matching pair) on BOTH sides of the ratio |
| A fractional scale ("1/4 inch to the foot") | Multiply the drawn measurement by the scale's denominator |
| A rate crossing two unit changes | Convert one link at a time; check the final unit is bigger or smaller as expected |
| Two package sizes at two prices | Reduce both to a price per unit before comparing anything |

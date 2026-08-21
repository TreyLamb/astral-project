# Rate, time and distance

One formula runs this whole chapter:

> **distance = rate × time**

Every question here is that formula solved for a different letter, or applied to two vehicles at
once. The arithmetic is short. What gets people is three specific traps, and each has its own
section below.

---

## 1. One formula, three unknowns

Rearranged, `d = rt` gives you `r = d / t` and `t = d / r`. Which one you need depends only on
which letter the question leaves out.

> A truck drives at a steady 50 miles per hour for 2 hours 30 minutes. How far does it travel?

Convert the time to hours BEFORE you multiply: 30 minutes is 30/60 = 0.5 of an hour, so the time
is 2.5 hours and the distance is `50 × 2.5 = 125 miles`.

**The trap:** reading "2 hours 30 minutes" as the decimal 2.30 and multiplying by that instead.
An hour has 60 minutes in it, not 100, so 30 minutes is 0.5 of an hour, not 0.30 of one. That one
substitution - minutes over 60, never minutes over 100 - is the single most common error in this
chapter, and it runs in both directions:

> A van covers 150 miles at a steady 40 miles per hour. How long does the trip take?

`150 / 40 = 3.75 hours`. Now convert the decimal back properly: 0.75 of an hour is
`0.75 × 60 = 45 minutes`, so the trip takes 3 hours 45 minutes - not "3 hours 75 minutes," which
is what you get by reading the decimal digits straight off as minutes. Whichever direction you
are converting, the rule is the same: minutes divide (or multiply) by 60, never by 100.

---

## 2. Slower means longer

Distance held fixed, speed and time move in OPPOSITE directions: slow down and the trip takes
longer, speed up and it takes less time.

> Driving at 40 mph, your commute takes 30 minutes. Driving the same route at 20 mph, how long
> does it take?

The distance does not change - it is 20 miles either way. At half the speed, the trip takes
DOUBLE the time: 60 minutes.

**The trap:** scaling the time by the speeds in the same direction they went, which makes the
slower trip come out shorter. The sanity check costs nothing and catches it every time: if the
speed goes down, the time answer MUST go up. Check that direction before you check the
arithmetic - it eliminates any answer that has the relationship backwards, no calculation
required.

---

## 3. Average speed is not the average of the speeds

This is the one place in the chapter where the intuitive answer is a real number on the answer
sheet, and it is wrong.

> A cyclist rides out to a job site at 30 mph and back along the same route at 10 mph. What is
> the average speed for the whole round trip?

It is tempting to average 30 and 10 to get 20. That is not what "average speed" means. Average
speed is **total distance over total time**, and because the return leg is slower, you spend
MORE time on it - so the true average leans toward the slower speed, not the midpoint.

Pick a convenient one-way distance, say 30 miles: the outbound leg takes `30 / 30 = 1 hour` and
the return takes `30 / 10 = 3 hours`. That is `60 miles` in `4 hours`, an average of `15 mph` -
well below the naive mean of 20. The more time a leg takes, the more it pulls the true average
toward its own speed, which is exactly the weighting the simple mean leaves out.

---

## 4. Consumption and other per-something rates

"Miles per gallon," "gallons per hour," "pages per minute" - all of these are the same
relationship as `d = rt` wearing different units, and they solve the same way: find the amount
per ONE unit, then scale.

> A generator uses 3 gallons of fuel every 8 hours. How many hours can it run on 12 gallons?

`12` gallons is `4` times `3` gallons, so the generator runs `4 × 8 = 32 hours`. Equivalently,
set it up as a proportion with matching units on top: `3 gal / 8 hr = 12 gal / x hr`, and solve
for `x`. Whichever way you reach it, check the direction of the scaling makes sense before you
commit - more fuel should mean more hours, not fewer.

---

## 5. Two vehicles and the gap between them

When two vehicles move toward each other, the gap between them closes at the SUM of their
speeds - each one is eating into the distance from its own side at once.

> Two trucks leave the same depot at the same time and drive in OPPOSITE directions, one at
> 45 mph and one at 55 mph. After how many hours are they 300 miles apart?

The gap grows by both speeds combined every hour: `45 + 55 = 100 miles per hour`, so
`300 / 100 = 3 hours`.

**The trap:** subtracting the speeds instead of adding them. Subtracting answers a DIFFERENT
question - it is the closing rate for two vehicles travelling the SAME direction, one catching
up to the other, and it would give a much larger and wrong number of hours here. The single word
"opposite" (or "toward each other," or "apart") versus "same direction" (or "catching up") is
the whole item; read it before you decide whether to add or subtract.

---

## Before you move on

| Question type | Do this |
|---|---|
| Time given as hours and minutes | Convert minutes over 60, never over 100, before multiplying |
| A decimal answer for time | Convert the decimal part back to minutes by ×60 |
| Same distance, a different (usually slower) speed | Check the direction first: slower speed always means more time |
| "Average speed" over two legs at different speeds | Use total distance ÷ total time - never the mean of the two speeds |
| "Per" phrased any other way (fuel, pages, output) | Find the amount for ONE unit, then scale by the ratio |
| Two vehicles, opposite directions | ADD the speeds to get the closing rate |
| Two vehicles, one catching the other | SUBTRACT the speeds instead |

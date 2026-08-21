# Counting, area and volume in words

Two families make up this chapter, and they look unrelated until you notice they share a habit:
both punish you for computing a real, correctly-worked quantity and then reporting the wrong one.
Counting problems hand you the number of GAPS when the question wants the number of things
standing at the ends of them. Area and volume problems hand you a clean conversion that is off by
a squared or cubed factor rather than the plain one you would guess.

The geometry in this chapter is the Air Force's own - area and volume word problems sit in its
Arithmetic Reasoning syllabus, not its Math Knowledge one, which is why they live here rather than
alongside the shapes chapters in the math track.

---

## 1. Fenceposts: counting events, not gaps

Divide a length or a duration by a spacing, and what you get back is the number of GAPS between
things - never the number of things itself.

> You must take a meter reading once every 20 minutes during a 4-hour shift, starting with one
> reading at the very beginning. How many readings do you take?

4 hours is 240 minutes, and `240 / 20 = 12`. That 12 is the number of INTERVALS between readings,
not the number of readings. Because a reading is taken at the very start as well, there is one
more reading than interval: `12 + 1 = 13`.

**The trap:** stopping at the division and reporting 12. Picture four fence posts holding up
three panels - dividing the fence's length by the panel width always gives you the panel count,
one fewer than the posts.

That "always add one" habit is itself a trap the moment the run closes into a loop, because a
closed loop has no ends to add an extra post to:

> A circular path 120 feet around has lights spaced every 15 feet. How many lights are there?

`120 / 15 = 8` gaps, and on a closed loop the last gap connects back to the first light, so there
is no extra one to add: the answer is 8, not 9. Compare a STRAIGHT run of the same length and
spacing, with a light at each end - that one WOULD be `8 + 1 = 9`. The only way to tell which rule
applies is to read whether the run is open or closed; there is no formula that covers both, and
memorizing "always add one" gets the loop case backwards.

---

## 2. A missing side from a perimeter

Perimeter problems in this chapter give you the total distance around a rectangle and one side,
and ask for the other.

> A rectangular workshop is 40 feet long and has a perimeter of 130 feet. How wide is it?

`Perimeter = 2L + 2W`, so `130 = 2(40) + 2W = 80 + 2W`, giving `2W = 50` and `W = 25` feet.

The fastest route is to halve the perimeter first: half of 130 is 65, and that half is exactly ONE
length plus ONE width, so the width is `65 - 40 = 25`.

**The trap:** forgetting the final halving - subtracting `80` from `130` and stopping at `50`,
which is TWICE the actual width. `2 × 40 = 80` accounts for both long sides; what remains, `50`,
is both copies of the width added together, not one copy of it.

---

## 3. Area in words: the squared conversion

A floor measured in feet but priced or sold by the square yard hides a trap in the conversion
factor itself: three feet make a yard, but the conversion for an AREA is that factor SQUARED, not
the plain factor.

> The floor of a hangar bay measures 24 feet by 15 feet. Carpet is sold by the square yard. How
> many square yards are needed to cover it?

Area first: `24 × 15 = 360` square feet. A square yard is 3 feet BY 3 feet, so it is `3 × 3 = 9`
square feet - not 3. `360 / 9 = 40` square yards.

**The trap:** dividing by 3 instead of 9. That gives 120, a number that looks entirely
reasonable and is exactly three times too big, because it applies the LINEAR conversion factor
(3 feet to a yard) to a quantity that is already two-dimensional. Whenever a length conversion is
being applied to an area, square the factor first.

---

## 4. Volume in words: three dimensions, then a rate

Volume problems in this chapter go two steps: multiply all THREE dimensions to get a volume, then
apply a given conversion rate to turn that volume into a different unit, such as gallons.

> A storage bin measures 4 feet by 3 feet by 5 feet. If one cubic foot holds about 7.5 gallons,
> approximately how many gallons does it hold when full?

Volume needs all three measurements multiplied together: `4 × 3 × 5 = 60` cubic feet. Then apply
the rate: `60 × 7.5 = 450` gallons.

**The trap:** using only two of the three dimensions - multiplying just the length and width, as
though the question were asking for an area - which produces a real number that is simply missing
a whole dimension. A second check is free: a gallon is much smaller than a cubic foot, so the
gallon figure has to come out LARGER than the cubic-foot volume, never smaller or equal to it.

---

## 5. Costing a floor: combine the steps in order

The last piece of this chapter chains sections 3 and 4's habits with an ordinary multiplication -
convert the area correctly, price it, then add anything that is charged as a flat fee rather than
by the square yard.

> The floor of a briefing room measures 18 feet by 12 feet. Carpet costs $18 per square yard, and
> fitting is a flat $75. What is the total cost?

Area: `18 × 12 = 216` square feet. Convert, dividing by NINE: `216 / 9 = 24` square yards. Price
the carpet: `24 × $18 = $432`. Add the flat fitting charge: `$432 + $75 = $507`.

**The trap:** pricing every square FOOT at the square-yard rate instead of converting first -
`216 × $18` - which prices nine times too much carpet and produces by far the largest number on
the page. The other common miss is doing the conversion and the pricing correctly and then simply
forgetting to add the flat fee at the end; a flat charge never scales with area, so it always
comes in as one last addition, never folded into the per-yard rate.

---

## Before you move on

| Question type | Do this |
|---|---|
| Events/posts at a fixed spacing, over an OPEN run or duration | Divide for the gaps, then add ONE for the ends |
| Events/posts spaced around a CLOSED loop | Divide for the gaps - that count is already the answer, add nothing |
| A perimeter and one side given | Halve the perimeter first (that's one length plus one width), then subtract the known side |
| A floor area needed in square yards | Divide the square-foot area by 9, never by 3 |
| A volume in a different unit (gallons, etc.) | Multiply all THREE dimensions first, then apply the given rate |
| A total cost with a per-area rate and a flat fee | Convert and price the area first, then add the flat fee last |

# Turning words into arithmetic

Arithmetic Reasoning gives you 69.6 seconds a question - the most generous clock on the whole
AFOQT. That is not because the arithmetic is hard. It almost never goes past a step or two of
adding, multiplying or dividing. The clock is generous because the actual work is reading a
paragraph, deciding what it is asking, and writing it down correctly - and every later chapter
in this track is this one skill applied to a specific kind of paragraph.

Five habits carry the whole subtest. Learn these once and the rest of the track is vocabulary.

---

## 1. Name the unknown

Every word problem defines some quantities in terms of others. Before anything else, find the
one everything else is measured AGAINST and call it `n`.

> Sam has three times as many stamps as Ana. Together they have 48. How many does Ana have?

Ana's count is what Sam's is built from, so `n` = Ana. Sam is `3n`, and `n + 3n = 48`, so
`4n = 48` and `n = 12`. Ana has 12; Sam has 36.

**The trap:** naming the unknown for whoever is asked about, rather than whichever quantity the
others are actually defined off. Here they happen to be the same person - but they will not
always be, which is exactly what section 4 is about.

---

## 2. Translate the exact words

A handful of phrasings account for most translation errors, and each fails its own specific way:

| Phrase | Means | The trap |
|---|---|---|
| "C less than K times a number" | `Kn - C` | writing it in the order it's read: `C - Kn` |
| "C more than K times a number" | `Kn + C` | swapping which number multiplies: `Cn + K` |
| "K times the sum of a number and C" | `K(n + C)` | multiplying only the variable: `Kn + C` |
| "C less than the quotient of a number and K" | `n/K - C` | dividing the wrong way round: `K/n - C` |

Take "9 less than 4 times a number." You are not writing `9 - 4n` just because 9 is read first -
"9 less than" something means you start AT that something and take 9 away, so the 9 lands
SECOND: `4n - 9`. English states the subtracted amount up front; arithmetic puts it last. That
single inversion is the most common translation miss on the subtest.

"K times the sum of..." fails the opposite way. "5 times the sum of a number and 3" is a single
quantity multiplied whole: `5(n + 3)` → `5n + 15`. Writing `5n + 3` multiplies only the variable
and leaves the 3 untouched - if the words say "the sum of," parenthesize before you multiply
anything.

"More than" does not care about order the way "less than" does - `Kn + C` reads correctly either
way round - but it is easy to swap which of the two numbers is the multiplier, so check that the
number attached to "times" is the one sitting next to `n`. And "the quotient of" inverts twice
over: "the quotient of a number and K" puts the number itself on top, `n/K`, and then "C less
than" that subtracts from it afterward - `n/K - C`, never `K/n - C`.

---

## 3. Undo it in the right order

Some stems describe a sequence of operations and hand you the result:

> A number is decreased by 5, and the result is then multiplied by 3, giving 21. What is the
> number?

Work backwards, and undo the LAST operation FIRST: `21 ÷ 3 = 7`, then add the 5 back:
`7 + 5 = 12`.

**The trap:** undoing the operations in the order the sentence describes them - subtracting 5
from 21 before dividing, which gives `21 - 5 = 16`, then `16 ÷ 3`. That is backwards for the same
reason you take your shoes off before your socks: the operations were applied in one order, so
reversing them has to run in the opposite order.

---

## 4. Answer the question that was actually asked

This is the trap the chapter exists to name. Sometimes the algebra resolves cleanly to `n` - and
the question then asks about someone or something DEFINED OFF `n`, not `n` itself.

> Priya works twice as many shifts as Wen, and Marco works 3 more shifts than Wen. Together they
> work 27 shifts. How many shifts does Marco work?

Name the one everything else is measured against: `Wen = n`. Then `Priya = 2n` and
`Marco = n + 3`, so `2n + n + (n + 3) = 4n + 3 = 27`, giving `n = 6`. The question asks for
Marco, so the answer is `6 + 3 = 9` - not 6. And 6 sits right there on the answer sheet,
correctly computed, answering a question about Wen that nobody asked. This is the only kind of
error on the test that punishes you for doing the algebra correctly.

The same trap shows up when the question asks for a GAP rather than either value on its own:

> A shop has three times as many small bikes as large ones, and 24 bikes in total. How many MORE
> small bikes are there than large ones?

Large = `n`, small = `3n`, `4n = 24`, `n = 6`. Small = 18. The difference is `18 - 6 = 12` - not
18, not 6, and not 24. All three of those other numbers are genuine values from the problem, and
all three are wrong, because none of them is the difference. Underline the last sentence of a
stem before you compute anything; it is where both of these traps hide.

---

## 5. Track the units

Data and the question sometimes arrive in different units, and the fix is always to convert
BEFORE you multiply, never after.

> Wire costs $0.75 per foot. What is the cost of 8 yards of wire?

$0.75 is a price per FOOT, and 8 is a count of YARDS. Convert first: 8 yards is 24 feet, then
`24 × $0.75 = $18.00`. Multiplying `$0.75 × 8` straight off gives `$6.00` - a clean, entirely
plausible number produced by never reading the units at all.

---

## Before you move on

| Question type | Do this |
|---|---|
| Two or more quantities defined off each other | Name the base one `n` first |
| "C less/more than K times a number" | Write it literally - the subtracted or added amount goes LAST |
| "K times the sum of..." | Parenthesize the sum before multiplying |
| A sequence of operations and a final result | Undo the LAST operation first, working backwards |
| The question names something built off `n` | Finish the last step - `n` alone is not always the answer |
| The question asks "how many MORE/fewer" | Subtract the two values - neither value alone is the answer |
| A price and a quantity in different units | Convert before you multiply, not after |

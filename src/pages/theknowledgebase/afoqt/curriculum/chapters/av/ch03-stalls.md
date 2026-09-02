# Stalls, spins and load factor

This chapter is built around one sentence, and if you take nothing else from it, take this:

> ## A stall is an **angle**, not a speed.

A wing stalls when it exceeds its **critical angle of attack** — full stop. Not when it gets
slow. Not when the nose is high. An aircraft can stall at any airspeed, in any attitude, at any
power setting, pointed straight at the ground.

Every planted wrong answer in this chapter trades on people believing a stall means "flying too slowly."

---

## What actually happens

Past the critical angle, the smooth airflow over the upper surface **separates** — it breaks
away instead of following the curve — and the lift collapses.

The warnings, in order:

1. **Buffet** — separated air striking the tail shakes the airframe.
2. **The stall warning** — a vane or tab on the leading edge triggers a few knots before the stall.

The recovery is one thing and one thing only: **reduce the angle of attack**. Lower the nose.
Adding power helps you recover *afterwards*, but power alone does not un-stall a wing.

**Stall speed** is a real number but read the small print: it is the speed at which a wing reaches
its critical angle *in level flight at a specified weight*. Change either and the number changes.

**Stall strips** are small leading-edge wedges that force the wing **root** to stall before the
tip — same purpose as washout, so the ailerons still work while the root has let go.

---

## Spins

A spin is an **aggravated stall** with a corkscrew descent. It needs **two ingredients together**:

1. The wing must be **stalled**, and
2. There must be **yaw** — one wing more stalled than the other.

Uncoordinated flight near the stall is the classic setup, which is why the base-to-final skidding
turn is the accident that keeps happening.

**Recovery**, in order — and the order is the point:

> Power **idle** · Ailerons **neutral** · **Full opposite rudder** · Then elevator **forward**.

Rudder first. Break the stall while still yawing and you have simply started a new spin.

### Spin or spiral dive?

They look similar and the fix is opposite, so know the tell:

| | Airspeed | Wing |
|---|---|---|
| **Spin** | Low, roughly constant | **Stalled** |
| **Spiral dive** | **Rising rapidly** | Not stalled |

In a spiral dive, pulling back only tightens it and loads the airframe. Watch the airspeed.

### Slip and skid

- **Slip** — the aircraft moves toward the **inside** of the turn.
- **Skid** — it slides toward the **outside**. This is the dangerous one near the stall.

---

## Load factor, where the numbers are exact

**Load factor** is the load the wings carry divided by the actual weight of the aircraft. In level
flight it is 1.0 G.

Bank the aircraft and it rises, by `1 / cos(bank)`:

| Bank angle | Load factor | Stall speed increase |
|---|---|---|
| 30° | 1.15 G | +7% |
| 45° | 1.41 G | +19% |
| **60°** | **2.0 G** | **+41%** |

**Memorise the 60° row.** It is exact, it is clean, and it is the one that gets asked. cos 60° =
0.5, so the load factor is exactly 2.

The stall-speed column follows a different rule: stall speed rises with the **square root** of
load factor. At 2 G that is √2 ≈ 1.41 — hence 41% higher.

That is what an **accelerated stall** is: a stall that happens well above the published stall
speed, because you increased the load factor rather than reduced the speed.

---

## Maneuvering speed

**Va** is the highest speed at which a full, abrupt control input will **stall the wing before it
breaks anything**. Below Va the wing gives up first, which is the safe failure.

> ⚠ **Va goes DOWN as the aircraft gets lighter.** That is the counter-intuitive part and it is
> exactly why it gets asked. A lighter aircraft is accelerated to a damaging load factor more
> easily, so its protective speed is lower.

On entering severe turbulence, the correct action is to **slow to maneuvering speed**.

**Limit load factor** is a different thing: the greatest load the airframe is certified to carry
without permanent deformation.

---

## Before you move on

- [ ] "A stall is an angle, not a speed" is automatic, and you can say what recovery requires.
- [ ] A spin needs a **stall AND yaw**; recovery is opposite rudder *then* forward elevator.
- [ ] You can tell a spin from a spiral dive by the airspeed.
- [ ] **60° of bank = 2.0 G and +41% stall speed.** Exactly.
- [ ] Va is the abrupt-control limit, and it **decreases** with weight.

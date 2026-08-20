# Flight instruments and what fails

The six-pack splits into **two groups of three**, and almost every question in this chapter is
answerable the moment you know which group an instrument belongs to.

| Runs on **air pressure** | Runs on a **gyroscope** |
|---|---|
| Airspeed indicator | Attitude indicator |
| Altimeter | Heading indicator |
| Vertical speed indicator | Turn coordinator |

A blockage kills instruments from the left column. A vacuum failure kills the right. That is the
whole failure table, and it falls out of one fact.

---

## The pitot-static three

- **Altimeter** — height from **static** pressure alone.
- **Vertical speed indicator** — rate of climb from how *fast* static pressure is changing.
- **Airspeed indicator** — the **difference** between ram air (pitot) and static pressure.

Note the asymmetry: the airspeed indicator is the **only** instrument that touches the pitot tube
at all. Everything else needs static only.

Two probes:

- **Pitot tube** — faces *forward into* the airflow, senses ram pressure.
- **Static port** — sits *flush* with the fuselage, senses undisturbed ambient pressure.

### ⭐ The failure table

| Failure | What is lost |
|---|---|
| **Blocked pitot tube** | **Airspeed indicator only** |
| **Blocked static port** | **All three** — altimeter, airspeed, VSI |
| **Vacuum pump failure** | Attitude indicator and heading indicator |

Details worth having:

- With a **blocked pitot** (drain included), the airspeed indicator starts behaving like an
  altimeter — reading *higher* as you climb.
- With a **blocked static**, the altimeter freezes at the blockage altitude and the VSI reads zero.
  The **alternate static source** draws from inside the cabin instead; cabin pressure is slightly
  lower, so the altimeter then reads a little **high** and the airspeed a little **fast**.
- **Pitot heat** exists to stop the probe icing in visible moisture.
- The **turn coordinator is usually electric**, deliberately wired apart from the vacuum system,
  so it survives a vacuum failure and gives you a backup.

---

## The gyroscopic three

- **Attitude indicator** — pitch **and** bank against an artificial horizon.
- **Heading indicator** — a steady heading, but the gyro drifts, so it must be **realigned against
  the magnetic compass** every fifteen minutes or so.
- **Turn coordinator** — **rate of turn and coordination**, and *no pitch information at all*. Its
  face says so in print, because the little aircraft symbol looks like an attitude indicator and
  is not one. The **inclinometer** is the ball at the bottom: *step on the ball*.

Two gyroscopic properties get asked by name:

- **Rigidity in space** — a spinning rotor holds its orientation while the aircraft moves around it.
- **Precession** — a force applied to a spinning rotor takes effect **90° later** in the rotation.

The **Kollsman window** is the small window on the altimeter where the local pressure setting goes.

---

## The airspeed chain

Four speeds, each one a correction on the last. Learn them as a chain and the order answers the
question:

**IAS → CAS → TAS → GS**

| | Correction applied |
|---|---|
| **Indicated (IAS)** | None — the raw dial reading |
| **Calibrated (CAS)** | Instrument and installation error |
| **True (TAS)** | Air density — altitude and temperature |
| **Groundspeed (GS)** | Wind |

*(**Equivalent airspeed** is CAS corrected for compressibility, which only matters fast and high.)*

> **Rule of thumb: TAS runs about 2% higher than IAS per 1,000 feet.** The dial under-reads as the
> air thins, so at 10,000 feet you are going about 20% faster than it says.

Standard atmosphere numbers, all three asked directly:

- **29.92 inches of mercury** (= 1013.2 mb) at sea level
- **15 °C** at sea level
- **about 2 °C per 1,000 feet** of temperature lapse

---

## Compass errors

The magnetic compass is the only direction instrument that needs **no power of any kind**, which
is why it is still there. It also lies in four different ways.

| Error | Cause |
|---|---|
| **Variation** | True north and magnetic north are in different places |
| **Deviation** | The aircraft's *own* metal and electrics — unique to that airframe, hence the correction card beside the compass |
| **Dip** | The field pulls the card down toward the pole — this is what causes the two below |
| **Acceleration / turning error** | Consequences of dip |

Two memory aids, both examinable:

- **ANDS** — **A**ccelerate **N**orth, **D**ecelerate **S**outh. On easterly or westerly headings,
  speeding up shows a turn toward north; slowing shows one toward south.
- **UNOS** — **U**ndershoot **N**orth, **O**vershoot **S**outh when rolling out of a turn.

---

## Before you move on

- [ ] You can sort all six instruments into pitot-static or gyroscopic without hesitating.
- [ ] Blocked **pitot** = airspeed only. Blocked **static** = all three.
- [ ] Vacuum failure = attitude and heading; the turn coordinator survives because it is electric.
- [ ] IAS → CAS → TAS → GS, and what each correction is for.
- [ ] 29.92 inHg, 15 °C, 2 °C per 1,000 ft.
- [ ] Variation is the *earth*; deviation is the *aircraft*. ANDS and UNOS.

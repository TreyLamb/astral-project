# Engines and propellers

One official sample question lives here and it sets the level nicely:

> *"If the aircraft ammeter is indicating a minus value, this means the ___"* → generator or
> alternator output is inadequate.

Not an engineering question. A systems question with a common-sense answer.

---

## Which engine is which

| Engine | Where the power goes |
|---|---|
| **Reciprocating** | Pistons in cylinders turn a propeller |
| **Turbojet** | *All* thrust from the exhaust jet |
| **Turbofan** | Most thrust from a large **ducted fan** bypassing the core |
| **Turboprop** | A turbine drives a **propeller** through a reduction gearbox |
| **Turboshaft** | A turbine drives a **shaft** — the standard helicopter engine |
| **Ramjet** | No compressor at all; cannot make thrust until already moving fast |

Two extras:

- **Afterburner** — dumps extra fuel into the exhaust for more thrust at a brutal fuel cost.
- **Thrust reverser** — redirects exhaust *forward* to slow the aircraft after landing.

The turboprop/turboshaft pair is the one to keep straight: **prop** ends at a propeller, **shaft**
ends at a shaft driving something else (usually a rotor).

---

## The four-stroke cycle

In order, every time:

> **Intake → Compression → Power → Exhaust**
> *"Suck, squeeze, bang, blow."*

Only the **power** stroke produces power. The other three are the setup and the cleanup.

**Ignition** is by **magneto**, and the magneto matters because it is **self-powered** — it makes
its own spark independently of the electrical system, so the engine keeps running even if the
whole electrical system fails. Aircraft engines carry **two magnetos and two spark plugs per
cylinder**, for redundancy and a more even burn.

---

## Fuel and induction

- **Carburetor** — meters fuel into the airflow using the pressure drop through a venturi.
- **Fuel injection** — sprays fuel at each cylinder. **Cannot suffer carburetor ice.**
- **Mixture control** — leans the fuel-air ratio as you climb. Thinner air means the same fuel
  flow makes the mixture too rich, so leaning restores the ratio.

> ⚠ **Carburetor ice can form on a warm day.** This is the counter-intuitive fact and therefore
> the one that gets asked. Vaporising fuel cools the induction air by *tens of degrees*, so ice
> can form with an outside temperature of 20 °C on a humid day. **Carburetor heat** feeds warmed
> air in to melt or prevent it.

Two abnormal combustion terms, distinguished only by timing:

- **Detonation** — the mixture explodes uncontrollably **after** the spark.
- **Pre-ignition** — the mixture lights **before** the spark, usually from a hot spot.

---

## Propellers

- **Fixed-pitch** — blade angle set at the factory, unchangeable in flight.
- **Constant-speed** — varies blade angle automatically to hold a selected **RPM**. On these, the
  throttle sets manifold pressure and the **propeller control** sets RPM.
- **Feathering** — turning the blades **edge-on** to the airflow to minimise drag from a dead
  engine.
- **Reverse pitch** — angling the blades to push air *forward* and slow the aircraft on rollout.

---

## ⭐ The four left-turning tendencies

Four distinct effects, each a perfect planted wrong answer for the other three, so learn them as a set with
what triggers each:

| Tendency | Cause | When you feel it |
|---|---|---|
| **Torque effect** | Newton's third law — the aircraft rolls *opposite* to the propeller | Always, worst at high power |
| **P-factor** | The **descending blade** takes a bigger bite of air than the ascending one | High angle of attack — slow and nose-high |
| **Spiralling slipstream** | The corkscrew of prop wash strikes one side of the **vertical fin** | High power, low speed |
| **Gyroscopic precession** | Pitching the propeller disc produces a force **90° later** | Only while the *pitch is changing* — raising a taildragger's tail |

The discriminator for gyroscopic precession is that it only appears while the attitude is
*changing*. The others are present in steady flight.

---

## Engine instruments

| Instrument | What it tells you |
|---|---|
| **Ammeter** | Charging system health. **Minus = alternator output inadequate**, battery discharging |
| **Oil pressure** | Must indicate **within seconds** of start, or shut down |
| **Manifold pressure** | Induction pressure, as a measure of power |
| **Tachometer** | Engine RPM |
| **EGT** | Used to lean the mixture precisely by finding peak temperature |

The **alternator** supplies electrical power in flight and keeps the battery charged — which is
exactly what a negative ammeter says is not happening.

---

## Before you move on

- [ ] Turbojet / turbofan / turboprop / turboshaft, by where the power ends up.
- [ ] Intake, compression, power, exhaust — and only the third makes power.
- [ ] Magnetos are self-powered; that is why they are used.
- [ ] Carb ice forms in **warm humid** air, and injection is immune to it.
- [ ] All four left-turning tendencies by name, and which one needs a *changing* attitude.
- [ ] A minus ammeter means the charging system is not keeping up.

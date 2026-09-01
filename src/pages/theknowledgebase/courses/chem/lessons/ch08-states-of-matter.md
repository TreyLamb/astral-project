# States of Matter

Gases are the most mathematical part of this chapter — one equation does most of the work.
Liquids and solids are more about ranking and reasoning: which force is stronger, which phase
survives which conditions.

---

## When a gas behaves "ideally"

The ideal gas model assumes two things that are never quite true: particles take up zero volume,
and particles never attract each other. Both assumptions get closer to true at **low pressure**
(particles are far apart, so their own volume barely matters) and **high temperature** (particles
move fast enough that weak attractions don't have time to act). So a real gas behaves *most*
ideally at low pressure and high temperature — and least ideally at high pressure and low
temperature, exactly the conditions where a gas is closest to condensing into a liquid.

## The ideal gas law: PV = nRT

One equation, four variables (plus the constant R = 0.08206 L·atm/(mol·K)). Whatever you're
solving for, isolate it algebraically — there's no separate formula to memorize for "solve for
V" versus "solve for n."

> **The trap:** T must be in **Kelvin**, always, no exceptions. Plugging in Celsius directly is
> the single most common gas-law mistake there is. Convert first (K = °C + 273.15), then touch
> the rest of the equation.

**Gas density** is a useful variant: since n = mass/molar mass, substituting into PV = nRT and
rearranging gives **d = PM/(RT)** — density in terms of pressure, molar mass, and temperature
directly, without ever computing moles as an intermediate step.

## The combined gas law

For a *fixed amount* of gas changing conditions (not a chemical reaction — literally the same
gas, before and after): **P₁V₁/T₁ = P₂V₂/T₂**. Same Kelvin requirement as above. This is really
just the ideal gas law with n and R canceled out between two states of the same sample.

## Gas stoichiometry

When a reaction produces or consumes a gas, this is just ordinary stoichiometry (Chapter 4) with
one extra step: use PV = nRT to convert between a gas's volume and its moles, wherever the
problem needs that conversion. The order is always: **given → moles (via molar mass or PV=nRT) →
mole ratio → target moles → target quantity (mass or volume, whichever was asked for)**.

> **The trap:** using the given substance's moles directly as the gas's moles, skipping the mole
> ratio from the balanced equation. Unless the reaction happens to have a 1:1 ratio between the
> two species, this silently gives a wrong answer that still looks reasonable.

## Dalton's law of partial pressures

The total pressure of a gas mixture is the **sum** of each gas's partial pressure:
P_total = P₁ + P₂ + P₃ + ... And each gas's partial pressure equals its **mole fraction** times
the total pressure: Pᵢ = (moles of i / total moles) × P_total. Mole fraction, not mole count
directly — a gas that's a third of the moles present contributes a third of the total pressure,
not its raw mole number.

## Kinetic molecular theory

The model behind all of this: gas particles move constantly and randomly, their own volume is
negligible, their collisions are perfectly elastic (no energy lost), and — the detail most often
missed — **average kinetic energy depends only on temperature, never on the identity of the
gas.** Two different gases at the same temperature have the *same* average kinetic energy, even
though (as the next section covers) they don't have the same average speed.

## Maxwell-Boltzmann distributions

If average kinetic energy (½mv²) is the same for two gases at the same T, and one gas is
lighter, that lighter gas *must* move faster on average to make up the difference. So **at a
given temperature, lighter molecules move faster than heavier ones.** Separately, **raising the
temperature of any single gas** shifts its whole speed distribution toward higher speeds and
makes it broader/flatter — more molecules populate a wider range of high speeds.

## Hydrogen bonding

A hydrogen bond requires hydrogen bonded **directly** to nitrogen, oxygen, or fluorine — one of
the three smallest, most electronegative elements that can bond to hydrogen. H₂O, NH₃, and HF
qualify. H₂S, PH₃, and HCl look similar on paper but don't — sulfur, phosphorus, and chlorine
aren't small/electronegative enough, so those molecules only have ordinary dipole-dipole forces,
noticeably weaker than hydrogen bonding.

## Intermolecular forces and boiling point

Ranked weakest to strongest: **dispersion forces** (present in every molecule, growing stronger
with molar mass/polarizability) < **dipole-dipole forces** (permanent dipoles) <
**hydrogen bonding** (the strongest common type). Boiling point tracks directly with this
ranking — stronger intermolecular forces mean more energy is needed to separate molecules into
the gas phase, so a higher boiling point.

## Vapor pressure

The mirror image of boiling point: **weaker** intermolecular forces let molecules escape into the
vapor phase more easily at a given temperature, producing a **higher** vapor pressure (and a more
volatile liquid). Vapor pressure also rises with temperature for any single substance — more
thermal energy means more molecules have enough energy to escape.

## Unit cells and density

A crystal's density can be calculated from its unit cell: figure out how many atoms actually
belong to one unit cell (a body-centered cubic cell has 8 corner atoms, each shared among 8
cells, plus 1 full atom in the center — that's 8×⅛ + 1 = **2 atoms per cell**), find that cell's
mass (atoms × molar mass ÷ Avogadro's number), find its volume (edge length cubed — watch your
units, edge lengths are often given in picometers and need converting to centimeters for a
g/cm³ answer), and divide mass by volume.

## Phase diagrams

A phase diagram plots pressure vs. temperature and divides the plane into solid/liquid/gas
regions with three landmarks worth knowing by name:

- **The triple point** — the one pressure/temperature combination where solid, liquid, and gas
  all coexist simultaneously.
- **Below the triple point's pressure**, there is no liquid region at all — a substance there
  transitions directly between solid and gas (sublimation/deposition).
- **The critical point** — above this pressure AND temperature, the liquid/gas distinction
  disappears entirely into a single supercritical fluid phase.

---

**Before you move on:** you should be able to solve PV = nRT for any one variable without
hesitating over the Kelvin conversion, explain why lighter gas molecules move faster at the same
temperature, and read a phase diagram well enough to identify all three landmark regions.

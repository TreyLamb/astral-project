let _wordIdCounter = 0;
function nextId() { return ++_wordIdCounter; }

export const WORD_POOLS = {
  SHORT: [
    'void', 'flux', 'dark', 'emit', 'ping', 'sync', 'data', 'wave', 'core',
    'lock', 'node', 'echo', 'scan', 'link', 'beam', 'code', 'grid', 'null',
    'halt', 'boot', 'mask', 'port', 'feed', 'warp', 'ion', 'arc', 'bit',
    'hex', 'rng', 'ack', 'nav', 'sat', 'rad', 'erg', 'amp', 'ohm', 'mhz',
    'log', 'key', 'tag', 'run', 'raw', 'drift', 'relay', 'orbit', 'signal',
    'noise', 'pulse', 'probe', 'array', 'laser', 'solar',
  ],
  MEDIUM: [
    'static', 'debris', 'uplink', 'sector', 'beacon', 'photon', 'vector',
    'module', 'output', 'buffer', 'packet', 'encode', 'decode', 'cipher',
    'plasma', 'nebula', 'quasar', 'pulsar', 'zenith', 'zenon', 'tensor',
    'fissure', 'reactor', 'conduit', 'scanner', 'station', 'channel',
    'protocol', 'override', 'blackout', 'lockdown', 'starfield', 'fragment',
    'anomaly', 'isolate', 'warning', 'entropy', 'cascade', 'telemetry',
    'ignition', 'subspace', 'manifest', 'transmit', 'deflect', 'thruster',
    'coolant', 'decrypt', 'archive', 'firmware', 'calibrate', 'sentinel',
  ],
  LONG: [
    'coordinates', 'transmission', 'interference', 'resonance', 'quantified',
    'deteriorate', 'atmospheric', 'calibration', 'initialization', 'deactivate',
    'communications', 'malfunction', 'containment', 'deterioration', 'navigation',
    'extraterrestrial', 'identification', 'electromagnetic', 'configuration',
    'hypervelocity', 'decompression', 'disintegrate', 'reinitialized',
    'countermeasure', 'supplementary', 'reconnaissance', 'thermodynamics',
    'gravitational', 'singularity', 'unauthorized', 'decontaminate',
    'electromagnetic', 'infrastructure', 'crystallization', 'approximation',
    'deteriorating', 'recalibrating', 'depressurizing', 'authentication',
    'intercommunication', 'superintelligence', 'hyperspace', 'discontinuity',
    'stratospheric', 'reconfiguration', 'unidentified', 'crystalline',
    'multidimensional', 'transcendence', 'interstellar',
  ],
  PHRASE: [
    'signal lost', 'void drift', 'relay down', 'core breach', 'dark matter',
    'sector seven', 'dead zone', 'null field', 'echo chamber', 'solar wind',
    'ion storm', 'data corruption', 'link severed', 'beacon offline',
    'orbit decay', 'hull breach', 'warp static', 'grid failure',
    'power drain', 'nav error', 'scan complete', 'threat detected',
    'code red', 'lock down', 'static burst', 'deep space', 'cold void',
    'ghost signal', 'rogue packet', 'pulse wave', 'plasma leak',
    'final burst', 'last transmission', 'station silent', 'crew missing',
    'object detected', 'contact lost', 'anomaly confirmed', 'approach vector',
    'zero response', 'reactor critical', 'cascade failure', 'system offline',
    'unknown origin', 'coordinates locked', 'signal strength', 'time remaining',
    'fuel depleted', 'life support', 'emergency beacon', 'distress call',
  ],
};

export function generateWord(level) {
  const clampedLevel = Math.max(1, Math.min(20, level));

  // Category probabilities shift with level
  const roll = Math.random();
  let category;
  if (clampedLevel <= 3) {
    category = roll < 0.55 ? 'SHORT' : roll < 0.85 ? 'MEDIUM' : 'PHRASE';
  } else if (clampedLevel <= 7) {
    category = roll < 0.30 ? 'SHORT' : roll < 0.65 ? 'MEDIUM' : roll < 0.85 ? 'LONG' : 'PHRASE';
  } else if (clampedLevel <= 12) {
    category = roll < 0.15 ? 'SHORT' : roll < 0.45 ? 'MEDIUM' : roll < 0.75 ? 'LONG' : 'PHRASE';
  } else {
    category = roll < 0.10 ? 'SHORT' : roll < 0.35 ? 'MEDIUM' : roll < 0.65 ? 'LONG' : 'PHRASE';
  }

  const pool = WORD_POOLS[category];
  const text = pool[Math.floor(Math.random() * pool.length)];

  // Speed: 40 px/s at level 1, up to 200 px/s at level 20
  const minSpeed = 40;
  const maxSpeed = 200;
  const speed = minSpeed + ((maxSpeed - minSpeed) * (clampedLevel - 1) / 19);
  // Add small random variance ±15%
  const variance = speed * 0.15 * (Math.random() * 2 - 1);

  // Base points: short=10, medium=20, long=35, phrase=30
  const basePoints = { SHORT: 10, MEDIUM: 20, LONG: 35, PHRASE: 30 }[category];

  return {
    id: nextId(),
    text,
    speed: Math.round(speed + variance),
    points: basePoints,
    category,
  };
}

export function calculatePoints(word, timeToType, combo) {
  const comboMultipliers = [1, 1, 1, 1, 1, 2, 2.5, 3, 3.5, 4, 5];
  const comboIdx = Math.min(combo, comboMultipliers.length - 1);
  const comboMult = comboMultipliers[comboIdx];

  // Speed bonus: faster words = more points. Normalized to 1.0–2.0
  const speedBonus = 1 + (word.speed / 200);

  // Time bonus: typing faster than expected gives up to 1.5x
  const expectedTime = word.text.length * 0.25; // 250ms per char baseline
  const timeMult = timeToType > 0 ? Math.max(0.5, Math.min(1.5, expectedTime / timeToType)) : 1;

  return Math.round(word.points * comboMult * speedBonus * timeMult);
}

export function signalForLevel(level) {
  // Exponential: 100 at lv1, roughly doubles every 3 levels
  return Math.round(100 * Math.pow(1.45, level - 1));
}

export const SKILL_DEFS = [
  {
    id: 'slow_beam',
    name: 'SLOW BEAM',
    description: 'Freezes all incoming packets for 2 seconds.',
    energyCost: 20,
    unlockLevel: 3,
    key: '1',
  },
  {
    id: 'clear_burst',
    name: 'CLEAR BURST',
    description: 'Destroys all current packets. No points awarded.',
    energyCost: 30,
    unlockLevel: 5,
    key: '2',
  },
  {
    id: 'shield',
    name: 'SHIELD',
    description: 'Blocks the next 3 reactor hits.',
    energyCost: 25,
    unlockLevel: 8,
    key: '3',
  },
  {
    id: 'overdrive',
    name: 'OVERDRIVE',
    description: '60 seconds of 2x score multiplier.',
    energyCost: 40,
    unlockLevel: 12,
    key: '4',
  },
];

export const STORY_BEATS = [
  {
    id: 'boot',
    level: 1,
    title: 'EREBUS-9 BOOT SEQUENCE',
    text: `> INITIALIZING EREBUS-9 DEEP SPACE RELAY STATION...
> CRYO UNIT 01 — OPERATOR-7 — ONLINE
> CURRENT DATE: UNKNOWN. MISSION CLOCK: 14,623 DAYS.

Station power at 4%. Emergency lighting only.
All uplink channels corrupted. The automated systems
failed somewhere around year 12. You are the only
human on board. The only human for 2.3 light-years.

> TO RESTORE UPLINK: MANUALLY RE-KEY ALL INCOMING PACKETS.
> BEGIN TRANSMISSION RELAY IMMEDIATELY.`,
  },
  {
    id: 'first_signal',
    level: 3,
    title: 'FRAGMENTED TRANSMISSION RECEIVED',
    text: `> INCOMING DATA FRAGMENT — SOURCE: UNKNOWN
> SIGNAL QUALITY: 3%

  ... -45.7712 ... +112.9004 ... bearing ...
  ... object ... non-natural ... 847 meters ...
  ... moving ...

The navigation array flickered on for a moment.
Long enough to capture coordinates.
Something is out there, in the dark between stars.
Something big.`,
  },
  {
    id: 'station_log',
    level: 5,
    title: 'STATION LOG — YEAR 12, DAY 089',
    text: `> RECOVERED LOG FILE — DR. YAEL OKONKWO, CHIEF SCIENCE OFFICER

"We made contact three weeks ago. It responded to our
transmissions. Not with words. With... patterns. Sequences
we didn't write. The crew is frightened. Commander Vasek
has ordered evacuation. I disagree. Whatever this is,
it is not hostile. It is LISTENING.

We cannot abandon EREBUS-9 now. If it loses signal—"

> LOG ENTRY ENDS. EVACUATION COMPLETED: YEAR 12, DAY 091.
> STATION UNMANNED SINCE.`,
  },
  {
    id: 'approach',
    level: 8,
    title: 'OBJECT APPROACH CONFIRMED',
    text: `> COMMUNICATIONS ARRAY RESTORED — SIGNAL QUALITY: 31%

The coordinates from level 3. We have a fix now.
The object is 0.4 AU away and closing at 12 km/s.

It is not a comet. Not a asteroid.
Spectral analysis suggests a constructed surface —
alloys that don't exist in any known catalog.

And it's been getting closer since you started typing.
Since YOU started transmitting.

> ESTIMATED ARRIVAL: 38 HOURS.`,
  },
  {
    id: 'final_message',
    level: 12,
    title: "THE CREW'S FINAL MESSAGE",
    text: `> ENCRYPTED FILE — PRIORITY ALPHA — COMMANDER PETRA VASEK

"Operator. If you are reading this, forty years have passed.
You were kept in cryo deliberately. We needed EREBUS-9 to
go dark. To stop transmitting. To make it think we left.

But you are here now, and you are transmitting again.
It will come. We could not stop it — only delay it.

There is a decision waiting for you in the reactor core:
a final broadcast that could either welcome it or warn it away.

We ran. We don't know which choice is right.
That's why we left you.

  — Vasek, Year 12, Day 090"`,
  },
  {
    id: 'response',
    level: 16,
    title: 'IT RESPONDS',
    text: `> INCOMING TRANSMISSION — SOURCE: OBJECT AT 0.1 AU
> SIGNAL QUALITY: 89%

The data packets have changed.
You've been re-keying them for weeks now, never reading
them closely. But this one is different.

The words are yours.

Every word you've typed since waking up — every packet
you relayed — it was collecting them. Learning your
patterns. Learning you.

And now it writes back in your own vocabulary:

  OPERATOR-7. WE RECEIVED. WE UNDERSTAND. WE COME.
  NOT TO TAKE. TO RETURN WHAT WAS LEFT BEHIND.

> OBJECT HAS STOPPED. HOLDING AT 50,000 KM.
> AWAITING YOUR RESPONSE.`,
  },
  {
    id: 'true_ending',
    level: 20,
    title: 'TRANSCENDENCE',
    text: `> SIGNAL STRENGTH: 100%
> ALL STATION SYSTEMS: ONLINE
> REACTOR: FULL POWER
> EREBUS-9 STATUS: RESTORED

You typed every word. Every packet.
Forty years of silence, ended by your hands.

The object hovers at 50,000 km. Its surface unfolds —
not a ship. A message. A monument, built by something
that wanted to leave a record for whoever came after.

The crew's fear was never about danger.
It was about what it meant: that we are not alone,
have never been alone, and the universe has been
waiting patiently for us to learn how to listen.

Dr. Okonkwo was right.

You open the final broadcast channel and type:

  WE HEAR YOU. WE ARE HERE.

The stars answer.

> END TRANSMISSION
> OPERATOR-7 — MISSION COMPLETE
> EREBUS-9 WILL REMAIN ONLINE. INDEFINITELY.`,
  },
];

export const STATION_MODULES = [
  {
    id: 'emergency_power',
    level: 1,
    name: 'Emergency Power',
    description: 'Backup systems activated. Red emergency lighting online.',
  },
  {
    id: 'nav_array',
    level: 3,
    name: 'Navigation Array',
    description: 'Navigation systems restored. Coordinate tracking enabled.',
  },
  {
    id: 'life_support',
    level: 5,
    name: 'Life Support',
    description: 'Atmospheric processors online. O2 levels stabilizing.',
  },
  {
    id: 'comms_array',
    level: 8,
    name: 'Communications Array',
    description: 'Long-range antenna fully deployed. Signal clarity increased.',
  },
  {
    id: 'max_hp_1',
    level: 8,
    name: 'Structural Reinforcement',
    description: 'Hull plating restored. Maximum reactor HP increased to 4.',
  },
  {
    id: 'reactor_60',
    level: 12,
    name: 'Reactor at 60%',
    description: 'Main reactor output climbing. Station brightness increasing.',
  },
  {
    id: 'max_hp_2',
    level: 12,
    name: 'Redundant Shielding',
    description: 'Secondary shields online. Maximum reactor HP increased to 5.',
  },
  {
    id: 'full_power',
    level: 16,
    name: 'Full Power Restored',
    description: 'All systems online. EREBUS-9 is fully operational.',
  },
  {
    id: 'transcendence',
    level: 20,
    name: 'TRANSCENDENCE',
    description: 'Signal lock achieved. Contact established.',
  },
];

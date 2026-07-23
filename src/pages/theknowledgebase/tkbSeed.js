// TKB seed data — 10 subjects, ~16 questions each (main_recall + quick_fact
// pipelines, difficulties basic/intermediate/advanced), used to populate a
// fresh localStorage install. Authored across two batches to stay under
// single-response output limits; merged here as the canonical seed module.

export const SEED_SUBJECTS = [
  {
    "id": "subj-geog",
    "name": "World Geography",
    "color": "hsl(203, 55%, 50%)",
    "visibleToProfiles": [
      "main_recall",
      "quick_facts",
      "auto_all",
      "auto_scoped"
    ],
    "subtopics": [
      {
        "id": "subtopic-capitals",
        "name": "Capitals & Cities",
        "checklist": {
          "basic": [
            "Capital of France",
            "Capital of Japan",
            "Capital of Brazil",
            "Capital of Egypt"
          ],
          "intermediate": [
            "Capital of Thailand",
            "Capital of Poland",
            "Capital of South Africa",
            "Largest cities by population"
          ],
          "advanced": [
            "Historical capitals",
            "City-state definitions",
            "Megacities & urbanization",
            "Administrative centers"
          ]
        }
      },
      {
        "id": "subtopic-mountains",
        "name": "Mountain Ranges",
        "checklist": {
          "basic": [
            "Rocky Mountains location",
            "Alps location",
            "Andes location",
            "Himalayas location"
          ],
          "intermediate": [
            "Mountain formation",
            "Peak elevations",
            "Mountain ecosystems",
            "Plate boundaries"
          ],
          "advanced": [
            "Orogenesis processes",
            "Volcanic mountain chains",
            "Mountain climate patterns",
            "Erosion & geology"
          ]
        }
      },
      {
        "id": "subtopic-water",
        "name": "Bodies of Water",
        "checklist": {
          "basic": [
            "Five oceans",
            "Largest lakes",
            "Major rivers",
            "Strait definitions"
          ],
          "intermediate": [
            "Ocean currents",
            "Sea depth zones",
            "River systems",
            "Water salinity"
          ],
          "advanced": [
            "Oceanic circulation",
            "Thermohaline flow",
            "Aquatic biomes",
            "Watershed management"
          ]
        }
      },
      {
        "id": "subtopic-climate",
        "name": "Climate Zones",
        "checklist": {
          "basic": [
            "Tropical climate",
            "Temperate climate",
            "Polar regions",
            "Desert definition"
          ],
          "intermediate": [
            "Köppen classification",
            "Monsoon systems",
            "Climate transitions",
            "Latitude effects"
          ],
          "advanced": [
            "Climate change patterns",
            "Albedo & radiation",
            "Jet streams",
            "Atmospheric circulation"
          ]
        }
      },
      {
        "id": "subtopic-borders",
        "name": "Borders & Regions",
        "checklist": {
          "basic": [
            "Bordering countries",
            "Continental divisions",
            "Hemispheres",
            "Time zones"
          ],
          "intermediate": [
            "Geopolitical regions",
            "Trade blocs",
            "Disputed territories",
            "Island nations"
          ],
          "advanced": [
            "Border conflicts",
            "Sovereignty concepts",
            "Maritime boundaries",
            "Geopolitical power"
          ]
        }
      }
    ]
  },
  {
    "id": "subj-alg",
    "name": "Algebra",
    "color": "hsl(9, 55%, 55%)",
    "visibleToProfiles": [
      "main_recall",
      "quick_facts",
      "auto_all",
      "auto_scoped"
    ],
    "subtopics": [
      {
        "id": "subtopic-linear",
        "name": "Linear Equations",
        "checklist": {
          "basic": [
            "Solving for x",
            "Two-step equations",
            "Graphing lines",
            "Slope definition"
          ],
          "intermediate": [
            "Point-slope form",
            "Systems of linear equations",
            "Inequalities",
            "Parallel vs perpendicular"
          ],
          "advanced": [
            "Linear programming",
            "Matrix solutions",
            "Augmented matrices",
            "Determinants"
          ]
        }
      },
      {
        "id": "subtopic-poly",
        "name": "Polynomials",
        "checklist": {
          "basic": [
            "Polynomial degree",
            "Like terms",
            "Adding polynomials",
            "Multiplying binomials"
          ],
          "intermediate": [
            "Polynomial division",
            "Synthetic division",
            "Remainder theorem",
            "Rational roots"
          ],
          "advanced": [
            "Polynomial factorization",
            "Descartes rule of signs",
            "Complex roots",
            "Multiplicity"
          ]
        }
      },
      {
        "id": "subtopic-systems",
        "name": "Systems of Equations",
        "checklist": {
          "basic": [
            "Two-equation systems",
            "Substitution method",
            "Elimination method",
            "Graphical solutions"
          ],
          "intermediate": [
            "Three-variable systems",
            "Inconsistent systems",
            "Dependent systems",
            "Solution types"
          ],
          "advanced": [
            "Non-linear systems",
            "Matrix methods",
            "Cramer's rule",
            "Vector solutions"
          ]
        }
      },
      {
        "id": "subtopic-exponents",
        "name": "Exponents & Roots",
        "checklist": {
          "basic": [
            "Exponent rules",
            "Negative exponents",
            "Zero exponent",
            "Square roots"
          ],
          "intermediate": [
            "Fractional exponents",
            "Radical simplification",
            "Rationalization",
            "Cube roots"
          ],
          "advanced": [
            "Complex exponents",
            "Logarithmic equivalence",
            "Exponential growth",
            "Scientific notation"
          ]
        }
      },
      {
        "id": "subtopic-factor",
        "name": "Factoring",
        "checklist": {
          "basic": [
            "Greatest common factor",
            "Difference of squares",
            "Trinomial factoring",
            "Grouping"
          ],
          "intermediate": [
            "Sum & difference of cubes",
            "Advanced trinomials",
            "Factoring by substitution",
            "Complete factorization"
          ],
          "advanced": [
            "Irreducible polynomials",
            "Factor theorem application",
            "Polynomial decomposition",
            "Ring theory basics"
          ]
        }
      }
    ]
  },
  {
    "id": "subj-anat",
    "name": "Human Anatomy",
    "color": "hsl(140, 40%, 42%)",
    "visibleToProfiles": [
      "main_recall",
      "quick_facts",
      "auto_all",
      "auto_scoped"
    ],
    "subtopics": [
      {
        "id": "subtopic-skeletal",
        "name": "Skeletal System",
        "checklist": {
          "basic": [
            "Number of bones in adult",
            "Bone types",
            "Joint classifications",
            "Major bones"
          ],
          "intermediate": [
            "Bone structure",
            "Cartilage types",
            "Ligaments vs tendons",
            "Bone remodeling"
          ],
          "advanced": [
            "Ossification process",
            "Biomechanics of joints",
            "Bone density factors",
            "Skeletal pathology"
          ]
        }
      },
      {
        "id": "subtopic-circulatory",
        "name": "Circulatory System",
        "checklist": {
          "basic": [
            "Heart chambers",
            "Arteries vs veins",
            "Blood vessel types",
            "Pulmonary circulation"
          ],
          "intermediate": [
            "Blood pressure",
            "Cardiac cycle",
            "Valve function",
            "Coronary circulation"
          ],
          "advanced": [
            "Hemodynamics",
            "Baroreceptor reflex",
            "Microcirculation",
            "Coagulation cascade"
          ]
        }
      },
      {
        "id": "subtopic-nervous",
        "name": "Nervous System",
        "checklist": {
          "basic": [
            "CNS vs PNS",
            "Neuron structure",
            "Brain regions",
            "Spinal cord function"
          ],
          "intermediate": [
            "Neurotransmitters",
            "Synaptic transmission",
            "Reflex arc",
            "Nerve impulse"
          ],
          "advanced": [
            "Action potentials",
            "Myelin sheath function",
            "Neuroplasticity",
            "Neurodegenerative diseases"
          ]
        }
      },
      {
        "id": "subtopic-respiratory",
        "name": "Respiratory System",
        "checklist": {
          "basic": [
            "Lung function",
            "Air passage parts",
            "Gas exchange location",
            "Breathing process"
          ],
          "intermediate": [
            "Tidal volume",
            "Vital capacity",
            "Oxygen-hemoglobin binding",
            "pH regulation"
          ],
          "advanced": [
            "Ventilation-perfusion",
            "Boyle's law application",
            "Chemoreceptor sensitivity",
            "Respiratory pathology"
          ]
        }
      },
      {
        "id": "subtopic-digestive",
        "name": "Digestive System",
        "checklist": {
          "basic": [
            "Digestive organs",
            "Enzyme function",
            "Nutrient absorption",
            "Gastric juices"
          ],
          "intermediate": [
            "Peristalsis",
            "Bile role",
            "Pancreatic function",
            "Intestinal flora"
          ],
          "advanced": [
            "Nutrient metabolism",
            "Hormone regulation",
            "Microbiome impact",
            "Digestive disorders"
          ]
        }
      }
    ]
  },
  {
    "id": "subj-chem",
    "name": "Chemistry",
    "color": "hsl(45, 70%, 48%)",
    "visibleToProfiles": [
      "main_recall",
      "quick_facts",
      "auto_all",
      "auto_scoped"
    ],
    "subtopics": [
      {
        "id": "subtopic-periodic",
        "name": "Periodic Table",
        "checklist": {
          "basic": [
            "Element symbols",
            "Atomic number definition",
            "Period vs group",
            "Noble gases"
          ],
          "intermediate": [
            "Electron configuration",
            "Valence electrons",
            "Electronegativity",
            "Atomic radius trends"
          ],
          "advanced": [
            "d-block elements",
            "Lanthanides & actinides",
            "Orbital filling order",
            "Effective nuclear charge"
          ]
        }
      },
      {
        "id": "subtopic-bonds",
        "name": "Chemical Bonds",
        "checklist": {
          "basic": [
            "Ionic bonds",
            "Covalent bonds",
            "Electronegativity difference",
            "Polar vs nonpolar"
          ],
          "intermediate": [
            "Hydrogen bonding",
            "Coordinate bonds",
            "Bond polarity",
            "Resonance structures"
          ],
          "advanced": [
            "Orbital hybridization",
            "Molecular orbital theory",
            "Metallic bonding",
            "VSEPR theory application"
          ]
        }
      },
      {
        "id": "subtopic-reactions",
        "name": "Reactions & Equations",
        "checklist": {
          "basic": [
            "Balancing equations",
            "Combustion reactions",
            "Acid-base reactions",
            "Displacement reactions"
          ],
          "intermediate": [
            "Redox reactions",
            "Oxidation states",
            "Electron transfer",
            "Stoichiometry"
          ],
          "advanced": [
            "Thermochemistry",
            "Reaction mechanisms",
            "Catalyst effects",
            "Equilibrium calculations"
          ]
        }
      },
      {
        "id": "subtopic-matter",
        "name": "States of Matter",
        "checklist": {
          "basic": [
            "Solid properties",
            "Liquid properties",
            "Gas properties",
            "Phase transitions"
          ],
          "intermediate": [
            "Kinetic molecular theory",
            "Ideal gas law",
            "Van der Waals forces",
            "Critical point"
          ],
          "advanced": [
            "Plasma state",
            "Supercritical fluids",
            "Bose-Einstein condensates",
            "Matter equations of state"
          ]
        }
      },
      {
        "id": "subtopic-acids",
        "name": "Acids & Bases",
        "checklist": {
          "basic": [
            "pH scale",
            "Acid definition",
            "Base definition",
            "Neutralization"
          ],
          "intermediate": [
            "Weak acids",
            "Buffers",
            "pH calculations",
            "Conjugate pairs"
          ],
          "advanced": [
            "Titration curves",
            "Henderson-Hasselbalch",
            "Salt hydrolysis",
            "Amphoteric compounds"
          ]
        }
      }
    ]
  },
  {
    "id": "subj-hist",
    "name": "US History",
    "color": "hsl(265, 35%, 55%)",
    "visibleToProfiles": [
      "main_recall",
      "quick_facts",
      "auto_all",
      "auto_scoped"
    ],
    "subtopics": [
      {
        "id": "subtopic-colonial",
        "name": "Colonial Era",
        "checklist": {
          "basic": [
            "First settlers",
            "Colonial powers",
            "Jamestown founding",
            "Plymouth colony"
          ],
          "intermediate": [
            "Triangular trade",
            "Colonial governments",
            "French & Indian War",
            "Mercantilism"
          ],
          "advanced": [
            "Great Awakening",
            "Colonial society structure",
            "Indigenous impact",
            "Pre-revolution tensions"
          ]
        }
      },
      {
        "id": "subtopic-civil-war",
        "name": "Civil War Era",
        "checklist": {
          "basic": [
            "Civil War dates",
            "Union vs Confederacy",
            "Emancipation Proclamation",
            "Major battles"
          ],
          "intermediate": [
            "Causes of war",
            "Lincoln's presidency",
            "Reconstruction period",
            "Grant's strategy"
          ],
          "advanced": [
            "Radical Reconstruction",
            "Southern Redemption",
            "Freedmen's Bureau",
            "Constitutional amendments"
          ]
        }
      },
      {
        "id": "subtopic-industrial",
        "name": "Industrial Revolution",
        "checklist": {
          "basic": [
            "Industrial period dates",
            "Factory system",
            "Railroad expansion",
            "Telegraph invention"
          ],
          "intermediate": [
            "Labor movements",
            "Immigration waves",
            "Monopolies & trusts",
            "Progressive Era"
          ],
          "advanced": [
            "Robber barons",
            "Muckraking journalism",
            "Antitrust legislation",
            "Social Darwinism"
          ]
        }
      },
      {
        "id": "subtopic-modern",
        "name": "Modern Era",
        "checklist": {
          "basic": [
            "World War I entry",
            "Great Depression decade",
            "World War II role",
            "Cold War beginning"
          ],
          "intermediate": [
            "New Deal programs",
            "Pearl Harbor date",
            "Cuban Missile Crisis",
            "Space Race"
          ],
          "advanced": [
            "Vietnam War politics",
            "Watergate scandal",
            "Iran hostage crisis",
            "End of Cold War"
          ]
        }
      },
      {
        "id": "subtopic-leaders",
        "name": "Presidents & Leaders",
        "checklist": {
          "basic": [
            "Washington's role",
            "Lincoln leadership",
            "FDR programs",
            "Truman decisions"
          ],
          "intermediate": [
            "Kennedy's policies",
            "Johnson Great Society",
            "Nixon presidency",
            "Reagan era"
          ],
          "advanced": [
            "Founding Fathers ideals",
            "Presidential succession",
            "Executive power evolution",
            "Diplomatic history"
          ]
        }
      }
    ]
  },
  {
    "id": "subj-chi",
    "name": "Chinese Vocabulary",
    "color": "hsl(180, 35%, 40%)",
    "visibleToProfiles": [
      "main_recall",
      "quick_facts",
      "auto_all",
      "auto_scoped"
    ],
    "subtopics": [
      {
        "id": "subtopic-chi-hsk12",
        "name": "HSK Level 1-2",
        "checklist": {
          "basic": [
            "Basic greetings",
            "Numbers 1-10",
            "Colors",
            "Family terms"
          ],
          "intermediate": [
            "Common verbs",
            "Simple time expressions",
            "Direction words"
          ],
          "advanced": [
            "Quantifier pairs",
            "Measure words",
            "Modal particles"
          ]
        }
      },
      {
        "id": "subtopic-chi-hsk34",
        "name": "HSK Level 3-4",
        "checklist": {
          "basic": [
            "Food vocabulary",
            "Clothing terms",
            "Transport words"
          ],
          "intermediate": [
            "Office/workplace terms",
            "Emotion words",
            "Physical descriptions"
          ],
          "advanced": [
            "Abstract nouns",
            "Formal expressions",
            "Idiom components"
          ]
        }
      },
      {
        "id": "subtopic-chi-radicals",
        "name": "Radicals",
        "checklist": {
          "basic": [
            "Water radical (氵)",
            "Fire radical (火)",
            "Wood radical (木)",
            "Person radical (人)"
          ],
          "intermediate": [
            "Metal radical (金)",
            "Heart radical (心)",
            "Hand radical (手)"
          ],
          "advanced": [
            "Radical variations",
            "Complex radical combinations"
          ]
        }
      },
      {
        "id": "subtopic-chi-components",
        "name": "Hanzi Components",
        "checklist": {
          "basic": [
            "Pictographic origins",
            "Strokes",
            "Stroke order",
            "Common components"
          ],
          "intermediate": [
            "Semantic components",
            "Phonetic components",
            "Combined forms"
          ],
          "advanced": [
            "Ancient forms",
            "Variant characters",
            "Seal script"
          ]
        }
      },
      {
        "id": "subtopic-chi-phrases",
        "name": "Common Phrases",
        "checklist": {
          "basic": [
            "Greeting phrases",
            "Polite expressions",
            "Common collocations"
          ],
          "intermediate": [
            "Business phrases",
            "Academic expressions",
            "Set idioms"
          ],
          "advanced": [
            "Proverbs (谚语)",
            "Classical idioms (成语)",
            "Colloquialisms"
          ]
        }
      }
    ]
  },
  {
    "id": "subj-geo2",
    "name": "Geology",
    "color": "hsl(28, 60%, 50%)",
    "visibleToProfiles": [
      "main_recall",
      "quick_facts",
      "auto_all",
      "auto_scoped"
    ],
    "subtopics": [
      {
        "id": "subtopic-geo2-minerals",
        "name": "Minerals",
        "checklist": {
          "basic": [
            "Crystal systems",
            "Hardness scale",
            "Luster types",
            "Common minerals"
          ],
          "intermediate": [
            "Mineral composition",
            "Cleavage patterns",
            "Mineral identification"
          ],
          "advanced": [
            "Rare minerals",
            "Mineral structure",
            "Polymorphs"
          ]
        }
      },
      {
        "id": "subtopic-geo2-rocks",
        "name": "Rocks",
        "checklist": {
          "basic": [
            "Rock cycle",
            "Igneous rocks",
            "Sedimentary rocks",
            "Metamorphic rocks"
          ],
          "intermediate": [
            "Rock textures",
            "Granite vs basalt",
            "Fossil-bearing rocks"
          ],
          "advanced": [
            "Metamorphic grades",
            "Rare rock types",
            "Rock weathering"
          ]
        }
      },
      {
        "id": "subtopic-geo2-tectonics",
        "name": "Plate Tectonics",
        "checklist": {
          "basic": [
            "Plate boundaries",
            "Continental drift",
            "Seafloor spreading",
            "Subduction"
          ],
          "intermediate": [
            "Collision zones",
            "Transform faults",
            "Hot spots"
          ],
          "advanced": [
            "Mantle convection",
            "Stress regimes",
            "Plate history"
          ]
        }
      },
      {
        "id": "subtopic-geo2-structure",
        "name": "Earth Structure",
        "checklist": {
          "basic": [
            "Crust layers",
            "Mantle composition",
            "Core properties",
            "Density gradient"
          ],
          "intermediate": [
            "Mohorovičić discontinuity",
            "Gutenberg discontinuity",
            "Temperature profile"
          ],
          "advanced": [
            "Seismic wave velocities",
            "Inner vs outer core",
            "Lithosphere vs asthenosphere"
          ]
        }
      },
      {
        "id": "subtopic-geo2-time",
        "name": "Geological Time",
        "checklist": {
          "basic": [
            "Geologic time scale",
            "Eons",
            "Eras",
            "Periods"
          ],
          "intermediate": [
            "Radiometric dating",
            "Relative dating",
            "Index fossils"
          ],
          "advanced": [
            "Half-life calculations",
            "Chronostratigraphy",
            "Biostratigraphy"
          ]
        }
      }
    ]
  },
  {
    "id": "subj-astro",
    "name": "Astronomy",
    "color": "hsl(320, 35%, 55%)",
    "visibleToProfiles": [
      "main_recall",
      "quick_facts",
      "auto_all",
      "auto_scoped"
    ],
    "subtopics": [
      {
        "id": "subtopic-astro-stars",
        "name": "Stars",
        "checklist": {
          "basic": [
            "Star composition",
            "Star classification",
            "Brightness",
            "Luminosity"
          ],
          "intermediate": [
            "Hertzsprung-Russell diagram",
            "Star lifecycle",
            "Stellar fusion"
          ],
          "advanced": [
            "Spectroscopy",
            "Parallax distance",
            "Proper motion"
          ]
        }
      },
      {
        "id": "subtopic-astro-planets",
        "name": "Planets",
        "checklist": {
          "basic": [
            "Planet types",
            "Solar System planets",
            "Orbital periods",
            "Atmospheres"
          ],
          "intermediate": [
            "Exoplanets",
            "Habitable zone",
            "Planet detection methods"
          ],
          "advanced": [
            "Planet formation",
            "Orbital mechanics",
            "Planetary atmospheres"
          ]
        }
      },
      {
        "id": "subtopic-astro-galaxies",
        "name": "Galaxies",
        "checklist": {
          "basic": [
            "Galaxy types",
            "Milky Way structure",
            "Andromeda",
            "Galaxy clusters"
          ],
          "intermediate": [
            "Supermassive black holes",
            "Active galactic nuclei",
            "Galactic rotation"
          ],
          "advanced": [
            "Galaxy evolution",
            "Redshift",
            "Hubble constant"
          ]
        }
      },
      {
        "id": "subtopic-astro-mechanics",
        "name": "Celestial Mechanics",
        "checklist": {
          "basic": [
            "Gravity",
            "Orbits",
            "Kepler's laws",
            "Escape velocity"
          ],
          "intermediate": [
            "N-body problems",
            "Lagrange points",
            "Orbital resonance"
          ],
          "advanced": [
            "Perturbation theory",
            "Orbital stability",
            "Three-body dynamics"
          ]
        }
      },
      {
        "id": "subtopic-astro-solar",
        "name": "Solar System",
        "checklist": {
          "basic": [
            "Sun composition",
            "Solar flares",
            "Sunspots",
            "Solar wind"
          ],
          "intermediate": [
            "Asteroid belt",
            "Kuiper belt",
            "Oort cloud"
          ],
          "advanced": [
            "Solar cycles",
            "Coronal mass ejections",
            "Comets"
          ]
        }
      }
    ]
  },
  {
    "id": "subj-cs",
    "name": "Computer Science",
    "color": "hsl(95, 35%, 42%)",
    "visibleToProfiles": [
      "main_recall",
      "quick_facts",
      "auto_all",
      "auto_scoped"
    ],
    "subtopics": [
      {
        "id": "subtopic-cs-structures",
        "name": "Data Structures",
        "checklist": {
          "basic": [
            "Arrays",
            "Linked lists",
            "Stacks",
            "Queues",
            "Trees"
          ],
          "intermediate": [
            "Hash tables",
            "Graphs",
            "Heaps",
            "Tries"
          ],
          "advanced": [
            "B-trees",
            "Skip lists",
            "Bloom filters"
          ]
        }
      },
      {
        "id": "subtopic-cs-algorithms",
        "name": "Algorithms",
        "checklist": {
          "basic": [
            "Sorting algorithms",
            "Searching",
            "Big O notation",
            "Time complexity"
          ],
          "intermediate": [
            "Dynamic programming",
            "Greedy algorithms",
            "Divide and conquer"
          ],
          "advanced": [
            "Graph algorithms",
            "NP-completeness",
            "Approximation algorithms"
          ]
        }
      },
      {
        "id": "subtopic-cs-paradigms",
        "name": "Programming Paradigms",
        "checklist": {
          "basic": [
            "Imperative programming",
            "Object-oriented",
            "Functional programming"
          ],
          "intermediate": [
            "Declarative languages",
            "Logic programming",
            "Design patterns"
          ],
          "advanced": [
            "Metaprogramming",
            "Reflection",
            "Aspect-oriented programming"
          ]
        }
      },
      {
        "id": "subtopic-cs-networking",
        "name": "Networking",
        "checklist": {
          "basic": [
            "TCP/IP",
            "HTTP/HTTPS",
            "DNS",
            "IP addresses"
          ],
          "intermediate": [
            "UDP",
            "Routing",
            "Load balancing",
            "Firewalls"
          ],
          "advanced": [
            "BGP",
            "MPLS",
            "Network security protocols"
          ]
        }
      },
      {
        "id": "subtopic-cs-databases",
        "name": "Databases",
        "checklist": {
          "basic": [
            "SQL basics",
            "Normalization",
            "Indexes",
            "Primary/foreign keys"
          ],
          "intermediate": [
            "Transactions",
            "ACID properties",
            "Query optimization"
          ],
          "advanced": [
            "Distributed databases",
            "NoSQL",
            "Database sharding"
          ]
        }
      }
    ]
  },
  {
    "id": "subj-music",
    "name": "Music Theory",
    "color": "hsl(230, 30%, 55%)",
    "visibleToProfiles": [
      "main_recall",
      "quick_facts",
      "auto_all",
      "auto_scoped"
    ],
    "subtopics": [
      {
        "id": "subtopic-music-intervals",
        "name": "Intervals",
        "checklist": {
          "basic": [
            "Unison to octave",
            "Semitones",
            "Interval quality",
            "Perfect intervals"
          ],
          "intermediate": [
            "Chromatic intervals",
            "Enharmonic equivalents",
            "Inversions"
          ],
          "advanced": [
            "Microtones",
            "Just intonation",
            "Interval ratios"
          ]
        }
      },
      {
        "id": "subtopic-music-scales",
        "name": "Scales",
        "checklist": {
          "basic": [
            "Major scales",
            "Minor scales",
            "Scale degrees",
            "Relative keys"
          ],
          "intermediate": [
            "Modes",
            "Pentatonic scales",
            "Blues scale"
          ],
          "advanced": [
            "Whole tone scale",
            "Chromatic scale",
            "Exotic scales"
          ]
        }
      },
      {
        "id": "subtopic-music-harmony",
        "name": "Harmony",
        "checklist": {
          "basic": [
            "Triads",
            "Chord inversions",
            "Roman numeral analysis",
            "Voice leading"
          ],
          "intermediate": [
            "Seventh chords",
            "Extended chords",
            "Chord progressions"
          ],
          "advanced": [
            "Modulation",
            "Secondary dominants",
            "Chromatic harmony"
          ]
        }
      },
      {
        "id": "subtopic-music-rhythm",
        "name": "Rhythm",
        "checklist": {
          "basic": [
            "Time signatures",
            "Note values",
            "Rests",
            "Beats and measures"
          ],
          "intermediate": [
            "Syncopation",
            "Polyrhythm",
            "Triplets",
            "Swing"
          ],
          "advanced": [
            "Metric modulation",
            "Odd meters",
            "Rhythmic notation"
          ]
        }
      },
      {
        "id": "subtopic-music-form",
        "name": "Form",
        "checklist": {
          "basic": [
            "Binary form",
            "Ternary form",
            "Rondo",
            "Fugue basics"
          ],
          "intermediate": [
            "Sonata form",
            "Theme and variations",
            "Suite structure"
          ],
          "advanced": [
            "Twelve-tone technique",
            "Serialism",
            "Cyclical forms"
          ]
        }
      }
    ]
  }
];

export const SEED_QUESTIONS = [
  {
    "id": "q-geo-001",
    "question": "What is the capital of France?",
    "answer": "Paris",
    "answerAlternates": [],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-capitals",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "capital-city"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Paris has been France's capital since the Middle Ages and remains the country's largest city and primary political and cultural center."
  },
  {
    "id": "q-geo-002",
    "question": "Which mountain range contains Mount Everest?",
    "answer": "Himalayas",
    "answerAlternates": [],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-mountains",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "geography",
      "mountain"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Himalayas are the world's highest mountain range stretching across Asia, with Mount Everest standing as its tallest peak at 8,849 meters."
  },
  {
    "id": "q-geo-003",
    "question": "What is the capital of Japan?",
    "answer": "Tokyo",
    "answerAlternates": [],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-capitals",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "capital-city"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Tokyo became Japan's capital in 1868 and is now the country's largest metropolitan area and seat of government."
  },
  {
    "id": "q-geo-004",
    "question": "How many oceans are on Earth?",
    "answer": "Five",
    "answerAlternates": [
      "5"
    ],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-water",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "count",
      "fact"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The five oceans are the Pacific, Atlantic, Indian, Arctic, and Southern (Antarctic), classified by their distinct geographic boundaries and water masses."
  },
  {
    "id": "q-geo-005",
    "question": "What is the largest desert in the world?",
    "answer": "Sahara",
    "answerAlternates": [],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-climate",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "superlative",
      "geography"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Sahara covers over 9 million square kilometers across North Africa, making it the largest hot desert on Earth."
  },
  {
    "id": "q-geo-006",
    "question": "What capital is located in Switzerland?",
    "answer": "Bern",
    "answerAlternates": [],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-capitals",
    "difficulty": "intermediate",
    "pipeline": "quick_fact",
    "styleTags": [
      "capital-city"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Bern serves as Switzerland's official capital and seat of federal government, despite Zurich being the country's largest city."
  },
  {
    "id": "q-geo-007",
    "question": "Which continents are separated by the Atlantic Ocean?",
    "answer": "North America, South America, Europe, and Africa",
    "answerAlternates": [
      "Americas and Europe/Africa"
    ],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-water",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "geography",
      "ocean"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Atlantic Ocean lies between the Western Hemisphere (North and South America) to the west and Europe and Africa to the east."
  },
  {
    "id": "q-geo-008",
    "question": "What is the longest river in Africa?",
    "answer": "Nile River",
    "answerAlternates": [
      "Nile"
    ],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-water",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "superlative",
      "river"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Nile River flows through northeastern Africa for over 6,600 kilometers, making it the continent's longest river."
  },
  {
    "id": "q-geo-009",
    "question": "Which country is landlocked in South America?",
    "answer": "Bolivia",
    "answerAlternates": [],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-borders",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "geography",
      "borders"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Bolivia is one of two landlocked countries in South America, having lost its Pacific coastline in the War of the Pacific during the 19th century."
  },
  {
    "id": "q-geo-010",
    "question": "What are the tropical climates called near the equator?",
    "answer": "Tropical wet or tropical humid climates",
    "answerAlternates": [
      "Tropical",
      "Equatorial"
    ],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-climate",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "climate",
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Regions near the equator receive consistent high temperatures and abundant rainfall year-round, defining tropical wet and humid climate zones."
  },
  {
    "id": "q-geo-011",
    "question": "What is the deepest ocean trench?",
    "answer": "Mariana Trench",
    "answerAlternates": [],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-water",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "superlative",
      "ocean"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Located in the western Pacific Ocean, the Mariana Trench reaches approximately 11,000 meters deep, the lowest point in Earth's oceans."
  },
  {
    "id": "q-geo-012",
    "question": "Which three countries share the borders of North America?",
    "answer": "Canada, United States, Mexico",
    "answerAlternates": [],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-borders",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "borders",
      "geography"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Canada, the United States, and Mexico are the three countries of mainland North America that share direct land borders with one another, with Canada to the north, Mexico to the south, and the United States in between."
  },
  {
    "id": "q-geo-013",
    "question": "What mountain range spans multiple South American countries?",
    "answer": "Andes Mountains",
    "answerAlternates": [
      "Andes"
    ],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-mountains",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "mountain",
      "geography"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Andes is the longest continental mountain range at over 7,000 kilometers, stretching through seven South American countries including Colombia, Peru, and Chile."
  },
  {
    "id": "q-geo-014",
    "question": "What is the capital of Brazil?",
    "answer": "Brasília",
    "answerAlternates": [],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-capitals",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "capital-city"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Brasília replaced Rio de Janeiro as Brazil's capital in 1960, serving as a purpose-built modernist city and the seat of government."
  },
  {
    "id": "q-geo-015",
    "question": "Which ocean separates Europe and Asia?",
    "answer": "Arctic Ocean",
    "answerAlternates": [],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-water",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "ocean",
      "geography"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Arctic Ocean borders the northern regions of Europe and Asia, forming the primary oceanic connection between these continents to the north."
  },
  {
    "id": "q-geo-016",
    "question": "What climate zone has warm, dry summers and mild winters?",
    "answer": "Mediterranean climate",
    "answerAlternates": [],
    "subjectId": "subj-geog",
    "subtopicId": "subtopic-climate",
    "difficulty": "advanced",
    "pipeline": "quick_fact",
    "styleTags": [
      "climate",
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Mediterranean climates feature hot, dry summers and cool, wet winters, found around the Mediterranean Sea and similar subtropical coastal latitudes."
  },
  {
    "id": "q-alg-001",
    "question": "Solve for x: 2x + 5 = 13",
    "answer": "x = 4",
    "answerAlternates": [
      "4"
    ],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-linear",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "linear-equation",
      "solve"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Subtract 5 from both sides: 2x = 13 - 5 = 8.\nDivide by 2: x = 8 ÷ 2 = 4."
  },
  {
    "id": "q-alg-002",
    "question": "What is the slope of the line y = 2x + 3?",
    "answer": "2",
    "answerAlternates": [],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-linear",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "slope",
      "linear"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Equation is already in slope-intercept form y = mx + b, where m is the slope.\nHere m = 2, so the slope is 2."
  },
  {
    "id": "q-alg-003",
    "question": "Expand (x + 2)(x + 3)",
    "answer": "x² + 5x + 6",
    "answerAlternates": [],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-poly",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "polynomial",
      "foil"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "FOIL: (x + 2)(x + 3) = x×x + x×3 + 2×x + 2×3.\n= x² + 3x + 2x + 6.\nCombine like terms: x² + 5x + 6."
  },
  {
    "id": "q-alg-004",
    "question": "Factor x² - 9",
    "answer": "(x - 3)(x + 3)",
    "answerAlternates": [
      "(x+3)(x-3)"
    ],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-factor",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "factoring",
      "difference-of-squares"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Recognize difference of squares: x² - 9 = x² - 3².\nDifference of squares rule: a² - b² = (a - b)(a + b).\nResult: (x - 3)(x + 3)."
  },
  {
    "id": "q-alg-005",
    "question": "What is 2³?",
    "answer": "8",
    "answerAlternates": [],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-exponents",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "exponent",
      "calculation"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "2³ means 2 × 2 × 2.\n2 × 2 = 4, then 4 × 2 = 8."
  },
  {
    "id": "q-alg-006",
    "question": "Solve the system: x + y = 5, x - y = 1",
    "answer": "x = 3, y = 2",
    "answerAlternates": [
      "(3, 2)"
    ],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-systems",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "system",
      "solve"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Elimination: add the two equations to cancel y: (x + y) + (x - y) = 5 + 1 → 2x = 6 → x = 3.\nSubstitute back into x + y = 5: 3 + y = 5 → y = 2."
  },
  {
    "id": "q-alg-007",
    "question": "Simplify √16",
    "answer": "4",
    "answerAlternates": [],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-exponents",
    "difficulty": "basic",
    "pipeline": "quick_fact",
    "styleTags": [
      "root",
      "simplify"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "√16 asks: what number squared gives 16?\n4² = 16, so √16 = 4."
  },
  {
    "id": "q-alg-008",
    "question": "What is x⁰ for any nonzero x?",
    "answer": "1",
    "answerAlternates": [],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-exponents",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "exponent",
      "rule"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Zero exponent rule: any nonzero x raised to the 0 power equals 1.\nx⁰ = 1."
  },
  {
    "id": "q-alg-009",
    "question": "Factor 2x² + 5x + 3",
    "answer": "(2x + 3)(x + 1)",
    "answerAlternates": [
      "(x + 1)(2x + 3)"
    ],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-factor",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "factoring",
      "trinomial"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Find two numbers multiplying to 2×3 = 6 and adding to 5: these are 2 and 3.\nSplit the middle term: 2x² + 2x + 3x + 3.\nGroup and factor: 2x(x + 1) + 3(x + 1) = (2x + 3)(x + 1)."
  },
  {
    "id": "q-alg-010",
    "question": "Simplify (x²)³",
    "answer": "x⁶",
    "answerAlternates": [],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-exponents",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "exponent",
      "rule"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Power rule: (xᵃ)ᵇ = xᵃˣᵇ.\n(x²)³ = x²ˣ³ = x⁶."
  },
  {
    "id": "q-alg-011",
    "question": "What is the degree of polynomial 3x⁴ + 2x² + 1?",
    "answer": "4",
    "answerAlternates": [],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-poly",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "polynomial",
      "degree"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The degree of a polynomial is its highest exponent on the variable.\nIn 3x⁴ + 2x² + 1, the highest exponent is 4."
  },
  {
    "id": "q-alg-012",
    "question": "Solve 3x - 7 = 2x + 1",
    "answer": "x = 8",
    "answerAlternates": [
      "8"
    ],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-linear",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "linear",
      "solve"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Move x terms to one side: 3x - 2x = 1 + 7.\nx = 8."
  },
  {
    "id": "q-alg-013",
    "question": "What is √49?",
    "answer": "7",
    "answerAlternates": [],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-exponents",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "root",
      "simplify"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "√49 asks: what number squared gives 49?\n7² = 49, so √49 = 7."
  },
  {
    "id": "q-alg-014",
    "question": "Simplify 2⁻³",
    "answer": "1/8 or 0.125",
    "answerAlternates": [
      "1/8"
    ],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-exponents",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "exponent",
      "negative"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Negative exponent rule: x⁻ⁿ = 1 ÷ xⁿ.\n2⁻³ = 1 ÷ 2³ = 1 ÷ 8 = 1/8 (= 0.125)."
  },
  {
    "id": "q-alg-015",
    "question": "Which is the y-intercept of y = 2x + 5?",
    "answer": "5 or (0, 5)",
    "answerAlternates": [
      "(0, 5)"
    ],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-linear",
    "difficulty": "intermediate",
    "pipeline": "quick_fact",
    "styleTags": [
      "linear",
      "intercept"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The y-intercept occurs where x = 0.\nSubstitute: y = 2(0) + 5 = 5.\nThe y-intercept is (0, 5)."
  },
  {
    "id": "q-alg-016",
    "question": "Factor out the GCF from 6x² + 9x",
    "answer": "3x(2x + 3)",
    "answerAlternates": [],
    "subjectId": "subj-alg",
    "subtopicId": "subtopic-factor",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "factoring",
      "gcf"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Find the GCF of 6x² and 9x: GCF of coefficients 6 and 9 is 3, and both terms share a factor of x, so GCF = 3x.\nDivide each term: 6x² ÷ 3x = 2x, 9x ÷ 3x = 3.\nResult: 3x(2x + 3)."
  },
  {
    "id": "q-anat-001",
    "question": "How many bones does an adult human have?",
    "answer": "206",
    "answerAlternates": [],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-skeletal",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "count",
      "skeleton"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Adults have exactly 206 bones because many bones fuse together during development; babies are born with about 300 bones, some of which gradually fuse together as they grow into adulthood."
  },
  {
    "id": "q-anat-002",
    "question": "What are the four chambers of the heart?",
    "answer": "Right atrium, right ventricle, left atrium, left ventricle",
    "answerAlternates": [],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-circulatory",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "heart",
      "anatomy"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The heart is a four-chambered pump with two upper chambers (atria) that receive blood and two lower chambers (ventricles) that pump blood out to the lungs and body."
  },
  {
    "id": "q-anat-003",
    "question": "Which part of the brain controls voluntary movement?",
    "answer": "Motor cortex",
    "answerAlternates": [
      "Frontal lobe"
    ],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-nervous",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "brain",
      "function"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The motor cortex, located in the frontal lobe, sends signals down the spinal cord to muscles, enabling voluntary movements like walking, reaching, and writing."
  },
  {
    "id": "q-anat-004",
    "question": "What gas do lungs primarily exchange with blood?",
    "answer": "Oxygen and carbon dioxide",
    "answerAlternates": [
      "O2 and CO2"
    ],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-respiratory",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "respiratory",
      "gas-exchange"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The lungs exchange oxygen from inhaled air into the blood while simultaneously removing carbon dioxide waste from the blood to be exhaled."
  },
  {
    "id": "q-anat-005",
    "question": "What is the largest bone in the human body?",
    "answer": "Femur or thighbone",
    "answerAlternates": [
      "Femur"
    ],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-skeletal",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "bone",
      "skeleton"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The femur bears the body's full weight during standing and movement, making it both the longest and strongest bone in the human skeleton."
  },
  {
    "id": "q-anat-006",
    "question": "Which vessels carry blood away from the heart?",
    "answer": "Arteries",
    "answerAlternates": [],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-circulatory",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "blood-vessel",
      "circulation"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Arteries are defined by their function: they carry blood away from the heart under high pressure to deliver oxygen-rich blood to tissues throughout the body."
  },
  {
    "id": "q-anat-007",
    "question": "What does the pancreas produce to regulate blood sugar?",
    "answer": "Insulin",
    "answerAlternates": [],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-digestive",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "hormone",
      "pancreas"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The pancreas secretes insulin in response to high blood glucose, allowing cells to take up glucose for energy and lowering blood sugar levels."
  },
  {
    "id": "q-anat-008",
    "question": "What neurotransmitter is crucial for muscle movement?",
    "answer": "Acetylcholine",
    "answerAlternates": [],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-nervous",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "neurotransmitter",
      "nerve"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Acetylcholine is released from motor neurons at the neuromuscular junction, binding to muscle cell receptors to trigger muscle contraction."
  },
  {
    "id": "q-anat-009",
    "question": "What is the function of the trachea?",
    "answer": "Carries air to the lungs",
    "answerAlternates": [
      "Windpipe"
    ],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-respiratory",
    "difficulty": "basic",
    "pipeline": "quick_fact",
    "styleTags": [
      "respiratory",
      "function"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The trachea is the rigid airway that conducts air from the larynx down to the bronchi, preventing collapse and enabling unobstructed breathing."
  },
  {
    "id": "q-anat-010",
    "question": "What is the small intestine's primary function?",
    "answer": "Nutrient absorption",
    "answerAlternates": [
      "Absorb nutrients"
    ],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-digestive",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "digestion",
      "function"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The small intestine's specialized lining with villi and microvilli provides an enormous surface area for absorbing nutrients from digested food into the bloodstream."
  },
  {
    "id": "q-anat-011",
    "question": "What connects muscle to bone?",
    "answer": "Tendons",
    "answerAlternates": [],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-skeletal",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "anatomy",
      "connective-tissue"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Tendons are dense fibrous connective tissue that directly attach muscle to bone, transferring the force of muscle contractions to move skeletal structures."
  },
  {
    "id": "q-anat-012",
    "question": "Which type of blood cells fight infections?",
    "answer": "White blood cells",
    "answerAlternates": [
      "Leukocytes"
    ],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-circulatory",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "blood",
      "immunity"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "White blood cells (leukocytes) are part of the immune system and actively patrol the bloodstream and tissues, identifying and destroying pathogens and foreign invaders."
  },
  {
    "id": "q-anat-013",
    "question": "What does the cerebellum control?",
    "answer": "Balance and coordination",
    "answerAlternates": [],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-nervous",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "brain",
      "function"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The cerebellum, located at the base of the brain, continuously processes movement and sensory information to maintain balance, posture, and smooth coordinated motion."
  },
  {
    "id": "q-anat-014",
    "question": "What is the primary function of the liver?",
    "answer": "Detoxification and metabolism",
    "answerAlternates": [
      "Process nutrients",
      "Filter blood"
    ],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-digestive",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "liver",
      "organ"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The liver is the body's primary metabolic organ, breaking down harmful substances into forms the body can eliminate while processing nutrients for storage and use."
  },
  {
    "id": "q-anat-015",
    "question": "What is the spinal cord enclosed by?",
    "answer": "Vertebrae",
    "answerAlternates": [
      "Vertebral column"
    ],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-nervous",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "spinal-cord",
      "anatomy"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The vertebrae form a protective column around the spinal cord, safeguarding this vital bundle of nerves that carries signals between the brain and the rest of the body."
  },
  {
    "id": "q-anat-016",
    "question": "What is the largest internal organ?",
    "answer": "Liver",
    "answerAlternates": [],
    "subjectId": "subj-anat",
    "subtopicId": "subtopic-digestive",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "organ",
      "superlative"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The liver is larger than other internal organs like the stomach, kidneys, and heart combined, reflecting its crucial role in metabolism and detoxification."
  },
  {
    "id": "q-chem-001",
    "question": "What is the chemical symbol for sodium?",
    "answer": "Na",
    "answerAlternates": [],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-periodic",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "element",
      "symbol"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Sodium's chemical symbol Na comes from its Latin name natrium, following the convention that symbols derive from element names in their original languages."
  },
  {
    "id": "q-chem-002",
    "question": "What is the atomic number of carbon?",
    "answer": "6",
    "answerAlternates": [],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-periodic",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "element",
      "atomic-number"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "An element's atomic number equals the number of protons in its nucleus, and carbon with 6 protons is the foundation of all organic chemistry."
  },
  {
    "id": "q-chem-003",
    "question": "What type of bond holds oxygen and hydrogen in water?",
    "answer": "Covalent bond",
    "answerAlternates": [],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-bonds",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "chemical-bond",
      "water"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Water forms when hydrogen and oxygen atoms share electrons between them in a covalent bond, creating a stable H-O-H molecule."
  },
  {
    "id": "q-chem-004",
    "question": "What is the pH of a neutral solution?",
    "answer": "7",
    "answerAlternates": [],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-acids",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "ph",
      "acid-base"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The pH scale defines 7 as neutral because at this point the concentration of hydrogen ions equals the concentration of hydroxide ions in solution."
  },
  {
    "id": "q-chem-005",
    "question": "What state of matter has no fixed shape?",
    "answer": "Liquid or gas",
    "answerAlternates": [
      "Gas",
      "Liquid"
    ],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-matter",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "states-of-matter",
      "property"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Both liquids and gases lack fixed shape because their particles move freely enough to conform to whatever container holds them, though gases are more mobile."
  },
  {
    "id": "q-chem-006",
    "question": "What is the chemical formula for table salt?",
    "answer": "NaCl",
    "answerAlternates": [],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-bonds",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "compound",
      "formula"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Table salt (NaCl) forms when sodium (Na+) and chloride (Cl-) ions bond together through electrostatic attraction between oppositely charged ions."
  },
  {
    "id": "q-chem-007",
    "question": "What does an oxidation number indicate?",
    "answer": "Number of electrons gained or lost",
    "answerAlternates": [
      "Electron transfer"
    ],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-reactions",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "redox",
      "oxidation"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "An oxidation number represents how many electrons an atom has gained, lost, or shared in a chemical reaction, tracking electron transfer during redox processes."
  },
  {
    "id": "q-chem-008",
    "question": "What is the noble gas with atomic number 2?",
    "answer": "Helium",
    "answerAlternates": [
      "He"
    ],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-periodic",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "noble-gas",
      "element"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Helium is the second element on the periodic table with atomic number 2, and its full electron shells make it a stable noble gas."
  },
  {
    "id": "q-chem-009",
    "question": "What is the pH of acidic solution?",
    "answer": "Less than 7",
    "answerAlternates": [],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-acids",
    "difficulty": "intermediate",
    "pipeline": "quick_fact",
    "styleTags": [
      "ph",
      "acid"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Solutions with pH below 7 are acidic because they contain more hydrogen ions (H+) than hydroxide ions (OH-), giving them a sour taste and corrosive properties."
  },
  {
    "id": "q-chem-010",
    "question": "What is the chemical formula for glucose?",
    "answer": "C6H12O6",
    "answerAlternates": [],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-reactions",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "carbohydrate",
      "formula"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Glucose, the simple sugar that cells use for energy, has the molecular formula C6H12O6 representing six carbons, twelve hydrogens, and six oxygens bonded together."
  },
  {
    "id": "q-chem-011",
    "question": "What does electronegativity measure?",
    "answer": "Ability to attract electrons",
    "answerAlternates": [],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-bonds",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "bond",
      "electronegativity"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Electronegativity is a quantitative measure of how strongly an atom pulls electron density toward itself in a chemical bond."
  },
  {
    "id": "q-chem-012",
    "question": "What is the formula for sulfuric acid?",
    "answer": "H2SO4",
    "answerAlternates": [],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-acids",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "acid",
      "formula"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Sulfuric acid (H2SO4) is one of the strongest and most widely used industrial chemicals, containing two hydrogen atoms, one sulfur, and four oxygen atoms."
  },
  {
    "id": "q-chem-013",
    "question": "What is the lightest element?",
    "answer": "Hydrogen",
    "answerAlternates": [
      "H"
    ],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-periodic",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "element",
      "property"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Hydrogen is the lightest element with an atomic mass of 1, consisting of a single proton and electron, making it the first element on the periodic table."
  },
  {
    "id": "q-chem-014",
    "question": "What happens in a combustion reaction?",
    "answer": "Substance reacts with oxygen and releases energy",
    "answerAlternates": [
      "Burns",
      "Oxidizes"
    ],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-reactions",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "reaction",
      "combustion"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Combustion is a rapid oxidation reaction where a substance combines with oxygen, breaking chemical bonds and releasing the stored energy as heat and light."
  },
  {
    "id": "q-chem-015",
    "question": "What is the atomic number of oxygen?",
    "answer": "8",
    "answerAlternates": [],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-periodic",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "element",
      "atomic-number"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Oxygen's atomic number of 8 means it has 8 protons in its nucleus, and its position on the periodic table reflects its strong tendency to gain electrons."
  },
  {
    "id": "q-chem-016",
    "question": "What is a hydrogen bond?",
    "answer": "Weak attraction between hydrogen and electronegative atoms",
    "answerAlternates": [
      "Intermolecular force"
    ],
    "subjectId": "subj-chem",
    "subtopicId": "subtopic-bonds",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "bond",
      "hydrogen"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "A hydrogen bond is an intermolecular attraction that forms when hydrogen bonded to an electronegative atom (N, O, F) is attracted to another electronegative atom."
  },
  {
    "id": "q-hist-001",
    "question": "In what year did the US declare independence?",
    "answer": "1776",
    "answerAlternates": [],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-colonial",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "date",
      "independence"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Declaration of Independence was formally adopted on July 4, 1776, marking the thirteen colonies' official break from British rule."
  },
  {
    "id": "q-hist-002",
    "question": "Who was the first President of the United States?",
    "answer": "George Washington",
    "answerAlternates": [
      "Washington"
    ],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-leaders",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "president",
      "leader"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "George Washington was elected the first President and served from 1789 to 1797, establishing key precedents for the office."
  },
  {
    "id": "q-hist-003",
    "question": "What years did the Civil War span?",
    "answer": "1861-1865",
    "answerAlternates": [
      "1861 to 1865"
    ],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-civil-war",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "date",
      "civil-war"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Civil War began with the Confederate attack on Fort Sumter in April 1861 and concluded with Lee's surrender at Appomattox in April 1865."
  },
  {
    "id": "q-hist-004",
    "question": "Who was President during the Civil War?",
    "answer": "Abraham Lincoln",
    "answerAlternates": [
      "Lincoln"
    ],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-leaders",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "president",
      "civil-war"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Abraham Lincoln was elected President in 1860 and led the United States through the entire Civil War until his assassination in 1865."
  },
  {
    "id": "q-hist-005",
    "question": "In what year did the US enter World War II?",
    "answer": "1941",
    "answerAlternates": [],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-modern",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "date",
      "war"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The United States formally entered World War II on December 8, 1941, the day after the Japanese attack on Pearl Harbor, which occurred on December 7."
  },
  {
    "id": "q-hist-006",
    "question": "What document declared US independence?",
    "answer": "Declaration of Independence",
    "answerAlternates": [],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-colonial",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "document",
      "independence"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Written primarily by Thomas Jefferson, the Declaration of Independence articulated the colonists' grievances against Britain and their vision of natural rights."
  },
  {
    "id": "q-hist-007",
    "question": "Who won the Civil War?",
    "answer": "The Union (North)",
    "answerAlternates": [
      "North",
      "Union"
    ],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-civil-war",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "civil-war",
      "outcome"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Union won through its superior industrial capacity, larger population, and effective military leadership, ultimately forcing Confederate surrender."
  },
  {
    "id": "q-hist-008",
    "question": "What was the Emancipation Proclamation?",
    "answer": "Executive order freeing enslaved people in Confederate states",
    "answerAlternates": [
      "Lincoln freed slaves"
    ],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-civil-war",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "document",
      "slavery"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Issued by Lincoln in 1863, this executive order declared enslaved people in Confederate states to be free, combining moral principle with wartime strategy."
  },
  {
    "id": "q-hist-009",
    "question": "When did the Great Depression occur?",
    "answer": "1929-1939",
    "answerAlternates": [
      "1930s"
    ],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-modern",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "date",
      "economic"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Great Depression began with the stock market crash in October 1929 and persisted through the 1930s, causing mass unemployment and economic collapse."
  },
  {
    "id": "q-hist-010",
    "question": "Which President initiated the New Deal?",
    "answer": "Franklin D. Roosevelt",
    "answerAlternates": [
      "FDR",
      "Roosevelt"
    ],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-leaders",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "president",
      "new-deal"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "FDR won the presidency in 1932 and immediately implemented the New Deal, a comprehensive program of government intervention and public works to fight the Depression."
  },
  {
    "id": "q-hist-011",
    "question": "What started the Industrial Revolution in America?",
    "answer": "Development of factories and manufacturing",
    "answerAlternates": [
      "Factory system"
    ],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-industrial",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "industrial-revolution",
      "cause"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The American Industrial Revolution was powered by the rise of factory systems and mechanized manufacturing, particularly in northeastern states during the 19th century."
  },
  {
    "id": "q-hist-012",
    "question": "When did World War I occur?",
    "answer": "1914-1918",
    "answerAlternates": [],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-modern",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "date",
      "war"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "World War I lasted from 1914 to 1918, with the United States joining the Allied forces in 1917 after initially maintaining neutrality."
  },
  {
    "id": "q-hist-013",
    "question": "What was Jamestown?",
    "answer": "First permanent English settlement in North America",
    "answerAlternates": [
      "First colony",
      "Virginia colony"
    ],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-colonial",
    "difficulty": "intermediate",
    "pipeline": "quick_fact",
    "styleTags": [
      "colonial",
      "settlement"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Founded in 1607 in Virginia, Jamestown was the first permanent English colonial settlement in North America, thirteen years before Plymouth."
  },
  {
    "id": "q-hist-014",
    "question": "What were robber barons?",
    "answer": "Wealthy businessmen using unethical practices during industrialization",
    "answerAlternates": [
      "Industrialists",
      "Businessmen"
    ],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-industrial",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "industrial-era",
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Robber barons like Rockefeller and Carnegie amassed fortunes through monopolistic practices, labor exploitation, and occasionally corrupt political influence during industrialization."
  },
  {
    "id": "q-hist-015",
    "question": "What was the Cuban Missile Crisis?",
    "answer": "Standoff between US and Soviet Union over nuclear missiles in Cuba",
    "answerAlternates": [
      "Nuclear standoff",
      "Cold War confrontation"
    ],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-modern",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "cold-war",
      "crisis"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "In October 1962, the US discovered Soviet nuclear missiles deployed in Cuba, creating a tense standoff resolved through diplomatic negotiation without military conflict."
  },
  {
    "id": "q-hist-016",
    "question": "What war occurred after the American Revolution?",
    "answer": "War of 1812",
    "answerAlternates": [],
    "subjectId": "subj-hist",
    "subtopicId": "subtopic-colonial",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "war",
      "history"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The War of 1812 was fought between the United States and Britain approximately three decades after American independence, driven by trade disputes and territorial tensions."
  },
  {
    "id": "q-chi-001",
    "question": "What is the Pinyin for 中?",
    "answer": "zhōng",
    "answerAlternates": [],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-hsk12",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "translation"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "中 (zhōng) is pronounced with a high-level first tone, written zhōng in pinyin; it means center or middle."
  },
  {
    "id": "q-chi-002",
    "question": "Translate: 爱 means what in English?",
    "answer": "love",
    "answerAlternates": [
      "to love"
    ],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-hsk12",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "translation"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "爱 (ài) is the Chinese character for love, commonly used as both a noun and verb in HSK 1 vocabulary."
  },
  {
    "id": "q-chi-003",
    "question": "What is the character for \"water\" radical?",
    "answer": "氵",
    "answerAlternates": [
      "水"
    ],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-radicals",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The water radical appears in two forms: 水 (full form) and 氵 (three-drop form used within characters); 氵 is the standard radical notation."
  },
  {
    "id": "q-chi-004",
    "question": "What does 你好 mean?",
    "answer": "hello",
    "answerAlternates": [
      "hi",
      "good day"
    ],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-phrases",
    "difficulty": "basic",
    "pipeline": "quick_fact",
    "styleTags": [
      "translation"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "你好 literally combines 你 (you) and 好 (good), making a greeting that translates to hello or hi in English."
  },
  {
    "id": "q-chi-005",
    "question": "The fire radical (火) appears in which character: 燃, 水, or 火?",
    "answer": "燃",
    "answerAlternates": [],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-radicals",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "identification"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "燃 (burn) contains the fire radical 火 on the left, while 水 (water) contains the water radical and 火 as standalone means fire itself, not a combination."
  },
  {
    "id": "q-chi-006",
    "question": "Pinyin for 谢谢 (thank you)?",
    "answer": "xièxiè",
    "answerAlternates": [
      "xiè xiè"
    ],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-phrases",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "translation"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "谢谢 (thank you) is pronounced xièxiè, with both characters having the falling fourth tone; pinyin can write it as one word or with a space."
  },
  {
    "id": "q-chi-007",
    "question": "How many strokes does 书 have?",
    "answer": "4",
    "answerAlternates": [
      "four"
    ],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-components",
    "difficulty": "intermediate",
    "pipeline": "quick_fact",
    "styleTags": [
      "count"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "书 (book) has 4 strokes in simplified Chinese: a dot, a horizontal, a horizontal bend-hook, and a final horizontal - the same stroke pattern as 与 (yu) with an added dot on top, not a vertical-plus-three-horizontals shape."
  },
  {
    "id": "q-chi-008",
    "question": "What is the classical Chinese idiom 成语?",
    "answer": "a four-character fixed expression with historical/cultural origin",
    "answerAlternates": [
      "four-character idiom",
      "proverb"
    ],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-phrases",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "成语 refers to a four-character fixed expression (chéngyǔ) with historical or cultural origins, often carrying metaphorical meaning, distinct from regular phrases."
  },
  {
    "id": "q-chi-009",
    "question": "Which component appears in both 明 and 日?",
    "answer": "日",
    "answerAlternates": [],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-components",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "identification"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "日 (sun/day) is a rectangular component that appears as the core element in 明 (bright), while 日 by itself is just that component standalone."
  },
  {
    "id": "q-chi-010",
    "question": "What is HSK?",
    "answer": "Chinese proficiency test for non-native speakers",
    "answerAlternates": [
      "Hanyu Shuiping Kaoshi"
    ],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-hsk34",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "HSK stands for Hanyu Shuiping Kaoshi (汉语水平考试), the official standardized proficiency test for non-native speakers of Chinese."
  },
  {
    "id": "q-chi-011",
    "question": "The radical 人 appears in which word: 人, 水, or 心?",
    "answer": "人",
    "answerAlternates": [],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-radicals",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "identification"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "人 (person/human) is the radical itself; 水 contains the water radical 氵, and 心 (heart) contains the heart radical, not the person radical."
  },
  {
    "id": "q-chi-012",
    "question": "What does 麻烦 mean?",
    "answer": "trouble or inconvenience",
    "answerAlternates": [
      "bothersome"
    ],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-hsk34",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "translation"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "麻烦 (máfan) combines 麻 (hemp/numb) and 烦 (annoyed), semantic composition meaning trouble, inconvenience, or to bother someone."
  },
  {
    "id": "q-chi-013",
    "question": "How many standard radicals exist in Chinese?",
    "answer": "214",
    "answerAlternates": [],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-radicals",
    "difficulty": "intermediate",
    "pipeline": "quick_fact",
    "styleTags": [
      "count"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Modern Chinese uses 214 standard radicals as defined in the Kangxi Dictionary; this is the universally accepted count for all Chinese characters."
  },
  {
    "id": "q-chi-014",
    "question": "The phrase 买办 (comprador) combines which radicals?",
    "answer": "貝 and 力",
    "answerAlternates": [
      "shell and power"
    ],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-components",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "analysis"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "买办 (comprador/middleman) combines 买 (containing 貝 shell radical, relating to commerce/money) and 办 (containing 力 power/strength radical)."
  },
  {
    "id": "q-chi-015",
    "question": "What are the six levels of HSK proficiency?",
    "answer": "1, 2, 3, 4, 5, 6",
    "answerAlternates": [
      "HSK 1 through 6"
    ],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-hsk34",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "count"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "HSK has six official proficiency levels numbered 1 through 6, with 1 being beginner and 6 being advanced mastery for non-native speakers."
  },
  {
    "id": "q-chi-016",
    "question": "In seal script (篆书), do character forms resemble modern simplified forms?",
    "answer": "no",
    "answerAlternates": [],
    "subjectId": "subj-chi",
    "subtopicId": "subtopic-chi-components",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Seal script (篆书) uses curved, flowing strokes with tight spacing that bear little visual resemblance to modern simplified forms, reflecting ancient calligraphy rather than contemporary writing."
  },
  {
    "id": "q-geo2-001",
    "question": "What is the Mohs hardness of quartz?",
    "answer": "7",
    "answerAlternates": [],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-minerals",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "fact"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Quartz is a reference mineral on the Mohs hardness scale, defined as having a hardness of 7 on the 1-10 scale."
  },
  {
    "id": "q-geo2-002",
    "question": "Name the three main rock types.",
    "answer": "igneous, sedimentary, metamorphic",
    "answerAlternates": [],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-rocks",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "All rocks on Earth are classified into three fundamental categories based on how they form: molten material cooling (igneous), sediment compacting and cementing (sedimentary), and existing rock transforming under heat/pressure (metamorphic)."
  },
  {
    "id": "q-geo2-003",
    "question": "What is plate tectonics?",
    "answer": "theory that Earths crust consists of moving plates",
    "answerAlternates": [
      "plate movement theory"
    ],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-tectonics",
    "difficulty": "basic",
    "pipeline": "quick_fact",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Plate tectonics is the unifying theory of modern geology explaining how Earth's crust is divided into mobile plates that interact through collisions, spreading, and sliding."
  },
  {
    "id": "q-geo2-004",
    "question": "Which layer is thickest: crust, mantle, or core?",
    "answer": "mantle",
    "answerAlternates": [],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-structure",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "fact"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The mantle comprises the vast bulk of Earth's interior between the thin crust and the core, extending roughly 2,900 km deep and accounting for most of Earth's mass."
  },
  {
    "id": "q-geo2-005",
    "question": "What does basalt form from?",
    "answer": "lava cooling quickly",
    "answerAlternates": [
      "rapid cooling of mafic magma"
    ],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-rocks",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Basalt forms when lava extrudes onto Earth's surface and cools quickly, creating a fine-grained, dense igneous rock typical of oceanic crust."
  },
  {
    "id": "q-geo2-006",
    "question": "What occurs at a convergent plate boundary?",
    "answer": "plates collide and are pushed together",
    "answerAlternates": [
      "collision or subduction"
    ],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-tectonics",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "At convergent plate boundaries, plates move toward each other, causing them to collide, with results ranging from subduction to mountain building depending on plate density."
  },
  {
    "id": "q-geo2-007",
    "question": "What is the Mohorovičić discontinuity?",
    "answer": "boundary between crust and mantle",
    "answerAlternates": [
      "Moho boundary",
      "crust-mantle interface"
    ],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-structure",
    "difficulty": "intermediate",
    "pipeline": "quick_fact",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Mohorovičić discontinuity (Moho) is the sharp seismic boundary separating the crust from the denser mantle below, identified by changes in seismic wave velocities."
  },
  {
    "id": "q-geo2-008",
    "question": "Which mineral is harder: diamond or feldspar?",
    "answer": "diamond",
    "answerAlternates": [],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-minerals",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "comparison"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Diamond is the hardest naturally occurring substance (10 on Mohs scale), while feldspar is a much softer mineral (around 6 on the scale)."
  },
  {
    "id": "q-geo2-009",
    "question": "What does relative dating determine?",
    "answer": "age of rocks compared to other rocks, not absolute age",
    "answerAlternates": [
      "comparative age ordering"
    ],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-time",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Relative dating establishes the chronological sequence of rocks by comparing their ages to one another rather than assigning specific absolute ages in years."
  },
  {
    "id": "q-geo2-010",
    "question": "Name Earth's four major geological eons.",
    "answer": "Hadean, Archean, Proterozoic, Phanerozoic",
    "answerAlternates": [],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-time",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Earth's geologic history is divided into four eons spanning 4.6 billion years: Hadean (earliest), Archean, Proterozoic, and Phanerozoic (most recent, containing visible life)."
  },
  {
    "id": "q-geo2-011",
    "question": "What is luster in mineralogy?",
    "answer": "how light reflects from mineral surface",
    "answerAlternates": [
      "mineral shine or reflection"
    ],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-minerals",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Luster describes how a mineral's surface reflects light, ranging from metallic and glassy to dull or pearly, and is a key identifying property in mineralogy."
  },
  {
    "id": "q-geo2-012",
    "question": "What happens during metamorphism?",
    "answer": "rocks change due to heat and pressure",
    "answerAlternates": [
      "transformation without melting"
    ],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-rocks",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Metamorphism occurs when existing rock is subjected to intense heat and pressure, causing minerals to recrystallize and the rock to change without fully melting."
  },
  {
    "id": "q-geo2-013",
    "question": "What is subduction?",
    "answer": "oceanic plate pushed beneath continental plate",
    "answerAlternates": [
      "plate sinking into mantle"
    ],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-tectonics",
    "difficulty": "intermediate",
    "pipeline": "quick_fact",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Subduction is the process where a denser oceanic plate descends beneath a lighter continental plate at a convergent boundary, recycling crust into the mantle."
  },
  {
    "id": "q-geo2-014",
    "question": "What is the Gutenberg discontinuity?",
    "answer": "boundary between the mantle and the outer core",
    "answerAlternates": [
      "core boundary"
    ],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-structure",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Gutenberg discontinuity is the seismic boundary between the mantle and the liquid outer core (~2,891 km depth), discovered by Beno Gutenberg. The separate boundary between the outer and inner core is a different feature entirely."
  },
  {
    "id": "q-geo2-015",
    "question": "What is an index fossil used for?",
    "answer": "determining relative age of rock layers",
    "answerAlternates": [
      "dating strata",
      "biostratigraphy"
    ],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-time",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Index fossils are organisms that lived for a relatively brief geological time span and spread widely, making them ideal markers for dating rock layers through biostratigraphy."
  },
  {
    "id": "q-geo2-016",
    "question": "How does radiometric dating calculate age?",
    "answer": "measures radioactive decay of isotopes",
    "answerAlternates": [
      "comparing isotope ratios"
    ],
    "subjectId": "subj-geo2",
    "subtopicId": "subtopic-geo2-time",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Radiometric dating calculates the absolute age of rocks by measuring the ratio of radioactive parent isotopes to their decay products, using known half-lives to determine elapsed time."
  },
  {
    "id": "q-astro-001",
    "question": "What is a star mainly composed of?",
    "answer": "hydrogen and helium",
    "answerAlternates": [],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-stars",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Hydrogen and helium comprise roughly 99% of stellar mass and are the primary fuel sources for the thermonuclear fusion that powers stars."
  },
  {
    "id": "q-astro-002",
    "question": "How many planets orbit the Sun?",
    "answer": "8",
    "answerAlternates": [
      "eight"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-planets",
    "difficulty": "basic",
    "pipeline": "quick_fact",
    "styleTags": [
      "count"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "In 2006, the International Astronomical Union formally defined eight planets based on orbital characteristics; Pluto was reclassified as a dwarf planet."
  },
  {
    "id": "q-astro-003",
    "question": "What is the habitable zone?",
    "answer": "region around star where liquid water can exist",
    "answerAlternates": [
      "Goldilocks zone"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-planets",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The habitable zone is the orbital region around a star where temperatures allow liquid water to exist on a planet's surface, a necessary condition for known life."
  },
  {
    "id": "q-astro-004",
    "question": "Name the Milky Way's galaxy type.",
    "answer": "spiral",
    "answerAlternates": [
      "barred spiral"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-galaxies",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Milky Way is classified as a spiral galaxy with evidence of a central bar structure, characterized by a flat disk with spiral arms extending from the core."
  },
  {
    "id": "q-astro-005",
    "question": "What is escape velocity?",
    "answer": "minimum speed needed to leave gravitational field",
    "answerAlternates": [
      "speed to break free from gravity"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-mechanics",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Escape velocity is the minimum speed an object must reach to break free from a celestial body's gravitational field, derived from equating kinetic energy to gravitational potential energy."
  },
  {
    "id": "q-astro-006",
    "question": "What is Kepler's First Law?",
    "answer": "planets orbit in ellipses with sun at one focus",
    "answerAlternates": [
      "elliptical orbits"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-mechanics",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Kepler's First Law, derived from astronomical observations, states that planetary orbits are ellipses with the sun at one of the two foci."
  },
  {
    "id": "q-astro-007",
    "question": "What is a redshift?",
    "answer": "wavelength shift toward red when object moves away",
    "answerAlternates": [
      "Doppler shift",
      "light stretched"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-galaxies",
    "difficulty": "intermediate",
    "pipeline": "quick_fact",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Redshift is the Doppler shift of light toward longer wavelengths (red end of spectrum) that occurs when an object moves away from an observer."
  },
  {
    "id": "q-astro-008",
    "question": "What is the Hertzsprung-Russell diagram used for?",
    "answer": "plotting stellar brightness against temperature",
    "answerAlternates": [
      "star classification",
      "H-R diagram"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-stars",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Hertzsprung-Russell diagram plots stars by their luminosity (brightness) against their surface temperature, revealing distinct stellar populations and evolution patterns."
  },
  {
    "id": "q-astro-009",
    "question": "What is a supermassive black hole?",
    "answer": "black hole at galaxy center, millions/billions solar masses",
    "answerAlternates": [
      "giant black hole"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-galaxies",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Supermassive black holes at galaxy centers have masses between millions and billions of solar masses and likely formed through accretion and mergers in galactic centers."
  },
  {
    "id": "q-astro-010",
    "question": "Where is the Kuiper Belt?",
    "answer": "beyond Neptune, icy bodies region",
    "answerAlternates": [
      "outer solar system"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-solar",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Kuiper Belt is a region of icy bodies beyond Neptune's orbit, extending from about 30 to 55 AU and serving as the source of short-period comets."
  },
  {
    "id": "q-astro-011",
    "question": "What causes solar flares?",
    "answer": "sudden release of magnetic energy from sun",
    "answerAlternates": [
      "solar magnetic discharge"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-solar",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Solar flares are sudden, violent releases of magnetic energy from the sun's surface, triggered by instabilities in the solar magnetic field."
  },
  {
    "id": "q-astro-012",
    "question": "What is parallax distance measurement?",
    "answer": "calculating distance by shift in star position",
    "answerAlternates": [
      "apparent movement method"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-stars",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Parallax distance measurement uses the apparent shift in a star's position as Earth orbits the sun; the magnitude of this shift is inversely proportional to the star's distance."
  },
  {
    "id": "q-astro-013",
    "question": "What is an exoplanet?",
    "answer": "planet orbiting star other than the sun",
    "answerAlternates": [
      "extrasolar planet"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-planets",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "An exoplanet is any planet orbiting a star outside our solar system; thousands have been discovered since the first confirmation in 1992."
  },
  {
    "id": "q-astro-014",
    "question": "What is a Lagrange point?",
    "answer": "position where gravitational forces balance",
    "answerAlternates": [
      "orbital equilibrium point"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-mechanics",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Lagrange points are five positions where the gravitational pull of two orbiting bodies (like the sun and a planet) balances the centripetal force needed to keep a small object fixed relative to them. Only L4 and L5 are stable equilibria; L1, L2, and L3 are unstable and need periodic station-keeping."
  },
  {
    "id": "q-astro-015",
    "question": "What is the Oort Cloud?",
    "answer": "spherical shell of icy bodies surrounding solar system",
    "answerAlternates": [
      "cometary cloud"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-solar",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The Oort Cloud is a theoretical spherical shell of icy bodies surrounding the solar system at great distances, believed to be the source of long-period comets."
  },
  {
    "id": "q-astro-016",
    "question": "What is stellar fusion?",
    "answer": "hydrogen combines into helium, releasing energy",
    "answerAlternates": [
      "nuclear fusion in stars"
    ],
    "subjectId": "subj-astro",
    "subtopicId": "subtopic-astro-stars",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Stellar fusion in stars combines hydrogen nuclei into helium through thermonuclear reactions at stellar cores, releasing enormous energy that powers the star's luminosity."
  },
  {
    "id": "q-cs-001",
    "question": "What is an array?",
    "answer": "ordered collection of elements stored contiguously",
    "answerAlternates": [
      "linear data structure"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-structures",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "An array is the most basic linear data structure where elements are stored in contiguous memory locations, enabling constant-time O(1) random access via index."
  },
  {
    "id": "q-cs-002",
    "question": "What does Big O notation measure?",
    "answer": "algorithm efficiency/growth rate with input size",
    "answerAlternates": [
      "time or space complexity"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-algorithms",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Big O notation describes the asymptotic complexity of algorithms, expressing how runtime or space requirements scale as input size increases, independent of constant factors."
  },
  {
    "id": "q-cs-003",
    "question": "Name five common sorting algorithms.",
    "answer": "bubble sort, quick sort, merge sort, heap sort, insertion sort",
    "answerAlternates": [],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-algorithms",
    "difficulty": "intermediate",
    "pipeline": "quick_fact",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "These five algorithms represent the most commonly studied sorting methods, each with distinct tradeoffs: bubble sort (simple but slow), quick sort (fast average case), merge sort (guaranteed O(n log n)), heap sort (guaranteed O(n log n) with less space), and insertion sort (efficient for small or nearly-sorted data)."
  },
  {
    "id": "q-cs-004",
    "question": "What is a hash table?",
    "answer": "data structure mapping keys to values using hash function",
    "answerAlternates": [
      "associative array",
      "hash map"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-structures",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "A hash table uses a hash function to map keys to array indices, enabling fast average-case O(1) insert, delete, and lookup operations despite occasional collisions."
  },
  {
    "id": "q-cs-005",
    "question": "What does TCP stand for?",
    "answer": "Transmission Control Protocol",
    "answerAlternates": [],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-networking",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "TCP (Transmission Control Protocol) is a connection-oriented protocol in the transport layer that ensures reliable, in-order delivery of data streams across the internet."
  },
  {
    "id": "q-cs-006",
    "question": "What is normalization in databases?",
    "answer": "organizing data to reduce redundancy and dependency",
    "answerAlternates": [
      "minimizing data duplication"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-databases",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Database normalization systematically organizes data through rules (1NF, 2NF, 3NF, etc.) to eliminate redundancy, ensure consistency, and reduce storage waste."
  },
  {
    "id": "q-cs-007",
    "question": "What is dynamic programming?",
    "answer": "solving by breaking into subproblems and storing solutions",
    "answerAlternates": [
      "memoization technique"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-algorithms",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Dynamic programming optimizes recursive algorithms by decomposing problems into overlapping subproblems and memoizing (caching) solutions to avoid redundant recomputation."
  },
  {
    "id": "q-cs-008",
    "question": "What is ACID in databases?",
    "answer": "atomicity, consistency, isolation, durability",
    "answerAlternates": [],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-databases",
    "difficulty": "intermediate",
    "pipeline": "quick_fact",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "ACID properties (atomicity, consistency, isolation, durability) guarantee that database transactions are reliable units of work that either fully complete or fully roll back, maintaining data integrity."
  },
  {
    "id": "q-cs-009",
    "question": "What is a stack?",
    "answer": "last-in-first-out data structure (LIFO)",
    "answerAlternates": [
      "LIFO collection"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-structures",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "A stack is a Last-In-First-Out (LIFO) abstract data type where elements are pushed and popped from a single end, used in recursive algorithms, function calls, and expression evaluation."
  },
  {
    "id": "q-cs-010",
    "question": "What is functional programming?",
    "answer": "programming using functions as first-class objects",
    "answerAlternates": [
      "function-based paradigm",
      "immutable data"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-paradigms",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Functional programming treats functions as first-class objects that can be passed as arguments and returned as values, emphasizes immutable data, and avoids side effects."
  },
  {
    "id": "q-cs-011",
    "question": "What is DNS?",
    "answer": "Domain Name System translates domain names to IP addresses",
    "answerAlternates": [
      "domain name resolution"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-networking",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "DNS (Domain Name System) is a distributed hierarchical database and protocol that translates human-readable domain names into IP addresses, enabling internet communication."
  },
  {
    "id": "q-cs-012",
    "question": "What is NP-complete?",
    "answer": "problem whose solution can be verified in polynomial time",
    "answerAlternates": [
      "computationally hard problem class"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-algorithms",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "NP-complete problems are in a complexity class where a proposed solution can be verified in polynomial time, though finding one may require exponential time; they are believed (but unproven) to be harder than polynomial-time solvable problems."
  },
  {
    "id": "q-cs-013",
    "question": "What is a design pattern?",
    "answer": "reusable solution to common programming problem",
    "answerAlternates": [
      "code structure template"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-paradigms",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "A design pattern is a reusable architectural template (like Singleton, Observer, Factory) that provides a proven solution to common recurring problems in software design."
  },
  {
    "id": "q-cs-014",
    "question": "What is sharding in databases?",
    "answer": "partitioning data across multiple servers",
    "answerAlternates": [
      "horizontal partitioning"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-databases",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Sharding (horizontal partitioning) divides a large dataset across multiple database servers based on a shard key, improving scalability and query performance."
  },
  {
    "id": "q-cs-015",
    "question": "What is a graph?",
    "answer": "data structure with nodes connected by edges",
    "answerAlternates": [
      "network of vertices and edges"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-structures",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "A graph is a non-linear data structure consisting of vertices (nodes) connected by edges, used to represent networks, relationships, and interconnected data."
  },
  {
    "id": "q-cs-016",
    "question": "What is distributed consensus?",
    "answer": "agreement protocol for multiple independent systems",
    "answerAlternates": [
      "Byzantine agreement",
      "consensus algorithm"
    ],
    "subjectId": "subj-cs",
    "subtopicId": "subtopic-cs-databases",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Distributed consensus algorithms (like Raft or PBFT) enable a group of independent systems to agree on a value or decision despite potential network failures or Byzantine participants."
  },
  {
    "id": "q-music-001",
    "question": "What is an interval?",
    "answer": "distance in pitch between two notes",
    "answerAlternates": [
      "pitch relationship"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-intervals",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "An interval is the measurable distance between two pitches, expressed in semitones or specific interval names like major third or perfect fifth."
  },
  {
    "id": "q-music-002",
    "question": "How many semitones in an octave?",
    "answer": "12",
    "answerAlternates": [
      "twelve"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-intervals",
    "difficulty": "basic",
    "pipeline": "quick_fact",
    "styleTags": [
      "count"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Western equal temperament divides the octave into 12 equal semitones; this is the standard tuning system for modern instruments."
  },
  {
    "id": "q-music-003",
    "question": "What is a triad?",
    "answer": "chord with three notes stacked in thirds",
    "answerAlternates": [
      "three-note chord"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-harmony",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "A triad consists of three notes stacked in thirds (root, third, fifth), forming the foundation of harmony in Western music theory."
  },
  {
    "id": "q-music-004",
    "question": "What time signature is common time?",
    "answer": "4/4",
    "answerAlternates": [
      "four-four"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-rhythm",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Common time is 4/4 time signature, meaning four beats per measure with the quarter note receiving one beat; it is the most prevalent meter in popular and classical music."
  },
  {
    "id": "q-music-005",
    "question": "What is a major scale?",
    "answer": "scale pattern with specific whole/half step intervals",
    "answerAlternates": [
      "Ionian mode"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-scales",
    "difficulty": "basic",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "A major scale follows a specific pattern of whole and half steps: W-W-H-W-W-W-H, also called the Ionian mode."
  },
  {
    "id": "q-music-006",
    "question": "How many notes are in a pentatonic scale?",
    "answer": "5",
    "answerAlternates": [
      "five"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-scales",
    "difficulty": "intermediate",
    "pipeline": "quick_fact",
    "styleTags": [
      "count"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "A pentatonic scale contains exactly five notes, commonly found in folk traditions across cultures and in jazz improvisation."
  },
  {
    "id": "q-music-007",
    "question": "What is voice leading?",
    "answer": "smooth progression of independent melodic lines",
    "answerAlternates": [
      "part writing",
      "counterpoint"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-harmony",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Voice leading is the art of moving each melodic line smoothly from one note to the next, minimizing large jumps and creating coherent independent parts."
  },
  {
    "id": "q-music-008",
    "question": "What are the modes of the major scale?",
    "answer": "Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian",
    "answerAlternates": [],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-scales",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The seven modes of the major scale each start on a different scale degree: Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, and Locrian."
  },
  {
    "id": "q-music-009",
    "question": "What is chord inversion?",
    "answer": "rearranging chord tones so root is not lowest",
    "answerAlternates": [
      "changing bass note"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-harmony",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Chord inversion rearranges the notes so the root is not the lowest pitch; first inversion has the third as lowest note, second inversion has the fifth as lowest."
  },
  {
    "id": "q-music-010",
    "question": "What is syncopation?",
    "answer": "emphasis on weak beats instead of strong beats",
    "answerAlternates": [
      "off-beat rhythm"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-rhythm",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Syncopation shifts the musical emphasis away from the downbeat or strong beats to weak beats or the space between beats, creating rhythmic surprise."
  },
  {
    "id": "q-music-011",
    "question": "What is Roman numeral analysis?",
    "answer": "system for analyzing chords using Roman numerals",
    "answerAlternates": [
      "chord function identification"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-harmony",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Roman numeral analysis uses I, ii, iii, IV, etc. to label chords by their function within a key, showing relationships like dominant (V) resolving to tonic (I)."
  },
  {
    "id": "q-music-012",
    "question": "What is the circle of fifths?",
    "answer": "diagram showing relationships between key signatures",
    "answerAlternates": [
      "key relationship chart"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-scales",
    "difficulty": "intermediate",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "The circle of fifths arranges all 12 major and minor keys in a circle, showing which keys are closely related by sharps and flats, aiding modulation and transposition."
  },
  {
    "id": "q-music-013",
    "question": "What is sonata form?",
    "answer": "large form with exposition, development, and recapitulation",
    "answerAlternates": [
      "three-section form"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-form",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Sonata form is a large structural form with three main sections: exposition (presents themes), development (explores and varies themes), and recapitulation (returns to themes)."
  },
  {
    "id": "q-music-014",
    "question": "What is serialism?",
    "answer": "twelve-tone technique where all notes used equally",
    "answerAlternates": [
      "twelve-tone composition"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-form",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Serialism, or twelve-tone technique, treats all 12 chromatic notes as equal, using each once before repeating any, preventing traditional tonal hierarchy."
  },
  {
    "id": "q-music-015",
    "question": "What is polyrhythm?",
    "answer": "simultaneous use of different rhythmic patterns",
    "answerAlternates": [
      "conflicting rhythms"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-rhythm",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Polyrhythm layers two or more rhythmic patterns simultaneously with different pulses or subdivisions, creating complex interlocking rhythmic texture."
  },
  {
    "id": "q-music-016",
    "question": "What is modulation?",
    "answer": "shift from one key to another key",
    "answerAlternates": [
      "key change"
    ],
    "subjectId": "subj-music",
    "subtopicId": "subtopic-music-harmony",
    "difficulty": "advanced",
    "pipeline": "main_recall",
    "styleTags": [
      "definition"
    ],
    "sourceNote": null,
    "source": "seed",
    "status": "active",
    "flagged": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "timesShown": 0,
      "timesCorrect": 0,
      "timesWrong": 0,
      "lastShownAt": null,
      "correctDays": []
    },
    "explanation": "Modulation is a deliberate shift from one key to another key within a piece, often used to add harmonic interest and expand the tonal space."
  }
];

export const SEED_WEIGHTS = {
  "subject": {},
  "tag": {},
  "question": {
    "q-geo-001": 20,
    "q-geo-002": 80,
    "q-geo-003": 10
  }
};

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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
  },
  {
    "id": "q-geo2-014",
    "question": "What is the Gutenberg discontinuity?",
    "answer": "boundary between outer and inner core",
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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

// ASVAB practice subject + subtopic checklists, used only to seed the
// dedicated ASVAB module (see asvabLoader.js). Checklist items are curriculum
// bullet points (for coverage tracking on the Bubbles page), not questions.

export const ASVAB_SUBJECT = {
  id: 'subj-asvab',
  name: 'ASVAB Practice',
  color: 'hsl(230, 30%, 55%)',
  visibleToProfiles: ['main_recall', 'quick_facts', 'auto_all', 'auto_scoped', 'focused_review'],
  subtopics: [
    {
      id: 'subtopic-word-knowledge',
      name: 'Word Knowledge',
      checklist: {
        basic: ['Common synonyms/antonyms', 'Everyday vocabulary in context'],
        intermediate: ['Root words (Latin/Greek)', 'Moderately advanced vocabulary', 'Word-to-meaning recall'],
        advanced: ['Nuanced synonym discrimination', 'Low-frequency vocabulary'],
      },
    },
    {
      id: 'subtopic-paragraph-comprehension',
      name: 'Paragraph / Sentence Comprehension',
      checklist: {
        basic: ['Meaning of a word/phrase in context', 'Literal sentence meaning'],
        intermediate: ['Main idea identification', 'Inference from context'],
        advanced: ['Multi-clause sentence interpretation'],
      },
    },
    {
      id: 'subtopic-arithmetic-reasoning',
      name: 'Arithmetic Reasoning',
      checklist: {
        basic: ['Basic rate/time/distance', 'Percentages and discounts'],
        intermediate: ['Ratios and mixtures', 'Simple interest', 'Multi-step word problems'],
        advanced: ['Compound word problems with multiple constraints'],
      },
    },
    {
      id: 'subtopic-mathematics-knowledge',
      name: 'Mathematics Knowledge',
      checklist: {
        basic: ['Order of operations', 'Basic algebra (solve for x)'],
        intermediate: ['Exponents and roots', 'Geometry formulas (area/volume)', 'Scientific notation'],
        advanced: ['Pythagorean theorem', 'Circumference vs. area', 'Mean/median/mode'],
      },
    },
    {
      id: 'subtopic-physical-science',
      name: 'Physical Science',
      checklist: {
        basic: ['States of matter', 'Basic chemistry (pH, elements)'],
        intermediate: ["Newton's Three Laws of Motion", 'Energy types (kinetic/potential/chemical)'],
        advanced: ['Physics formulas (velocity, momentum, density)', 'Mass vs. weight distinction'],
      },
    },
    {
      id: 'subtopic-earth-space-science',
      name: 'Earth & Space Science',
      checklist: {
        basic: ['Atmosphere layers', 'Solar system planets'],
        intermediate: ["Earth's internal layers", 'Cloud types and weather fronts'],
        advanced: ['Geologic eras and fossils', 'Eclipses, tides, and orbital mechanics'],
      },
    },
    {
      id: 'subtopic-biology',
      name: 'Biology',
      checklist: {
        basic: ['Cell as basic unit of life', 'DNA and genetics basics'],
        intermediate: ['Cell organelles and functions', 'Human body systems'],
        advanced: ['Taxonomy and classification hierarchy', 'Binomial nomenclature'],
      },
    },
    {
      id: 'subtopic-mechanical-comprehension',
      name: 'Mechanical Comprehension',
      checklist: {
        basic: ['Simple machines (levers, ramps)', 'Basic pulley systems'],
        intermediate: ['Gears and mechanical advantage', 'Pressure and hydraulics'],
        advanced: ['Work in joules (W = F × d)', 'Torque and force balance problems'],
      },
    },
    {
      id: 'subtopic-electronics-information',
      name: 'Electronics Information',
      checklist: {
        basic: ["Ohm's Law basics", 'Circuit components (resistor, capacitor)'],
        intermediate: ['Series vs. parallel circuits', 'AC vs. DC'],
        advanced: ['Transistors and semiconductors', 'Reactance and electromagnetism'],
      },
    },
    {
      id: 'subtopic-auto-shop-information',
      name: 'Auto & Shop Information',
      checklist: {
        basic: ['Common hand tools', 'Basic engine components'],
        intermediate: ['Automotive systems (transmission, alternator)', 'Fastener and nail types'],
        advanced: ['Diesel vs. gasoline ignition', 'Emissions systems (EGR, PCV, catalytic converter)'],
      },
    },
  ],
};

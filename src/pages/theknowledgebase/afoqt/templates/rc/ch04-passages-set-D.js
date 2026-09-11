// Reading Comprehension, Set D — band 4.
// Topic domain: intelligence and decision-making (intelligence cycle, analytic tradecraft and
// cognitive bias, indications and warning, deception and counterdeception, open-source
// intelligence, and the intelligence-policy relationship).
//
// Same contract as ch01-passages-set-A.js / ch02-passages-set-B.js: PME/Joint-Force strategic
// prose, lines arrays joined with '\n', registerPassages() only (no passageTemplates() call -
// template registration is centralized elsewhere). Every vocabulary-in-context "line N" reference
// was checked against the actual array index (1-indexed, blank paragraph-break entries counted)
// using a throwaway wrap/number script before this file was written - see
// docs/afoqt/RC-AUTHORING-SPEC.md section 3 for why a hand count is not trustworthy on its own.
//
// Per-passage type distribution follows the sheet-lock-safe pattern from set B: main-idea x1,
// author-agreement x1, detail-inference x1, function-of-paragraph x1, vocabulary-in-context x2 -
// four distinct types, six questions, both pooled pairs land on exactly two eligible items.
//
// Subject matter is grounded in real, unclassified, widely documented doctrine and history
// (the intelligence cycle as taught in joint doctrine, the tradecraft/cognitive-bias literature
// following Richards Heuer's public-domain CIA work, the general historical record of Operation
// Fortitude before Normandy, the well documented rise of open-source intelligence, and the
// standard treatment of the intelligence-policy line associated with the Sherman Kent tradition)
// but the prose itself is original - no passage reproduces text from any commercial source.

import { registerPassages } from '../../engine/passage.js';

const MI_STEMS = [
  'Which choice best expresses the main point of the passage?',
  'Which of the following best captures the central argument of the passage?',
  'The passage as a whole is most concerned with establishing which idea?',
  'Which choice best states what the passage as a whole is arguing?',
  'Which of the following best identifies the main idea of the passage?',
  'Which choice best summarizes the overall argument the passage makes?',
];
const AA_STEMS = [
  'Which statement would the author of this passage be most likely to defend?',
  'The passage gives the clearest sign that its author holds that:',
  'Which statement would the author of this passage most likely accept as accurate?',
  "Based on the passage, which claim is most consistent with the author's argument?",
  'Which of the following claims would the author be most ready to grant?',
  'The author would most likely agree with which of the following claims?',
];

// ================================================================================================
// rc-031 — The intelligence cycle, and why the tidy circular diagram misrepresents practice.
// ================================================================================================

const P31_LINES = [
  'The intelligence cycle is usually taught as a closed loop of five or six named phases: planning and direction, collection,',
  'processing and exploitation, analysis and production, dissemination, and feedback. The diagram is meant to give a new analyst or an',
  'outside policymaker a simple mental model of an otherwise sprawling enterprise, showing intelligence work as an orderly sequence that begins',
  'with a stated requirement and ends with a delivered product that in',
  'turn reshapes the next requirement, closing the loop cleanly on paper.',
  '',
  'The first way the tidy diagram misleads is that these phases run concurrently rather than one after another inside a',
  'real intelligence organization. Collection against an unresolved requirement typically continues even as analysts draft an initial assessment from whatever data',
  'is already in hand, and processing pipelines rarely wait for a formal end to collection before feeding partial results into',
  'ongoing analytic work already underway elsewhere in the building, sometimes in a completely different section entirely.',
  '',
  'A second divergence concerns the requirement itself, which the diagram treats as fixed once stated. Policymakers routinely revise or abandon',
  "a question in response to a fast-moving event, so what began as an inquiry into one adversary's near-term intentions can",
  'become an entirely different question before the resulting report ever reaches dissemination. Planning and direction therefore recur constantly throughout the',
  'process rather than opening it a single time and then receding into the background.',
  '',
  'A third divergence involves timing. Time-sensitive current intelligence on an unfolding crisis routinely leaves the building hours or even days',
  'before longer-term analytic production addressing the same topic has actually finished, which means the analysis phase the diagram places before',
  'dissemination is, in practice, still running alongside it, feeding successive updates',
  'into the very product line the diagram shows as already complete.',
  '',
  "The feedback phase, which closes the loop in the diagram, is arguably the weakest link in the model's own logic.",
  'A policymaker who acts on a verbal briefing rarely files a formal new requirement documenting what the briefing changed about',
  'their thinking, so the loop that the diagram draws as an explicit arrow back to planning more often closes informally,',
  'through a hallway conversation or a follow-up phone call that leaves no trace in any tasking system at all.',
  '',
  'None of this makes the diagram worthless. New analysts genuinely need the named categories to understand what any single task',
  'is meant to accomplish, and the sequential picture communicates a real logical dependency: collection must occur before there is material',
  'worth analyzing, whatever the calendar overlap between the two activities later turns out to be in day-to-day practice.',
  '',
  'The risk lies in mistaking a taxonomy of functions for a description of daily workflow. An organization literally built around',
  'the cycle, handing work downstream only once each phase formally concluded, would be slower and considerably less responsive than intelligence',
  'production actually is, which more closely resembles several continuous, parallel processes held together by feedback than a relay race run',
  'in a fixed and unchanging order from start to finish.',
];

// ================================================================================================
// rc-032 — Analytic tradecraft and cognitive bias: what structured techniques can and cannot fix.
// ================================================================================================

const P32_LINES = [
  'Analysts, like anyone else, reason using mental shortcuts that usually serve them well but can systematically mislead when applied to',
  "an adversary's intentions under real uncertainty. The discipline now called analytic tradecraft grew directly out of recognizing that untrained intuition,",
  'however experienced the individual analyst, is not a reliable enough instrument for judgments carrying genuine operational consequences for decision-makers downstream.',
  '',
  "Mirror imaging, the habit of assuming an adversary reasons and weighs costs the way a friendly analyst's own government would,",
  'is among the most persistent of these shortcuts. An analyst who quietly assumes a foreign government calculates risk the way',
  'their own does risks badly misjudging decisions actually grounded in a different strategic culture, a different threat perception, or a',
  'domestic political constraint the analyst has never personally experienced firsthand.',
  '',
  'Confirmation bias compounds mirror imaging in a related way. Once an analyst forms an initial working hypothesis, later evidence tends',
  'to be read unconsciously as support for that hypothesis rather than weighed fairly against genuine alternatives, and ambiguous or contradictory',
  'reporting is frequently reinterpreted rather than allowed to actually revise the',
  'standing judgment already in place well before any contrary evidence arrived.',
  '',
  'Anchoring adds a third, subtler failure mode. The first plausible estimate an analyst encounters, whether from a colleague, a prior',
  'assessment, or an early piece of raw reporting, tends to fix the range within which every later revision is judged',
  'reasonable, so a genuinely large shift in the underlying situation can be represented on paper as only a modest adjustment',
  'to a number nobody has actually revisited from first principles in months.',
  '',
  'Structured analytic techniques were developed specifically to counter tendencies like these. Analysis of competing hypotheses requires an analyst to array',
  'the available evidence against several explanations at once, then ask which hypothesis the evidence most strongly disconfirms rather than which',
  'single explanation simply feels most immediately plausible. Formal red team review assigns someone the explicit task of arguing a case',
  'the primary analysis has not yet seriously considered at all.',
  '',
  'These techniques discipline reasoning without eliminating the underlying bias, because the cognitive tendencies they target operate below conscious awareness, and',
  "a technique applied mechanically can become a checklist exercise satisfied without genuinely altering anyone's judgment. A team can complete a",
  'full hypothesis matrix and still converge, in the end, on the explanation',
  'its members already favored before the exercise even began that afternoon.',
  '',
  'The honest claim tradecraft can make is narrower than eliminating error outright: it slows judgment down long enough to make',
  'its underlying assumptions visible on paper, and a visible assumption can at least be challenged later by a colleague, a',
  "skeptical policymaker, or a subsequent reviewer in ways an unstated one embedded in someone's head never realistically can be. This",
  'is why tradecraft standards insist on recording the assumption itself, not merely the conclusion it eventually produced, since a conclusion',
  'alone gives a later reviewer nothing concrete to actually push against or revisit.',
];

// ================================================================================================
// rc-033 — Indications and warning: why warning failures are usually not collection failures.
// ================================================================================================

const P33_LINES = [
  "Indications and warning intelligence exists to give decision-makers enough advance notice of an adversary's hostile intent to act before a",
  'crisis or an attack actually begins, and its historical record contains an uncomfortable, recurring pattern: the raw information later shown',
  'to matter was very often already sitting somewhere in hand well',
  'before the event it should have foreseen in the first place.',
  '',
  'Warning failure, examined afterward, is rarely a story of missing collection. Relevant reporting and intercepted communications bearing directly on the',
  'eventual attack existed in most retrospectively studied cases, sometimes in considerable volume and from multiple independent channels. What actually failed',
  'was interpretation: the analytic task of assembling countless individual fragments into a coherent picture of intent, and of distinguishing a',
  'genuine signal of impending action from ordinary background noise that closely resembles it in the moment.',
  '',
  'The noise problem is genuinely difficult on its own terms, not merely a matter of insufficient diligence. Adversary preparations for',
  'war typically resemble routine peacetime military activity in most particulars right up until forces actually begin to move, so an',
  'analyst reviewing partial indicators in real time confronts a genuinely ambiguous picture rather than an obviously alarming one, and any',
  'single report in isolation can be reasonably explained away by some other, entirely innocent cause.',
  '',
  'A separate mindset trap compounds the noise problem further, and it is arguably the more dangerous of the two. Warning',
  "analysts, like analysts generally, tend to expect an adversary to behave as the analyst's own strategic logic would predict, so",
  'evidence contradicting that prevailing assumption is often quietly discounted rather than treated as reason to seriously revise it, and the',
  'original assumption can survive the very evidence that should eventually have overturned it outright weeks earlier.',
  '',
  'Collection genuinely still matters here and should not be dismissed entirely as a factor in these failures: a warning system',
  'with no sensors trained on a given region cannot warn regardless of analytic skill applied afterward to whatever fragments do',
  'arrive. Even so, after-action reviews of major warning failures consistently identify assumption and interpretation, not missing sensors, as the dominant',
  'recurring failure across decades of documented and thoroughly studied cases.',
  '',
  "This history has pushed warning doctrine toward deliberately institutionalizing dissent, through devil's advocate cells and formal indicator lists that a",
  'watch officer reviews on a fixed schedule rather than only when something already feels alarming enough to warrant a second',
  'look. A process depending on individual analysts to silently revise an unstated assumption in real time has repeatedly proven less',
  'reliable than one that structurally forces a stated assumption to be argued against on a routine, calendar-driven basis regardless of',
  'how confident the watch currently feels.',
];

// ================================================================================================
// rc-034 — Deception and counterdeception: succeeding by confirming what the target already
// believes.
// ================================================================================================

const P34_LINES = [
  "Military deception succeeds by manipulating an adversary's perception of events, not by simply concealing information from that adversary. The most",
  'effective deception operation leads a target to act on a false picture of the situation precisely as though the false',
  'picture were true, using it as the actual basis for real operational decisions',
  'the target then commits to well before the deception is ever discovered.',
  '',
  'Deception is least effective against a belief the target does not already hold, and most effective when it reinforces a',
  "conclusion the target's own analysts have already reached through entirely separate means, because a message that merely fits an existing",
  'belief requires far less independent corroboration before that target accepts it',
  'as confirmed and acts accordingly on the strength of it alone.',
  '',
  'The Allied deception preceding the 1944 Normandy invasion illustrates the pattern clearly. German commanders already believed, for sound geographic reasons',
  'of their own, that the Pas-de-Calais region was the likeliest invasion site, being the shortest Channel crossing and within range',
  'of emerging weapons meant to strike England directly. The deception operation supplied confirming detail, a fictitious army group, deceptive radio',
  'traffic, decoy equipment, rather than manufacturing a belief that had not existed there beforehand.',
  '',
  'German reserves remained concentrated near Calais for weeks after the actual Normandy landings had already begun, delaying the decisive reinforcement',
  'that might otherwise have reached the real beachhead in time to matter a great deal. The deception had not persuaded',
  'a skeptical staff of something implausible on its face; it had confirmed, at considerable length, what that staff was already',
  'strongly inclined to conclude on its own.',
  '',
  'Counterdeception\'s central difficulty follows directly from this same pattern. Detecting deception requires an analyst to question a conclusion they independently',
  'find credible for entirely legitimate reasons, and a conclusion reinforced by several apparently independent reporting streams is exactly the conclusion',
  "a well-run deception operation is deliberately designed to produce for its intended audience. Corroboration itself, ordinarily an analyst's most trusted",
  'tool, becomes an unreliable signal against a sufficiently capable and patient adversary.',
  '',
  'Deception nonetheless has real limits worth naming plainly. It must be sustained across the entire span a target continues collecting',
  'against it, it cannot resolve every question a target might separately ask through other channels, and a target already inclined',
  'toward doubt for independent reasons resists it more effectively than one holding an untested belief. Counterdeception therefore proceeds less by',
  'hunting for anomalies in individual reports, which a capable deception is specifically built to avoid producing, and more by periodically',
  'asking whether an entire prevailing assessment rests on an assumption never actually tested',
  'against contrary evidence gathered independently of the reporting that first produced it.',
];

// ================================================================================================
// rc-035 — Open-source intelligence: its rise, and validating abundance rather than scarcity.
// ================================================================================================

const P35_LINES = [
  'Open-source intelligence has grown rapidly as commercial satellite imagery, unclassified geospatial platforms, and social media have placed enormous quantities of',
  'publicly available material within reach of any analyst willing to look for it. Open reporting during recent armed conflicts has',
  'at times reached the public and even policymakers before classified reporting on the same event could, meaningfully shifting where an',
  'analytic assessment now typically begins its work.',
  '',
  'Open-source intelligence is not simply searching the internet, however useful an ordinary search might occasionally turn out to be for',
  'a narrow question. The discipline requires systematically identifying a body of open material relevant to a specific requirement, tracking each',
  "item's provenance, and producing an assessed judgment rather than merely passing along whatever happens to be found by whoever is",
  'looking. Open material must be tasked, collected, and evaluated with the same rigor as any other intelligence discipline before it',
  'properly counts as open-source intelligence rather than casual browsing.',
  '',
  "The field's distinct challenge is validating an abundance rather than confirming a scarcity, which inverts a problem the wider discipline",
  'has faced for most of its history. Classified collection has historically strained to obtain even one reliable indicator of a',
  'given fact of interest. Open-source analysts instead face a continuous flood of largely unverified claims, and sheer volume can create',
  'a false sense of confirmation, since many independently posted claims often trace back to one unverified original report that has',
  'simply been repeated and reposted without any genuinely independent corroboration ever actually occurring anywhere along the chain.',
  '',
  'Manipulated and synthetic media sharpen this problem considerably further. Fabricated video, staged imagery, and coordinated networks of inauthentic accounts deliberately',
  'exploit the ordinary assumption that a widely repeated claim has been independently confirmed by separate sources acting without coordination. Tracing',
  'a claim back to its original source, and confirming that source was not itself fabricated, has become a more central',
  'analytic skill than it was in earlier decades, when available material was comparatively',
  'scarce and each additional source genuinely added something new to the picture.',
  '',
  'Open material carries genuine advantages classified collection structurally lacks, and these should not be understated. It can be shared freely',
  'with allies and partners without the complications a security clearance requirement introduces into every exchange, and its underlying conclusions can',
  'sometimes be checked publicly, an outside accountability check that most classified analysis',
  'simply cannot receive from anyone beyond its own cleared community of readers.',
  '',
  'The net effect is that openly available material has not replaced classified collection so much as shifted the analytic burden',
  'entirely. The scarce resource is no longer acquiring information but discriminating credible material from a flood of it, a skill',
  'closer to investigative sourcing than to the collection management the intelligence discipline',
  'traditionally emphasized above nearly everything else in its formal training pipeline.',
];

// ================================================================================================
// rc-036 — The intelligence-policy relationship: politicization and the assessment/advocacy line.
// ================================================================================================

const P36_LINES = [
  "Intelligence exists to inform policy decisions, which requires staying close enough to a policymaker's actual questions to remain genuinely useful,",
  'yet an analytic judgment retains real value only for as long as it is not shaped by what a policymaker',
  'would simply prefer to hear from the analyst delivering it. This tension is inherent to the relationship itself rather than',
  "a symptom of any single administration's particular failure.",
  '',
  'A useful way to state the underlying problem is that an intelligence service positioned too far from policymakers ends up',
  'producing analysis irrelevant to the decisions actually being made in real time, while one positioned too close risks becoming an',
  'instrument that merely confirms decisions already reached rather than one that independently tests them beforehand. Neither extreme performs the warning',
  'and assessment function intelligence exists to serve in the first place, whatever its formal organizational chart might otherwise suggest.',
  '',
  'Politicization, precisely defined, is not simply disagreement between an individual analyst and a policymaker over what the evidence shows on',
  'a given question. It is pressure, whether explicit or only implicit and quietly anticipated, to shape a judgment toward some',
  'preferred conclusion rather than toward the evidence itself as gathered. The more corrosive version is self-censorship, in which an analyst',
  'anticipates which conclusions will be well received and quietly favors them long',
  'before any policymaker has actually intervened at all in the drafting process.',
  '',
  'A related but separate distinction separates assessment from advocacy, and the two are frequently confused by outside observers. An assessment',
  'states what is known, what remains genuinely unknown, and how confidently, then traces the implications of a given development for',
  'policy interests already on record. Advocacy instead recommends which specific choice a policymaker ought to make going forward. A service',
  'that regularly crosses this particular line surrenders exactly the credibility that',
  'makes its underlying assessment worth hearing at all by anyone.',
  '',
  'The line is admittedly difficult to hold in daily practice, and reasonable, well-trained analysts disagree about exactly where it falls',
  'in any given case. A written assessment that lists implications for several competing courses of action will inevitably resemble a',
  'policy recommendation to a reader already looking for one, and consumers do not always respect a distinction the analyst carefully',
  'intended to preserve, however precisely that analyst phrased the underlying judgment on the page itself.',
  '',
  'Institutional safeguards exist for exactly this reason: tradecraft standards, formal channels for recorded dissent, and a working separation between officials',
  'who brief policymakers directly and those who draft the underlying assessment beforehand without that direct contact. These exist not because',
  'individual analysts are presumed dishonest, but because pressure toward a preferred conclusion is structural, and a discipline relying solely on',
  'individual integrity to resist that pressure would eventually fail precisely when the',
  'stakes were highest for everyone involved in the decision at hand.',
];

registerPassages([
  {
    id: 'rc-031', wordCount: 502, band: 4, lineNumbered: true,
    text: P31_LINES.join('\n'),
    questions: [
      {
        type: 'main-idea',
        stem: MI_STEMS[0],
        choices: [
          'Intelligence collection must always be completed in its entirety before any analysis of that same requirement is formally allowed to begin at all.',
          'Feedback from policymakers back to collectors is, in practice, the single most reliable and thoroughly documented phase of the whole intelligence cycle.',
          'The circular intelligence-cycle diagram is a simplifying teaching device whose named phases actually run concurrently, recur throughout the process, and rarely close in the sequence the diagram depicts.',
          'The intelligence cycle diagram was originally designed mainly to let policymakers draft their own formal collection requirements without any analyst assistance at all.',
          'Dissemination of a finished intelligence product never actually occurs until every phase of analysis on that same requirement has been entirely completed first.',
        ],
        correctIndex: 2,
        why: 'The passage repeatedly shows phases like collection, analysis, and dissemination overlapping and recurring rather than following the diagram\'s clean, closed sequence.',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 3, "sprawling" most nearly means:',
        choices: [
          'Confined tightly within a single office or organizational unit with no branches elsewhere in government.',
          'Spread out extensively and somewhat irregularly, without a single tidy shape holding all of it together.',
          'Funded generously well beyond whatever amount was originally budgeted for it in a given fiscal year.',
          'Organized strictly according to military rank and a fixed chain of command running top to bottom.',
          'Scheduled to run for only a brief, clearly bounded period before being formally concluded and closed.',
        ],
        correctIndex: 1,
        why: 'The sentence calls intelligence work an "otherwise sprawling enterprise" right before describing the diagram as a simple model imposed on that breadth and irregularity.',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 31, "taxonomy" most nearly means:',
        choices: [
          'A strict legal requirement imposed by statute on how an organization must be formally structured.',
          'A funding formula used to allocate budget across several competing organizational priorities each year.',
          'A classification scheme that sorts things into named categories according to their shared characteristics.',
          'A performance review process used to evaluate individual employees against fixed annual standards.',
          'A historical account describing how an organizational structure changed gradually over several decades.',
        ],
        correctIndex: 2,
        why: 'The sentence uses "taxonomy of functions" to mean a set of named categories, which is exactly what a classification scheme is.',
      },
      {
        type: 'detail-inference',
        stem: "Based on the passage, why might a policymaker's revised question change an intelligence requirement mid-process?",
        choices: [
          'Because the diagram legally requires every requirement to be resubmitted through a formal review committee twice each calendar year.',
          'Because collection managers are required by internal regulation to change requirements automatically every thirty days regardless of events.',
          'Because analysts are formally prohibited from working on any requirement not personally approved in advance by senior leadership.',
          'Because policymakers often revise or abandon a question in response to a fast-moving event, so planning and direction recur throughout the process.',
          'Because dissemination schedules are fixed by international treaty and cannot be adjusted once a requirement has already been drafted.',
        ],
        correctIndex: 3,
        why: 'The passage states policymakers "routinely revise or abandon a question" after a fast-moving event, which is why planning and direction "recur constantly throughout the process."',
      },
      {
        type: 'function-of-paragraph',
        stem: 'The paragraph beginning "The feedback phase, which closes the loop..." serves primarily to:',
        choices: [
          "It argues that dissemination must always precede analysis in every case, contradicting the rest of the passage's argument entirely.",
          'It explains why the feedback step often closes informally, without leaving a trace in any formal tasking system.',
          'It proves that policymakers never actually act on verbal briefings without first filing a formal written requirement.',
          'It introduces an unrelated discussion of how collection budgets are approved by legislative oversight committees.',
          'It concludes the passage by recommending a specific replacement diagram for the traditional intelligence cycle model.',
        ],
        correctIndex: 1,
        why: 'The paragraph explains that a policymaker "rarely files a formal new requirement," so the loop "closes informally" rather than through a documented feedback step.',
      },
      {
        type: 'author-agreement',
        stem: AA_STEMS[0],
        choices: [
          'The intelligence cycle diagram should be discarded entirely because it teaches nothing useful to new analysts joining the field.',
          "An organization built literally around the diagram's sequence would likely be less responsive than intelligence work actually is.",
          'Collection should always wait until a requirement has been fully finalized before any analytic work is permitted to begin.',
          'Feedback from policymakers is unnecessary because analysts already know exactly what the next requirement will turn out to be.',
          'The intelligence cycle has remained completely unchanged in practice since it was first formally diagrammed many decades ago.',
        ],
        correctIndex: 1,
        why: 'The closing paragraph states an organization literally built around the cycle "would be slower and considerably less responsive than intelligence production actually is."',
      },
    ],
  },
  {
    id: 'rc-032', wordCount: 490, band: 4, lineNumbered: true,
    text: P32_LINES.join('\n'),
    questions: [
      {
        type: 'main-idea',
        stem: MI_STEMS[1],
        choices: [
          'Cognitive bias affects only inexperienced analysts and disappears completely once an analyst gains enough operational field experience.',
          'Analysis of competing hypotheses guarantees a correct conclusion whenever it is properly applied to a genuine intelligence question.',
          'Mirror imaging is a rare failure mode that has only ever affected a small handful of documented historical cases.',
          'Red team review has entirely replaced the need for any other structured analytic technique in modern tradecraft practice.',
          "Structured analytic techniques discipline an analyst's reasoning and make hidden assumptions visible, but cannot fully eliminate biases like mirror imaging or anchoring.",
        ],
        correctIndex: 4,
        why: "The passage's final paragraph states tradecraft's honest claim is narrower than eliminating error, since it only makes assumptions visible rather than removing the bias itself.",
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 5, "mirror imaging" most nearly refers to:',
        choices: [
          'Reviewing satellite photographs twice to confirm a visual observation before it is formally reported upward.',
          "Assuming an adversary reasons and weighs costs the way one's own government would in the same situation.",
          'Translating a foreign document into English using a certified government linguist for accuracy and speed.',
          'Comparing two competing hypotheses side by side using a formal structured matrix of gathered evidence.',
          'Repeating a briefing verbatim to a second audience without changing any of its original wording.',
        ],
        correctIndex: 1,
        why: "The passage defines mirror imaging directly as \"assuming an adversary reasons and weighs costs the way a friendly analyst's own government would.\"",
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 15, "anchoring" most nearly refers to:',
        choices: [
          'Physically securing a ship or a piece of equipment firmly in place during a field exercise.',
          'Letting an initial estimate fix the range within which later revisions are judged to be reasonable.',
          'Assigning a colleague the formal task of arguing against the primary analytic conclusion reached.',
          'Verifying a single source through at least two independent and entirely unrelated reporting channels.',
          'Discarding an early estimate entirely once any new contradictory evidence becomes available to the analyst.',
        ],
        correctIndex: 1,
        why: 'The passage explains anchoring as the first plausible estimate fixing "the range within which every later revision is judged reasonable."',
      },
      {
        type: 'detail-inference',
        stem: 'Based on the passage, why can a team completing a full analysis-of-competing-hypotheses matrix still reach a biased conclusion?',
        choices: [
          'Because the matrix format itself contains a mathematical error that always favors whichever hypothesis is listed first.',
          'Because a technique applied mechanically can become a checklist exercise that does not genuinely change anyone\'s judgment.',
          'Because analysis of competing hypotheses is only permitted to be used once per calendar year under regulation.',
          "Because red team reviewers are formally barred from disagreeing with the primary analyst's original conclusion once filed.",
          'Because confirmation bias only affects analysts who are working entirely alone without any team members present.',
        ],
        correctIndex: 1,
        why: 'The passage states a technique "applied mechanically can become a checklist exercise satisfied without genuinely altering anyone\'s judgment," which describes exactly this outcome.',
      },
      {
        type: 'function-of-paragraph',
        stem: 'The paragraph beginning "Anchoring adds a third, subtler failure mode..." serves primarily to:',
        choices: [
          'It introduces a third specific cognitive shortcut, distinct from mirror imaging and confirmation bias, that also distorts analysis.',
          'It refutes the existence of mirror imaging as a genuine cognitive bias affecting intelligence analysts generally.',
          'It argues that confirmation bias is actually the same phenomenon as mirror imaging under a different name.',
          'It concludes the passage by recommending that anchoring be eliminated through additional formal analyst training programs.',
          'It shifts the passage\'s focus entirely away from cognitive bias toward organizational budget constraints instead.',
        ],
        correctIndex: 0,
        why: 'The paragraph opens by naming anchoring as "a third, subtler failure mode," adding it alongside the mirror imaging and confirmation bias already introduced.',
      },
      {
        type: 'author-agreement',
        stem: AA_STEMS[1],
        choices: [
          'Structured analytic techniques should be abandoned since they cannot guarantee a bias-free conclusion in every single case.',
          "A visible, recorded assumption can be challenged later in ways an unstated one embedded in someone's head cannot.",
          'Confirmation bias only ever appears in analysts who have received no formal tradecraft training whatsoever.',
          'Mirror imaging is best corrected simply by hiring analysts from a much wider range of academic backgrounds.',
          'Anchoring has no meaningful effect once an analyst has reviewed more than just a few pieces of evidence.',
        ],
        correctIndex: 1,
        why: 'The closing paragraph states a visible assumption "can at least be challenged later...in ways an unstated one embedded in someone\'s head never realistically can be."',
      },
    ],
  },
  {
    id: 'rc-033', wordCount: 445, band: 4, lineNumbered: true,
    text: P33_LINES.join('\n'),
    questions: [
      {
        type: 'main-idea',
        stem: MI_STEMS[2],
        choices: [
          'Warning failures occur exclusively because intelligence agencies fail to collect any relevant raw reporting on the adversary at all.',
          "Indications and warning intelligence has never once failed to predict an adversary's hostile intent well in advance of action.",
          'Warning failures are usually caused by flawed interpretation and a mistaken analytic mindset rather than by a genuine lack of collected raw intelligence.',
          'Watch officers are formally forbidden from reviewing an indicator list more than a single time during any given shift.',
          'Devil\'s advocate cells were invented specifically to replace collection sensors that had become prohibitively expensive to maintain.',
        ],
        correctIndex: 2,
        why: 'The passage states warning failure "is rarely a story of missing collection" and instead traces it to "assumption and interpretation" across documented cases.',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 7, "retrospectively" most nearly means:',
        choices: [
          'Classified at the very highest level of government security clearance available.',
          'Predicting a future event well before any supporting evidence has actually appeared.',
          'Looking back on past events after they have already occurred and concluded.',
          'Confirmed by at least three fully independent collection sources acting at once.',
          'Dismissed by senior leadership without any further formal review or written comment.',
        ],
        correctIndex: 2,
        why: 'The word describes cases "studied" after the fact, meaning analysts looked back on the event once it had already happened.',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 26, "institutionalizing" most nearly means:',
        choices: [
          "Building a practice permanently into an organization's formal, ongoing procedures rather than leaving it to individual choice.",
          "Removing an outdated practice entirely from an organization's official rules and standard operating procedures.",
          'Punishing an employee formally for disagreeing publicly with an already established organizational policy.',
          'Transferring a specific function from one government agency to a separate and unrelated agency.',
          'Reducing the total budget allocated to a specific analytic office within an organization.',
        ],
        correctIndex: 0,
        why: 'The sentence pairs institutionalizing dissent with concrete structures, "devil\'s advocate cells and formal indicator lists," meaning the practice becomes a standing procedure.',
      },
      {
        type: 'detail-inference',
        stem: "Based on the passage, why can an analyst's individual report of adversary preparations be reasonably explained away in the moment?",
        choices: [
          'Because collection sensors are physically incapable of detecting any adversary military activity in most contested regions.',
          'Because analysts are required by policy to dismiss any report that has not been independently corroborated twice over.',
          'Because adversary war preparations typically resemble routine peacetime activity right up until forces actually begin to move.',
          "Because watch officers are rotated too frequently to develop any familiarity with a given region's baseline activity.",
          'Because indicator lists are updated so rarely that most listed indicators are already several decades old by then.',
        ],
        correctIndex: 2,
        why: 'The passage explains that preparations "typically resemble routine peacetime military activity...so any single report in isolation can be reasonably explained away."',
      },
      {
        type: 'function-of-paragraph',
        stem: 'The paragraph beginning "Collection genuinely still matters here..." serves primarily to:',
        choices: [
          'It introduces an unrelated discussion of how collection budgets are approved by legislative committees each year.',
          'It reverses the passage\'s entire argument, concluding that collection failure explains every warning failure after all.',
          "It acknowledges a genuine limit of the passage's own argument before restating what after-action reviews actually find.",
          'It proves that analytic mindset has never once contributed to any documented warning failure in the record.',
          'It concludes the passage by recommending that indicator lists be reviewed only once per calendar year.',
        ],
        correctIndex: 2,
        why: 'The paragraph concedes collection "genuinely still matters" before immediately noting that reviews "consistently identify assumption and interpretation" as the dominant failure instead.',
      },
      {
        type: 'author-agreement',
        stem: AA_STEMS[2],
        choices: [
          'A watch process that forces a stated assumption to be argued against on a fixed schedule is more reliable than relying on individual judgment alone.',
          'Collection sensors are the only meaningful factor that determines whether a warning failure will eventually occur.',
          "An adversary's peacetime activity is always obviously distinguishable from genuine preparation for war by any analyst.",
          "Devil's advocate cells have proven to be an unnecessary and largely wasteful addition to warning doctrine.",
          'Analysts rarely form assumptions strong enough to survive contradictory evidence for any meaningful length of time.',
        ],
        correctIndex: 0,
        why: 'The passage states a process relying on individual judgment alone "has repeatedly proven less reliable than one that structurally forces a stated assumption to be argued against" on a schedule.',
      },
    ],
  },
  {
    id: 'rc-034', wordCount: 445, band: 4, lineNumbered: true,
    text: P34_LINES.join('\n'),
    questions: [
      {
        type: 'main-idea',
        stem: MI_STEMS[3],
        choices: [
          'Military deception works only by inventing an entirely new belief a target has never previously considered at all.',
          'Operation Fortitude ultimately failed to delay any German reinforcement of the actual Normandy beachhead in a meaningful way.',
          "A deception operation succeeds most by confirming a belief the target already holds, which is exactly what makes a well-run deception so difficult to detect.",
          'Counterdeception is accomplished mainly by searching for a single obvious anomaly buried somewhere within one intelligence report.',
          'Corroboration from several independent sources is always sufficient by itself to rule out an ongoing deception operation.',
        ],
        correctIndex: 2,
        why: "The passage states deception is \"most effective when it reinforces a conclusion the target's own analysts have already reached,\" which is why corroboration becomes unreliable.",
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 8, "corroboration" most nearly means:',
        choices: [
          'A specific type of coded radio transmission used between field agents in the area.',
          'Formal written approval issued by a senior commanding officer before an operation begins.',
          'A financial cost calculated in advance of launching any new deception operation.',
          'Independent confirmation from a separate source that supports an existing claim or belief.',
          "An official denial issued publicly to contradict a competing government's public claim.",
        ],
        correctIndex: 3,
        why: 'The sentence explains a belief already held "requires far less independent corroboration," meaning less outside confirmation is needed for the target to accept it.',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 29, "anomalies" most nearly means:',
        choices: [
          'Officially confirmed facts that every available independent source already agrees upon.',
          'Formal requirements submitted by a policymaker to an intelligence collection manager.',
          "Encrypted messages intercepted from an adversary's secure military communications network.",
          'Irregularities or details that deviate noticeably from an otherwise expected pattern.',
          'Budget allocations set aside specifically for a classified deception program each year.',
        ],
        correctIndex: 3,
        why: "The sentence contrasts hunting for anomalies with a capable deception's design to avoid producing them, meaning irregularities that would otherwise stand out.",
      },
      {
        type: 'detail-inference',
        stem: 'Based on the passage, why did the Pas-de-Calais deception before Normandy require relatively little additional persuasion to succeed?',
        choices: [
          'Because German commanders already believed, for independent geographic reasons, that Calais was the likeliest invasion site.',
          'Because German commanders had no prior belief at all about where an Allied invasion might eventually occur.',
          'Because the deception operation was conducted entirely without any use of fictitious military units or equipment.',
          'Because German intelligence had already confirmed through direct contact that Normandy was in fact the true target.',
          'Because Allied commanders publicly announced the details of the deception plan to German officials in advance.',
        ],
        correctIndex: 0,
        why: 'The passage explains German commanders "already believed, for sound geographic reasons of their own," that Calais was the likeliest site before any deception occurred.',
      },
      {
        type: 'function-of-paragraph',
        stem: 'The paragraph beginning "German reserves remained concentrated near Calais..." serves primarily to:',
        choices: [
          'It argues that German commanders never actually believed the Pas-de-Calais invasion theory in the first place.',
          "It refutes the passage's earlier claim that deception reinforces an existing belief rather than inventing one.",
          'It introduces an entirely new topic unrelated to the Normandy invasion discussed earlier in the passage.',
          "It supplies a concrete historical outcome showing the deception's confirming approach actually delaying real reinforcement.",
          'It concludes the passage by recommending a specific modern deception technique for future planners to adopt.',
        ],
        correctIndex: 3,
        why: 'The paragraph reports that German reserves "remained concentrated near Calais for weeks," a concrete result illustrating the confirming deception\'s real effect.',
      },
      {
        type: 'author-agreement',
        stem: AA_STEMS[3],
        choices: [
          "Deception operations require no ongoing effort once a target's initial belief has been confirmed a single time.",
          'A target already holding a strong belief is generally easier to deceive than one holding no belief at all.',
          'Detecting deception mainly requires searching individual reports for one single obvious inconsistency or anomaly.',
          'Corroboration from several independent-seeming reporting streams can itself be exactly what a skilled deception is designed to produce.',
          'Counterdeception was permanently solved once the Normandy deception was studied by later military historians.',
        ],
        correctIndex: 3,
        why: 'The passage states "a conclusion reinforced by several apparently independent reporting streams is exactly the conclusion a well-run deception operation is deliberately designed to produce."',
      },
    ],
  },
  {
    id: 'rc-035', wordCount: 465, band: 4, lineNumbered: true,
    text: P35_LINES.join('\n'),
    questions: [
      {
        type: 'main-idea',
        stem: MI_STEMS[4],
        choices: [
          'Open-source intelligence has now entirely replaced classified collection as the primary method of gathering foreign intelligence around the world.',
          'Social media reporting is always considerably more reliable than any classified reporting ever collected through traditional government channels.',
          'Open-source intelligence has grown enormously, but its central challenge is validating an overwhelming abundance of unverified material rather than acquiring scarce information.',
          'Commercial satellite imagery cannot legally be used for any genuine intelligence purpose whatsoever under current government regulation and law.',
          'Open-source analysts face no meaningful challenge beyond simply locating enough publicly available material that is worth reviewing carefully.',
        ],
        correctIndex: 2,
        why: 'The passage states the field\'s "distinct challenge is validating an abundance rather than confirming a scarcity," inverting the problem classified collection has traditionally faced.',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 8, "provenance" most nearly means:',
        choices: [
          'The origin and chain of custody of a piece of material, tracing where it actually came from.',
          'The formal security classification level assigned to a specific document or intelligence report.',
          'The total number of times a given claim has been reposted across social media.',
          'The language a piece of open-source material was originally written or spoken in.',
          'The budget cost associated with collecting a specific piece of intelligence material.',
        ],
        correctIndex: 0,
        why: "The passage pairs \"provenance\" with tracking where an item originated, which is exactly what tracing a source's origin and history means.",
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 30, "discriminating" most nearly means:',
        choices: [
          "Translating a foreign-language claim into English for a policymaker's review.",
          'Treating certain sources unfairly based on where they were originally collected.',
          'Encrypting a piece of material so that it cannot be read by unauthorized readers.',
          'Distinguishing carefully between what is genuinely credible and what is not.',
          "Deleting unverified material permanently from an organization's internal archive.",
        ],
        correctIndex: 3,
        why: 'The sentence pairs discriminating with separating "credible material from a flood of it," meaning distinguishing genuine material from the rest.',
      },
      {
        type: 'detail-inference',
        stem: 'Based on the passage, why can sheer volume of open-source reporting create a false sense of confirmation?',
        choices: [
          'Because government regulation limits the total number of unverified claims a platform may host at any time.',
          'Because open-source platforms are legally required to remove any claim that has not been independently verified.',
          'Because social media companies employ trained intelligence analysts to verify every post before it is published.',
          'Because classified collection systems automatically cross-check every open-source claim against a secure internal database.',
          'Because many independently posted claims often trace back to one unverified original report repeated without real corroboration.',
        ],
        correctIndex: 4,
        why: 'The passage explains that "many independently posted claims often trace back to one unverified original report" repeated without genuine independent corroboration.',
      },
      {
        type: 'function-of-paragraph',
        stem: 'The paragraph beginning "Manipulated and synthetic media sharpen this problem..." serves primarily to:',
        choices: [
          'It extends the volume problem by showing how fabricated media deliberately exploits the assumption of independent confirmation.',
          'It refutes the earlier claim that open-source material can ever be independently corroborated at all.',
          'It introduces an unrelated discussion of how satellite imagery contracts are awarded to commercial vendors.',
          'It argues that fabricated media has had no meaningful effect on open-source analysis to date.',
          'It concludes the passage by recommending a total ban on synthetic media across every platform.',
        ],
        correctIndex: 0,
        why: 'The paragraph builds on the volume problem, explaining that fabricated media "exploit the ordinary assumption that a widely repeated claim has been independently confirmed."',
      },
      {
        type: 'author-agreement',
        stem: AA_STEMS[4],
        choices: [
          'Commercial satellite imagery has made ground-based human collection entirely unnecessary for modern intelligence purposes.',
          'Classified collection no longer serves any meaningful analytic purpose now that open-source material is so widely available.',
          'A widely repeated social media claim can generally be trusted without any need for further independent verification.',
          'Open-source intelligence requires no more analytic rigor than an ordinary internet search performed by any casual reader.',
          'Tracing a claim back to its original source has become a more central analytic skill than it once was.',
        ],
        correctIndex: 4,
        why: 'The passage states tracing a claim to its source "has become a more central analytic skill than it was in earlier decades" of comparative scarcity.',
      },
    ],
  },
  {
    id: 'rc-036', wordCount: 470, band: 4, lineNumbered: true,
    text: P36_LINES.join('\n'),
    questions: [
      {
        type: 'main-idea',
        stem: MI_STEMS[5],
        choices: [
          'Intelligence services should always tell policymakers precisely which specific decision they ought to make in every single case.',
          'Politicization only occurs when a policymaker explicitly and directly orders an analyst to alter a stated conclusion.',
          'An intelligence service positioned as closely as possible to policymakers always produces the single most objective analysis.',
          'Intelligence must stay close enough to policy to remain genuinely useful without losing the objectivity that separates honest assessment from advocacy.',
          'Self-censorship among individual analysts has never actually been documented as a genuine problem in practice.',
        ],
        correctIndex: 3,
        why: 'The passage opens by stating intelligence must stay "close enough...to remain genuinely useful" while never being "shaped by what a policymaker would simply prefer to hear."',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 13, "corrosive" most nearly means:',
        choices: [
          'Publicly visible and easily identified at once by any outside observer.',
          'Extremely well documented and formally recorded in an official government file.',
          'Legally prohibited under a specific, clearly written government regulation.',
          'Financially expensive to correct once it has already occurred within an organization.',
          'Gradually damaging or eroding something valuable over an extended period of time.',
        ],
        correctIndex: 4,
        why: 'The sentence calls self-censorship "the more corrosive version" of politicization, meaning it erodes objectivity more damagingly than open pressure does.',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 19, "advocacy" most nearly means:',
        choices: [
          'Actively recommending a specific course of action rather than merely describing one.',
          'Formally recording a disagreement in an official government archive for later review.',
          'Translating a classified assessment into a version suitable for public release.',
          'Collecting raw information from a human source operating somewhere in the field.',
          'Reviewing a finished assessment for grammatical and stylistic errors before release.',
        ],
        correctIndex: 0,
        why: 'The sentence defines advocacy directly as recommending "which specific choice a policymaker ought to make," as opposed to merely assessing the situation.',
      },
      {
        type: 'detail-inference',
        stem: 'Based on the passage, why might a written assessment of policy implications be mistaken for a policy recommendation?',
        choices: [
          'Because self-censorship guarantees that every assessment eventually becomes a disguised policy recommendation over time.',
          'Because analysts are formally required to state a preferred policy choice at the end of every assessment.',
          'Because policymakers are legally forbidden from reading any assessment that does not include a specific recommendation.',
          'Because advocacy and assessment are, in fact, defined identically under standard intelligence tradecraft doctrine.',
          'Because listing implications for several competing courses of action will inevitably resemble a recommendation to an eager reader.',
        ],
        correctIndex: 4,
        why: 'The passage states an assessment listing implications "will inevitably resemble a policy recommendation to a reader already looking for one."',
      },
      {
        type: 'function-of-paragraph',
        stem: 'The paragraph beginning "Politicization, precisely defined..." serves primarily to:',
        choices: [
          'It refutes the earlier claim that intelligence must remain close enough to policy to stay useful.',
          'It argues that politicization and simple disagreement are, in every practical respect, the exact same phenomenon.',
          'It introduces an unrelated discussion of how intelligence budgets are approved by legislative oversight committees.',
          'It concludes the passage by recommending that all analyst-policymaker contact be formally eliminated going forward.',
          'It narrows a broad concept into a precise definition, distinguishing genuine politicization from ordinary analyst-policymaker disagreement.',
        ],
        correctIndex: 4,
        why: 'The paragraph opens "Politicization, precisely defined, is not simply disagreement," then narrows the term to pressure toward a preferred conclusion.',
      },
      {
        type: 'author-agreement',
        stem: AA_STEMS[5],
        choices: [
          'The distinction between assessment and advocacy is purely academic and has no real practical consequence for policymakers.',
          'Politicization can only occur when a senior policymaker gives an analyst an explicit, direct order to change a finding.',
          'An intelligence service positioned very close to policymakers is always the most effective arrangement for genuine objectivity.',
          'Institutional safeguards like tradecraft standards exist mainly because most analysts cannot otherwise be trusted to act honestly.',
          'A written assessment can resemble a policy recommendation even when the analyst never intended it to be read that way.',
        ],
        correctIndex: 4,
        why: 'The passage states a written assessment "will inevitably resemble a policy recommendation to a reader already looking for one," regardless of the analyst\'s actual intent.',
      },
    ],
  },
]);

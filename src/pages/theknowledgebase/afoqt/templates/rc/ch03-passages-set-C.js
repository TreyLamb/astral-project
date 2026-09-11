// Reading Comprehension, Set C — band 3.
// Topic domain: airpower and aviation doctrine (air superiority, close air support, the
// strategic bombing debate, aerial refueling and operational reach, airlift throughput,
// suppression of enemy air defenses). Per docs/afoqt/RC-AUTHORING-SPEC.md.
//
// Registers passages only - template registration is centralised elsewhere. This file is not
// wired into templates/index.js; it is linted standalone via
// `node scripts/afoqtRcLint.mjs --file=src/pages/theknowledgebase/afoqt/templates/rc/ch03-passages-set-C.js`.

import { registerPassages } from '../../engine/passage.js';

// ================================================================================================
// rc-025 — air superiority as a precondition, not an objective
// ================================================================================================

const P25_LINES = [
  'Air superiority is often described as a battlefield achievement in its own right, but joint doctrine treats it differently.',
  'The Air Force defines the term as the degree of control that allows friendly air, land, and sea forces to operate',
  'at a given time and place without prohibitive interference from an adversary, and it treats that control as a precondition',
  'for everything else a joint force does, rather than as an objective that is pursued and then set aside.',
  'The distinction matters because it changes how planners judge success: not by whether enemy aircraft were destroyed, but by',
  'whether everything that depends on the air being open was actually able to proceed on schedule.',
  '',
  'Two campaigns illustrate the point clearly. Over Normandy in 1944, Allied fighters had already driven the Luftwaffe from the',
  'skies over the invasion beaches weeks before the landing craft ever launched, which let reconnaissance aircraft map German defenses',
  'openly and let resupply ships cross the Channel without having to fight their way through the water as well as',
  'the air. Nearly five decades later, the opening days of Operation Desert Storm followed the same pattern: coalition aircraft',
  'spent the first days of the war suppressing Iraqi radar and fighters specifically so that the ground offensive six weeks',
  'later could move without having to watch the sky as well as the horizon.',
  '',
  'Doctrine explains this pattern by pointing to what control of the air actually enables rather than what it destroys.',
  "A force that holds the air can move reinforcements and supplies by transport aircraft, can watch an adversary's positions",
  'from above nearly at will, and can strike targets deep behind the front line without first fighting through a screen',
  'of defending fighters. None of those advantages requires a single additional enemy aircraft to be shot down; they follow',
  'automatically once the sky itself stops being contested. This is why planners describe air superiority as an enabling condition',
  'rather than a campaign objective: it is valuable almost entirely for what it permits everyone else to do next.',
  '',
  'The concept is nonetheless more layered than a simple on-or-off switch. Doctrine distinguishes degrees of control, from local',
  'air parity, where neither side can operate freely, up through air superiority, to full air supremacy, in which the',
  'opposing air force is essentially unable to interfere at all. Most operations only ever secure the middle condition, and',
  'usually only over a limited area for a limited time, not across an entire theater for the length of a',
  'campaign. Sustaining even that partial control is expensive, consuming aircraft, fuel, and skilled personnel that a commander might',
  'otherwise commit elsewhere, so a planner has to judge continuously how much control is actually worth buying.',
  '',
  'This is the reason a purely defensive air campaign, one that shoots down enemy aircraft without ever clearing space',
  'for the rest of the force to work, counts as a strategic disappointment even when its kill tally looks',
  'impressive. The measure that matters is downstream: whether the airlift flew, whether the reconnaissance flights returned with usable',
  'imagery, and whether the ground force could maneuver without watching the sky. A commander who wins the air fight',
  'but never spends the advantage it buys has not finished the job; the fight for the air was always a',
  'means, and a means left unused is simply a cost the campaign paid for nothing in return.',
];

registerPassages([
  {
    id: 'rc-025', wordCount: 563, band: 3, lineNumbered: true,
    text: P25_LINES.join('\n'),
    questions: [
      {
        type: 'main-idea',
        stem: 'Which statement best conveys what the passage is mainly arguing?',
        choices: [
          'Air superiority is valuable mainly as a precondition that lets other operations proceed, not as a goal pursued for its own sake.',
          "Destroying enemy aircraft in the air is the clearest and most reliable measure of a campaign's overall success.",
          'Once achieved, air superiority is permanent and requires no further resources to sustain for the rest of a campaign.',
          'Ground campaigns generally succeed or fail independently of whether friendly forces control the air above them.',
          "Reconnaissance aircraft contribute less to a campaign's outcome than transport aircraft delivering supplies to the front.",
        ],
        correctIndex: 0,
        why: "The passage opens by defining air superiority as a precondition for other operations and closes by saying an advantage that is 'never spent' is a cost paid for nothing, both framing it as a means rather than an end in itself.",
      },
      {
        type: 'main-idea',
        stem: 'The primary purpose of the passage is to:',
        choices: [
          'catalog every historical campaign in which control of the air played some documented role in the outcome.',
          'explain why air superiority functions as an enabling precondition for other operations rather than as an objective pursued for its own sake.',
          'argue that ground and naval forces no longer require any air support at all to operate safely in combat.',
          'describe the technical specifications of the specific aircraft that first achieved control of the air over Europe.',
          'recommend a specific dollar allocation between air, ground, and naval procurement for some future campaign.',
        ],
        correctIndex: 1,
        why: "Every paragraph returns to the same point: air superiority is measured by what it enables downstream, from Normandy's landing craft to a ground force's freedom to maneuver, not by the air fight in isolation.",
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 3, "precondition" most nearly means:',
        choices: [
          'a formal treaty term used only in negotiated cease-fire agreements between two air forces.',
          "a final objective that, once reached, ends a campaign's need for further planning.",
          'a necessary condition that must be satisfied before something else can properly proceed.',
          'a synonym for total and permanent air supremacy over an entire theater of war.',
          'a temporary pause in hostilities agreed to by both sides during a campaign.',
        ],
        correctIndex: 2,
        why: "Line 3 says control of the air is treated \"as a precondition for everything else a joint force does,\" meaning it is a requirement other operations depend on rather than a goal in itself.",
      },
      {
        type: 'detail-inference',
        stem: 'Based on the passage, why did coalition airpower spend the opening days of Desert Storm suppressing Iraqi radar and fighters rather than striking ground targets immediately?',
        choices: [
          'Ground targets in the initial days of the campaign had not yet been identified by intelligence analysts.',
          'Iraqi ground forces were considered too dispersed to strike effectively during the opening days of the war.',
          'International law required a formal declaration period before ground targets could be legally engaged.',
          'Clearing Iraqi air defenses first let the later ground offensive proceed without having to watch the sky as well as the ground.',
          'Coalition planners believed destroying radar systems alone would be sufficient to end the war quickly.',
        ],
        correctIndex: 3,
        why: "The passage states the early air campaign against Iraqi radar and fighters was conducted \"specifically so that the ground offensive six weeks later could move without having to watch the sky as well as the horizon.\"",
      },
      {
        type: 'detail-inference',
        stem: 'The passage suggests that a commander who destroys many enemy aircraft but never uses the resulting freedom of the sky has:',
        choices: [
          'achieved the single most important objective of any air campaign regardless of what follows.',
          'guaranteed that the ground campaign will also succeed without further air support.',
          'demonstrated that the enemy air force posed no meaningful threat in the first place.',
          'proven that local air parity is functionally identical to full air supremacy.',
          'spent resources on a means without collecting the operational benefit it was supposed to buy.',
        ],
        correctIndex: 4,
        why: "The final paragraph calls an unused advantage \"a means left unused\" that is \"simply a cost the campaign paid for nothing in return,\" meaning the aerial victory alone accomplished nothing further.",
      },
      {
        type: 'function-of-paragraph',
        stem: "The fourth paragraph (beginning 'The concept is nonetheless more layered...') serves primarily to:",
        choices: [
          'qualify the earlier claim by showing that control of the air comes in degrees and is costly to sustain rather than absolute and free.',
          'introduce the historical examples of Normandy and Desert Storm discussed earlier in the passage.',
          'restate the definition of air superiority given in the opening paragraph without adding anything new.',
          'conclude the passage with a final recommendation about future defense budgets.',
          'contradict the claim that air superiority functions as a precondition for other operations.',
        ],
        correctIndex: 0,
        why: 'This paragraph introduces parity, superiority, and supremacy as distinct degrees and notes that sustaining even partial control is expensive, qualifying the earlier claim rather than repeating or reversing it.',
      },
    ],
  },
]);

// ================================================================================================
// rc-026 — close air support and the ground-air coordination problem
// ================================================================================================

const P26_LINES = [
  'Close air support, the use of aircraft to strike targets near friendly ground troops, sounds like a straightforward job',
  'for whichever pilot happens to be overhead, but the historical record shows the hard part is rarely the aircraft',
  'or the weapon it carries. The hard part is the coordination between the pilot and the troops on the',
  'ground who need the strike, because both sides are working from different information at different speeds under real time',
  'pressure. A soldier calling for help can usually see the target with their own eyes but cannot always describe',
  'its exact location precisely enough for a pilot moving at several hundred knots to find it from altitude.',
  '',
  'The coordination itself runs through a formal, practiced procedure. A qualified joint terminal attack controller on the ground',
  'talks the pilot onto the target using known landmarks, compass bearings, and distance estimates, confirming a shared picture',
  'before any weapon is released. Aircraft are assigned to altitude blocks and time windows so that several strike or',
  'reconnaissance flights can operate over the same small piece of ground without colliding with each other in the sky.',
  "A fire support coordination line marks where artillery and mortars must stop firing so an aircraft's bomb run does",
  'not cross paths with a friendly round already in flight toward the same patch of ground.',
  '',
  'This much procedure did not exist from the start of powered flight; it grew out of hard experience. Several',
  'documented incidents of aircraft striking friendly positions, mistaking them for the enemy in poor visibility or fast-moving fighting,',
  'pushed services to formalize exactly who may authorize a strike and exactly what must be confirmed first. Training a',
  'single terminal attack controller now takes months, not days, precisely because the job is judgment under pressure rather than',
  'a checklist that can be memorized quickly. That investment reflects a lesson paid for in past casualties, not a',
  'bureaucratic preference for paperwork over speed.',
  '',
  'The central tension in the mission has never fully gone away. Troops already under fire want ordnance on target',
  'immediately, while the controller and pilot both need enough time to positively identify the target and confirm no friendly',
  'position sits inside the danger radius of the weapon about to be dropped. Modern targeting pods, digital data links,',
  'and full-motion video feeds from the aircraft to the ground have shortened that verification step considerably compared to a',
  'voice-only radio call. None of that technology removes the underlying tradeoff between speed and certainty; it only moves the',
  'line at which a controller is willing to accept the remaining risk.',
  '',
  'Because the hardest part of close air support is coordination rather than hardware, buying a faster aircraft or a',
  'smarter bomb does comparatively little for units whose ground controllers are undertrained or whose procedures are unpracticed. The services',
  'that perform this mission well are consistently the ones that rehearse the handoff between ground and air constantly, not',
  'simply the ones that field the newest equipment. A procedure exercised only on paper fails exactly when it is',
  'needed most, which is the same lesson that produced the procedure in the first place.',
];

registerPassages([
  {
    id: 'rc-026', wordCount: 520, band: 3, lineNumbered: true,
    text: P26_LINES.join('\n'),
    questions: [
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 17, "formalize" most nearly means:',
        choices: [
          'to informally suggest a possible new approach without requiring anyone to follow it.',
          'to establish something as an official, required procedure rather than an informal practice.',
          'to translate a document from one language into another for foreign partners.',
          'to reduce the total number of steps required to authorize an action.',
          'to celebrate an achievement with an official award or ceremony.',
        ],
        correctIndex: 1,
        why: 'The sentence says incidents "pushed services to formalize exactly who may authorize a strike," meaning turning what had been informal judgment calls into a required, official procedure.',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 25, "verification" most nearly means:',
        choices: [
          "the total destruction of an enemy position by an aircraft's weapons.",
          'a formal ceremony marking the end of a training course for controllers.',
          'the process of confirming that a target and the surrounding area are what they are believed to be.',
          "the routine maintenance schedule performed on an aircraft's targeting equipment.",
          'a written report filed after a mission has already been completed.',
        ],
        correctIndex: 2,
        why: 'The passage says targeting pods and video feeds have "shortened that verification step," referring back to the need to positively identify the target and confirm no friendly position is nearby before releasing a weapon.',
      },
      {
        type: 'function-of-paragraph',
        stem: "The second paragraph (beginning 'The coordination itself runs through...') serves primarily to:",
        choices: [
          'argue that formal procedures are unnecessary once pilots gain enough combat experience.',
          'introduce the historical incidents that are discussed later in the passage.',
          'conclude the passage by recommending a specific piece of new equipment.',
          'describe the concrete mechanics of the coordination procedure introduced in the first paragraph.',
          'contradict the claim that coordination, not hardware, is the hardest part of the mission.',
        ],
        correctIndex: 3,
        why: 'This paragraph walks through the terminal attack controller\'s talk-on, altitude blocks, and the fire support coordination line, giving concrete mechanical detail for the coordination problem the first paragraph names.',
      },
      {
        type: 'function-of-paragraph',
        stem: "The third paragraph (beginning 'This much procedure did not exist...') serves primarily to:",
        choices: [
          'describe the specific radio equipment a joint terminal attack controller carries into the field.',
          'argue that current coordination procedures should be simplified to shorten training time.',
          'restate the definition of close air support that was already given in the first paragraph.',
          'introduce a historical example that has no real bearing on the rest of the passage.',
          'explain why the procedure described earlier exists, tracing it to hard experience rather than bureaucratic preference.',
        ],
        correctIndex: 4,
        why: 'The paragraph directly credits the procedure to "a lesson paid for in past casualties, not a bureaucratic preference for paperwork," explaining the origin of the mechanics just described.',
      },
      {
        type: 'main-idea',
        stem: 'Which of the following best summarizes the passage?',
        choices: [
          'The hardest part of close air support is the coordination between ground and air, not the capability of the aircraft or its weapons.',
          'Modern targeting technology has completely eliminated the tradeoff between speed and certainty in close air support.',
          'Joint terminal attack controllers are no longer necessary now that aircraft carry advanced targeting pods.',
          'Close air support became simpler to coordinate once formal procedures were removed from the process.',
          'The fire support coordination line is the single most important tool in modern combat aviation.',
        ],
        correctIndex: 0,
        why: 'The passage opens by naming coordination, not the aircraft or weapon, as the hard part, and closes by saying units with undertrained controllers benefit little from newer hardware, reinforcing the same point.',
      },
      {
        type: 'author-agreement',
        stem: 'The passage indicates that the author believes that:',
        choices: [
          'a unit that buys the newest aircraft will automatically perform close air support well.',
          'rehearsing the handoff between ground controllers and pilots matters more than fielding newer equipment.',
          'the tension between speed and certainty in close air support has now been fully resolved.',
          'close air support requires no specialized training beyond what a standard pilot already receives.',
          'historical fratricide incidents had no lasting influence on how the mission is conducted today.',
        ],
        correctIndex: 1,
        why: 'The final paragraph states plainly that units with undertrained controllers gain little from better equipment, and that services who rehearse the handoff perform the mission well, not merely the ones fielding the newest equipment.',
      },
    ],
  },
]);

// ================================================================================================
// rc-027 — the strategic bombing survey evidence
// ================================================================================================

const P27_LINES = [
  "For much of the Second World War, airpower advocates argued that bombing an enemy's factories and cities could win",
  'a war largely on its own, without a matching land campaign, by collapsing war production and breaking civilian morale.',
  'That claim was tested directly after the war ended, when Allied investigators interviewed German officials, examined production records, and',
  'toured the wreckage of bombed cities to measure what the campaign had actually accomplished. The evidence they gathered complicated',
  'the claim considerably rather than confirming it outright.',
  '',
  'The most surprising finding was that German war production did not collapse for most of the war; it actually',
  'rose year over year even as the bombing intensified, peaking as late as 1944. Investigators found several reasons for',
  'this. German industry dispersed factories away from obvious targets, moved production underground in some cases, and reallocated labor',
  'from consumer goods into weapons manufacturing, absorbing losses that would have crippled a less centrally directed economy. Civilian morale',
  'also proved harder to break through bombing than prewar theory had assumed, since fear and hardship did not translate',
  'cleanly into political pressure to surrender.',
  '',
  'Later in the war, a different kind of campaign told a different story. Attacks concentrated specifically on oil',
  'refineries and the rail network, rather than spread across cities generally, produced measurable and fairly rapid effects: fuel',
  'shortages grounded aircraft and stalled armored units, and transportation bottlenecks kept finished equipment from reaching the front even when',
  'factories kept producing it. The contrast was instructive. Diffuse pressure against a resilient, adaptable economy achieved comparatively little,',
  'while concentrated pressure against a genuine bottleneck, a single point the whole system depended on, achieved a great deal',
  'in a short span of time.',
  '',
  'The survey could not, however, settle every question it raised. Measuring what would have happened without the bombing',
  'campaign is inherently speculative, and the investigators were reconstructing intentions and effects years after the fact from interviews',
  'and incomplete records. Nor did the material findings resolve the separate moral and political argument over bombing campaigns aimed',
  'at population centers rather than military or industrial targets specifically. A campaign could be judged militarily ineffective and still',
  "be defended or condemned on entirely different grounds, and the survey's authors were careful not to claim their production",
  'data settled that second argument.',
  '',
  'What the findings did settle, for the doctrine that followed, was a preference for concentration over diffusion. Postwar',
  'airpower planners drew the lesson that identifying and destroying a small number of genuine chokepoints beats spreading the same',
  'weight of attack across an entire economy hoping something critical gets hit along the way. That argument, refined many',
  'times since, still underlies how modern planners select which targets actually matter in a system rather than simply how',
  'many targets a campaign can strike.',
];

registerPassages([
  {
    id: 'rc-027', wordCount: 461, band: 3, lineNumbered: true,
    text: P27_LINES.join('\n'),
    questions: [
      {
        type: 'main-idea',
        stem: 'Which choice best captures the overall argument of the passage?',
        choices: [
          'German industry proved completely immune to every effect of sustained Allied strategic bombing throughout the whole war.',
          "The moral debate over bombing population centers was fully and permanently resolved by the post-war survey's own production data.",
          'Post-war survey evidence complicated, rather than confirmed, the wartime claim that bombing alone could collapse an enemy economy.',
          'Civilian morale collapsed almost immediately and completely once bombing campaigns against major German cities began in earnest.',
          'Aerial reconnaissance photographs alone provided the only reliable evidence used throughout the entire post-war survey effort.',
        ],
        correctIndex: 2,
        why: 'The passage states the evidence "complicated the claim considerably rather than confirming it outright," then shows concentrated attacks on oil and rail bottlenecks worked far better than diffuse city bombing, which is the survey\'s central lesson.',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 9, "dispersed" most nearly means:',
        choices: [
          'destroyed completely and permanently by a series of repeated bombing raids.',
          'relocated entirely into a single, heavily fortified underground facility.',
          'reduced sharply in the total number of skilled workers still employed.',
          'spread out and scattered into multiple separate locations to avoid a concentrated target.',
          'converted entirely from military use into purely civilian production purposes.',
        ],
        correctIndex: 3,
        why: 'The sentence explains that German industry "dispersed factories away from obvious targets" and in some cases moved production underground, meaning it spread operations out across many locations rather than staying concentrated at one.',
      },
      {
        type: 'detail-inference',
        stem: 'Based on the passage, why did German war production rise rather than collapse for most of the war despite sustained bombing?',
        choices: [
          'Allied bombers deliberately avoided striking German industrial targets for most of the conflict.',
          'German factories were protected by an air defense network too strong for bombers to penetrate.',
          "The survey's investigators later admitted the production data they collected was fabricated after the war.",
          'Civilian morale remained so high that workers volunteered for unusually long factory shifts.',
          'German industry adapted by dispersing and relocating production and by reallocating labor from consumer goods into weapons manufacturing.',
        ],
        correctIndex: 4,
        why: 'The passage credits the rise in production to adaptation: factories were dispersed away from obvious targets, some moved underground, and labor was reallocated from consumer goods into weapons manufacturing.',
      },
      {
        type: 'detail-inference',
        stem: 'The passage suggests that concentrated attacks on oil refineries and rail lines succeeded where diffuse city bombing did not mainly because:',
        choices: [
          'they targeted a genuine bottleneck the whole war economy depended on, rather than spreading pressure across a resilient, adaptable system.',
          'oil refineries and rail lines were located in areas with weaker air defenses than major cities.',
          'the bombers used against refineries and rail lines carried larger and more powerful bombs.',
          'civilian workers at refineries and rail yards were less willing to work under bombing than city dwellers.',
          'refineries and rail lines had no capacity at all to disperse or relocate their operations.',
        ],
        correctIndex: 0,
        why: 'The passage draws the contrast directly: "concentrated pressure against a genuine bottleneck... achieved a great deal" while "diffuse pressure against a resilient, adaptable economy achieved comparatively little."',
      },
      {
        type: 'author-agreement',
        stem: 'Based on the passage, the author most clearly believes that:',
        choices: [
          'diffuse bombing across an entire economy is generally more effective than concentrated attacks on bottlenecks.',
          'concentrated attacks on genuine chokepoints proved more effective than diffuse pressure spread across an entire economy.',
          'the post-war survey proved that bombing civilian population centers was morally justified.',
          'German industry had no meaningful ability to adapt to sustained Allied bombing.',
          'production records collected years after the war are more reliable than records collected during it.',
        ],
        correctIndex: 1,
        why: 'The passage states postwar planners drew the lesson that "identifying and destroying a small number of genuine chokepoints beats spreading the same weight of attack across an entire economy," the opposite of the first option.',
      },
      {
        type: 'author-agreement',
        stem: 'Regarding the limits of the post-war survey itself, the author would most likely agree that:',
        choices: [
          "the survey's production data was sufficient on its own to settle the moral argument over bombing cities.",
          'measuring what would have happened without the bombing campaign is a simple and precise exercise.',
          'production data showing a campaign was militarily ineffective does not by itself settle whether that campaign was morally justified.',
          'investigators reconstructing wartime effects years later face no meaningful limitations in their methodology.',
          'civilian morale broke down completely under sustained bombing, regardless of what the survey concluded.',
        ],
        correctIndex: 2,
        why: 'The passage states a campaign "could be judged militarily ineffective and still be defended or condemned on entirely different grounds," and that the survey\'s authors were careful not to claim their production data settled the moral argument.',
      },
    ],
  },
]);

// ================================================================================================
// rc-028 — aerial refueling and operational reach
// ================================================================================================

const P28_LINES = [
  "Aerial refueling is often described loosely as a way to extend an aircraft's range, but that description understates",
  'what it actually does. A fighter or bomber that refuels in flight does not simply fly farther on a',
  'single tank of fuel; it converts a fixed, finite fuel load into a renewable one, turning a brief pass',
  'over a target into sustained presence that can last for hours rather than minutes.',
  '',
  'The method itself takes one of two forms. In the boom method, an operator aboard the tanker flies a',
  'rigid, telescoping arm into a receptacle on the receiving aircraft and pumps fuel under pressure, a technique that transfers',
  'fuel quickly but requires the receiving pilot to hold a precise position just behind and below the tanker. In',
  "the probe-and-drogue method, the receiving aircraft extends its own probe into a trailing, basket-shaped drogue reeled out behind",
  'the tanker, a slower but more flexible arrangement that lets several smaller aircraft refuel from hoses on the same',
  'tanker in sequence.',
  '',
  'The operational effect shows up clearly in missions that would otherwise be impossible. A long-range bomber can strike a',
  'target on the far side of an ocean and return home without landing anywhere in between. Fighters can fly',
  'combat air patrols hundreds of miles from their base and remain on station for hours rather than the twenty',
  'or thirty minutes a full tank alone would allow. Before aerial refueling matured, aircraft attempting missions at this distance',
  'had to stage through a chain of forward air bases, each one requiring its own fuel, security, and diplomatic',
  'clearance from whatever nation hosted it.',
  '',
  'That capability comes with its own vulnerability built in. A tanker aircraft is large, slow, and essentially unarmed, which',
  'means it typically must operate in airspace that is reasonably permissive or be escorted by fighters whose own range',
  'depends, often enough, on the very tanker they are protecting. The tanker fleet is also a genuinely limited resource:',
  'there are far fewer tankers in most air forces than there are aircraft that might want fuel from one,',
  'and a single theater-wide operation can draw on the whole available fleet at once, leaving little slack for a',
  'second contingency elsewhere.',
  '',
  'Because operational reach is created by the tanker rather than by the fighter or bomber it refuels, the true',
  'limit on how much airpower a nation can project and sustain far from home is frequently the size of',
  'its tanker fleet, not the number of combat aircraft it owns. A large fighter force with too few tankers',
  'behind it can generate an impressive number of aircraft on a ramp and still be unable to keep more',
  'than a handful of them on station at any distance for very long.',
];

registerPassages([
  {
    id: 'rc-028', wordCount: 455, band: 3, lineNumbered: true,
    text: P28_LINES.join('\n'),
    questions: [
      {
        type: 'main-idea',
        stem: 'Which statement best expresses the main point of the passage?',
        choices: [
          'Refueling booms are always more reliable than probe-and-drogue systems in every possible operational situation.',
          'A tanker aircraft is generally considered safer to operate than the fighters and bombers it refuels.',
          'Forward air bases have become entirely unnecessary now that aerial refueling is so widely available.',
          'Aerial refueling converts a finite fuel load into sustained presence, which is why tanker fleet size often limits how far airpower can reach.',
          'Combat air patrols are the only mission type that aerial refueling has meaningfully improved so far.',
        ],
        correctIndex: 3,
        why: 'The passage opens by saying refueling converts fuel into "sustained presence" rather than simply more range, and closes by naming tanker fleet size, not aircraft count, as the practical limit on projecting airpower.',
      },
      {
        type: 'main-idea',
        stem: 'The passage is chiefly intended to:',
        choices: [
          'compare the fuel capacity of several specific fighter aircraft currently in front-line service.',
          'argue that every forward air base should be closed now that tankers exist in numbers.',
          'recommend a specific number of tankers that each modern air force should purchase this decade.',
          'describe the extended training required for someone to qualify as a tanker crew member.',
          'explain how aerial refueling turns a fixed fuel load into sustained reach, and why tanker capacity limits projected airpower.',
        ],
        correctIndex: 4,
        why: "The passage traces refueling's mechanics, its operational payoff in real missions, and its own vulnerability, all building toward the closing claim that tanker fleet size is the real constraint on reach.",
      },
      {
        type: 'function-of-paragraph',
        stem: "The second paragraph (beginning 'The method itself takes one of two forms...') serves primarily to:",
        choices: [
          'describe the two physical methods by which fuel is actually transferred between aircraft in flight.',
          'argue that the probe-and-drogue method should be phased out in favor of the boom method.',
          'introduce the historical origin of aerial refueling technology during an earlier conflict.',
          'conclude the passage with a recommendation about future tanker procurement.',
          'restate the definition of operational reach given in the first paragraph.',
        ],
        correctIndex: 0,
        why: 'This paragraph explains the boom method and the probe-and-drogue method mechanically, one right after the other, giving concrete detail for how the fuel transfer described generally in the opening paragraph actually happens.',
      },
      {
        type: 'function-of-paragraph',
        stem: "The fourth paragraph (beginning 'That capability comes with its own vulnerability...') serves primarily to:",
        choices: [
          'describe the specific radar systems that adversaries use to detect tanker aircraft in flight.',
          "qualify the earlier capability by naming the tanker's own vulnerability and its fleet limits.",
          'restate the operational examples of long-range bombing missions already given in the third paragraph.',
          'argue that tanker aircraft should be armed with their own defensive weapons systems.',
          'conclude the passage by recommending that fewer fighters be purchased in the near future.',
        ],
        correctIndex: 1,
        why: 'The paragraph shifts from describing what refueling enables to naming its costs: the tanker is large, slow, and unarmed, and the fleet itself is a genuinely limited resource that constrains a whole theater at once.',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 3, "renewable" most nearly means:',
        choices: [
          'expensive to produce and difficult to replace once it has been used up.',
          'limited to a single use before the aircraft must return to base.',
          'able to be restored or replenished rather than simply used up once and gone.',
          'identical in composition to the fuel used by ground vehicles.',
          'measured only in a fixed, unchanging quantity for the life of an aircraft.',
        ],
        correctIndex: 2,
        why: 'The sentence contrasts "a fixed, finite fuel load" with one that becomes "renewable," meaning the tank can be replenished in flight rather than being a one-time, use-it-and-return supply.',
      },
      {
        type: 'author-agreement',
        stem: 'The passage suggests that the author holds the view that:',
        choices: [
          'the number of fighters and bombers a nation owns is the main limit on how much airpower it can sustain far away.',
          'tanker aircraft are safer to operate than the fighters and bombers they support.',
          'forward air bases became entirely obsolete once aerial refueling was introduced.',
          "the size of a nation's tanker fleet, not its number of combat aircraft, often limits how much airpower it can sustain far from home.",
          'probe-and-drogue refueling has completely replaced the boom method in modern air forces.',
        ],
        correctIndex: 3,
        why: 'The closing paragraph states directly that the true limit "is frequently the size of its tanker fleet, not the number of combat aircraft it owns," the opposite of the first option.',
      },
    ],
  },
]);

// ================================================================================================
// rc-029 — airlift throughput and ground handling capacity
// ================================================================================================

const P29_LINES = [
  'When planners estimate how much cargo an airlift operation can deliver, the instinct is to count aircraft and multiply',
  'by how much each one can carry. That arithmetic is misleading on its own, because the actual limit on',
  'throughput is usually set on the ground, not in the air: how quickly cargo can be loaded, unloaded, and',
  'cleared away at each end of the route.',
  '',
  'Ramp space at any airfield is finite. Only so many aircraft can be parked, loading, or unloading at once,',
  'and each aircraft occupies its spot for the entire time it takes to taxi in, offload or load its',
  'cargo, and taxi back out again. Adding more aircraft to a route does nothing for total tonnage delivered once',
  'the ramp is already full; the extra aircraft simply queue in a holding pattern overhead or wait on a',
  'taxiway, burning fuel without moving any cargo at all.',
  '',
  'The Berlin Airlift of 1948 and 1949 illustrates the point well. Early in the operation, tonnage delivered per',
  'day rose only modestly even as more aircraft were added to the effort. The real gains came once planners',
  'restructured how the ground itself operated: trucks and drivers were pre-positioned before each aircraft landed, a single fixed',
  'approach pattern let controllers land planes in rapid, predictable succession, and ground crews were timed against a strict',
  'schedule rather than working at their own pace. Those changes to ground handling, not new aircraft, produced most of',
  'the improvement in daily tonnage that followed.',
  '',
  'None of this means aircraft and fuel are irrelevant; a fleet that is genuinely too small, or that lacks',
  'the fuel to fly its planned sorties, will fail regardless of how efficient the ground crews are. Weather and',
  'the physical condition of the destination airfield matter as well, since a damaged runway or poor visibility can idle',
  'a ramp no matter how well it is organized. But once a fleet is adequate to the route, ground',
  'handling capacity is typically the binding constraint, the one factor that determines whether additional aircraft translate into additional',
  'tons delivered at all.',
  '',
  'The practical implication for planners is that airlift capacity should be measured, and invested in, on both ends of',
  'the equation at once. A larger fleet purchased without a matching increase in ramp space, ground crews, and vehicles',
  'to move cargo away from the aircraft produces no additional tonnage delivered; it only produces aircraft waiting their turn.',
  'Throughput planning that focuses on aircraft numbers alone, while treating ground handling as an afterthought, consistently overestimates what an',
  'airlift operation can actually deliver in a given day.',
];

registerPassages([
  {
    id: 'rc-029', wordCount: 432, band: 3, lineNumbered: true,
    text: P29_LINES.join('\n'),
    questions: [
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 3, "throughput" most nearly means:',
        choices: [
          'the total number of aircraft assigned to a single operation.',
          'the fuel efficiency of a specific type of cargo aircraft.',
          'the distance an aircraft can fly without landing to refuel.',
          'the maintenance schedule required to keep an aircraft flightworthy.',
          'the actual rate at which cargo is delivered by the whole operation over time.',
        ],
        correctIndex: 4,
        why: 'The sentence contrasts naive arithmetic (aircraft times capacity) with the real limit, saying "throughput is usually set on the ground," referring to how much cargo the operation as a whole actually delivers.',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 23, "binding constraint" most nearly means:',
        choices: [
          'the specific limiting factor that actually determines the outcome, regardless of other resources available.',
          'a legally enforceable contract signed between an airfield operator and a cargo carrier.',
          'a physical strap or cord used to secure cargo pallets inside an aircraft.',
          'a formal agreement requiring two allied nations to share airfield access rights.',
          'a fixed daily schedule that ground crews are legally required to follow exactly.',
        ],
        correctIndex: 0,
        why: 'The passage says that once a fleet is adequate, ground handling capacity "is typically the binding constraint, the one factor that determines whether additional aircraft translate into additional tons delivered at all" - the actual limiting factor, not a legal term.',
      },
      {
        type: 'author-agreement',
        stem: 'It can be inferred from the passage that the author accepts that:',
        choices: [
          'adding aircraft to a route with full ramp space and no additional ground crews increases total tonnage delivered.',
          'adding aircraft beyond what ground crews can turn around produces no additional tonnage delivered.',
          'aircraft and fuel are entirely irrelevant once ground handling procedures are well organized.',
          'weather and runway condition have no meaningful effect on airlift throughput.',
          "the Berlin Airlift's tonnage gains came mainly from introducing new types of cargo aircraft.",
        ],
        correctIndex: 1,
        why: 'The passage states plainly that once the ramp is full, "the extra aircraft simply queue in a holding pattern overhead or wait on a taxiway, burning fuel without moving any cargo at all," the opposite of the first option.',
      },
      {
        type: 'author-agreement',
        stem: 'Regarding the Berlin Airlift specifically, the author would most likely agree that:',
        choices: [
          "the Berlin Airlift's tonnage gains came mainly from adding new aircraft rather than from changing ground procedures.",
          'ramp space limitations only matter for operations conducted before the Berlin Airlift era.',
          "the Berlin Airlift's tonnage gains came mainly from restructuring ground procedures rather than from adding new aircraft.",
          'modern airlift operations no longer face any meaningful ramp space limitations.',
          'ground crew scheduling has little effect on how much cargo an operation can deliver in a day.',
        ],
        correctIndex: 2,
        why: 'The passage states directly that "those changes to ground handling, not new aircraft, produced most of the improvement in daily tonnage that followed" during the Berlin Airlift, the opposite of the first option.',
      },
      {
        type: 'main-idea',
        stem: 'Which of the following best reflects the passage as a whole?',
        choices: [
          'The number of aircraft assigned to a route is always the single best predictor of total tonnage delivered.',
          'Weather conditions are the single most important factor limiting how much cargo an airlift operation can deliver.',
          'The Berlin Airlift failed to deliver meaningful tonnage until new aircraft types were introduced late in the operation.',
          'Airlift throughput depends mainly on ground handling capacity, such as ramp space and ground crews, rather than simply on the number of aircraft available.',
          'Aerial refueling has made ramp space limitations irrelevant to modern airlift planning.',
        ],
        correctIndex: 3,
        why: 'The passage opens by calling the naive aircraft-times-capacity arithmetic misleading, and repeatedly ties actual throughput to ramp space and ground crew capacity instead, closing with a direct warning against planning on aircraft numbers alone.',
      },
      {
        type: 'detail-inference',
        stem: "Based on the passage, why would increasing the number of ground crews and vehicles at an airfield likely raise an airlift operation's delivered tonnage more reliably than purchasing additional cargo aircraft?",
        choices: [
          'Ground crews generally consume noticeably less scarce aviation fuel than cargo aircraft do over a long operation.',
          'New cargo aircraft almost always require a considerably longer runway than most existing airfields can actually provide.',
          'Ground crews can typically be trained and certified far faster than pilots can be certified to fly cargo aircraft.',
          'Additional cargo aircraft are usually far more expensive to purchase than additional ground vehicles and support personnel.',
          'Ground handling capacity is typically the binding constraint once the fleet is adequate, so extra aircraft would simply wait.',
        ],
        correctIndex: 4,
        why: 'The passage states that once a fleet is adequate, ground handling capacity is "the one factor that determines whether additional aircraft translate into additional tons delivered at all," implying more aircraft alone would not help.',
      },
    ],
  },
]);

// ================================================================================================
// rc-030 — suppression of enemy air defenses as a measure-countermeasure cycle
// ================================================================================================

const P30_LINES = [
  'Suppression of enemy air defenses, usually shortened to SEAD, is sometimes described as a task that a campaign completes',
  'and then moves past, the way a unit might clear a minefield once and never think about it again.',
  'The historical record argues against that framing. SEAD is better understood as an ongoing contest between measure and countermeasure,',
  "one that never permanently resolves in either side's favor for very long.",
  '',
  'The contest plays out at the level of specific techniques. A ground radar detects an incoming aircraft, cues a',
  'surface-to-air missile system, and threatens the strike. Attackers respond with jamming to blind the radar, chaff to confuse',
  "its return, or anti-radiation missiles that home in on the radar's own emissions and destroy it directly. Each of",
  'those countermeasures defeats a specific defensive technique rather than defenses in general, which is exactly why defenders can',
  'and do adapt: shifting to different radar frequencies, moving launchers between engagements, or emitting only briefly before shutting down',
  'to avoid being targeted in turn.',
  '',
  'This leapfrogging shows up clearly across decades of conflict. Surface-to-air missile systems used over Vietnam prompted new radar-homing',
  'weapons and evasive tactics; those countermeasures prompted mobile, frequency-agile systems used a decade later in the Middle East; those',
  'systems in turn prompted better jamming and more capable anti-radiation missiles fielded by the following generation of aircraft. At',
  'no point in this history did either side achieve a permanent advantage. Every gain by one side proved temporary,',
  'eroded within a handful of years by an adaptation from the other.',
  '',
  'Even a force with a substantial technological advantage cannot simply bank that advantage and stop investing in the competition.',
  'A static air defense system, one that emits on fixed frequencies from a fixed location, becomes vulnerable quickly once',
  'an adversary studies its pattern, while a mobile system that relocates and limits its own emissions remains a persistent',
  'problem precisely because it refuses to stay predictable. The reverse holds for the attacker as well: a set of',
  'jamming techniques and target lists validated in one campaign cannot simply be assumed to still work in the next',
  'one against an adversary who has had time to adapt in the interval.',
  '',
  "Because the competition is perpetual rather than something either side wins outright, the right measure of a SEAD effort's",
  'success is not a permanent, campaign-spanning kill list of destroyed systems. It is narrower and more practical: whether friendly',
  'aircraft can operate with an acceptable level of risk for the specific duration of a specific operation. That advantage',
  'must be renewed continuously rather than banked once and assumed to last, which is the same lesson the broader',
  'history of the contest keeps teaching.',
];

registerPassages([
  {
    id: 'rc-030', wordCount: 445, band: 3, lineNumbered: true,
    text: P30_LINES.join('\n'),
    questions: [
      {
        type: 'detail-inference',
        stem: 'Based on the passage, a defensive system is most likely to remain effective over time if it:',
        choices: [
          'changes its behavior unpredictably, relocating and limiting emissions, rather than staying fixed on one frequency.',
          'relies on a single, permanently assigned radar frequency that never changes across any single engagement fought.',
          'remains stationary in one fixed location so that friendly ground forces can resupply it more easily overall.',
          'operates only during daylight hours specifically to reduce its overall measured risk of enemy detection.',
          'uses the identical jamming countermeasures across every campaign regardless of which specific adversary is faced.',
        ],
        correctIndex: 0,
        why: 'The passage contrasts a static system on "fixed frequencies from a fixed location," which "becomes vulnerable quickly," with a mobile system that "relocates and limits its own emissions" and "remains a persistent problem precisely because it refuses to stay predictable."',
      },
      {
        type: 'detail-inference',
        stem: 'A commander who assumes that jamming techniques validated in one campaign will automatically work equally well in the next campaign is most likely making which mistake, according to the passage?',
        choices: [
          'underestimating the total number of surface-to-air missile systems the adversary has fielded.',
          'treating a temporary, competitive advantage as though it were permanent rather than something the adversary will adapt against.',
          'overestimating how quickly friendly forces can train new radar operators between campaigns.',
          'assuming that anti-radiation missiles are less effective than chaff against modern radar systems.',
          'failing to account for the fuel consumption of jamming aircraft during a long campaign.',
        ],
        correctIndex: 1,
        why: 'The passage states that "a set of jamming techniques and target lists validated in one campaign cannot simply be assumed to still work in the next one against an adversary who has had time to adapt," the exact mistake described.',
      },
      {
        type: 'function-of-paragraph',
        stem: "The second paragraph (beginning 'The contest plays out at the level...') serves primarily to:",
        choices: [
          'argue that jamming is generally a more effective countermeasure than anti-radiation missiles.',
          'introduce the specific historical examples of Vietnam and the Middle East discussed later.',
          'show concretely how specific attacking and defending techniques trade advantage back and forth at the technique level.',
          'conclude the passage by recommending one particular defensive countermeasure over the others.',
          'restate the definition of SEAD given earlier in the first paragraph without adding detail.',
        ],
        correctIndex: 2,
        why: 'This paragraph walks through radar detection, jamming, chaff, and anti-radiation missiles, and then defender adaptations like frequency shifts, giving the concrete mechanism behind the "measure and countermeasure" contest named in paragraph one.',
      },
      {
        type: 'function-of-paragraph',
        stem: "The fourth paragraph (beginning 'Even a force with a substantial technological advantage...') serves primarily to:",
        choices: [
          'describe the specific radar frequencies used by static air defense systems.',
          'introduce the historical leapfrogging discussed in the previous paragraph for the first time.',
          'restate the passage\'s opening definition of suppression of enemy air defenses.',
          'explain why even a technologically superior force cannot treat SEAD as a one-time achievement and must keep reinvesting.',
          'conclude the passage with a specific recommendation about future weapons procurement.',
        ],
        correctIndex: 3,
        why: 'The paragraph opens by saying a dominant force "cannot simply bank that advantage and stop investing in the competition," then explains why for both static defenses and validated attacker techniques, extending the ongoing-contest claim.',
      },
      {
        type: 'main-idea',
        stem: 'Which choice most accurately conveys the central claim of the passage?',
        choices: [
          'Anti-radiation missiles have made essentially all forms of ground-based air defense completely obsolete today.',
          'Surface-to-air missile systems used over Vietnam remain the single most advanced defenses fielded anywhere today.',
          "A single successful SEAD campaign permanently eliminates an adversary's entire ability to threaten friendly aircraft again.",
          'Static air defense systems are consistently more effective than mobile ones across any sufficiently long campaign.',
          'Suppression of enemy air defenses is an ongoing contest that never permanently resolves, so any advantage must be renewed rather than banked.',
        ],
        correctIndex: 4,
        why: 'The passage opens by rejecting the idea that SEAD is a one-time task, traces decades of leapfrogging advantage, and closes by saying any advantage "must be renewed continuously rather than banked once and assumed to last."',
      },
      {
        type: 'vocabulary-in-context',
        stem: 'As used in line 13, "leapfrogging" most nearly means:',
        choices: [
          "each side alternately overtaking the other's advantage through successive rounds of adaptation.",
          "a single decisive advance that permanently settles a competition in one side's favor.",
          'a formal training exercise conducted jointly by two allied air forces.',
          'the gradual retirement of older weapons systems without any replacement being fielded.',
          'a defensive formation used by ground troops to advance under covering fire.',
        ],
        correctIndex: 0,
        why: "The sentence introduces decades in which one side's countermeasure prompted the other's new system, which then prompted a further countermeasure in turn, the back-and-forth overtaking pattern the word describes.",
      },
    ],
  },
]);

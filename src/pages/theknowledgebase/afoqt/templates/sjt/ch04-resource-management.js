// Chapter 4 - Resource management.
//
// PART 25B of docs/afoqt/HANDOFF.md. Same sourcing and authoring rules as ch02/ch03 - see
// ch02-integrity-professionalism.js's header, not repeated here.

import { registerScenarios, scenarioTemplates } from '../../engine/judgment.js';

const CH = 'sjt-04-resource-management';
const PRIORITIZATION = ['sjt-prioritization-under-scarcity'];
const PROPER_CHANNELS = ['sjt-proper-channels-for-requests'];
const REALISTIC_COMMITMENT = ['sjt-realistic-commitment'];

registerScenarios([
  // ============================ BAND 2 ============================
  {
    id: 'sjt-prioritize-01', chapter: CH, concepts: PRIORITIZATION, band: 2,
    situation: 'You supervise a small supply room with three open requests at once: a routine restock that can wait a week, a request for a spare part needed to finish a repair due tomorrow, and a request from a coworker who would simply prefer to have their item today rather than tomorrow for convenience.',
    actions: [
      { text: "Fill the spare part request for tomorrow's repair first, then the routine restock, then the convenience request last.", competency: 'resource-management', rationale: 'This ranks the three requests by actual urgency and consequence rather than by convenience or order received, which is exactly what prioritization under scarcity means.' },
      { text: 'Fill all three requests in the order they were received, regardless of urgency.', competency: 'resource-management', rationale: 'First-come-first-served ignores that one of these requests has a real deadline tomorrow and another has none at all - treating them as equally urgent is itself a prioritization failure.' },
      { text: "Fill the convenience request first, since that coworker asked in person and is waiting nearby.", competency: 'resource-management', rationale: "Filling the least urgent request first, just because the person is physically present, puts a tomorrow's-deadline repair at real risk for no good reason." },
      { text: 'Try to fill all three requests partially and simultaneously, splitting your attention across them.', competency: 'resource-management', rationale: 'Splitting attention across three requests of different urgency risks the most time-sensitive one, the spare part, getting no more attention than the other two.' },
      { text: "Ask your supervisor to decide which of the three requests to fill first.", competency: 'leadership', rationale: 'Prioritizing a handful of routine supply requests by urgency is squarely within your own role - escalating this small a decision is unnecessary.' },
    ],
    mostEffective: 0, leastEffective: 2,
    tell: 'Rank competing demands by actual urgency and consequence, not by arrival order or who is asking most conveniently.',
  },
  {
    id: 'sjt-channels-01', chapter: CH, concepts: PROPER_CHANNELS, band: 2,
    situation: 'You need an additional laptop for a new team member starting next week. Your unit has a standard equipment request process that typically takes about ten days, but you know the IT supply sergeant personally from a previous assignment and could likely get one faster by asking them directly, off the books.',
    actions: [
      { text: 'Submit the request through the standard process, and if the timeline is a genuine problem, ask your supervisor whether an expedited request is available.', competency: 'resource-management', rationale: 'Using the actual process, and escalating through it if there is a real timing problem, gets the equipment tracked and accounted for the way it is supposed to be.' },
      { text: 'Ask your IT contact directly for a laptop off the books, since you know them personally and it would be faster.', competency: 'resource-management', rationale: 'Routing a routine equipment request around the official process, based on a personal connection, skips the accountability and tracking the process exists to provide.' },
      { text: "Submit the request through the standard process, but also ask your personal contact to quietly hold one aside just in case.", competency: 'resource-management', rationale: 'Working the personal connection in parallel with the official process still uses an informal channel for something that should go through the process alone.' },
      { text: "Wait until the new team member actually arrives without equipment, then treat it as an urgent problem to escalate.", competency: 'resource-management', rationale: 'Waiting until the deadline has already been missed to start escalating turns an avoidable problem into an urgent one, when the standard timeline was known well in advance.' },
      { text: 'Ask a different team member to lend their own laptop temporarily instead of submitting any request at all.', competency: 'resource-management', rationale: "Borrowing around the problem instead of submitting the actual request means the real equipment need never gets addressed or tracked." },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: 'Route a resource request through the correct process, even when a personal connection offers a shortcut - and use that same process, escalated if needed, rather than working around it.',
  },

  // ============================ BAND 3 ============================
  {
    id: 'sjt-prioritize-02', chapter: CH, concepts: PRIORITIZATION, band: 3,
    situation: "You lead a small analysis cell with two pending taskers due the same afternoon: one is a routine recurring report that a senior officer reviews weekly but rarely acts on urgently, and the other is a one-time request tied to a decision a commander needs to make by end of day. You do not have time to fully complete both to your usual standard.",
    actions: [
      { text: "Prioritize the commander's time-sensitive decision request, and submit the recurring report on time but with a note that it received a lighter review than usual.", competency: 'resource-management', rationale: 'This puts full effort where a real, same-day decision actually depends on it, while still delivering the recurring report honestly flagged rather than silently degraded.' },
      { text: 'Split your remaining time evenly between both taskers, giving neither your full attention.', competency: 'resource-management', rationale: "Splitting time evenly between a routine report and a time-sensitive decision the commander is actually waiting on risks under-serving the one that genuinely can't wait." },
      { text: 'Complete the recurring report to its usual standard first, since it is due to a senior officer, and get to the commander\'s request afterward if time allows.', competency: 'resource-management', rationale: "Treating the routine, rarely-acted-on report as higher priority than a same-day decision a commander is actually waiting on reverses the real urgency here." },
      { text: "Ask your supervisor to decide which tasker to prioritize, rather than making the call yourself.", competency: 'leadership', rationale: 'Ranking two competing near-term taskers by actual urgency is a routine judgment call within your own role - escalating it costs time you do not have.' },
      { text: 'Submit both taskers late rather than choosing between them, so neither one is shortchanged.', competency: 'resource-management', rationale: 'Missing both deadlines rather than prioritizing between them fails the one that genuinely could not wait, for no benefit to the one that could.' },
    ],
    mostEffective: 0, leastEffective: 2,
    tell: 'When resources are genuinely too scarce to do everything to full standard, prioritize by actual consequence and communicate honestly about the tradeoff - never let a routine deadline silently outrank a genuinely time-sensitive one.',
  },
  {
    id: 'sjt-prioritize-03', chapter: CH, concepts: PRIORITIZATION, band: 3,
    situation: 'Your small team has a single shared piece of specialized equipment, and three team members each have a legitimate, work-related reason to need it at the same time this afternoon: one has a hard external deadline, one has an internal deadline with some flexibility, and one would simply prefer to get their task done early.',
    actions: [
      { text: 'Assign the equipment to the person with the hard external deadline first, then the internal deadline, then the person who simply preferred to go early.', competency: 'resource-management', rationale: 'This ranks the three genuine needs by actual consequence - an external deadline that cannot move outranks an internal one with flexibility, which outranks a simple preference.' },
      { text: 'Let whoever asks first have the equipment first, regardless of whose deadline is actually harder.', competency: 'resource-management', rationale: 'Deciding by who asked first, rather than by whose need is actually most urgent, risks the hard external deadline losing out to someone who simply asked sooner.' },
      { text: 'Divide the afternoon into three equal blocks of time, one for each person, regardless of how urgent each need actually is.', competency: 'resource-management', rationale: 'An equal split treats a hard external deadline and a simple preference as equally urgent, which they clearly are not.' },
      { text: "Tell all three they'll need to find their own workaround today, since you don't want to choose between them.", competency: 'resource-management', rationale: 'Declining to make the prioritization call at all leaves the person with the hardest, least flexible deadline with no more support than the person who merely preferred to go early.' },
      { text: "Give the equipment to whichever of the three is most senior, regardless of whose deadline is hardest.", competency: 'resource-management', rationale: "Deciding by seniority rather than by actual urgency risks the hardest external deadline losing out to someone whose need was only a preference." },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: "When several genuine needs compete for one scarce resource, rank them by actual consequence, not by who asked first, who is senior, or splitting time evenly regardless of need.",
  },
  {
    id: 'sjt-channels-02', chapter: CH, concepts: PROPER_CHANNELS, band: 3,
    situation: 'A team from a different section approaches you directly, without going through either of your supervisors, asking to borrow two of your team members for a rush project for the next three days. The request seems reasonable and your team members are willing, but it would affect your own section\'s ability to meet its own commitments this week.',
    actions: [
      { text: "Tell the requesting team you'd need your own supervisor's approval before lending anyone, and route the request through them.", competency: 'resource-management', rationale: 'A cross-team resource request that affects your own section\'s commitments genuinely needs to go through the person who can weigh both sides - your own supervisor, not just you.' },
      { text: 'Approve the loan yourself since your team members are willing and the request seems reasonable.', competency: 'resource-management', rationale: 'Approving a cross-section resource loan on your own authority, without informing your supervisor, skips a decision that affects commitments beyond just your own team.' },
      { text: "Refuse the request outright without discussing it with anyone, since it would affect your section's own work.", competency: 'resource-management', rationale: 'Refusing without even routing the request through the proper channel denies your supervisor the chance to weigh it against your section\'s actual priorities.' },
      { text: "Tell the requesting team to go ask your supervisor directly themselves, without your own input on the tradeoff.", competency: 'communication', rationale: "Handing the request off entirely, without giving your own supervisor the context on how it would affect your section's commitments, leaves them making the call with less information than you actually have." },
      { text: 'Let your team members decide for themselves whether to go, without involving either supervisor.', competency: 'resource-management', rationale: "Letting individual team members decide bypasses the supervisors who are actually positioned to weigh the request against both sections' real commitments." },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: "Route a cross-team resource request through the correct chain - the person positioned to weigh it against your own section's commitments - rather than deciding it yourself or refusing it unilaterally.",
  },
  {
    id: 'sjt-commit-01', chapter: CH, concepts: REALISTIC_COMMITMENT, band: 3,
    situation: 'Your supervisor asks whether your team can deliver a project two weeks earlier than originally planned. Based on your honest read of the remaining work and your team\'s current workload, hitting that date would require either significant unplanned overtime or cutting a testing step you consider genuinely important.',
    actions: [
      { text: 'Tell your supervisor honestly that the earlier date is not realistic without either overtime or cutting testing, and lay out what each tradeoff would actually cost.', competency: 'resource-management', rationale: 'This gives your supervisor an honest, specific picture of the real tradeoff, which is exactly what they need to make an informed decision about the deadline.' },
      { text: 'Agree to the earlier date without mentioning the tradeoffs, and plan to quietly extend the informal internal deadlines slightly to make it work.', competency: 'resource-management', rationale: 'Agreeing to a date you already know requires a real tradeoff, without saying so, sets your supervisor up for a surprise later instead of an informed decision now.' },
      { text: 'Flatly tell your supervisor the earlier date is impossible, without explaining what specifically would need to change to make it work.', competency: 'communication', rationale: 'A bare refusal without laying out the actual tradeoffs gives your supervisor nothing to work with if they need to make a case for extra resources or accept a different tradeoff.' },
      { text: 'Agree to the earlier date and quietly plan to cut the testing step without telling your supervisor which step you cut.', competency: 'resource-management', rationale: 'Making the tradeoff decision unilaterally and not disclosing it removes your supervisor\'s ability to weigh in on a real risk they should know about.' },
      { text: "Agree to try for the earlier date, but don't mention the overtime or testing tradeoff unless it actually becomes a problem later.", competency: 'communication', rationale: 'Waiting to disclose a tradeoff you already know is likely, rather than raising it now, leaves your supervisor to find out only once it has already become a problem.' },
    ],
    mostEffective: 0, leastEffective: 3,
    tell: 'Communicate what is actually achievable, and name the real tradeoff plainly, rather than either over-promising and hiding the cost or flatly refusing without explanation.',
  },

  {
    id: 'sjt-commit-03', chapter: CH, concepts: REALISTIC_COMMITMENT, band: 3,
    situation: 'A peer from another team asks if you can help review a batch of documents by the end of the day as a favor, on top of your own already-full workload. You want to be a team player, but you genuinely do not know yet whether you can finish your own priorities and still get to theirs.',
    actions: [
      { text: 'Tell them you can likely fit in a partial review by end of day, and confirm by early afternoon exactly how much you can realistically cover.', competency: 'resource-management', rationale: 'This gives a specific, honest picture of what you can likely deliver, with a concrete checkpoint, rather than a vague yes or no before you actually know your own capacity.' },
      { text: 'Say yes right away to be helpful, without checking whether you can actually finish your own priorities first.', competency: 'resource-management', rationale: 'Committing before you actually know your own capacity risks either your own priorities or the favor slipping, with no warning to either side until it is too late to adjust.' },
      { text: "Say no immediately, without offering any alternative or explaining that you genuinely don't know your capacity yet.", competency: 'communication', rationale: 'A flat no, without even a partial offer or an explanation, is more discouraging than necessary when a partial or delayed contribution might actually be possible.' },
      { text: 'Say yes, but silently plan to deprioritize your own assigned work in order to finish the favor first.', competency: 'resource-management', rationale: "Quietly reordering your own priorities to accommodate a favor, without telling anyone depending on your own assigned work, risks that work slipping with no warning to whoever is counting on it." },
      { text: "Avoid giving a direct answer and hope the peer forgets to follow up before the end of the day.", competency: 'communication', rationale: 'Avoiding a direct answer leaves the peer with no real information to plan around and no idea whether they need to find help elsewhere.' },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'Give a specific, honest picture of what you can likely deliver and when you will know more - never a vague yes, a flat no, or silence, when a concrete partial answer is available.',
  },

  // ============================ BAND 4 ============================
  {
    id: 'sjt-commit-02', chapter: CH, concepts: REALISTIC_COMMITMENT, band: 4,
    situation: 'You lead a small team supporting two ongoing efforts at once for two different senior stakeholders, neither of whom is aware of how much of your team\'s bandwidth the other is actually consuming. Both have just asked, separately and within the same week, whether your team can take on a significant new piece of work starting immediately - and both requests are individually reasonable, but your team genuinely cannot do both well at the same time.',
    actions: [
      { text: 'Bring both stakeholders the full picture together, or through your own supervisor if that is more appropriate, and let them help decide how to prioritize between the two efforts.', competency: 'resource-management', rationale: 'Since neither stakeholder can see the whole picture on their own, surfacing the real constraint to the people who can actually help resolve it is what turns an impossible situation into a solvable one.' },
      { text: 'Quietly agree to both requests and try to make it work by having the team put in significantly more hours than sustainable.', competency: 'resource-management', rationale: "Agreeing to both without disclosing the real conflict just defers the failure to a later, less controlled moment, and burns out the team in the meantime." },
      { text: "Pick which stakeholder's request to accept on your own, without telling the other one why their request is being declined.", competency: 'communication', rationale: "Deciding unilaterally which stakeholder to disappoint, without explaining the real reason, leaves the declined stakeholder with no understanding of what actually happened." },
      { text: 'Tell both stakeholders your team is simply too busy right now, without explaining that the busyness is because of the other stakeholder\'s own request.', competency: 'communication', rationale: 'A vague "too busy" explanation, when the real cause is a specific, nameable resource conflict between two requests, denies both stakeholders the information they would need to actually help resolve it.' },
      { text: 'Accept both requests as given and let the team figure out on their own how to divide their time between them.', competency: 'resource-management', rationale: "Pushing an unresolved resource conflict down to the team, rather than surfacing it to the people who can actually resolve it, leaves the team to silently absorb a problem that was never theirs to solve." },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: 'When a genuine resource conflict is invisible to the people creating it, surface the real picture to someone positioned to resolve it - never try to quietly absorb an impossible commitment by working around the problem instead of naming it.',
  },
]);

for (const band of [2, 3, 4]) {
  scenarioTemplates({ chapter: CH, band, idBase: `sjt-04-b${band}`, name: 'Resource management' });
}

// Chapter 3 - Leadership.
//
// PART 25 of docs/afoqt/HANDOFF.md. Same sourcing and authoring rules as ch02-integrity-
// professionalism.js - see that file's header, not repeated here.

import { registerScenarios, scenarioTemplates } from '../../engine/judgment.js';

const CH = 'sjt-03-leadership';
const SITUATIONAL_AUTHORITY = ['sjt-situational-authority'];
const STANDARDS_VS_MORALE = ['sjt-standards-vs-morale'];
const CRISIS_TRIAGE = ['sjt-crisis-triage'];
const DIFFICULT_PERSONALITIES = ['sjt-difficult-personalities'];

registerScenarios([
  // ============================ BAND 2 ============================
  {
    id: 'sjt-authority-01', chapter: CH, concepts: SITUATIONAL_AUTHORITY, band: 2,
    situation: 'You are a newly assigned team lead. A team member asks you to approve a routine schedule swap with a coworker - the kind of request your predecessor always handled without escalating it. You are confident you understand the policy, but you have never actually approved one yourself.',
    actions: [
      { text: "Approve the swap yourself, since it's a routine request squarely within your role, and note it in the schedule.", competency: 'leadership', rationale: 'This is exactly the kind of routine decision a team lead is expected to make - hesitating on it undermines your own role without any real benefit.' },
      { text: 'Escalate the request to your own supervisor rather than deciding it yourself.', competency: 'leadership', rationale: 'Routing a routine, in-scope decision up the chain when you are fully authorized to make it yourself creates unnecessary delay and signals you are unsure of your own role.' },
      { text: 'Tell the team member to work it out between themselves without any approval at all.', competency: 'leadership', rationale: 'Some form of official approval and record-keeping is part of the process for a reason - stepping back from the decision entirely abdicates a responsibility that is actually yours.' },
      { text: 'Approve the swap, but only after having the team member get informal sign-off from a senior peer first.', competency: 'leadership', rationale: 'Requiring an extra, informal layer of approval for a routine decision you are already authorized to make adds friction without adding any real safeguard.' },
      { text: 'Delay the decision for a few days until you can confirm the policy with your supervisor, even though you already know it.', competency: 'leadership', rationale: 'Delaying a decision you are confident about and authorized to make costs the team member time for no real benefit.' },
    ],
    mostEffective: 0, leastEffective: 2,
    tell: 'Act on a decision that is genuinely within your own authority - neither escalating a routine call you are equipped to make, nor stepping back from a responsibility that is actually yours.',
  },
  {
    id: 'sjt-standards-01', chapter: CH, concepts: STANDARDS_VS_MORALE, band: 2,
    situation: 'Your team has just finished an unusually demanding stretch of back-to-back deadlines, and morale is visibly low. One team member turns in a routine weekly report a day late - a minor, first-time lapse for someone with an otherwise strong record.',
    actions: [
      { text: "Note the late report privately with the team member, acknowledge the demanding stretch they just came through, and confirm it won't become a pattern.", competency: 'leadership', rationale: 'This holds the actual standard while reading the real context - a brief, low-key acknowledgment that treats a first-time lapse as what it is, not a crisis.' },
      { text: 'Say nothing about it at all, given how demanding the recent stretch has been for everyone.', competency: 'leadership', rationale: 'Never acknowledging a missed deadline, even a minor one, risks it becoming an unspoken norm rather than staying the exception it currently is.' },
      { text: 'Issue a formal written warning for the late report, consistent with the standard you would apply at any other time.', competency: 'leadership', rationale: 'A formal written warning for a first-time, minor lapse right after an unusually demanding stretch reads as tone-deaf to context that a reasonable leader would actually weigh.' },
      { text: 'Address it in front of the whole team at the next meeting, to make clear that deadlines still matter.', competency: 'communication', rationale: 'Addressing an individual, minor, first-time lapse publicly is disproportionate and embarrasses someone for what does not warrant that kind of attention.' },
      { text: 'Quietly extend all future deadlines by a day for the whole team, to prevent this from happening again.', competency: 'leadership', rationale: 'Changing the standard for the whole team in response to one minor lapse is an overcorrection that was never actually asked for or needed.' },
    ],
    mostEffective: 0, leastEffective: 3,
    tell: "Hold the real standard while reading the team's actual state - a brief, private, proportionate acknowledgment beats both silence and a heavier response than the lapse actually warrants.",
  },

  // ============================ BAND 3 ============================
  {
    id: 'sjt-authority-02', chapter: CH, concepts: SITUATIONAL_AUTHORITY, band: 3,
    situation: 'You are a flight commander and a subordinate NCO approaches you with a proposal to change a long-standing but clearly outdated shop procedure. The change is sound and well-reasoned, but it falls outside your own delegated authority to approve on the spot - it would need sign-off from the squadron commander.',
    actions: [
      { text: 'Tell the NCO you agree with the proposal, then take it to the squadron commander yourself with your endorsement and the NCO\'s reasoning.', competency: 'leadership', rationale: 'This correctly recognizes the decision is above your own authority while still actively championing a good idea, rather than either approving something you cannot or letting it die on your desk.' },
      { text: 'Approve the change yourself, reasoning that it is clearly the right call and waiting for formal sign-off would just slow it down.', competency: 'leadership', rationale: 'Approving a change outside your delegated authority, even a good one, oversteps the actual scope of your role and sets a bad precedent regardless of how sound the idea is.' },
      { text: 'Tell the NCO the idea is good but that it is not something you can help with, since it is above your authority.', competency: 'leadership', rationale: 'Correctly identifying that the decision is above your authority does not mean there is nothing for you to do - actively carrying a good idea forward is still your job.' },
      { text: "Tell the NCO to submit the proposal through the suggestion program on their own, without your direct involvement.", competency: 'mentoring', rationale: "Redirecting a subordinate's well-reasoned proposal to a generic, slower channel rather than using your own position to advance it wastes the leverage your role actually provides." },
      { text: 'Implement the change quietly in your own shop without seeking sign-off, since it only affects your team directly.', competency: 'leadership', rationale: 'Implementing a change without the required sign-off is still overstepping your authority, even if the effect feels contained to your own shop.' },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'Act at your actual level of authority - neither approving what is not yours to approve, nor sitting on a good idea that is above your authority instead of carrying it forward.',
  },
  {
    id: 'sjt-standards-02', chapter: CH, concepts: STANDARDS_VS_MORALE, band: 3,
    situation: "You lead a small maintenance section that has been running at reduced staffing for two months while covering for an unfilled position. One of your most reliable technicians has started arriving fifteen minutes late several times a week, a clear departure from their normal punctuality, though their work quality has not slipped.",
    actions: [
      { text: 'Talk with the technician privately, note the change in their pattern, and ask directly what is going on before deciding anything further.', competency: 'leadership', rationale: 'A reliable performer suddenly showing a new pattern is worth understanding before it is judged - a direct, private conversation gets the actual cause rather than guessing at it.' },
      { text: 'Say nothing, since their work quality has not actually declined and the team is already stretched thin.', competency: 'leadership', rationale: 'A real change in a reliable performer\'s pattern is worth understanding even when output has not yet suffered - waiting until it does means missing the chance to help before it becomes a bigger problem.' },
      { text: "Issue a formal counseling for the repeated lateness immediately, consistent with standard policy.", competency: 'leadership', rationale: "Jumping straight to formal counseling for a reliable performer's first sustained change in pattern, without first understanding the cause, is a heavier response than the situation has been shown to warrant yet." },
      { text: 'Ask a peer on the team to have an informal word with the technician instead of addressing it yourself.', competency: 'leadership', rationale: "Delegating a conversation about a direct report's changed behavior to a peer avoids a responsibility that belongs to their actual supervisor." },
      { text: 'Quietly adjust the section schedule so the technician\'s new arrival time is no longer technically late.', competency: 'leadership', rationale: "Redefining the standard around the behavior, rather than addressing the behavior, papers over a change worth actually understanding first." },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'A real change in a reliable performer\'s pattern deserves a direct conversation before any judgment - understand the cause before deciding whether, or how, to hold the standard, and never redefine the standard just to avoid a conversation.',
  },
  {
    id: 'sjt-crisis-01', chapter: CH, concepts: CRISIS_TRIAGE, band: 3,
    situation: "You are the senior person present when a minor injury occurs during a routine training exercise - a sprained ankle, not life-threatening but clearly painful. At the same moment, the exercise's scheduled evaluator arrives early and is waiting to begin the formal assessment, and someone reminds you that the after-action paperwork from yesterday's exercise is due within the hour.",
    actions: [
      { text: 'Attend to the injured person first, then inform the evaluator of the short delay before resuming, and handle the paperwork afterward.', competency: 'leadership', rationale: 'This sequences correctly: an actual injury to a person takes priority over both the evaluation and paperwork, which can both wait a short while without any real harm.' },
      { text: 'Ask someone else to look after the injured person while you begin the evaluation on schedule.', competency: 'leadership', rationale: 'Prioritizing the evaluation schedule over personally ensuring an injured person is properly cared for gets the priority order backwards.' },
      { text: "Delay both the injury response and the evaluation until the paperwork is submitted, since it has a hard deadline.", competency: 'leadership', rationale: "Administrative paperwork with a same-day deadline is the lowest priority of the three here - delaying care for an injury to finish it gets the sequencing exactly backwards." },
      { text: 'Handle the injury and the evaluator at the same time by asking the evaluator to observe while you attend to the injured person.', competency: 'communication', rationale: 'Trying to run both at once split-attention risks shortchanging the injured person\'s care, which deserves your full attention even if the delay to the evaluator is brief.' },
      { text: "Cancel the evaluation outright and reschedule it for another day, rather than just delaying it briefly.", competency: 'leadership', rationale: 'A full cancellation is a bigger disruption than the situation calls for - a brief, informed delay while the injury is handled is proportionate; canceling outright is not.' },
    ],
    mostEffective: 0, leastEffective: 2,
    tell: 'Sequence safety first, then the mission-relevant task, then administrative matters last - and a brief, informed delay is usually enough; it rarely requires an outright cancellation.',
  },
  {
    id: 'sjt-difficult-01', chapter: CH, concepts: DIFFICULT_PERSONALITIES, band: 3,
    situation: 'A member of your team has a habit of interrupting and talking over quieter teammates in meetings, including cutting off a junior member mid-sentence in a meeting yesterday in front of the whole section. Their actual work is strong, and this appears to be a long-standing habit rather than a one-time incident.',
    actions: [
      { text: 'Speak with the team member privately, describe the specific pattern you have observed, and explain its effect on the rest of the team.', competency: 'leadership', rationale: 'Addressing the behavior directly and privately, with a specific example, gives the person a clear and fair chance to actually change without public embarrassment.' },
      { text: "Address it publicly in the next team meeting, so everyone understands the standard for how meetings should run.", competency: 'communication', rationale: 'Correcting an individual\'s behavior in front of the same group they just embarrassed a colleague in front of compounds the problem rather than fixing it.' },
      { text: 'Say nothing directly, but start deliberately calling on quieter team members yourself during meetings to work around the problem.', competency: 'leadership', rationale: 'Working around the behavior addresses its symptom in the moment but leaves the underlying habit itself completely unaddressed for the long term.' },
      { text: "Reassign the team member to a role with less meeting interaction, rather than addressing the behavior directly.", competency: 'leadership', rationale: 'Restructuring someone\'s role to avoid a behavior problem sidesteps a conversation that would actually be more direct, fair, and likely to produce real change.' },
      { text: 'Wait to see if the behavior happens again before deciding whether it is worth addressing at all.', competency: 'leadership', rationale: 'This is already described as a long-standing pattern with a clear recent example - waiting for further proof delays a conversation that is already clearly warranted.' },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: 'Address a behavior problem directly and privately with the person responsible - never by avoiding the conversation, working around it silently, or confronting it in public.',
  },

  {
    id: 'sjt-difficult-02', chapter: CH, concepts: DIFFICULT_PERSONALITIES, band: 3,
    situation: 'You supervise a small team, and one member has become noticeably short and dismissive toward a specific coworker over the past two weeks, though they remain perfectly professional with everyone else. The coworker on the receiving end has not complained, but you have noticed the change in tone yourself during team interactions.',
    actions: [
      { text: 'Speak privately with the team member showing the change in tone, describe what you have observed, and ask what is going on between them and their coworker.', competency: 'leadership', rationale: 'Addressing the specific person whose behavior changed, privately and directly, gets you the actual cause rather than guessing, and gives them a fair chance to explain or correct it.' },
      { text: 'Wait for the coworker on the receiving end to file a complaint before doing anything about it.', competency: 'leadership', rationale: 'Waiting for a formal complaint from someone who may not feel comfortable filing one lets a clearly observable problem continue unaddressed in the meantime.' },
      { text: "Bring both team members together at once and ask them to work out whatever is going on between them in front of you.", competency: 'communication', rationale: "Putting both people on the spot together, before understanding the situation from either side individually, risks an uncomfortable confrontation instead of a genuine resolution." },
      { text: "Reassign the two team members so they no longer have to interact with each other directly.", competency: 'leadership', rationale: 'Separating the two people avoids the friction in the short term but does nothing to actually address whatever caused the change in behavior in the first place.' },
      { text: 'Mention the change in tone to a few other team members to see if they have noticed the same thing or know what is going on.', competency: 'communication', rationale: "Discussing one team member's behavior with others, rather than the person themselves, spreads the issue informally without addressing it directly or fairly." },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'A directly observed behavior change is worth addressing on its own, privately and with the person responsible - not discussed with other team members first, which spreads concern about a colleague without ever actually addressing it.',
  },

  // ============================ BAND 4 ============================
  {
    id: 'sjt-crisis-02', chapter: CH, concepts: CRISIS_TRIAGE, band: 4,
    situation: "You are the senior person on duty when two things happen almost simultaneously: a piece of equipment begins overheating in a way that could become a genuine safety hazard if left unaddressed for more than a few minutes, and a separate team urgently radios that they are lost and behind schedule for a time-critical handoff that the whole operation depends on. You have exactly one other qualified person available to help with either.",
    actions: [
      { text: 'Send your available person to address the overheating equipment immediately, while you personally direct the lost team back on course by radio.', competency: 'leadership', rationale: 'This treats the safety issue as most urgent by sending immediate hands-on help, while still personally addressing the time-critical handoff in parallel rather than letting either wait entirely.' },
      { text: 'Send your available person to guide the lost team back, since the handoff is time-critical, and address the overheating equipment yourself once you can get to it.', competency: 'leadership', rationale: 'A safety hazard that could worsen within minutes needs to be treated as more urgent than a schedule problem, even a serious one - this reverses that priority.' },
      { text: 'Handle the overheating equipment yourself and send your available person to help the lost team, coordinating both by radio as needed.', competency: 'leadership', rationale: 'This also treats the safety issue as the immediate priority while addressing the schedule problem in parallel rather than sequentially, and uses the two available people efficiently between both real problems.' },
      { text: 'Focus entirely on the overheating equipment yourself and tell the lost team to figure out their own way back for now.', competency: 'communication', rationale: 'Leaving a lost, time-critical team with no support at all, rather than offering at least remote guidance while your hands are full, abandons a real problem that could still be partially addressed in parallel.' },
      { text: 'Radio for additional outside help for both problems and wait for it to arrive before acting on either one yourself.', competency: 'leadership', rationale: "Waiting for outside help before taking any action yourself wastes the several minutes a genuine safety hazard may not actually allow, when qualified help is already on hand." },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'Under real time pressure with limited people, treat an active safety hazard as most urgent, then work the mission-critical problem in parallel rather than sequentially - never wait on outside help for something you can act on yourself right now.',
  },
]);

for (const band of [2, 3, 4]) {
  scenarioTemplates({ chapter: CH, band, idBase: `sjt-03-b${band}`, name: 'Leadership' });
}

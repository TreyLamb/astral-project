// Chapter 2 - Integrity and professionalism.
//
// PART 25 of docs/afoqt/HANDOFF.md, against engine/judgment.js (PART 24). Grounded in Barron's
// 4th Ed's Practice Test #1 SJT section (25 situations, read in full via scripts/extractBook.mjs
// to the scratchpad, never the repo - copyright rule, CLAUDE.md rule 2). Original scenarios only,
// in the same register: a first/second-person military workplace situation ending in an implicit
// "what do you do?", five distinct plausible actions.
//
// Concentrated at band 3 (contested-ness, not difficulty - see engine/judgment.js's header) since
// that is the only band reaching the 5-row floor scenarioTemplates needs; a couple of band 2/4
// rows exist for realism per the brief but are not expected to produce their own template.
//
// Every action carries a rationale, including the three that are neither MOST nor LEAST - a miss
// on this subtest shows the candidate why the picked action falls short, the same job `why` plays
// on every other subtest's distractors. Protagonist rank/setting is varied deliberately so five
// scenarios don't all read as "you are a new lieutenant in an office."

import { registerScenarios, scenarioTemplates } from '../../engine/judgment.js';

const CH = 'sjt-02-integrity-professionalism';
const HONEST_REPORTING = ['sjt-honest-reporting'];
const CONFLICT_OF_INTEREST = ['sjt-conflict-of-interest'];
const OWNING_MISTAKES = ['sjt-owning-mistakes'];
const FAIR_PROCESS = ['sjt-fair-process-before-accusation'];

registerScenarios([
  // ============================ BAND 2 ============================
  {
    id: 'sjt-honest-01', chapter: CH, concepts: HONEST_REPORTING, band: 2,
    situation: 'You are a shift supervisor closing out the daily production log. The actual output for your shift fell short of the target by a wide margin because of an equipment breakdown, and your section chief will see the number first thing tomorrow. A peer suggests you round the number up slightly so it "doesn\'t look as bad" - technically within the log\'s rounding tolerance, but not what you actually measured.',
    actions: [
      { text: 'Log the actual measured output and note the equipment breakdown as the cause in the remarks field.', competency: 'integrity-professionalism', rationale: 'The log exists to give leadership an accurate picture, and the breakdown explains the shortfall honestly - there is nothing here to be defensive about.' },
      { text: "Round the number up slightly, within the log's technical tolerance, since it doesn't change the underlying story.", competency: 'integrity-professionalism', rationale: 'Even a small, technically-defensible shading of a number is still reporting something other than what was measured, and it sets a precedent for the next shortfall.' },
      { text: 'Ask your section chief to review the number with you before logging anything, so you are not the one who decides.', competency: 'leadership', rationale: 'This is your log to close out accurately; deferring a routine, factual entry to a superior avoids a decision that is actually yours to make.' },
      { text: 'Log a note that the equipment breakdown made accurate measurement impossible, without giving any number at all.', competency: 'communication', rationale: 'The output was measured, just low - omitting the number entirely is less useful to leadership than reporting it with context.' },
      { text: "Leave the shortfall out of the log entirely and mention it verbally to your section chief instead, off the record.", competency: 'integrity-professionalism', rationale: 'A verbal aside is not a substitute for the record, and leaves no documented explanation for the number leadership will eventually notice is missing.' },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'Report what you actually measured, with the context that explains it - never a version shaded to look better, however small the shading.',
  },
  {
    id: 'sjt-owning-01', chapter: CH, concepts: OWNING_MISTAKES, band: 2,
    situation: 'You are a junior officer in a joint headquarters cell. Reviewing a report you sent up the chain yesterday, you notice you transposed two figures in a budget table, understating a real cost by a significant margin. No one has flagged it yet, and the report has already been forwarded one level further up.',
    actions: [
      { text: 'Immediately notify your supervisor of the error, provide the corrected figures, and ask whether a formal correction needs to go out.', competency: 'integrity-professionalism', rationale: 'Catching your own mistake and reporting it before anyone else does is exactly what owning an error looks like - it gets fixed fastest and costs you the least credibility.' },
      { text: 'Quietly correct the figures in your own working file and wait to see if anyone up the chain notices the discrepancy.', competency: 'integrity-professionalism', rationale: 'The error is already in a report that has moved beyond your desk - fixing only your own copy does nothing about the version already circulating.' },
      { text: "Wait for your supervisor's weekly staff meeting and mention it then, along with your other updates.", competency: 'communication', rationale: 'A budget error that has already been forwarded is time-sensitive; folding it into a routine weekly update delays a correction that should go out now.' },
      { text: 'Send the correction directly to whoever now holds the report, without informing your own supervisor first.', competency: 'leadership', rationale: 'Skipping your own supervisor on a correction to a report they forwarded on your behalf leaves them blindsided if anyone asks them about it.' },
      { text: 'Say nothing, reasoning that the error understates a cost rather than overstates one, so it is less likely to cause a problem.', competency: 'integrity-professionalism', rationale: 'An error is still an error regardless of which direction it happens to be wrong in, and understating a real cost can cause its own downstream planning problems.' },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'Report your own mistake the moment you find it, to the person who can actually act on it - the size or direction of the error is not what determines whether it gets reported.',
  },

  // ============================ BAND 3 ============================
  {
    id: 'sjt-honest-02', chapter: CH, concepts: HONEST_REPORTING, band: 3,
    situation: 'You are a flight lead debriefing a training sortie. During the mission, you deviated slightly from the planned altitude block for about ninety seconds due to a momentary distraction, with no safety impact and nothing anyone else in the flight would have independently noticed or logged. Including it in the debrief will mean an uncomfortable conversation and possibly extra scrutiny on your next few flights.',
    actions: [
      { text: 'Report the altitude deviation in the debrief exactly as it happened, including the cause.', competency: 'integrity-professionalism', rationale: 'A deviation from the plan is worth reporting regardless of whether anyone else would have caught it - the debrief exists to catch exactly this kind of thing before it becomes a habit.' },
      { text: 'Mention it informally to your wingman after the debrief instead of including it in the official record.', competency: 'integrity-professionalism', rationale: 'An informal aside outside the debrief does not create any record that the deviation happened or that it was addressed.' },
      { text: 'Leave it out of the debrief since it had no safety impact and no one else would have noticed.', competency: 'integrity-professionalism', rationale: 'Deciding unilaterally that a deviation was too minor to report removes the ability of anyone else to independently judge whether a pattern is forming.' },
      { text: "Bring it up with the squadron safety officer privately, bypassing the debrief process entirely.", competency: 'communication', rationale: "The debrief is the correct, established forum for this - routing around it to a different office adds confusion about where the information actually lives." },
      { text: 'Report it, but describe it as caused by a minor equipment issue rather than a lapse in attention.', competency: 'integrity-professionalism', rationale: 'Reporting a deviation while misattributing its actual cause is arguably worse than not reporting it at all, since it points any follow-up in the wrong direction entirely.' },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'Report both what happened and its real cause - a report that is accurate about the event but dishonest about the cause defeats the entire purpose of debriefing.',
  },
  {
    id: 'sjt-conflict-01', chapter: CH, concepts: CONFLICT_OF_INTEREST, band: 3,
    situation: "You are a contracting officer's representative reviewing bids for a facilities contract. One of the bidding companies is owned by your spouse's cousin, whom you have met a handful of times at family events but have no financial relationship with. The bid appears competitive on paper, and no one else on the evaluation team knows about the family connection.",
    actions: [
      { text: 'Disclose the family connection to your supervisor before the evaluation continues, and let them decide whether you should recuse yourself.', competency: 'integrity-professionalism', rationale: 'Disclosing the connection before it can influence anything, and letting someone without the same connection make the call, is what actually prevents a conflict rather than just hoping to manage it internally.' },
      { text: 'Continue the evaluation as normal, reasoning that the connection is distant and you have no financial stake in the outcome.', competency: 'integrity-professionalism', rationale: 'Whether the connection is close enough to bias the outcome is exactly the judgment a conflicted evaluator is the wrong person to make about themselves.' },
      { text: 'Quietly score that bid slightly lower than you otherwise would, to compensate in advance for any unconscious bias.', competency: 'integrity-professionalism', rationale: 'Deliberately skewing a score to "correct" for a bias is still letting the connection affect the outcome, and it disadvantages the other bidders and your own family member unfairly either way.' },
      { text: 'Mention the connection casually to a coworker for their opinion, without formally disclosing it up the chain.', competency: 'communication', rationale: 'An informal, undocumented conversation with a coworker does not actually resolve anything and leaves no record that the conflict was ever addressed.' },
      { text: 'Recuse yourself from the evaluation immediately without telling anyone why.', competency: 'communication', rationale: 'Stepping back is a reasonable instinct, but doing so without explaining the reason leaves the team unable to properly plan around your absence or verify the process was handled correctly.' },
    ],
    mostEffective: 0, leastEffective: 2,
    tell: 'Disclose a personal entanglement before it has a chance to bias a decision, to someone positioned to judge it objectively - never try to privately self-correct for a bias you have already disclosed to no one.',
  },
  {
    id: 'sjt-conflict-02', chapter: CH, concepts: CONFLICT_OF_INTEREST, band: 3,
    situation: 'You are an NCO in charge of scheduling additional duty assignments, which are unpopular but occasionally come with a modest stipend. Your best friend in the unit, who is going through a difficult financial stretch, asks you privately to put them at the top of the list for the next stipend-eligible assignment before the schedule is published.',
    actions: [
      { text: "Tell your friend you understand their situation but that you'll assign the duty using the same rotation everyone else goes through, without giving them special placement.", competency: 'integrity-professionalism', rationale: 'This addresses the friend honestly and directly while keeping the process fair for everyone else on the rotation, which is the actual job here.' },
      { text: "Quietly move your friend up the list this one time, reasoning that their financial need is a good enough reason to make an exception.", competency: 'integrity-professionalism', rationale: 'A sympathetic reason for favoritism is still favoritism, and everyone else on the rotation has no visibility into why they were passed over.' },
      { text: "Tell your friend you can't discuss the schedule with them at all and stop responding to any of their messages.", competency: 'communication', rationale: 'Refusing to engage at all is an overcorrection that damages the friendship without actually addressing the underlying request.' },
      { text: 'Bring the request to your own supervisor and ask them to decide whether to make an exception.', competency: 'leadership', rationale: 'Assigning duty by the published rotation is a decision within your own authority - escalating a routine scheduling call avoids making a decision that is actually yours to make.' },
      { text: "Move your friend up the list, but also move someone else down to make room, so the total numbers still balance out.", competency: 'integrity-professionalism', rationale: 'Balancing the total count does nothing to fix the underlying unfairness - it just moves the favoritism\'s cost onto whoever else got bumped down.' },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'Keep a process fair for everyone it applies to, even when a personal relationship gives you a sympathetic reason to bend it - and be honest and direct with the person asking, rather than avoiding them.',
  },
  {
    id: 'sjt-owning-02', chapter: CH, concepts: OWNING_MISTAKES, band: 3,
    situation: 'You are a section lead who approved a work order that, it turns out, skipped a required inspection step because you misread the checklist. The work has already been completed and signed off, and the equipment has been back in service for two days with no issues so far. Reporting it now will trigger a formal review of your section\'s recent work.',
    actions: [
      { text: 'Report the missed inspection step to your chain immediately, and request the equipment be reinspected as soon as possible.', competency: 'integrity-professionalism', rationale: 'The equipment being fine so far does not mean the missed step was unnecessary - reporting it now, before any problem surfaces, is what actually protects everyone using it.' },
      { text: 'Wait to see if any issue actually develops with the equipment before deciding whether to report the missed step.', competency: 'integrity-professionalism', rationale: 'Waiting for a problem to appear before reporting a known gap defeats the entire point of the inspection requirement, which exists to catch issues before they happen.' },
      { text: "Quietly have someone perform the missed inspection step now, without documenting that it was originally skipped.", competency: 'integrity-professionalism', rationale: "Performing the step now is a good instinct, but doing it without documenting the original gap hides exactly the information a future reviewer would need." },
      { text: 'Report it, but frame it as a checklist design problem rather than your own misreading of it.', competency: 'integrity-professionalism', rationale: 'Misattributing the cause to the checklist rather than your own error means the actual root cause - a misread step - never gets addressed or trained against.' },
      { text: "Ask the technician who did the work to quietly note that the step was completed, since it wouldn't have changed the outcome.", competency: 'integrity-professionalism', rationale: 'Asking someone else to falsify a record to cover your own error compounds one mistake with a much more serious one.' },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'Report a gap you caused the moment you find it, and report it accurately - fixing it quietly, blaming the process, or waiting to see if it becomes a problem are all ways of avoiding ownership, not forms of it.',
  },
  {
    id: 'sjt-fair-01', chapter: CH, concepts: FAIR_PROCESS, band: 3,
    situation: "You are a shift lead and you notice that a piece of equipment is missing from the supply cage, which only a handful of people have access to. You strongly suspect a specific coworker, based on an offhand comment they made last week, but you have no direct evidence.",
    actions: [
      { text: 'Report the missing equipment through the proper channel and let a formal inventory review determine what happened, without naming your suspicion.', competency: 'integrity-professionalism', rationale: 'This gets the missing equipment investigated through a process that can actually gather facts, without putting a specific person\'s reputation at risk based on an offhand comment.' },
      { text: 'Confront your coworker directly and ask them if they took the equipment.', competency: 'communication', rationale: 'A direct question based on a suspicion, not evidence, risks accusing someone unfairly and puts them on the defensive before any facts are actually established.' },
      { text: 'Mention your suspicion to a few other coworkers to see if anyone else has noticed anything.', competency: 'integrity-professionalism', rationale: 'Spreading an unconfirmed suspicion informally can damage a reputation long before any facts are established, and does nothing to formally investigate the loss.' },
      { text: 'Say nothing about the missing equipment at all, since you have no proof of what happened to it.', competency: 'integrity-professionalism', rationale: 'The equipment is genuinely missing regardless of who is responsible - not reporting the loss at all leaves it unaddressed and unaccounted for.' },
      { text: "Quietly search your coworker's personal locker yourself to check for the missing equipment.", competency: 'integrity-professionalism', rationale: "Searching a coworker's personal property on your own authority, based on a suspicion, is well outside what a shift lead is entitled to do and could constitute a serious violation on its own." },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'Route a suspicion through the process built to gather facts, rather than acting on it directly - confronting, gossiping, or self-investigating all skip the fact-finding a fair process exists to provide.',
  },
  {
    id: 'sjt-honest-03', chapter: CH, concepts: HONEST_REPORTING, band: 3,
    situation: "You are compiling a monthly safety incident summary for your commander, and this month's numbers include a preventable near-miss you were personally involved in - caused by skipping a checklist step under time pressure. No one else witnessed it, and including it accurately means your own name is attached to a preventable incident in a report your commander reads closely.",
    actions: [
      { text: 'Report the near-miss accurately, including your own role in it and the checklist step you skipped.', competency: 'integrity-professionalism', rationale: 'The summary exists to give your commander an accurate safety picture, and naming your own role honestly is exactly what that requires, however uncomfortable.' },
      { text: 'Report the near-miss, but describe it as caused by an equipment issue rather than the checklist step you actually skipped.', competency: 'integrity-professionalism', rationale: "Reporting that something happened while misattributing its real cause defeats the purpose of the report just as much as omitting it would - any follow-up would look in the wrong direction entirely." },
      { text: 'Omit the near-miss from the summary entirely, since no one else witnessed it and it caused no actual harm.', competency: 'integrity-professionalism', rationale: 'A preventable near-miss is exactly the kind of thing a safety summary exists to catch before it becomes an actual incident - omitting it because it went unwitnessed defeats that purpose.' },
      { text: "Ask a peer to submit the report in their own name, describing the incident as something they happened to witness rather than something you were involved in.", competency: 'integrity-professionalism', rationale: 'Shifting who the record says was involved is a more serious falsification than simply staying quiet - it creates an actively false account of what happened, not just a missing one.' },
      { text: "Mention it verbally to your commander in passing, without including it in the written summary itself.", competency: 'communication', rationale: 'A verbal aside outside the actual report leaves no documented account of the near-miss for anyone reviewing the record later.' },
    ],
    mostEffective: 0, leastEffective: 3,
    tell: 'A report is only honest if it names both the real event and the real person responsible - shading the cause, staying silent, or shifting the record onto someone else are all forms of the same dishonesty, just at different costs.',
  },

  // ============================ BAND 4 ============================
  {
    id: 'sjt-fair-02', chapter: CH, concepts: FAIR_PROCESS, band: 4,
    situation: 'You are a division chief and receive an anonymous written complaint alleging that one of your senior NCOs has been falsifying training records for their subordinates. The complaint is detailed and specific, naming dates and records, but anonymous complaints in your unit have occasionally turned out to be motivated by personal grievances rather than genuine misconduct.',
    actions: [
      { text: 'Refer the complaint to the appropriate investigating office for a formal review of the specific records named, without confronting the NCO yourself first.', competency: 'integrity-professionalism', rationale: 'A specific, detailed complaint about falsified records deserves a real look by people equipped to verify records - routing it formally protects both a genuine victim and a possibly-accused innocent NCO equally.' },
      { text: 'Dismiss the complaint without action, since anonymous complaints in the unit have sometimes been unfounded before.', competency: 'integrity-professionalism', rationale: 'Past unfounded complaints do not make this one unfounded - a specific, detailed allegation about falsified records is exactly the kind of thing that deserves to be checked, not assumed away.' },
      { text: 'Confront the NCO directly and ask them to explain the specific records named in the complaint.', competency: 'leadership', rationale: 'Confronting the accused directly, before any records have actually been reviewed, risks tipping them off if the allegation is true and unfairly damages trust if it is false.' },
      { text: 'Quietly pull and review the specific records yourself before deciding whether a formal complaint is warranted.', competency: 'integrity-professionalism', rationale: "A detailed, specific allegation about falsified records is squarely the kind of thing that belongs with people equipped and authorized to investigate it properly, not an informal review on your own." },
      { text: 'Wait to see if additional complaints come in about the same NCO before taking any action.', competency: 'integrity-professionalism', rationale: 'Waiting for corroboration risks real harm continuing in the meantime if the allegation is genuine, and a single detailed, specific complaint is already enough to warrant a formal look.' },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: "A specific, detailed allegation earns a real process, even when it's anonymous and even when past anonymous complaints have sometimes been unfounded - dismissing it on that history alone is its own kind of unfairness.",
  },
  {
    id: 'sjt-conflict-03', chapter: CH, concepts: CONFLICT_OF_INTEREST, band: 4,
    situation: "You sit on a promotion board evaluating packages for a board you also helped design. One of the candidates is someone you personally supervised and mentored closely for a year; you believe, and so does everyone else on the board, that they are genuinely well-qualified - but your own closeness to their case is greater than any other board member has with any candidate being considered.",
    actions: [
      { text: 'Disclose the mentoring relationship to the board before the evaluation proceeds, and let them decide how to handle it, including possibly recusing you from that one packet.', competency: 'integrity-professionalism', rationale: 'Disclosing the connection before it can quietly shape the outcome, and letting people without the same closeness decide how to handle it, is what actually protects the evaluation rather than just trusting your own objectivity.' },
      { text: 'Say nothing and score the packet as you would any other, reasoning that your evaluation is objectively fair regardless of the relationship.', competency: 'integrity-professionalism', rationale: 'Whether a close mentoring relationship is distorting your judgment is exactly the kind of thing a conflicted evaluator is poorly positioned to judge about themselves.' },
      { text: 'Score the packet slightly lower than you otherwise would, to compensate in advance for the closeness of the relationship.', competency: 'integrity-professionalism', rationale: 'Deliberately adjusting a score to correct for an undisclosed bias is still letting the relationship shape the outcome, just in the opposite direction, and it is unfair to the candidate either way.' },
      { text: 'Recuse yourself from the entire board without telling anyone why, rather than disclosing the specific relationship behind just one packet.', competency: 'communication', rationale: 'Stepping back without explaining the reason leaves the board unable to verify the process was handled correctly, or to simply recuse you from the one packet that actually needed it.' },
      { text: "Mention the relationship informally to the board president over coffee, without making it part of the board's official record.", competency: 'communication', rationale: 'An informal, undocumented mention does not actually give the board a documented basis for deciding how to handle the conflict.' },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: 'Disclose a real personal closeness to a case before it can shape the outcome, to people who can judge it without that same closeness - staying silent because you trust your own objectivity is the one option that leaves the conflict completely unaddressed.',
  },
  {
    id: 'sjt-fair-03', chapter: CH, concepts: FAIR_PROCESS, band: 4,
    situation: "You are a senior NCO and overhear two coworkers discussing a rumor that a specific colleague has been falsifying their timecards. You have no direct evidence, and the coworkers themselves heard it secondhand from someone else. The colleague has an excellent reputation and you personally find the rumor hard to believe, but the specific details in it are oddly consistent.",
    actions: [
      { text: 'Report what you overheard, clearly labeled as an unverified secondhand rumor, through the proper channel for someone to review the timecards themselves.', competency: 'integrity-professionalism', rationale: 'This gets the specific, oddly consistent details into a process that can actually verify or clear them, without you personally vouching for or acting on an unconfirmed rumor.' },
      { text: "Dismiss the rumor entirely without reporting it, based on your own high opinion of the colleague's reputation.", competency: 'integrity-professionalism', rationale: 'A good reputation does not make specific, oddly consistent details automatically false - dismissing it on reputation alone skips the verification a real process could actually provide.' },
      { text: 'Confront the colleague directly and tell them what people are saying about them.', competency: 'communication', rationale: 'Confronting someone with an unverified, secondhand rumor puts them on the defensive and risks damaging their reputation before any facts have actually been established.' },
      { text: "Quietly review the colleague's timecards yourself before deciding whether the rumor is worth mentioning to anyone.", competency: 'integrity-professionalism', rationale: 'Reviewing records outside the proper process, on your own authority, is not something a senior NCO is entitled to do based on secondhand gossip alone.' },
      { text: "Tell the two coworkers to stop spreading the rumor, but take no other action yourself.", competency: 'communication', rationale: 'Stopping the gossip is reasonable but leaves specific, oddly consistent details that might warrant a real look completely unaddressed.' },
    ],
    mostEffective: 0, leastEffective: 2,
    tell: 'Route even a rumor with specific, consistent details through the process built to verify it - don\'t dismiss it on reputation alone, and never confront the accused directly based on secondhand gossip.',
  },
]);

for (const band of [2, 3, 4]) {
  scenarioTemplates({ chapter: CH, band, idBase: `sjt-02-b${band}`, name: 'Integrity and professionalism' });
}

// Chapter 7 - Mentoring.
//
// PART 25C of docs/afoqt/HANDOFF.md. Same authoring rules as the other SJT chapters (see
// ch02-integrity-professionalism.js's header) - not repeated here. Unlike ch06-innovation.js,
// mentoring has decent grounding in the sourced Barron's sample (three of the 25 situations
// touch developmental coaching or workload balance), so this file targets the usual 8-10 rows.

import { registerScenarios, scenarioTemplates } from '../../engine/judgment.js';

const CH = 'sjt-07-mentoring';
const DEVELOPMENTAL_COACHING = ['sjt-developmental-coaching'];
const BALANCING_WORKLOAD = ['sjt-balancing-mentorship-with-workload'];

registerScenarios([
  // ============================ BAND 2 ============================
  {
    id: 'sjt-coach-01', chapter: CH, concepts: DEVELOPMENTAL_COACHING, band: 2,
    situation: 'A junior team member asks you to just tell them the answer to a problem they are stuck on, rather than walking through how to figure it out themselves. You have the time available to do either.',
    actions: [
      { text: 'Ask them what they have tried so far, then guide them toward the answer with questions rather than simply stating it.', competency: 'mentoring', rationale: 'Guiding them to work through the problem builds their own ability to solve similar problems next time, which a direct answer alone does not.' },
      { text: 'Just give them the direct answer, since you have the time and it is faster for both of you.', competency: 'mentoring', rationale: 'Simply providing the answer solves this one instance but leaves the underlying skill gap unaddressed, so the same request is likely to come up again.' },
      { text: 'Tell them to figure it out entirely on their own, without offering any guidance at all.', competency: 'mentoring', rationale: 'Withholding all help is a bigger swing than the situation calls for - some guided support is more useful to their development than being left with nothing.' },
      { text: "Tell them you're too busy to help right now, even though you actually have the time available.", competency: 'communication', rationale: 'Claiming you are unavailable when you actually have time is not honest, and it misses a real opportunity to help someone develop.' },
      { text: 'Do the task for them entirely, since it will likely be done more efficiently that way.', competency: 'mentoring', rationale: 'Completing the task yourself removes the junior team member from the learning opportunity entirely, which is the opposite of what a mentoring moment like this is for.' },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'Guide someone toward figuring out an answer themselves rather than simply providing it or doing it for them - the goal of a coaching moment is their growth, not just a quick resolution.',
  },
  {
    id: 'sjt-workload-01', chapter: CH, concepts: BALANCING_WORKLOAD, band: 2,
    situation: 'A junior colleague asks for fifteen minutes of your time to go over feedback on a project they just finished. You are in the middle of your own task with a deadline later today, but the task is not so time-sensitive that a short interruption would put it at real risk.',
    actions: [
      { text: 'Give them the fifteen minutes now, since your own task has enough buffer to absorb a short interruption.', competency: 'mentoring', rationale: 'A brief, genuinely low-risk interruption to support someone\'s development is a reasonable use of your time when your own deadline has real room for it.' },
      { text: "Tell them you don't have time today and to figure out the feedback on their own.", competency: 'mentoring', rationale: 'Declining a genuinely low-cost request for feedback, when you actually have the buffer to spare, misses an easy opportunity to support someone\'s development.' },
      { text: 'Agree to the fifteen minutes, but spend the whole time distracted by your own task instead of actually engaging.', competency: 'mentoring', rationale: 'Agreeing to the time without actually giving it your attention wastes both your time and theirs, and gives them a worse experience than either fully helping or honestly declining would have.' },
      { text: 'Suggest a specific, brief time later today when you can give the feedback session your full attention instead of a distracted fifteen minutes now.', competency: 'mentoring', rationale: 'Offering a real, specific later time is a reasonable option, but it is a less good fit here than simply taking the fifteen minutes now, since your current task genuinely has the buffer to spare.' },
      { text: 'Ask someone else on the team to give the feedback instead, since you are in the middle of a task.', competency: 'mentoring', rationale: "Redirecting a request that you are genuinely available to handle yourself, just because you're mid-task, passes up feedback that would likely be more valuable coming from you." },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: 'When your own workload genuinely has room for it, a short investment in someone\'s development is worth making - declining a low-cost request outright is a bigger tradeoff than the situation actually calls for.',
  },

  // ============================ BAND 3 ============================
  {
    id: 'sjt-coach-02', chapter: CH, concepts: DEVELOPMENTAL_COACHING, band: 3,
    situation: 'A subordinate you mentor made a decision on a recent project that turned out wrong, though their reasoning at the time was defensible given what they knew. The mistake was minor and easily corrected, but it clearly shook their confidence.',
    actions: [
      { text: 'Walk through the decision with them, acknowledge that their reasoning was sound given what they knew at the time, and identify together what additional information would have changed the call.', competency: 'mentoring', rationale: "This treats the mistake as a genuine learning opportunity - validating sound reasoning while identifying the specific gap - rather than simply as a failure to move past." },
      { text: 'Tell them not to worry about it and move on, without discussing the decision itself.', competency: 'mentoring', rationale: "Reassurance without any discussion of the decision itself wastes a real chance to help them understand what to do differently next time." },
      { text: "Point out clearly that the decision was wrong and that they need to be more careful in the future.", competency: 'mentoring', rationale: "Focusing only on the fact that the outcome was wrong, without validating the reasoning or identifying the specific gap, is likely to further shake their confidence without actually teaching them anything new." },
      { text: 'Take over similar decisions yourself going forward, rather than letting them make the call again.', competency: 'mentoring', rationale: 'Removing their decision-making authority after one defensible-but-wrong call denies them the chance to actually apply what they would learn from discussing it.' },
      { text: "Bring up the mistake in front of the team as a general lesson for everyone, without naming who made it.", competency: 'communication', rationale: 'Even without naming them, raising a specific, still-fresh mistake in front of the team risks the person recognizing themselves and feeling exposed, when a private conversation would serve the same learning purpose without that risk.' },
    ],
    mostEffective: 0, leastEffective: 2,
    tell: 'Treat a defensible-but-wrong decision as a genuine coaching moment - validate the reasoning, name the specific gap, and help them see what to do differently next time, rather than just marking it a failure.',
  },
  {
    id: 'sjt-coach-03', chapter: CH, concepts: DEVELOPMENTAL_COACHING, band: 3,
    situation: 'You mentor a junior team member who is technically skilled but consistently undersells their own work in meetings, deferring to others even when their own analysis was actually the more accurate one. You have noticed this pattern several times now.',
    actions: [
      { text: 'Bring up the specific pattern with them privately, citing a concrete recent example, and discuss what is behind the tendency to defer.', competency: 'mentoring', rationale: "Naming the specific, observed pattern with a concrete example gives them something real to work with, and understanding the cause behind it is more useful than just telling them to be more confident." },
      { text: 'Say nothing, reasoning that their work speaks for itself even if they undersell it verbally.', competency: 'mentoring', rationale: "A skill that never actually gets recognized in the room, because it's consistently undersold, has a real career cost that letting the pattern continue does nothing to address." },
      { text: 'Publicly correct them in the next meeting when they defer, insisting in front of everyone that their own analysis was right.', competency: 'communication', rationale: 'Correcting the pattern in the moment, in front of the group, is more likely to embarrass them than to actually help them build the confidence to advocate for their own work.' },
      { text: "Start advocating for their work yourself in meetings, speaking up on their behalf instead of letting them do it.", competency: 'mentoring', rationale: "Speaking up on their behalf addresses the symptom in the moment but does nothing to help them build the skill of advocating for their own work going forward." },
      { text: "Assume this is just their personality and not something coachable, and focus your mentoring energy elsewhere.", competency: 'mentoring', rationale: 'Treating an observed pattern as a fixed personality trait, without ever raising it directly, forecloses on a real coaching opportunity before even attempting it.' },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: 'A specific, recurring pattern is worth naming directly and privately, with a concrete example - silence, public correction, and speaking on someone\'s behalf are all ways of not actually addressing it.',
  },
  {
    id: 'sjt-workload-02', chapter: CH, concepts: BALANCING_WORKLOAD, band: 3,
    situation: 'You are mentoring two junior team members this quarter while also carrying a full workload of your own. One of them requests significantly more of your time than the other, not because their work is objectively more complex, but because they seek more frequent check-ins and reassurance.',
    actions: [
      { text: "Set a regular, sustainable check-in schedule with both of them, and use part of that time with the more frequent-checking mentee to help build their independent judgment.", competency: 'mentoring', rationale: "A structured schedule protects your own workload while still giving both mentees real, fair access to your time - and using some of it to build independence addresses the actual root of the imbalance rather than just accommodating it indefinitely." },
      { text: 'Give the more demanding mentee as much time as they ask for, since they seem to need it most.', competency: 'mentoring', rationale: 'Accommodating unlimited requests for reassurance, rather than helping build independent judgment, both crowds out the other mentee\'s fair share of your time and does not actually address the underlying need.' },
      { text: 'Cut back sharply on time with the more demanding mentee to keep things strictly equal between the two.', competency: 'mentoring', rationale: 'A rigid equal split ignores that mentoring needs genuinely differ between people, and an abrupt cutback risks leaving a real need unaddressed rather than gradually building toward independence.' },
      { text: 'Stop mentoring the more demanding one for now, citing your own workload, and focus only on the other mentee.', competency: 'mentoring', rationale: 'Dropping a mentee entirely, rather than managing the time more sustainably, abandons a real developmental relationship instead of adjusting how it runs.' },
      { text: "Ask your supervisor to reassign one of the two mentees to someone else, citing your own workload.", competency: 'resource-management', rationale: "Offloading a mentoring relationship because of a scheduling imbalance, rather than managing your own time more sustainably, is a bigger step than the situation actually requires." },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: "Protect a sustainable structure for your own time while still meeting both mentees' real needs - and where one mentee's requests exceed what the work actually requires, address the underlying need for independence rather than simply accommodating or cutting them off.",
  },
  {
    id: 'sjt-workload-03', chapter: CH, concepts: BALANCING_WORKLOAD, band: 3,
    situation: "You have been informally mentoring a colleague from a different team who reached out to you directly for career advice. It has been valuable for both of you, but the time commitment has grown from an occasional coffee chat to something closer to a weekly standing meeting, and it is now noticeably cutting into your own team's work.",
    actions: [
      { text: 'Talk with them honestly about the time commitment, and propose a lighter, more sustainable schedule that still provides real support.', competency: 'mentoring', rationale: "Being honest about the actual constraint, while proposing a workable alternative, keeps the relationship valuable without letting it continue to grow unsustainably." },
      { text: 'Keep the weekly meetings going as they are, absorbing the impact on your own team\'s work rather than raising the issue.', competency: 'mentoring', rationale: 'Continuing to absorb a growing time commitment silently, at the cost of your own team\'s work, is not sustainable and denies the other person the chance to help find a better balance.' },
      { text: 'Stop responding to their outreach without any explanation, letting the relationship quietly end on its own.', competency: 'mentoring', rationale: 'Ending a valuable relationship through silence, rather than an honest conversation, is more likely to confuse and hurt the other person than a direct conversation about the time commitment would.' },
      { text: "Tell them abruptly that you can no longer meet with them at all, without offering any lighter alternative.", competency: 'communication', rationale: 'An abrupt full stop, without any alternative, is a bigger swing than the situation calls for when a lighter, sustainable schedule could preserve real value for both sides.' },
      { text: "Continue the weekly meetings, but start using some of that time to also discuss your own team's work, blending the two.", competency: 'mentoring', rationale: "Repurposing the mentoring time for your own team's business changes what the other person actually signed up for, without ever having an honest conversation about the schedule itself." },
    ],
    mostEffective: 0, leastEffective: 2,
    tell: 'When a mentoring commitment has genuinely outgrown what is sustainable, say so honestly and propose a workable alternative - silently absorbing it or silently ending it both avoid the direct conversation that actually resolves it.',
  },

  {
    id: 'sjt-coach-05', chapter: CH, concepts: DEVELOPMENTAL_COACHING, band: 3,
    situation: "A subordinate you mentor asks you to write a strong recommendation for a stretch assignment you honestly believe they are not quite ready for yet, though they are close and clearly motivated. Declining risks discouraging them; agreeing risks setting them up for a role they may struggle in.",
    actions: [
      { text: 'Tell them honestly that you think they are close but not quite ready yet, name the specific gap, and offer to help them close it so you can support a future application with confidence.', competency: 'mentoring', rationale: "This is honest about the real gap while still being genuinely supportive of their ambition, and gives them something concrete to work toward rather than either a discouraging no or a setup for struggle." },
      { text: 'Write the strong recommendation anyway, since you do not want to discourage someone who is clearly motivated.', competency: 'mentoring', rationale: 'Recommending someone for a role you honestly believe they are not ready for risks setting them up to struggle, which serves neither them nor the position they would be filling.' },
      { text: 'Decline to write the recommendation without explaining why, to avoid an uncomfortable conversation about their readiness.', competency: 'mentoring', rationale: 'Declining without any explanation leaves them without the honest, specific feedback that would actually help them understand what to work on.' },
      { text: "Write a vague, lukewarm recommendation that neither strongly supports nor clearly discourages the application.", competency: 'mentoring', rationale: 'A deliberately noncommittal recommendation avoids the honest conversation while still putting your name behind an application you have real reservations about.' },
      { text: "Tell them to ask someone else for the recommendation instead, without giving them any honest feedback about your actual concern.", competency: 'mentoring', rationale: 'Redirecting them elsewhere, without sharing the honest concern behind your hesitation, denies them the specific feedback that would actually help them grow toward being ready.' },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: 'Be honest about a real readiness gap while still supporting someone\'s genuine ambition - name the specific gap and offer a path to close it, rather than a false yes, an unexplained no, or a noncommittal middle ground.',
  },
  {
    id: 'sjt-workload-04', chapter: CH, concepts: BALANCING_WORKLOAD, band: 3,
    situation: 'A subordinate you mentor asks for extensive help reworking a project the night before it is due, well after you would normally have stopped for the day. You are willing to help somewhat, but giving the amount of time they are asking for would mean neglecting your own commitments for tomorrow morning.',
    actions: [
      { text: 'Offer a specific, bounded amount of time tonight to help with the highest-impact parts, and be honest that you cannot cover everything they are asking for.', competency: 'mentoring', rationale: 'A specific, honest, bounded offer gives real help where it matters most without silently sacrificing your own commitments for tomorrow.' },
      { text: 'Give them all the time they ask for tonight, even though it means you will be unprepared for your own commitments tomorrow morning.', competency: 'mentoring', rationale: 'Giving unlimited time at the direct cost of your own tomorrow trades one real responsibility for another rather than finding a sustainable middle ground.' },
      { text: 'Tell them you cannot help at all tonight, without offering any bounded alternative.', competency: 'mentoring', rationale: 'Declining entirely, when a bounded amount of real help was actually available, is a bigger swing away from support than the situation requires.' },
      { text: 'Agree to help for as long as they need, but stop responding partway through once it starts eating into your own time.', competency: 'communication', rationale: 'Agreeing without a real limit, then silently disappearing partway through, leaves them stranded worse than an honest limit set up front would have.' },
      { text: 'Do the rework yourself overnight so they do not have to worry about it, without involving them in the process.', competency: 'mentoring', rationale: 'Doing the work for them removes them from the learning opportunity entirely, which is the opposite of what a mentoring moment like this is for.' },
    ],
    mostEffective: 0, leastEffective: 3,
    tell: 'Offer a specific, bounded amount of help you can actually sustain, and say so honestly - agreeing to more than you can give, only to quietly withdraw partway through, is worse than a clear limit set up front.',
  },

  // ============================ BAND 4 ============================
  {
    id: 'sjt-coach-04', chapter: CH, concepts: DEVELOPMENTAL_COACHING, band: 4,
    situation: 'A subordinate you mentor is technically excellent but has just been passed over for a role they wanted and were, in your honest assessment, genuinely qualified for - the selection came down to a close call with another strong candidate. They ask you directly why they think this happened and what they should do differently.',
    actions: [
      { text: "Give them an honest, specific assessment of the areas where the other candidate had a genuine edge, alongside genuine acknowledgment of their own real strengths, and help them build a concrete plan for the next opportunity.", competency: 'mentoring', rationale: "This treats them as capable of hearing the honest, specific truth and using it productively, which respects both their qualifications and their ability to actually grow from specific, honest feedback." },
      { text: "Tell them it was simply bad luck and there was nothing they could have done differently.", competency: 'mentoring', rationale: 'If there genuinely was a specific, addressable gap that made the difference, telling them it was pure luck denies them the honest information they would need to actually close it before the next opportunity.' },
      { text: "Give them a long list of things to improve, including some things that were not actually relevant to why they were passed over this time.", competency: 'mentoring', rationale: "Padding the feedback with things that weren't actually relevant to this specific decision muddies the real, useful information with noise, making it harder for them to focus on what would actually matter next time." },
      { text: 'Avoid answering the question directly, since it is an uncomfortable topic involving a decision you were not part of making.', competency: 'communication', rationale: "Avoiding a direct question from someone you mentor, on a topic that genuinely matters to their development, misses a real opportunity to help them grow from a setback." },
      { text: "Tell them the selection process itself was flawed, without direct knowledge of whether that is actually true.", competency: 'mentoring', rationale: "Suggesting the process was flawed, without actually knowing that, may feel comforting in the moment but gives them a false explanation instead of the honest, useful one they asked for." },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: "When someone you mentor asks for the honest reason behind a setback, give them the specific, honest truth alongside genuine acknowledgment of their real strengths - a comforting but false explanation denies them what they would actually need to grow from it.",
  },
  {
    id: 'sjt-workload-05', chapter: CH, concepts: BALANCING_WORKLOAD, band: 4,
    situation: 'You are the only person in your section experienced enough to mentor two new team members who both started the same week. Your own project load has not decreased to make room for this, and your supervisor has not addressed the mismatch, seemingly assuming you will simply absorb it.',
    actions: [
      { text: 'Raise the actual mismatch with your supervisor directly, describing what mentoring both new members well would require against your current project load, and ask how to resolve the tradeoff.', competency: 'mentoring', rationale: 'Naming the real mismatch to the person who can actually resolve it gives your supervisor the chance to fix a problem they may not have realized they created.' },
      { text: 'Absorb the extra mentoring load silently by working extended hours, without raising the mismatch with your supervisor at all.', competency: 'mentoring', rationale: 'Quietly absorbing an unaddressed mismatch through extended hours is not sustainable, and it denies your supervisor the chance to actually fix a problem they may not know exists.' },
      { text: 'Mentor only one of the two new members well and leave the other largely to figure things out on their own, without telling your supervisor why.', competency: 'mentoring', rationale: "Quietly shortchanging one new member's development, without explaining why, leaves your supervisor unaware that the mismatch is even causing a real problem." },
      { text: 'Tell your supervisor you cannot mentor either new member at all, without proposing any way to make it work.', competency: 'communication', rationale: 'Refusing outright, without naming what would actually make the workload sustainable, gives your supervisor nothing to act on beyond a flat no.' },
      { text: 'Give both new members a reduced, surface-level version of mentoring, spread thin enough that neither actually benefits much.', competency: 'mentoring', rationale: 'Spreading your attention too thin to be useful to either new member wastes the mentoring relationship for both of them rather than actually resolving the underlying mismatch.' },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: 'When a real mismatch between mentoring responsibility and workload was never actually addressed by the people who could fix it, name it directly rather than quietly absorbing it - an unraised problem does not get less real for staying unraised.',
  },
  {
    id: 'sjt-coach-06', chapter: CH, concepts: DEVELOPMENTAL_COACHING, band: 4,
    situation: 'A subordinate you mentor has real potential but keeps repeating the same specific mistake despite two previous conversations about it, both of which they seemed to genuinely take on board at the time. This time, the mistake caused a minor but real problem for someone else on the team.',
    actions: [
      { text: 'Have a direct conversation naming that this is the third time, ask them what is actually getting in the way of the change sticking, and work out a concrete way to catch it earlier next time.', competency: 'mentoring', rationale: 'Naming the pattern honestly and asking why it has not stuck yet treats a repeat mistake as something to actually diagnose, rather than simply repeating the same conversation or giving up.' },
      { text: 'Have the same general conversation you had the first two times, without naming that this is a repeat or asking why it has not stuck.', competency: 'mentoring', rationale: 'Repeating the identical conversation, without acknowledging that it has already failed to work twice, is unlikely to produce a different result the third time.' },
      { text: 'Conclude they are not capable of improving in this area and stop assigning them the kind of work where the mistake comes up.', competency: 'mentoring', rationale: 'Writing off someone with real potential after two conversations, rather than trying a more direct diagnostic conversation first, gives up on a coaching relationship earlier than the situation warrants.' },
      { text: 'Say nothing this time since you have already addressed it twice before and do not want to repeat yourself.', competency: 'mentoring', rationale: 'Staying silent after a mistake that caused a real problem for someone else lets a known, recurring gap continue to affect other people on the team.' },
      { text: 'Escalate straight to formal counseling for the third occurrence, without another direct conversation first.', competency: 'leadership', rationale: 'Jumping straight to formal counseling, without first trying to actually understand why the change has not stuck, is a heavier response than the situation has been shown to need yet.' },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: "When a coaching conversation hasn't stuck twice, don't just repeat it or give up on the person - name the pattern directly and diagnose why it isn't sticking before reaching for a heavier response than the situation has earned yet.",
  },
]);

for (const band of [2, 3, 4]) {
  scenarioTemplates({ chapter: CH, band, idBase: `sjt-07-b${band}`, name: 'Mentoring' });
}

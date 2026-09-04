// Chapter 6 - Innovation.
//
// PART 25C of docs/afoqt/HANDOFF.md. Same authoring rules as the other SJT chapters (see
// ch02-integrity-professionalism.js's header) - not repeated here.
//
// ⚠ SMALLER ROW COUNT, DELIBERATELY, PER THE PART 24 DESIGN RECORD'S FLAG. Innovation is thin in
// every primary source actually checked for this part, not just the one Barron's sample PART 24
// already flagged:
//   - Trivium's practice book (G:\My Drive\...Trivium Test Prep...pdf) was extracted and its own
//     table of contents read directly: both practice tests list ten scored subtests, and neither
//     lists a Situational Judgment section at all - Trivium has no SJT practice items to check.
//   - The AFPC pamphlet (afpt-997, the Form T information pamphlet already used elsewhere in this
//     project) was fetched and extracted fresh for this part. It carries exactly two official
//     worked SJT situations, both with real answer keys. Situation I is a new leader in an
//     unfamiliar section trying to learn the job from unhelpful subordinates - a leadership/
//     information-gathering situation. Situation II is a civilian engineer filtering technical
//     information to a commander - an integrity/honest-reporting situation. Neither is about
//     proposing or championing a new idea, or about weighing a calculated risk.
//   - afoqt/data/realQuestions.json (the official OATTS bank used throughout this project) has
//     zero rows tagged to the SJ subtest at all.
// Three sources checked, all thin or empty for this competency specifically - the same finding
// PART 24 made from Barron's alone, now confirmed rather than merely repeated. Per the brief:
// report honestly and ship fewer rows rather than pad. The original five scenarios below are all
// genuinely distinct "propose/champion a new idea" or "weigh a calculated risk" situations -
// deliberately NOT variations on "you notice an outdated process," which is exactly the thin,
// generic frame PART 24 warned reads more like leadership/delegation than real innovation
// judgment. All five sit at band 3, the minimum needed for scenarioTemplates to produce anything
// at all; there was not enough genuinely distinct, well-grounded material found in the CHECKED
// SOURCES to also stretch to bands 2 and 4 without either padding or forcing an artificial
// difficulty label onto content that doesn't actually vary in how contested it is.
//
// 2026-09-04: three more scenarios added (sjt-risk-03 at band 3, sjt-risk-04 and sjt-improve-04
// at band 4), original writing rather than sourced, since the thin-source finding above is about
// calibration material, not about whether this competency can produce genuinely band-4 judgment
// calls on its own - a full commitment with no fallback, or an expectation of cooperation from
// people who don't report to you, are contestable enough on their own terms. `scenarioTemplates`
// now runs for bands [3, 4] instead of band 3 alone.

import { registerScenarios, scenarioTemplates } from '../../engine/judgment.js';

const CH = 'sjt-06-innovation';
const PROCESS_IMPROVEMENT = ['sjt-process-improvement'];
const CALCULATED_RISK = ['sjt-calculated-risk'];

registerScenarios([
  {
    id: 'sjt-improve-01', chapter: CH, concepts: PROCESS_IMPROVEMENT, band: 3,
    situation: 'You notice that a recurring manual data-entry task in your section, currently taking a team member roughly two hours a week, could be handled by a simple tool you personally know how to build. Building and proposing it would take real time outside your assigned duties, and there is no guarantee your section chief will want to adopt it.',
    actions: [
      { text: 'Build a rough working version on your own time, then bring it to your section chief with a clear explanation of the time it could save.', competency: 'innovation', rationale: 'A concrete, working example makes the proposal easy to actually evaluate, and doing the initial work on your own time avoids committing section resources before anyone has agreed it is worth pursuing.' },
      { text: "Mention the idea verbally to your section chief without building anything, and wait to see if they ask you to pursue it further.", competency: 'innovation', rationale: 'A vague verbal suggestion, with nothing concrete to evaluate, is easy for a busy supervisor to set aside even if the underlying idea has real merit.' },
      { text: 'Build the tool and start using it yourself immediately, without mentioning it to your section chief at all.', competency: 'innovation', rationale: 'Quietly changing how a shared task gets done, without ever proposing it up the chain, means the improvement never spreads beyond you and was never actually sanctioned.' },
      { text: 'Decide the idea is not worth pursuing since it falls outside your assigned duties and is not something anyone asked you to work on.', competency: 'innovation', rationale: 'A genuinely useful improvement does not stop being worth proposing just because building it was not formally assigned to you.' },
      { text: "Ask the team member currently doing the manual task whether they'd support the idea before mentioning it to anyone else.", competency: 'communication', rationale: "Checking in with the person most affected is reasonable, but treating their informal buy-in as the deciding factor, rather than actually proposing the idea up the chain, stalls a genuinely useful improvement." },
    ],
    mostEffective: 0, leastEffective: 3,
    tell: 'A genuinely useful improvement is worth proposing with something concrete to evaluate, even when building it falls outside your assigned duties - the fact that no one asked for it is not a reason to let it go unproposed.',
  },
  {
    id: 'sjt-risk-01', chapter: CH, concepts: CALCULATED_RISK, band: 3,
    situation: "You are coordinating logistics for a time-sensitive delivery. The standard route is well-tested but will make the delivery about two hours late for a deadline that genuinely matters. An alternate route would arrive on time, but it is one you have not personally used before, though a colleague who has used it regularly describes it as reliable and only slightly more complex to navigate.",
    actions: [
      { text: 'Get specific details on the alternate route from your colleague, confirm it meets basic safety and reliability requirements, and use it for this delivery.', competency: 'innovation', rationale: 'This weighs the real, described risk against the genuine benefit of an on-time delivery, using an actual informed source rather than either blind confidence or blanket caution.' },
      { text: 'Use the standard route and accept the delay, without looking into whether the alternate route is actually a reasonable option.', competency: 'innovation', rationale: 'Defaulting to the familiar option without even evaluating the alternative treats caution as automatically correct, even when the described risk is genuinely modest and the deadline genuinely matters.' },
      { text: 'Use the alternate route without checking any details on it first, reasoning that your colleague mentioned it works.', competency: 'innovation', rationale: 'Adopting an unfamiliar route on a time-sensitive delivery without confirming any actual details first is treating a secondhand mention as sufficient justification for a real risk.' },
      { text: 'Split the delivery, sending part of it on each route, to hedge against the alternate route turning out to be a problem.', competency: 'innovation', rationale: "Splitting the delivery adds real coordination complexity and does not actually resolve the question of whether the alternate route is a reasonable risk - it just spreads the uncertainty across two shipments instead of resolving it." },
      { text: "Ask your supervisor to decide which route to use, rather than making the call yourself.", competency: 'leadership', rationale: 'Evaluating a route choice for a delivery you are responsible for coordinating is squarely within your own role - escalating a decision you have the information to make yourself adds unnecessary delay.' },
    ],
    mostEffective: 0, leastEffective: 2,
    tell: 'A calculated risk is informed, not blind - gather the specific details that let you actually weigh the risk against the benefit, rather than defaulting to caution or acting on a secondhand assurance alone.',
  },
  {
    id: 'sjt-improve-02', chapter: CH, concepts: PROCESS_IMPROVEMENT, band: 3,
    situation: 'You have an idea for a better approach to a recurring team task. You later learn that a similar approach was tried once, several years ago, under a previous section chief, and was abandoned - though the circumstances back then (different team size, different tools available) were noticeably different from today.',
    actions: [
      { text: 'Bring the idea forward anyway, explicitly noting the earlier attempt and explaining specifically what has changed since then that might make it work now.', competency: 'innovation', rationale: "Acknowledging the earlier attempt directly, and explaining what is actually different this time, gives your section chief real information to judge whether the idea deserves a second look rather than an automatic no." },
      { text: 'Drop the idea entirely, reasoning that it was already tried once and did not work.', competency: 'innovation', rationale: "Treating a years-old attempt under different circumstances as a permanent verdict on the idea ignores that the actual conditions have genuinely changed since then." },
      { text: 'Propose the idea without mentioning that a similar approach was tried before, to avoid it being dismissed based on the earlier attempt.', competency: 'innovation', rationale: 'Withholding the relevant history risks your section chief hearing about the earlier attempt from someone else later, which would undermine trust in the proposal more than raising it yourself would have.' },
      { text: 'Ask around informally to gauge whether coworkers remember the earlier attempt fondly or not, before deciding whether to propose the idea at all.', competency: 'communication', rationale: "Basing the decision to propose the idea on informal, secondhand nostalgia about the earlier attempt substitutes gossip for actually evaluating whether the circumstances have changed." },
      { text: "Propose a nearly identical version of the earlier attempt, without adjusting it for the team's current size or the tools now available.", competency: 'innovation', rationale: "Proposing the same approach without adapting it to the circumstances that are now different repeats exactly the version that already failed once, rather than the genuinely improved version the changed circumstances make possible." },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: "A past attempt under different circumstances is context to explain, not a permanent verdict - propose the improved idea openly, naming what has actually changed since it was last tried.",
  },
  {
    id: 'sjt-risk-02', chapter: CH, concepts: CALCULATED_RISK, band: 3,
    situation: 'One of your subordinates proposes an unconventional approach to an upcoming project that has a real chance of producing significantly better results than the standard approach, but also carries a real chance of falling short in a way the conventional approach would not. You have the authority to approve which approach the team uses.',
    actions: [
      { text: "Discuss the proposal with the subordinate in detail, weigh the actual upside against the actual downside, and decide based on that assessment rather than on the approach's novelty alone.", competency: 'innovation', rationale: "This treats the unconventional approach on its actual merits - neither rejecting it just because it's new, nor approving it just because it's exciting - which is what a genuine calculated-risk assessment requires." },
      { text: 'Reject the proposal without much discussion, since the conventional approach is safer and has a known track record.', competency: 'innovation', rationale: "Defaulting to the safer, known approach without seriously weighing the unconventional one's actual upside forecloses on a genuinely promising idea for no reason beyond its unfamiliarity." },
      { text: 'Approve the proposal without much discussion, since a subordinate who is close to the work likely has good instincts about it.', competency: 'innovation', rationale: "Approving a real risk based on trust in the subordinate's instincts alone, without actually discussing and weighing the specific upside and downside, skips the assessment a calculated risk requires." },
      { text: "Tell the subordinate to run the unconventional approach quietly, alongside the conventional one, without formally deciding between them.", competency: 'innovation', rationale: 'Running both approaches at once avoids making the actual decision and spends real resources on two efforts instead of clearly choosing and committing to one.' },
      { text: 'Ask the subordinate to find several other people who have successfully used the unconventional approach before deciding.', competency: 'innovation', rationale: 'Requiring outside precedent before considering a genuinely novel approach sets a bar that, if applied consistently, would rule out ever trying something new for the first time.' },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: "Weigh a subordinate's proposed risk on its actual merits - the real upside against the real downside - rather than rejecting it for being unfamiliar or approving it on trust alone.",
  },
  {
    id: 'sjt-improve-03', chapter: CH, concepts: PROCESS_IMPROVEMENT, band: 3,
    situation: 'You have identified a genuinely better way to run a training session your team delivers regularly, but implementing it means asking two senior instructors, who have delivered the training the same way for years and take real pride in it, to change a method they are comfortable with and clearly attached to.',
    actions: [
      { text: "Present the idea to the senior instructors directly, framed around the specific problem it solves, and genuinely invite their input on how to adapt it.", competency: 'innovation', rationale: 'Framing the proposal around the actual problem it solves, and inviting the people most affected to help shape it, gives the idea a real chance while respecting their experience rather than simply overriding it.' },
      { text: 'Drop the idea rather than risk an uncomfortable conversation with instructors who are attached to their current method.', competency: 'innovation', rationale: "A genuinely better training method does not stop being worth proposing just because the conversation to introduce it might be uncomfortable." },
      { text: 'Have your own supervisor mandate the change from above, without you personally raising it with the instructors first.', competency: 'leadership', rationale: "Having the change imposed from above, rather than raising it with the instructors directly and inviting their input, is more likely to produce resentment and passive resistance than a change proposed collaboratively." },
      { text: 'Implement the new method yourself the next time you deliver the training, without discussing it with the other two instructors at all.', competency: 'innovation', rationale: "Changing only your own sessions, without ever raising the idea with the instructors who deliver the same training the old way, means the improvement never actually reaches most of the sessions it could help." },
      { text: "Wait until one of the two senior instructors happens to retire or move on before proposing the change to whoever replaces them.", competency: 'innovation', rationale: 'Waiting years for a personnel change, rather than proposing a genuinely better method now, delays a real improvement for a reason that has nothing to do with whether the idea is actually good.' },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: "A genuinely better idea is worth proposing directly to the people most attached to the old way, framed around the problem it solves and open to their input - not shelved to avoid discomfort, imposed from above, or delayed indefinitely.",
  },
  {
    id: 'sjt-risk-03', chapter: CH, concepts: CALCULATED_RISK, band: 3,
    situation: 'You are planning an approach for an upcoming exercise. A new piece of equipment has just become available that could meaningfully improve results, but your team has had only limited hands-on time with it, and the exercise itself has real stakes if something goes wrong.',
    actions: [
      { text: 'Have the team run a focused practice session with the new equipment beforehand, then decide whether to use it based on how that practice actually goes.', competency: 'innovation', rationale: 'Testing the new equipment under low stakes first gives you real information to weigh against the exercise\'s actual stakes, rather than deciding on promise alone.' },
      { text: 'Use the new equipment in the actual exercise without any dedicated practice time, given how promising it looks.', competency: 'innovation', rationale: 'Committing to unfamiliar equipment on a real, high-stakes exercise with zero practice time is treating promise as if it were proven readiness.' },
      { text: 'Avoid the new equipment entirely and use only the familiar approach, without giving the new option a real evaluation first.', competency: 'innovation', rationale: 'Ruling out a genuinely promising option without ever testing it treats caution as automatically correct, even when a low-stakes practice session was available to actually check it.' },
      { text: "Use the new equipment for only part of the exercise and the familiar approach for the rest, splitting the team's attention between both.", competency: 'innovation', rationale: 'Splitting effort between both approaches during the actual exercise adds real coordination complexity without resolving whether the new equipment is actually ready to rely on.' },
      { text: 'Ask around informally whether other teams have used the new equipment successfully before deciding anything yourself.', competency: 'communication', rationale: "Relying on secondhand accounts from other teams, rather than your own team's actual practice with it, is a weaker basis for the decision than direct hands-on evaluation." },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: "Test a promising new option under low stakes before committing to it under real ones - a calculated risk is informed by your own actual practice, not by promise alone or secondhand reassurance.",
  },
  {
    id: 'sjt-risk-04', chapter: CH, concepts: CALCULATED_RISK, band: 4,
    situation: "You have the authority to approve a subordinate's request to pilot a new approach on a real, moderately important project rather than a low-stakes trial run first, because a genuine low-stakes trial opportunity will not come around again for months and the project's timeline cannot wait that long either.",
    actions: [
      { text: 'Approve the pilot on the real project, but build in an early checkpoint and a clear fallback to the conventional approach if early signs are not good.', competency: 'innovation', rationale: 'A real checkpoint and fallback lets you actually catch an early problem and limit the downside, which is what makes this a calculated risk rather than a blind commitment.' },
      { text: 'Deny the pilot outright and require the conventional approach, since there is no true low-stakes trial available first.', competency: 'innovation', rationale: 'Ruling out the new approach entirely, because a low-stakes trial happens not to be available, forecloses on a genuinely promising idea for a reason that has nothing to do with its actual merit.' },
      { text: 'Approve the pilot with no checkpoint or fallback plan, committing fully to the new approach for the whole project.', competency: 'innovation', rationale: 'Committing fully with no way to catch an early problem is not a smaller risk than building in a checkpoint - it is the same risk taken with less information along the way.' },
      { text: 'Delay the project\'s timeline to wait for a future low-stakes trial opportunity, even though the delay itself carries a real cost.', competency: 'resource-management', rationale: "Delaying a project that genuinely cannot wait, purely to get a trial run the situation has already ruled out as available in time, trades a real, known cost for one that may not even resolve the underlying question sooner." },
      { text: 'Approve the pilot, but only on the condition that the subordinate personally guarantees it will succeed.', competency: 'leadership', rationale: 'Demanding a personal guarantee of success from a subordinate for something that is, by definition, a real risk, asks for a certainty that a calculated risk cannot actually provide.' },
    ],
    mostEffective: 0, leastEffective: 2,
    tell: 'When a genuine low-stakes trial is not available, a calculated risk still needs a checkpoint and a real fallback - full commitment with no way to catch an early problem is not a smaller risk, just a less examined one.',
  },
  {
    id: 'sjt-improve-04', chapter: CH, concepts: PROCESS_IMPROVEMENT, band: 4,
    situation: "You believe a process change would genuinely help your section, but implementing it would require a modest amount of your peers' time to help with the transition, and none of your peers report to you - you need their voluntary cooperation, not just your own section chief's approval.",
    actions: [
      { text: "Propose the idea to your section chief with a specific, honest account of the time it would ask of your peers, and ask your chief to help you make the case to them rather than assuming their cooperation.", competency: 'innovation', rationale: "Naming the actual cost to your peers honestly, and treating their cooperation as something to be earned rather than assumed, respects that they do not report to you while still giving the idea a real path forward." },
      { text: 'Get your section chief\'s approval, then tell your peers the change is happening and their cooperation is expected.', competency: 'leadership', rationale: 'Framing voluntary cooperation from people who do not report to you as an expectation, just because your own chief approved the idea, overreaches the actual authority either of you has over them.' },
      { text: 'Drop the idea, reasoning that needing other people\'s voluntary time makes it too complicated to pursue.', competency: 'innovation', rationale: 'A genuinely good idea does not stop being worth pursuing just because it requires the extra step of actually asking for cooperation rather than commanding it.' },
      { text: 'Ask your peers directly for their time without ever looping in your section chief on the proposal at all.', competency: 'innovation', rationale: 'Skipping your own section chief entirely leaves the proposal without an endorsement that could help you actually make the case to your peers.' },
      { text: 'Quietly implement the parts of the change that only affect your own section, without asking your peers for anything or telling anyone the fuller idea exists.', competency: 'innovation', rationale: 'Scaling the idea down to only what you can do alone means the genuinely better version, the one that actually needs your peers, never gets proposed at all.' },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: "A genuinely good idea that needs other people's voluntary cooperation still needs to be proposed to them as a request, with the actual cost named honestly - not announced as an expectation just because you have your own chief's approval.",
  },
]);

for (const band of [3, 4]) {
  scenarioTemplates({ chapter: CH, band, idBase: `sjt-06-b${band}`, name: 'Innovation' });
}

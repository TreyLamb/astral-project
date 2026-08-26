// Chapter 5 - Communication.
//
// PART 25B of docs/afoqt/HANDOFF.md. Same sourcing and authoring rules as ch02/ch03/ch04 - see
// ch02-integrity-professionalism.js's header, not repeated here.

import { registerScenarios, scenarioTemplates } from '../../engine/judgment.js';

const CH = 'sjt-05-communication';
const TACTFUL_FEEDBACK = ['sjt-tactful-feedback'];
const RECEIVING_FEEDBACK = ['sjt-receiving-feedback'];
const RESPECTFUL_DISSENT = ['sjt-respectful-dissent'];
const PROPER_ESCALATION = ['sjt-proper-escalation'];

registerScenarios([
  // ============================ BAND 2 ============================
  {
    id: 'sjt-tactful-01', chapter: CH, concepts: TACTFUL_FEEDBACK, band: 2,
    situation: 'You notice a coworker has been consistently formatting a recurring report incorrectly for the past two weeks - a minor but noticeable error that a supervisor is likely to spot eventually.',
    actions: [
      { text: 'Mention it to them privately and specifically, showing them the correct format.', competency: 'communication', rationale: "A brief, private, specific correction fixes the actual error and lets them correct it before anyone above them notices, without any unnecessary embarrassment." },
      { text: "Say nothing, assuming they'll figure out the correct format eventually on their own.", competency: 'communication', rationale: 'A recurring, noticeable error left uncorrected risks a supervisor spotting it before the coworker has a chance to fix it themselves.' },
      { text: 'Mention the formatting error in front of the rest of the team during a regular meeting.', competency: 'communication', rationale: 'A minor, easily corrected error does not need to be raised in front of the whole team - doing so embarrasses the coworker for something that a quiet, private word would fix just as well.' },
      { text: "Fix the formatting yourself each time before the report goes out, without telling the coworker.", competency: 'mentoring', rationale: "Quietly fixing the error yourself every time means the coworker never learns the correct format and the same mistake keeps recurring." },
      { text: "Report the recurring error directly to your shared supervisor instead of mentioning it to the coworker first.", competency: 'communication', rationale: 'Escalating a minor, easily corrected error before even giving the coworker a chance to fix it themselves skips a much simpler, more direct first step.' },
    ],
    mostEffective: 0, leastEffective: 2,
    tell: 'Deliver a correction privately and specifically - the goal is a fixed error and a coworker who has actually learned, not one who has been embarrassed in front of others.',
  },
  {
    id: 'sjt-receiving-01', chapter: CH, concepts: RECEIVING_FEEDBACK, band: 2,
    situation: 'Your supervisor points out, during a routine check-in, that a report you submitted last week had several small errors that took them extra time to catch and correct.',
    actions: [
      { text: 'Thank your supervisor for pointing it out, ask what specifically to watch for next time, and confirm you\'ll review more carefully before submitting.', competency: 'communication', rationale: 'Seeking specifics and committing to a concrete change is what turns feedback into an actual improvement, rather than just an uncomfortable moment to get through.' },
      { text: 'Explain that you were under time pressure that week, without asking what specifically to improve.', competency: 'communication', rationale: 'Leading with an explanation, rather than asking what to actually improve, reads as defending the errors instead of addressing them.' },
      { text: 'Apologize repeatedly without asking any follow-up questions about what specifically went wrong.', competency: 'communication', rationale: 'Apologizing without seeking any specifics leaves you without the actual information you would need to avoid the same errors next time.' },
      { text: "Point out that the errors were minor and didn't actually affect the report's conclusions.", competency: 'communication', rationale: "Minimizing the errors, rather than engaging with the feedback, reads as deflecting responsibility instead of taking the correction seriously." },
      { text: 'Say nothing in the moment, and privately decide to be more careful next time without discussing it further.', competency: 'communication', rationale: 'Saying nothing at all leaves your supervisor unsure whether you actually understood or accepted the feedback.' },
    ],
    mostEffective: 0, leastEffective: 3,
    tell: 'Respond to criticism by seeking clarity and committing to a specific change - not by defending, minimizing, or silently absorbing it without engaging.',
  },

  // ============================ BAND 3 ============================
  {
    id: 'sjt-tactful-02', chapter: CH, concepts: TACTFUL_FEEDBACK, band: 3,
    situation: "You are a shift supervisor and need to tell an experienced, well-respected technician that their recent work on a specific task has fallen noticeably below their own usual standard, in a way that has started to affect the team's output.",
    actions: [
      { text: 'Meet with the technician privately, describe the specific pattern you\'ve observed compared to their usual standard, and ask if something is affecting their work.', competency: 'communication', rationale: "This delivers a specific, factual comparison privately, and opens the door to understanding a cause, rather than assuming one - appropriate for someone with an otherwise strong record." },
      { text: "Avoid raising it directly, hoping their usual high standard returns on its own without needing to say anything.", competency: 'communication', rationale: "Avoiding a real, team-affecting performance change because the person is usually strong lets the problem continue and denies them a fair chance to address it." },
      { text: 'Raise it in front of the team during a shift briefing, using it as a general reminder about maintaining standards.', competency: 'communication', rationale: "Singling out an experienced technician's specific decline in front of the team, even indirectly, is likely to embarrass someone with an otherwise strong reputation over what could be a private, fixable issue." },
      { text: "Reassign the technician's most important tasks to someone else without discussing the performance change with them first.", competency: 'leadership', rationale: 'Quietly reassigning work around a performance problem, without ever raising it directly, denies the technician the chance to actually address whatever is going on.' },
      { text: "Document the decline formally and route it straight to a written counseling, without a private conversation first.", competency: 'communication', rationale: 'Jumping straight to formal, written counseling for an experienced, well-regarded technician, without first having a direct conversation, is a heavier first response than the situation has been shown to need yet.' },
    ],
    mostEffective: 0, leastEffective: 2,
    tell: 'Deliver a hard message privately and specifically, framed as a factual comparison to their own usual standard - never as a public reminder, however indirectly aimed.',
  },
  {
    id: 'sjt-receiving-02', chapter: CH, concepts: RECEIVING_FEEDBACK, band: 3,
    situation: "During a formal performance review, your supervisor tells you that your written communication with other sections has come across as curt and has caused some friction, feedback you find genuinely surprising and don't fully agree with based on your own sense of how you write.",
    actions: [
      { text: 'Ask your supervisor for a specific example of a message that came across that way, so you can understand the actual pattern they mean.', competency: 'communication', rationale: "Asking for a concrete example turns vague, surprising feedback into something specific enough to actually evaluate and, if warranted, correct." },
      { text: "Tell your supervisor you disagree and that your writing style has never been a problem before, ending the discussion there.", competency: 'communication', rationale: "Disagreeing and closing the conversation, without asking for the specifics behind the feedback, forecloses on actually understanding what prompted it." },
      { text: "Accept the feedback at face value without any follow-up questions, and privately resolve to write differently without knowing exactly what to change.", competency: 'communication', rationale: 'Accepting feedback you find genuinely surprising without asking any clarifying questions means you may end up changing the wrong thing, since you never actually learned what the specific pattern was.' },
      { text: "Ask a few coworkers afterward, informally, whether they've also found your writing curt, instead of asking your supervisor directly.", competency: 'communication', rationale: "Going around your supervisor to informally poll coworkers, rather than asking the person who actually raised the feedback, is a less direct and less reliable way to get the specifics you need." },
      { text: "Point out that the other sections' own communication has been unclear too, shifting the conversation toward their side of it.", competency: 'communication', rationale: "Redirecting toward the other sections' communication, rather than engaging with the feedback about your own, reads as deflecting rather than seeking to actually understand it." },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: "When feedback is genuinely surprising, seek the specific example behind it before accepting or disputing it - understanding precedes either agreeing or pushing back.",
  },
  {
    id: 'sjt-dissent-01', chapter: CH, concepts: RESPECTFUL_DISSENT, band: 3,
    situation: 'Your supervisor announces a new procedure for your section that you believe, based on direct experience with a similar approach at a previous assignment, has a specific flaw that will cause real problems once it is implemented. Your supervisor seems confident in the decision and has already begun rolling it out.',
    actions: [
      { text: 'Request a brief private conversation with your supervisor to explain your specific concern and the experience it is based on, then support whatever they decide.', competency: 'communication', rationale: "Raising a genuine, experience-based concern directly and privately gives your supervisor the chance to actually weigh it, while still respecting that the decision is ultimately theirs to make." },
      { text: 'Say nothing, since the decision has already been made and is not really yours to question.', competency: 'communication', rationale: "Staying silent about a specific, experience-based concern denies your supervisor information they may not have, purely because the decision was already announced." },
      { text: "Raise your concern loudly and publicly during the announcement meeting, in front of the rest of the section.", competency: 'communication', rationale: "Airing a specific concern about a decision publicly, in front of the team, is more confrontational than necessary and puts your supervisor in a defensive position rather than an open one." },
      { text: 'Comply with the new procedure at first, but quietly work around the parts you disagree with in practice.', competency: 'communication', rationale: 'Working around a decision quietly, rather than raising the concern directly, means the actual flaw never gets surfaced to anyone who could address it.' },
      { text: "Voice your concern to several coworkers to gauge whether they agree with you, before deciding whether to say anything to your supervisor.", competency: 'communication', rationale: "Building informal consensus among coworkers first, rather than raising the concern directly and promptly, delays getting the concern to the person who can actually act on it." },
    ],
    mostEffective: 0, leastEffective: 3,
    tell: 'Raise a genuine concern to a superior directly, privately, and with your reasoning - then support the decision once it is made, rather than staying silent, being insubordinate, or quietly working around it.',
  },
  {
    id: 'sjt-escalate-01', chapter: CH, concepts: PROPER_ESCALATION, band: 3,
    situation: 'You notice that a specific process in your section seems to be causing a recurring problem, and you have a strong suspicion about which step is the actual cause, but you are not certain and do not have direct authority to change the process yourself.',
    actions: [
      { text: 'Bring your specific observation and suspicion, clearly labeled as such, to the person who owns the process, and let them investigate further.', competency: 'communication', rationale: "Framing it honestly as an observation and a suspicion, rather than a certainty, gives the person who can actually act on it real information without overstating your own confidence." },
      { text: 'Change the step yourself without asking anyone, since you are fairly confident it is the actual cause.', competency: 'leadership', rationale: "Changing a process you don't have authority over, based on a suspicion rather than confirmed cause, oversteps your role even if your instinct turns out to be right." },
      { text: 'Say nothing about it, since you are not certain and do not want to raise something that might turn out to be wrong.', competency: 'communication', rationale: "Withholding a specific, potentially useful observation because you aren't certain denies the process owner information they may not otherwise have." },
      { text: "Mention your suspicion to several coworkers to see if they've noticed the same pattern, rather than raising it with the process owner.", competency: 'communication', rationale: "Discussing the suspicion informally with coworkers, rather than routing it to the person who can actually investigate and act on it, delays getting it to where it matters." },
      { text: "Report the issue as a confirmed cause, rather than a suspicion, to make sure it gets taken seriously.", competency: 'communication', rationale: 'Overstating an unconfirmed suspicion as a confirmed cause risks the process owner acting on faulty certainty rather than appropriately investigating first.' },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: 'Escalate an observation to the person who can actually act on it, honestly framed as what it actually is - never act on it yourself without authority, sit on it, or overstate your certainty.',
  },

  {
    id: 'sjt-dissent-02', chapter: CH, concepts: RESPECTFUL_DISSENT, band: 3,
    situation: 'In a planning meeting, your supervisor proposes an approach that most of the room seems to be nodding along with, but you have a specific, concrete concern about a resource constraint the approach does not seem to account for. Speaking up means being the one dissenting voice in an otherwise agreeable room.',
    actions: [
      { text: 'Raise the specific resource concern in the meeting, framed as a question about how the approach accounts for it, rather than a flat objection.', competency: 'communication', rationale: "Raising a concrete, specific concern - framed as a genuine question rather than a confrontation - gets the information into the room while the plan can still be adjusted, without putting anyone on the defensive." },
      { text: "Stay quiet during the meeting since everyone else seems to agree, and mention the concern privately to a coworker afterward instead.", competency: 'communication', rationale: 'Raising a real, specific constraint only after the meeting, to a coworker rather than to the room that could actually act on it, means the plan moves forward without the information it needed.' },
      { text: 'Object strongly and repeatedly in the meeting, pushing back on the whole approach rather than the specific resource issue.', competency: 'communication', rationale: 'Objecting to the whole approach, rather than naming the one specific, concrete constraint, makes the pushback harder to actually address and reads as more combative than the concern warrants.' },
      { text: "Send your supervisor a message after the meeting raising the concern, once the decision has already been finalized and communicated.", competency: 'communication', rationale: 'Waiting until after the decision is finalized to raise a concern that was already clear during the meeting misses the window when it could still have been easily addressed.' },
      { text: "Go along with the room's apparent agreement and decide not to raise the concern at all, assuming someone else will catch it.", competency: 'communication', rationale: 'Assuming someone else will raise a concern only you have actually identified risks it never getting raised at all.' },
    ],
    mostEffective: 0, leastEffective: 4,
    tell: 'Raise a genuine, specific concern while a decision can still be adjusted, framed as a question rather than a confrontation - being the one dissenting voice is not a reason to stay silent when you have real information the room does not.',
  },

  // ============================ BAND 4 ============================
  {
    id: 'sjt-escalate-02', chapter: CH, concepts: PROPER_ESCALATION, band: 4,
    situation: "You believe, based on a pattern you've pieced together over several weeks, that a decision your own supervisor made was based on outdated information that a more senior office already corrected - but your supervisor was not on the distribution list for that correction and does not know it exists. Raising it risks appearing to publicly undermine your supervisor's decision, especially since the decision has already been communicated to the wider section.",
    actions: [
      { text: "Bring the specific correction to your supervisor privately, framed as new information you happened to find, rather than as a critique of their original decision.", competency: 'communication', rationale: "This gets the actual, missing information to your supervisor directly and privately, framed around the information itself rather than around blame for a decision made without it." },
      { text: 'Say nothing, since raising it risks appearing to undermine a decision that has already been communicated to the section.', competency: 'communication', rationale: 'Withholding a specific correction your supervisor genuinely does not have, purely to avoid an uncomfortable conversation, lets a decision based on outdated information stand uncorrected.' },
      { text: "Raise the discrepancy in front of the wider section, since they were the ones the original decision was communicated to.", competency: 'communication', rationale: 'Raising a correction to your own supervisor\'s decision in front of the section they announced it to is far more public, and more likely to look like undermining them, than a private conversation would be.' },
      { text: 'Send the correction directly to the more senior office that issued it, asking them to inform your supervisor themselves.', competency: 'communication', rationale: "Routing the correction through a third party, rather than bringing it to your supervisor directly yourself, adds an unnecessary layer and misses the chance for a more direct, respectful conversation." },
      { text: "Mention the discrepancy to a peer to get their opinion on whether it's worth raising at all.", competency: 'communication', rationale: 'Discussing a supervisor\'s decision informally with a peer, rather than bringing the actual correction to the supervisor directly, delays getting the needed information to the person who can act on it.' },
    ],
    mostEffective: 0, leastEffective: 1,
    tell: 'When a superior is missing information through no fault of their own, deliver it directly and privately, framed around the information itself rather than around their original decision - silence protects no one when a decision is actively based on something outdated.',
  },
]);

for (const band of [2, 3, 4]) {
  scenarioTemplates({ chapter: CH, band, idBase: `sjt-05-b${band}`, name: 'Communication' });
}

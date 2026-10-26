// AFROTC knowledge flashcards - mission/values, creeds/oaths/songs, rank structure (the REAL
// Air Force and Space Force enlisted/officer ranks, not the eight cadet grades already drilled by
// rankData.js/RankDrill.jsx), customs/greetings, organizational structure, and acronyms.
//
// Sourced primarily from the AFROTC Detachment 432 (Univ. of Southern Mississippi) Cadet Handbook,
// Spring 2026 - a publicly hosted, current cadet handbook whose "The Air Force / Space Force
// Environment," "Rank & Insignia," "Customs & Courtesies," and "DAF Organizational Structure"
// sections cover exactly this. Cross-checked against RecitationSheet.jsx where the two overlap so
// nothing here contradicts what that page already verified and dated.
//
// Deliberately NOT included: chain-of-command leadership NAMES (SecAF, CSAF, etc.) - those are
// perishable and RecitationSheet.jsx already tracks them with "changed" flags and an "ask your
// cadre" list. Duplicating names here would just be a second place for them to go stale.
//
// The 'admin' subject (added 2026-09-25) exists because Trey's actual Weekly Warrior Knowledge
// Quizzes (Det 855, BYU/UVU) test graded administrative/reporting/uniform-wear policy that the
// Det 432 handbook's topic sections don't cover at all. Verified against AFROTCI 36-2011
// (governing instruction, confirms the 80%-attendance figure independently of Det 432), the live
// Det 432 handbook's own Section 4 "POLICIES" (attendance mechanics, CI/72-hour reporting, HRA
// safety-brief-before-participating, Form 48, grooming, uniform-wear prohibitions), and Det 855's
// own "Uniform Wear for Dummies" guide (GMC/silver-name-tag rule — the one card here that's
// genuinely Det-855-specific rather than generic AFROTC policy).
// ⚠️ Two Week 2 quiz items could NOT be verified from any public source and are deliberately left
// OUT rather than guessed at: (1) the exact "E/E, U/E, U/U, E/U" absence-type taxonomy and which
// one triggers the LOC → MCE progressive-consequence ladder (Det 432's own counseling section
// documents a real progressive ladder - CRIC → cadre formal counseling → CRR - but never ties it
// to those four-letter codes, so which code maps to "the answer" is inference, not a sourced
// fact), and (2) the international-travel cadre-briefing requirement (plausible by elimination and
// by analogy to the AF Form 4392 pre-departure safety brief used for HRA, but not found written
// down anywhere for Det 855 or Det 432). If Trey gets the real wording/answer from cadre or a
// syllabus, add both as real cards - don't backfill a guess.

export const SUBJECTS = [
  { id: 'mission-values', label: 'Mission & Core Values', hint: 'AF + Space Force mission, vision, core functions, core values' },
  { id: 'mottos-creeds', label: 'Creeds, Oaths & Songs', hint: "Airman's Creed, oaths, Honor Code, Code of Conduct, both service songs" },
  { id: 'ranks-officer', label: 'Officer Ranks', hint: 'O-1 through O-10, gold/silver, joint-service traps' },
  { id: 'ranks-enlisted', label: 'Enlisted Ranks', hint: 'E-1 through E-9, NCO tiers, wreaths, Space Force divergence' },
  { id: 'customs', label: 'Customs, Courtesies & Greetings', hint: 'Forms of address, salutes, flag etiquette, reporting scripts' },
  { id: 'org', label: 'Organizational Structure', hint: 'Section through MAJCOM; Space Force Squadron through Field Command' },
  { id: 'admin', label: 'Admin, Reporting & Uniform Policy', hint: 'Attendance %, CI/law-enforcement reporting, HRA, Form 48, uniform-wear rules — graded Warrior Knowledge material' },
  { id: 'acronyms', label: 'Acronyms & Abbreviations', hint: 'Common AFROTC/DAF shorthand' },
];

export const SUBJECT_IDS = SUBJECTS.map((s) => s.id);

// Named subject GROUPS, one click away from the full 8-subject picker. Trey's request
// (2026-09-25): a preset that's "only things like mottos, mission and values, ranks - remove
// customs and acronyms and stuff like that" - i.e. the pure recite-it "Warrior Knowledge" trivia
// (creeds, values, both rank structures), split apart from the procedural/reference subjects
// (how you address people, how the detachment is organized, admin reporting windows, shorthand).
// That's a clean binary split of all 8 subjects, so both halves get a preset rather than just the
// one that was asked for - the complement is one line of code and means the split goes both ways.
export const PRESETS = [
  {
    id: 'core-knowledge',
    label: 'Mottos, Values & Ranks',
    hint: 'Pure recite-it material: mission/values, creeds/oaths/songs, both rank structures. No customs, org, admin, or acronyms.',
    subjects: ['mission-values', 'mottos-creeds', 'ranks-officer', 'ranks-enlisted'],
  },
  {
    id: 'procedures-reference',
    label: 'Customs, Org & Admin',
    hint: 'Everything else: how you address people and report in, org structure, admin/reporting policy, acronyms.',
    subjects: ['customs', 'org', 'admin', 'acronyms'],
  },
];

let n = 0;
const card = (subject, front, back, note) => ({ id: `${subject}-${++n}`, subject, front, back, note });

export const CARDS = [
  // ── Mission & Core Values ──────────────────────────────────────────────
  card('mission-values', 'USAF mission statement', 'To fly, fight, and win… airpower anytime, anywhere.'),
  card('mission-values', 'USAF vision statement', 'The World’s Greatest Air Force — Powered by Airmen, Fueled by Innovation.'),
  card('mission-values', "USAF's core functions", 'Air Superiority; Global Strike; Rapid Global Mobility; Intelligence, Surveillance & Reconnaissance; Command and Control.', 'Per the Det 432 handbook (2026) — doctrine has re-worded core-function lists before, so treat this as the current framing rather than an immutable list.'),
  card('mission-values', 'Space Force mission statement', 'Secure our Nation’s interests in, from, and to space.'),
  card('mission-values', "Space Force's three core functions, with their taglines", 'Space Superiority — "Control the Domain." Global Mission Operations — "Exploit the Domain." Assured Space Access — "Access the Domain."'),
  card('mission-values', 'USAF Core Value #1', 'Integrity First'),
  card('mission-values', 'Define "Integrity First"', 'Doing the right thing, all the time, whether or not anyone is watching — the foundation trust and respect are built on.'),
  card('mission-values', 'USAF Core Value #2', 'Service Before Self'),
  card('mission-values', 'Define "Service Before Self"', 'Holding yourself to a higher standard as a daily commitment — without giving up family, loved ones, or your own beliefs.'),
  card('mission-values', 'USAF Core Value #3', 'Excellence In All We Do'),
  card('mission-values', 'Define "Excellence In All We Do"', 'NOT literal perfection from everyone — a passion for continuously advancing your craft and improving performance.'),
  card('mission-values', "Space Force's four core values, in order", 'Character…Above All; Connection…Toward Unity; Commitment…To Mastery; Courage…To Be Bold.'),
  card('mission-values', 'Space Force Core Value: "Character…Above All" means', 'High ethical standards; act with integrity; stay accountable for your decisions and honor your obligations.'),
  card('mission-values', 'Space Force Core Value: "Connection…Toward Unity" means', 'Stronger together than individually; treat everyone with empathy and respect.'),
  card('mission-values', 'Space Force Core Value: "Commitment…To Mastery" means', 'Mastering yourself, your profession, and your domain.'),
  card('mission-values', 'Space Force Core Value: "Courage…To Be Bold" means', 'Standing up for what’s right; biased toward action; accepting risk when necessary.'),
  card('mission-values', 'What are Space Force members called?', 'Guardians.'),
  card('mission-values', 'The Air Force Honor Code, verbatim', 'We will not lie, steal, or cheat, nor tolerate among us anyone who does.'),

  // ── Creeds, Oaths & Songs ───────────────────────────────────────────────
  card('mottos-creeds', "Airman's Creed — opening two lines", 'I am an American Airman. I am a warrior.'),
  card('mottos-creeds', "Airman's Creed — what follows “I have answered my nation’s call”?", 'I am an American Airman. My mission is to fly, fight, and win.'),
  card('mottos-creeds', "Airman's Creed — the heritage line", 'I am faithful to a proud heritage, a tradition of honor, and a legacy of valor.'),
  card('mottos-creeds', "Airman's Creed — “guardian of freedom” stanza", 'I am an American Airman, guardian of freedom and justice, my nation’s sword and shield, its sentry and avenger. I defend my country with my life.'),
  card('mottos-creeds', "Airman's Creed — the three-word self-description near the end", 'Wingman, leader, warrior.'),
  card('mottos-creeds', "Airman's Creed — the three closing vows", 'I will never leave an Airman behind, I will never falter, and I will not fail.'),
  card('mottos-creeds', 'Oath of Enlistment — whose orders do you swear to obey?', 'The orders of the President of the United States and the orders of the officers appointed over me, according to regulations and the UCMJ.'),
  card('mottos-creeds', 'What phrase may any member omit from either oath?', '"So help me God" — omission is optional.'),
  card('mottos-creeds', 'Oath of Office (commissioning) — the phrase NOT in the enlistment oath', '"…that I take this obligation freely, without any mental reservation or purpose of evasion…"'),
  card('mottos-creeds', 'Who established the Code of Conduct, and how?', 'President Eisenhower, by Executive Order 10631, 17 Aug 1955.'),
  card('mottos-creeds', 'Code of Conduct — Article 1', 'I am an American, fighting in the forces which guard my country and our way of life. I am prepared to give my life in their defense.'),
  card('mottos-creeds', 'Code of Conduct — Article 2', 'I will never surrender of my own free will. If in command, I will never surrender the members of my command while they still have the means to resist.'),
  card('mottos-creeds', 'Code of Conduct — Article 3', 'If I am captured, I will continue to resist by all means available, make every effort to escape and help others escape, and accept neither parole nor special favors.'),
  card('mottos-creeds', 'Code of Conduct — Article 4', 'Keep faith with fellow prisoners; give no information or aid that could harm them; if senior, take command; if not, obey and back up those appointed.'),
  card('mottos-creeds', 'Code of Conduct — Article 5: the four things a POW is required to give', 'Name, rank, service number, and date of birth.'),
  card('mottos-creeds', 'Code of Conduct — Article 6, closing line', 'I will trust in my God and in the United States of America.'),
  card('mottos-creeds', 'Air Force Song — opening line', 'Off we go into the wild blue yonder,'),
  card('mottos-creeds', 'Air Force Song — closing line', 'Nothing’ll stop the U.S. Air Force!'),
  card('mottos-creeds', 'Space Force Song — opening line', 'We’re the mighty watchful eye,'),
  card('mottos-creeds', 'Space Force Song — how it describes Guardians on duty', 'The invisible front line, warfighters brave and true.'),
  card('mottos-creeds', 'Space Force Song — closing line', 'We’re the Space Force from on high.'),

  // ── Officer Ranks ───────────────────────────────────────────────────────
  card('ranks-officer', 'O-1', 'Second Lieutenant (2d Lt) — one GOLD bar.'),
  card('ranks-officer', 'O-2', 'First Lieutenant (1st Lt) — one SILVER bar.'),
  card('ranks-officer', 'O-3', 'Captain (Capt) — two silver bars.'),
  card('ranks-officer', 'O-4', 'Major (Maj) — one GOLD oak leaf.'),
  card('ranks-officer', 'O-5', 'Lieutenant Colonel (Lt Col) — one SILVER oak leaf.'),
  card('ranks-officer', 'O-6', 'Colonel (Col) — silver eagle.'),
  card('ranks-officer', 'O-7', 'Brigadier General (Brig Gen) — 1 silver star.'),
  card('ranks-officer', 'O-8', 'Major General (Maj Gen) — 2 silver stars.'),
  card('ranks-officer', 'O-9', 'Lieutenant General (Lt Gen) — 3 silver stars.'),
  card('ranks-officer', 'O-10', 'General (Gen) — 4 silver stars.'),
  card('ranks-officer', 'The gold/silver rule across company & field grade', 'Within each pair, gold is junior and silver is senior: 2d Lt (gold) < 1st Lt (silver); Maj (gold) < Lt Col (silver).'),
  card('ranks-officer', 'Is there a gold eagle or gold star anywhere in Air Force insignia?', 'No — the Colonel’s eagle and every general’s stars are always silver.'),
  card('ranks-officer', 'How do you verbally address a Lieutenant Colonel?', '"Colonel" — not "Lieutenant Colonel."'),
  card('ranks-officer', 'How do you verbally address both lieutenant grades?', '"Lieutenant," for both 2d Lt and 1st Lt.'),
  card('ranks-officer', 'How do you verbally address all four general grades?', '"General," regardless of star count.'),
  card('ranks-officer', 'Navy O-6, and the trap it sets', 'Captain (CAPT) — the same TITLE as an Air Force O-3, but three grades senior to it. The #1 cross-service mix-up.'),
  card('ranks-officer', 'Navy O-3', 'Lieutenant (LT) — equivalent to an Air Force Captain, not an AF Lieutenant.'),
  card('ranks-officer', 'Navy O-1', 'Ensign (ENS) — not "Second Lieutenant."'),
  card('ranks-officer', 'Navy O-7 vs O-8 — same title, how do you tell them apart?', 'Both are "Rear Admiral." Lower Half (RDML) = 1 star = O-7; Upper Half (RADM) = 2 stars = O-8.'),
  card('ranks-officer', "Coast Guard officer ranks, relative to the Navy's", 'Identical to the Navy’s. Navy and Coast Guard flag officers are Admirals, never Generals.'),
  card('ranks-officer', "What stays constant across all six services, O-1 through O-10?", 'The metal collar devices — bars, oak leaves, eagle, stars are the same insignia everywhere. Only the spoken titles change by service.'),
  card('ranks-officer', "Space Force officer titles, relative to the Air Force's", 'Identical, O-1 through O-10.'),

  // ── Enlisted Ranks ──────────────────────────────────────────────────────
  card('ranks-enlisted', 'E-1', 'Airman Basic (AB) — no insignia.'),
  card('ranks-enlisted', 'E-2', 'Airman (Amn) — 1 stripe.'),
  card('ranks-enlisted', 'E-3', 'Airman First Class (A1C) — 2 stripes.'),
  card('ranks-enlisted', 'E-4', 'Senior Airman (SrA) — 3 stripes. NOT an NCO.'),
  card('ranks-enlisted', 'E-5', 'Staff Sergeant (SSgt) — the first NCO grade. 3 upper chevrons + 1 rocker.'),
  card('ranks-enlisted', 'E-6', 'Technical Sergeant (TSgt) — 3 upper chevrons + 2 rockers.'),
  card('ranks-enlisted', 'E-7', 'Master Sergeant (MSgt) — the first Senior NCO (SNCO) grade. 3 upper + 3 rockers.'),
  card('ranks-enlisted', 'E-8', 'Senior Master Sergeant (SMSgt) — 4 upper chevrons + 3 rockers.'),
  card('ranks-enlisted', 'E-9', 'Chief Master Sergeant (CMSgt) — 5 upper chevrons + 3 rockers.'),
  card('ranks-enlisted', 'The shortcut linking pay grade to total stripe count', 'Total stripes = the pay-grade number minus 1 (e.g., E-6 → 5 stripes).'),
  card('ranks-enlisted', 'Do regular SMSgt (E-8) or CMSgt (E-9) insignia have a wreath?', 'No — neither has a wreath. A laurel wreath at E-8/E-9 is an Army, Marine Corps, and Navy convention, not an Air Force one.'),
  card('ranks-enlisted', 'Which single Air Force enlisted insignia DOES carry a wreath?', 'CMSAF (Chief Master Sergeant of the Air Force) — a wreath encircles the star, plus the Great Seal and two stars above.'),
  card('ranks-enlisted', 'First Sergeant insignia — what replaces the star?', 'A diamond. It’s a duty position, not a rank, and can be held at E-7, E-8, or E-9.'),
  card('ranks-enlisted', 'Command Chief (E-9) insignia', 'A standard CMSgt chevron plus one extra star in the upper field.'),
  card('ranks-enlisted', 'Space Force E-1 through E-4 titles', 'Specialist 1, 2, 3, 4 — not Airman / A1C.'),
  card('ranks-enlisted', 'The one enlisted grade where USAF and USSF titles diverge at NCO level', 'E-5: USAF = Staff Sergeant; USSF = Sergeant. There is no USSF "Staff Sergeant."'),
  card('ranks-enlisted', 'USAF vs. USSF enlisted titles at E-6 and above', 'Identical: Technical, Master, Senior Master, and Chief Master Sergeant.'),
  card('ranks-enlisted', 'Which Army enlisted grade is the first NCO grade?', 'Sergeant (E-5) — the same grade level where the Air Force’s first NCO (Staff Sergeant) appears.'),
  card('ranks-enlisted', 'Which Marine Corps enlisted grade is the first NCO grade?', 'Corporal (E-4) — one grade earlier than the Air Force, where E-4 (Senior Airman) is NOT an NCO.'),
  card('ranks-enlisted', "What is the Navy's term for 'NCO,' and where does it start?", 'Petty Officer — the first NCO-equivalent grade is Petty Officer Third Class (E-4).'),
  card('ranks-enlisted', 'What is the single highest enlisted grade/position in the Air Force?', 'Chief Master Sergeant of the Air Force (CMSAF) — a unique, one-of-a-kind position senior to a regular E-9/CMSgt, not just another Chief Master Sergeant.'),

  // ── Customs, Courtesies & Greetings ─────────────────────────────────────
  card('customs', 'How do cadets address each other?', '"Cadet" + Last Name (e.g., "Cadet Eagle").'),
  card('customs', 'How do cadets address cadre?', 'Rank + Last Name, or "Sir" / "Ma’am."'),
  card('customs', 'The seven basic responses — list all', 'Yes, Sir/Ma’am · No, Sir/Ma’am · No excuse, Sir/Ma’am · Sir/Ma’am, may I make a statement? · Sir/Ma’am, may I ask a question? · Sir/Ma’am, I do not understand. · Sir/Ma’am, I do not know.'),
  card('customs', 'Place of honor — which side?', 'Always the right. A junior walks, sits, or rides on the senior’s LEFT.'),
  card('customs', 'Boarding vs. exiting a vehicle — who goes when?', 'The senior boards LAST and exits FIRST.'),
  card('customs', 'When must a cadet stand?', 'When addressed by an officer, NCO, or senior cadet while seated; and when a cadre member enters or exits the room.'),
  card('customs', 'Who always initiates a salute — senior or junior?', 'The junior member, always. (Exception: when a unit commander gives an official report to an adjutant who might be junior.) The one saluted always returns it unless physically unable — incapacity, or the right hand isn’t free (e.g., carrying packages).'),
  card('customs', 'When do you render a hand salute in uniform?', 'Outdoors, in uniform, when you encounter or are encountered by a commissioned officer. NOT indoors under normal circumstances (reporting-in and specific ceremonies are the documented exceptions above), and NOT in civilian clothes — those situations call for standing at attention / hand-over-heart instead.'),
  card('customs', 'As a cadet, whom must you salute?', 'Any commissioned or warrant officer of the Army, Navy, Air Force, Marine Corps, or Coast Guard, plus commissioned officers of friendly foreign countries — AND all senior-ranking cadet officers in Air Force ROTC. If you can’t identify someone’s rank or remember if they rate a salute: "When in doubt, salute."', "Det 855's own handbook, Saluting Procedures p.38."),
  card('customs', 'Reporting-in script when you were ordered to report', '"Sir/Ma’am, Cadet [Last Name] reports as ordered."'),
  card('customs', 'Reporting-in script on your own initiative', '"Sir/Ma’am, Cadet [Last Name] reports [to ask a question / make a statement]."'),
  card('customs', 'Steps of a single cadet formally reporting in, start to finish', 'Center on the door/cubicle, knock once → on order, enter, close the door if you opened it, march the most direct route to the individual, execute a crisp facing movement, center 2 paces away → salute (if reporting to an officer or POC) and state "Sir/Ma’am, Cadet [Last Name] reports as ordered" → hold the salute until it’s returned, then stay at attention until told otherwise → at the end, ask "Will that be all, Sir/Ma’am?" — if so, step back one pace, salute (if officer/POC), render the greeting of the day, face out, and take the most direct route out.', "Det 855's own handbook, Formal Reporting-In Procedures p.39 — noticeably more precise than the generic version this subject otherwise draws from."),
  card('customs', 'How does reporting in change when MULTIPLE cadets report together?', 'One selected cadet knocks and, once ordered in, leads the group to center two paces away — with the selected cadet standing on the RIGHT of the formation — salutes if reporting to an officer/POC, and reports on behalf of everyone: "Sir/Ma’am, Cadets [last names] report as ordered."', "Det 855's own handbook, Formal Reporting-In Procedures p.39."),
  card('customs', 'Front-office entrance procedure', 'Knock once and state loudly, "Cadet entering the area." Wait for acknowledgement; if none comes, repeat it louder.'),
  card('customs', 'Salute timing when the flag passes in a parade/procession', 'Salute 6 paces before the flag passes you; hold the salute until it has passed 6 paces beyond your position.'),
  card('customs', 'National Anthem indoors, in uniform', 'Face the flag or the music; stand at attention through the last note — no salute.'),
  card('customs', 'National Anthem outdoors, in uniform', 'Face the flag or the music; stand at attention and salute from the first note through the last.'),
  card('customs', 'National Anthem, in civilian clothes', 'Stand at attention; right hand over the heart (or salute, if outdoors).'),
  card('customs', 'What does Reveille signal, and what do you do?', 'The start of the official duty day. Stand at attention and salute the flag once the anthem plays.'),
  card('customs', 'What does Retreat signal?', 'The end of the official duty day, and pays respect to the flag as it is lowered.'),
  card('customs', 'When is a flag on a stationary flagstaff saluted?', 'Only during reveille, retreat, or a special ceremony.'),
  card('customs', 'Pledge of Allegiance, in uniform and outdoors', 'Stand at attention, face the flag, remain silent, and salute.'),
  card('customs', 'Pledge of Allegiance, in uniform and indoors', 'Stand at attention, face the flag, remain silent — reciting it is optional if the room is mostly civilians in civilian attire.'),
  card('customs', 'Minimum number of people needed to ceremonially fold the flag', 'Two.'),
  card('customs', 'The three-step method for receiving an award', 'Shake (the presenter’s hand, right hand) → Take (the award, left hand) → Salute.'),

  // ── Organizational Structure ────────────────────────────────────────────
  card('org', 'Air Force organizational echelons, smallest to largest', 'Section/Element → Flight → Squadron → Group → Wing → Numbered Air Force (NAF) → MAJCOM → Headquarters Air Force.'),
  card('org', 'Who commands a Squadron?', 'A Field Grade Officer — a Major or a Lieutenant Colonel.'),
  card('org', 'What echelon is an AFROTC detachment equivalent to?', 'A squadron.'),
  card('org', 'Who commands a Group?', 'A Colonel.'),
  card('org', 'Who commands a Wing?', 'A Colonel or a Brigadier General.'),
  card('org', 'The two types of Wings', 'Composite (operates more than one aircraft type, often self-contained for quick intervention) and Objective (organized around an operational, air base, or specialized mission).'),
  card('org', 'Who commands a Numbered Air Force (NAF)?', 'A Major General or a Lieutenant General.'),
  card('org', 'Who commands a MAJCOM?', 'A (four-star) General.'),
  card('org', 'The two ways MAJCOMs are organized', 'By mission (e.g., Global Strike Command) or by region outside the continental U.S. (e.g., Pacific Air Forces).'),
  card('org', 'Institutional vs. Service Component MAJCOMs — the difference', 'Institutional MAJCOMs organize, train, and equip Airmen (e.g., AETC, ACC). Service Component MAJCOMs prepare Airmen to fight in a combatant command’s area of responsibility (e.g., AFSOC, AMC).'),
  card('org', 'Space Force organizational echelons, smallest to largest', 'Squadron → Delta → Field Command → Headquarters.'),
  card('org', 'The Space Force’s three Field Commands', 'Space Operations Command (SpOC), Space Systems Command (SSC), Space Training and Readiness Command (STARCOM).'),
  card('org', 'What does Space Operations Command (SpOC) do?', 'Generates, presents, and sustains space warfighting capability for Combatant Commanders.'),
  card('org', 'What does Space Systems Command (SSC) do?', 'Develops, acquires, equips, fields, and sustains space capabilities.'),
  card('org', 'What does Space Training and Readiness Command (STARCOM) do?', 'Increases Guardians’ readiness through education, training, doctrine, and test.'),
  card('org', 'Who leads the Space Force at the headquarters level?', 'The Chief of Space Operations — a four-star general who reports to the Secretary of the Air Force.'),
  card('org', 'The Department of the Air Force is to the Space Force as the Department of the Navy is to…', 'The Marine Corps — one department containing two distinct services.'),
  card('org', 'What is a "cadre," in AFROTC terms?', 'A small group of people specially trained for a purpose — the active-duty staff running a detachment (Commander, Operations Officer, Recruiting Officer, etc.).'),
  card('org', 'Chain of command from the President down to the Air Force, in order', 'President → Secretary of Defense → Secretary of the Air Force → Chief of Staff of the Air Force (CSAF).', 'Structural order only — the NAMES currently holding these offices are tracked separately in the Recitation Sheet, since they change and this file deliberately excludes them.'),

  // ── Admin, Reporting & Uniform Policy ─────────────────────────────────────
  card('admin', 'Minimum attendance rate to pass AS Class, LLAB, and PT', '80% — AFROTCI 36-2011, para 9.9.1. 79% or below in any one of the three is an automatic failure and removal from the program.'),
  card('admin', 'How does an APPROVED excused absence affect your attendance percentage?', 'It is removed from the denominator entirely, not counted as a "pass." E.g., 20 scheduled PT sessions minus 2 excused absences = 18 opportunities; you still need 80% of THAT (14 of 18). Unexcused absences count against you out of the adjusted total.'),
  card('admin', 'What is a Civil Involvement (CI), and how fast must it be reported to cadre?', 'Any offense, law/ordinance violation, or incident causing adverse contact with civil, military, or school authorities — including a campus-police interaction. New involvements must be reported within 72 hours, even during breaks; changes to an existing CI (up to final disposition) must also be reported within 72 hours.'),
  card('admin', 'Before participating in a high-risk activity (skydiving, scuba diving, etc.), what must a cadet do?', 'Receive a safety brief from the Detachment Safety Officer and read the required safety documentation BEFORE participating — not "notify afterward," and not only if an injury occurs. (Documented on AF Form 4392.)'),
  card('admin', 'What is AFROTC Form 48, and when is it needed?', "A cadet's academic plan, laid out semester-by-semester through commissioning — it shows and communicates your academic plan and expected graduation timeline. An advisor-signed copy must be brought to each term counseling session to re-certify the plan."),
  card('admin', 'Do grooming standards apply only during inspections?', 'No — DAFI 36-2903 grooming standards apply any time you are in uniform, not just at inspections.'),
  card('admin', 'Are non-contracted GMC cadets authorized to wear the silver cadet-officer name tag on Class A service dress?', 'No. The silver name tag is worn by cadet officers (contracted/POC); GMC (non-contracted) cadets do not wear it on service dress or the pullover sweater.', "Det 855's own uniform-wear guide, not the generic Det 432 handbook the rest of this subject leans on."),
  card('admin', 'Name several situations where wearing the Air Force uniform is prohibited', 'Attending/sponsored by an organization the Attorney General has named subversive or violence-advocating; participating in political speeches, protests, picket lines, or rallies; off-duty civilian employment; furthering political or commercial interests; mixing distinctive uniform items (insignia, ribbons, badges) with civilian clothes; and — in OCP/flight duty uniform specifically — eating at off-base restaurants where most diners wear business attire or that operate mainly to serve alcohol.', 'Casual/personal stops (e.g., a fast-food run) that aren’t tied to an AFROTC duty fall outside "authorized wear" (AFROTC duties, official appointments, or approved travel/social functions) by the same logic, but that specific framing wasn’t found verbatim in a Det 855/432 source — confirm with cadre if it comes up worded that way.'),

  // ── Acronyms & Abbreviations ─────────────────────────────────────────────
  card('acronyms', 'AFI', 'Air Force Instruction'),
  card('acronyms', 'DAFI', 'Department of the Air Force Instruction'),
  card('acronyms', 'AFPAM', 'Air Force Pamphlet'),
  card('acronyms', 'AFSC', 'Air Force Specialty Code'),
  card('acronyms', 'DAF', 'Department of the Air Force'),
  card('acronyms', 'DoD', 'Department of Defense'),
  card('acronyms', 'GMC', 'General Military Course — AS100/AS200, the pre-officer cadet years.'),
  card('acronyms', 'POC', 'Professional Officer Course (AS300/AS400) — NOT "point of contact" in this context, though that’s the other common meaning.'),
  card('acronyms', 'AFOQT', 'Air Force Officer Qualification Test'),
  card('acronyms', 'PFA', 'Physical Fitness Assessment'),
  card('acronyms', 'IAW', 'In Accordance With'),
  card('acronyms', 'BLUF', 'Bottom Line Up Front'),
  card('acronyms', 'UOD', 'Uniform of the Day'),
  card('acronyms', 'TDY', 'Temporary Duty'),
  card('acronyms', 'PCS', 'Permanent Change of Station'),
  card('acronyms', 'SecAF', 'Secretary of the Air Force'),
  card('acronyms', 'CSAF', 'Chief of Staff of the Air Force'),
  card('acronyms', 'CJCS', 'Chairman of the Joint Chiefs of Staff'),
  card('acronyms', 'AOR', 'Area of Responsibility'),
  card('acronyms', 'OPSEC', 'Operational Security'),
  card('acronyms', 'SA', 'Situational Awareness'),
  card('acronyms', 'USSF', 'United States Space Force'),
  card('acronyms', 'MAJCOM', 'Major Command'),
];

export const cardsFor = (subjectIds) => CARDS.filter((c) => subjectIds.includes(c.subject));
export const bySubject = (id) => SUBJECTS.find((s) => s.id === id);

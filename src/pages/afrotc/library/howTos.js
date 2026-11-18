// How-to's on /AFROTC: step-by-step procedures, by role, each step tied to where it comes from.
//
// A citation is one of:
//   { pub: '<slug from pubCatalog.js>', para: '4.3.1.1' }   an Air Force paragraph; the library opens on it
//   { pub: '<slug>', page: 3 }                             a page of a document with no paragraph numbers
//   { doc: 'handbook', label: 'Det 855 handbook, p.39' }    another tab on the AFROTC page
//   { teams: 'Flight Charlie, 9 Sep 2026' }                 a Det 855 Teams post (not linkable)
//
// Rules for writing one (Trey, 2026-11-17: "how-to's will be for things simple and complicated, both"):
//   - Det 855's own document wins over the regulation where they differ, and the step says so.
//   - Nothing is invented. If Det 855 has not published how it does something, it goes in `open`, not in a step.
//   - Commands are written exactly as given, in `say`.
//   - The drill paragraphs cite the 2013 AFMAN 36-2203 only because DAFPAM 34-1203 (2022) is not on the site yet.
//     When it is, re-point these citations (the movements did not change; the paragraph numbers may have).

export const HOWTO_LEVELS = [
  { id: 'simple', title: 'Simple', blurb: 'One person, a few steps.' },
  { id: 'middle', title: 'Middle ground', blurb: 'A small team, each role with its own part.' },
  { id: 'complex', title: 'Full procedures', blurb: 'A whole flight, start to finish.' },
];

const AFMAN = 'afman36-2203-2013';
const ORI = 'det855-ori';
const D025 = 'det025-manual';

export const HOWTOS = [
  {
    slug: 'fall-in', level: 'simple', title: 'Fall in a flight',
    summary: 'How a flight forms in line when the flight commander calls “FALL IN.” Each person has a different job depending on where they stand.',
    llab: { pub: 'afrotci36-2011v1', para: '7.3', label: 'LLAB objective 7.3: demonstrate basic drill of the flight' },
    roles: [
      {
        role: 'Flight commander',
        steps: [
          { do: 'Stand where you want the flight to form, facing that spot, and give the command.', say: 'FALL IN!', cite: [{ pub: ORI, page: 1 }, { pub: AFMAN, para: '4.3.1' }] },
          { do: 'A flight forms in at least two and not more than four elements (rows, when in line).', cite: [{ pub: AFMAN, para: '4.3.1' }] },
        ],
      },
      {
        role: 'Guidon bearer (the guide)',
        steps: [
          { do: 'Take a position facing the flight commander and to the commander’s left, so the first element will fall in centered on the commander and three paces from them.', cite: [{ pub: ORI, page: 1 }, { pub: AFMAN, para: '4.3.1.1' }] },
          { do: 'Halt at attention and do an automatic dress right dress, keeping the guidon at the carry.', cite: [{ pub: ORI, page: 1 }] },
          { do: 'When you feel the first element leader on your fingertips, do an automatic ready front. Once in place, do not move: everyone forms on you.', cite: [{ pub: ORI, page: 1 }, { pub: AFMAN, para: '4.3.1.1' }] },
        ],
      },
      {
        role: 'First element leader',
        steps: [
          { do: 'Fall in directly to the left of the guide.', cite: [{ pub: ORI, page: 1 }] },
          { do: 'Once halted, do an automatic dress right dress: turn your head 45 degrees to the right, raise your left arm, and take small choppy steps to fix your position. Det 855 remembers the order as “stop (at attention), pop (up your arm), chop (your feet).”', cite: [{ pub: ORI, page: 1 }] },
        ],
      },
      {
        role: 'Second, third and fourth element leaders',
        steps: [
          { do: 'Fall in behind the first element leader, one behind the other.', cite: [{ pub: ORI, page: 1 }] },
          { do: 'Do an automatic dress right dress but do NOT turn your head. Set a 40-inch distance by eye and line up directly behind the person in front of you.', cite: [{ pub: ORI, page: 1 }, { pub: AFMAN, para: '4.3.1.2' }] },
        ],
      },
      {
        role: 'Everyone else',
        steps: [
          { do: 'Fall into the next open position to the left of the element leaders, filling one row at a time.', cite: [{ pub: ORI, page: 1 }] },
          { do: 'Do an automatic dress right dress to get dress (side to side) and cover (front to back). If you are in the first element, get exact shoulder-to-fingertip contact with the person to your right: that sets the interval for everyone behind you.', cite: [{ pub: ORI, page: 1 }, { pub: AFMAN, para: '4.3.1.3' }] },
          { do: 'When you feel someone on your fingertips, do an automatic ready front and stay at attention. If you are the last person in your row, do not raise your arm at all.', cite: [{ pub: ORI, page: 1 }, { pub: AFMAN, para: '4.4.1.1' }] },
        ],
      },
    ],
    notes: [
      { text: 'Who sets what: the element leaders (the base file) set the distance between rows; the first element sets the interval between people. Everyone else lines up on them.', cite: [{ pub: ORI, page: 1 }] },
      { text: 'Centering: with an even number of elements, the flight centers on the commander counting the guidon bearer; with an odd number, the guidon bearer does not count.', cite: [{ pub: ORI, page: 1 }] },
      { text: 'Squaring off: extra people fill in from the fourth element forward to the first, so the left side of the flight is square.', cite: [{ pub: AFMAN, para: '4.3.1.4' }] },
      { text: 'Det 855’s advice: do not sprint to your spot. “Slow is smooth, smooth is fast.”', cite: [{ pub: ORI, page: 2 }] },
    ],
  },

  {
    slug: 'size-count', level: 'simple', title: 'Size the flight and count off',
    summary: 'After falling in, the flight commander sizes the flight (tallest to the front) and then has it count off so every person has a number.',
    llab: { pub: 'afrotci36-2011v1', para: '7.3', label: 'LLAB objective 7.3: demonstrate basic drill of the flight' },
    roles: [
      {
        role: 'Flight commander',
        steps: [
          { do: 'Face the flight into column.', say: 'Right, FACE!', cite: [{ pub: ORI, page: 2 }] },
          { do: 'Have taller people move forward. The guidon bearer and the element leaders do not move.', say: 'If you are taller than the cadet in front of you, tap and move forward.', cite: [{ pub: ORI, page: 2 }, { pub: AFMAN, para: '4.3.2' }] },
          { do: 'Face the flight to the right again (inverse line) and give the same command. This time there are no exceptions.', say: 'Right, FACE!', cite: [{ pub: ORI, page: 2 }] },
          { do: 'Face the flight back into column and give the command once more (guidon bearer and element leaders excepted). Repeat until everyone is sized.', say: 'Left, FACE!', cite: [{ pub: ORI, page: 2 }, { pub: AFMAN, para: '4.3.2' }] },
          { do: 'While sizing, stand behind the flight (whichever way it faces). While counting off, stand 45 degrees in front of and to the right of the flight, facing it. Det 855 strongly encourages marching over to check each one.', cite: [{ pub: ORI, page: 3 }] },
          { do: 'Count off, twice, then face the flight back into line.', say: 'Count, OFF! … Count, OFF! … Left, FACE!', cite: [{ pub: ORI, page: 3 }] },
        ],
      },
      {
        role: 'Flight member (sizing)',
        steps: [
          { do: 'If you are taller than the person in front of you, tap them on the shoulder with your right hand. You step forward to the right at 45 degrees while they step back to the left at 45 degrees, so you switch places.', cite: [{ pub: ORI, page: 2 }] },
        ],
      },
      {
        role: 'Flight member (counting off)',
        steps: [
          { do: 'On “OFF,” the element leaders say “one” in a normal conversational tone.', cite: [{ pub: ORI, page: 3 }] },
          { do: 'The next file turns head and eyes in unison and says “two,” and so on until every file, full or partial, has a number. Move with snap. The guidon bearer does not count.', cite: [{ pub: ORI, page: 3 }, { pub: AFMAN, para: '4.3.3' }] },
        ],
      },
    ],
    notes: [
      { text: 'Numbering runs right to left in line and front to rear in column, and the element leader is always number one.', cite: [{ pub: AFMAN, para: '4.3.3' }] },
      { text: 'Using the deputy flight commander as an exception during sizing is optional at Det 855, for training purposes.', cite: [{ pub: ORI, page: 2 }] },
    ],
  },

  {
    slug: 'report-in', level: 'simple', title: 'Report in to an officer, and report out',
    summary: 'The formal way to enter an office when you have been told to report, and the way to leave it.',
    llab: { pub: 'afrotci36-2011v1', para: '4.3', label: 'LLAB objective 4.3: practice reporting in and reporting out' },
    roles: [
      {
        role: 'One cadet reporting',
        steps: [
          { do: 'Center yourself on the door or cubicle entrance and knock once, loud enough to be heard in an average-size room. Do not knock if a conversation is already going on inside.', cite: [{ doc: 'handbook', label: 'Det 855 handbook, p.39' }] },
          { do: 'When told to enter, go in, close the door if you opened it, march the most direct route, face the person, and stop two paces away.', cite: [{ doc: 'handbook', label: 'Det 855 handbook, p.39' }] },
          { do: 'Salute if you are reporting to an officer or a POC cadet, and say:', say: 'Sir/Ma’am, Cadet (last name) reports as ordered.', cite: [{ doc: 'handbook', label: 'Det 855 handbook, p.39' }] },
          { do: 'Hold the salute until they drop theirs, then stay at attention until told otherwise. If you came on your own, not because you were told to, leave off “as ordered.”', cite: [{ doc: 'handbook', label: 'Det 855 handbook, p.39' }, { pub: D025, page: 10 }] },
          { do: 'To finish, come to attention and ask the question below. If the person has already said “that will be all,” do not ask it.', say: 'Will that be all, Sir/Ma’am?', cite: [{ doc: 'handbook', label: 'Det 855 handbook, p.39' }, { pub: D025, page: 10 }] },
          { do: 'Step back one pace, salute (officer or POC), give the greeting of the day, face toward the door and leave by the most direct route.', cite: [{ doc: 'handbook', label: 'Det 855 handbook, p.39' }] },
        ],
      },
      {
        role: 'Several cadets reporting together',
        steps: [
          { do: 'One selected cadet knocks, the same way.', cite: [{ doc: 'handbook', label: 'Det 855 handbook, p.39' }] },
          { do: 'Everyone enters, closes the door and stops two paces away, with the selected cadet on the right of the group. Salute if it is an officer or POC. The selected cadet speaks for everyone:', say: 'Sir/Ma’am, Cadets (last names) report as ordered.', cite: [{ doc: 'handbook', label: 'Det 855 handbook, p.39' }] },
        ],
      },
    ],
    open: ['The handbook page for a group stops before the group’s closing steps. Check the physical handbook (p.39) for how a group reports out.'],
  },

  {
    slug: 'room-attention', level: 'simple', title: 'Call a room to attention',
    summary: 'What to do when a senior officer walks into a room you are in.',
    roles: [
      {
        role: 'The first cadet to notice',
        steps: [
          { do: 'Call the room to attention. Everyone stands at attention.', say: 'Room, ATTENTION.', cite: [{ doc: 'handbook', label: 'Det 855 handbook, customs and courtesies' }] },
          { do: 'Stay at attention until the officer says “Carry on” or “As you were.”', cite: [{ doc: 'handbook', label: 'Det 855 handbook, customs and courtesies' }] },
          { do: 'Do not call it again for an officer who is not senior to someone already in the room.', cite: [{ doc: 'handbook', label: 'Det 855 handbook, customs and courtesies' }] },
        ],
      },
    ],
    notes: [
      { text: 'Another detachment (Arizona State, Det 025) has a cadet outside say “Room, STAND BY” and then “Room, ATTENTION,” uses “Area” outdoors, and only calls “STAND BY” (never attention) when the senior person arriving is enlisted. That is their rule, not one Det 855 has published.', cite: [{ pub: D025, page: 12 }] },
    ],
  },

  {
    slug: 'colors-bystander', level: 'simple', title: 'When reveille or retreat sounds and you are not on the detail',
    summary: 'What every cadet does outdoors when the flag goes up or comes down nearby.',
    roles: [
      {
        role: 'In uniform, outdoors',
        steps: [
          { do: 'On the first note of the bugle call (Reveille or Retreat), stop, face the flag (or the music if you cannot see the flag) and stand at parade rest.', cite: [{ pub: AFMAN, para: '7.26.3' }, { doc: 'handbook', label: 'Det 855 handbook, customs and courtesies' }] },
          { do: 'When “To the Color” or the national anthem starts, come to attention and salute. Hold the salute until the last note.', cite: [{ doc: 'handbook', label: 'Det 855 handbook, customs and courtesies' }] },
        ],
      },
      {
        role: 'In civilian clothes',
        steps: [
          { do: 'Stop, face the flag or the music, and stand at attention with your right hand over your heart during “To the Color” or the anthem.', cite: [{ doc: 'handbook', label: 'Det 855 handbook, customs and courtesies' }] },
        ],
      },
      {
        role: 'Driving',
        steps: [
          { do: 'Pull over and stop until the music ends. Do not salute from a vehicle.', cite: [{ doc: 'handbook', label: 'Det 855 handbook, customs and courtesies' }] },
        ],
      },
    ],
  },

  {
    slug: 'reveille', level: 'middle', title: 'Reveille (raising the flag), as each role',
    summary: 'The morning flag detail at Det 855: who does what, from forming up to falling out. Every cadet signs up for at least four reveilles or retreats a semester, and it is a zero-fail event.',
    llab: { pub: 'afrotci36-2011v1', para: '4.10', label: 'LLAB objective 4.10: describe proper procedures for reveille' },
    local: [
      { text: 'Sign up under Teams → Announcements 2 Sign-ups → Files → “Reveille and Retreat (FALL 2026).xlsx.” At least four per semester; earliest dates first.', cite: [{ teams: 'Flight Charlie and Announcements 2 Sign-ups, Sep 2026' }] },
      { text: 'Spots labelled “POC” are reserved for the upperclassman in charge. A GMC cadet does not sign up in them.', cite: [{ teams: 'GMC Official, Sep 2026' }] },
      { text: 'Uniform: Duty (OCPs, or blue polo and khakis).', cite: [{ teams: 'Flight Charlie, retreat reminder' }] },
      { text: '“The flags must come up and go down every day.” If you cannot make your slot, find a replacement; never leave it empty.', cite: [{ teams: 'Announcements, “Sign up for Reveille & Retreat”' }] },
    ],
    roles: [
      {
        role: 'Detail commander (the senior member, normally the POC)',
        steps: [
          { do: 'Form the detail in a line across from the flagpole, shoulder to shoulder, with yourself in the center holding the flag(s) and the other members on either side.', cite: [{ pub: AFMAN, para: '7.25.2' }, { pub: D025, page: 12 }] },
          { do: 'March the detail to the flagpole without arm swing and halt it one to two paces from the pole.', say: 'Forward, MARCH. … Detail, HALT.', cite: [{ pub: D025, page: 13 }, { pub: AFMAN, para: '7.25.2' }] },
          { do: 'Post the halyard members to the pole.', say: 'Guards, POST.', cite: [{ pub: D025, page: 13 }] },
          { do: 'Attach the flag(s) to the halyard hooks on the leeward side of the pole (the side the wind blows toward). Keep hold of the flag so no part of it touches the ground.', cite: [{ pub: AFMAN, para: '7.25.2' }, { pub: D025, page: 14 }] },
          { do: 'When the flag is clear of your grasp, come to attention and salute; with music, the flag goes up on the first note of the anthem or To the Color.', say: 'Present, ARMS.', cite: [{ pub: AFMAN, para: '7.25.2' }, { pub: AFMAN, para: '7.24.5' }, { pub: D025, page: 14 }] },
          { do: 'On the last note, or once the flag is at the top, drop your salute and order the detail to do the same.', say: 'Order, ARMS.', cite: [{ pub: AFMAN, para: '7.25.3' }, { pub: D025, page: 14 }] },
          { do: 'Recall the halyard members, face about, and march the detail away from the pole without arm swing; halt across from the pole and fall out.', say: 'Guards, POST. … Forward, MARCH.', cite: [{ pub: D025, page: 14 }, { pub: AFMAN, para: '7.25.3' }] },
        ],
      },
      {
        role: 'Halyard members (the two cadets beside the commander)',
        steps: [
          { do: 'On “Guards, POST,” take one pace forward and halt; the left member faces right and the right member faces left, so both face the pole.', cite: [{ pub: D025, page: 13 }] },
          { do: 'Unwrap the halyard (rope) from the cleat and bring the hooks down. Stand facing the staff so you can hoist without tangling the halyard.', cite: [{ pub: D025, page: 13 }, { pub: AFMAN, para: '7.25.2' }] },
          { do: 'On “Present, ARMS,” raise the flag briskly to the top. If it is a half-staff day, raise it to the top first and then lower it slowly to half-staff.', cite: [{ pub: AFMAN, para: '7.24.5' }, { pub: D025, page: 14 }] },
          { do: 'After “Order, ARMS,” secure the halyard to the cleat.', cite: [{ pub: AFMAN, para: '7.25.3' }, { pub: D025, page: 14 }] },
          { do: 'On the second “Guards, POST,” the left member does a right face and the right member a left face, then both take one pace forward while the commander does an about face. The whole detail now faces away from the pole.', cite: [{ pub: D025, page: 14 }] },
        ],
      },
    ],
    notes: [
      { text: 'Air Force standard detail for raising: one NCO (here, the senior cadet) and two Airmen.', cite: [{ pub: AFMAN, para: '7.25.1' }] },
      { text: 'Reveille marks the start of the duty day; the commander sets its time.', cite: [{ pub: AFMAN, para: '7.23.1' }] },
    ],
    open: [
      'Det 855 has not posted its own reveille checklist in any Teams channel I can read (only the sign-up sheet). The commands above are the Air Force paragraphs plus Arizona State’s detachment manual. If cadre or the POC in charge hands out a Det 855 version, save it to Drive and it will replace these.',
      'Whether the BYU flagpole run raises one flag or two (the United States flag and the Air Force flag, as at Arizona State), and whether music is played, is not in anything I can read. Ask the POC on your first slot.',
    ],
  },

  {
    slug: 'retreat', level: 'middle', title: 'Retreat (lowering and folding the flag), as each role',
    summary: 'The evening flag detail at Det 855. Retreat takes four cadets: at Det 855 the detail reports to the ASB flagpole no later than 1715.',
    llab: { pub: 'afrotci36-2011v1', para: '4.9', label: 'LLAB objective 4.9: describe proper procedures for retreat' },
    local: [
      { text: 'Report no later than 1715 at the ASB flagpole, in Duty uniform (OCPs, or blue polo and khakis).', cite: [{ teams: 'Flight Charlie, retreat reminder to four named cadets' }] },
      { text: 'Retreat is a four-cadet detail at Det 855; when one is missing, the flight asks for a volunteer “fourth cadet.”', cite: [{ teams: 'Flight Charlie, “a fourth cadet is needed for this evening’s retreat”' }] },
      { text: 'Sign-ups, the POC-only spots and the zero-fail rule are the same as for reveille.', cite: [{ teams: 'Announcements 2 Sign-ups, Sep 2026' }] },
    ],
    roles: [
      {
        role: 'Detail commander (the senior member, normally the POC)',
        steps: [
          { do: 'Form the detail in a line across from the flagpole with yourself in the center. You start with no flag.', cite: [{ pub: D025, page: 15 }] },
          { do: 'March the detail to the pole without arm swing and halt one to two paces from it.', say: 'Forward, MARCH. … Detail, HALT.', cite: [{ pub: D025, page: 15 }, { pub: D025, page: 16 }] },
          { do: 'Post the halyard members.', say: 'Guards, POST.', cite: [{ pub: D025, page: 16 }] },
          { do: 'When the halyards are ready and the music (To the Color or the anthem) begins, salute. Members not lowering the flag salute too.', say: 'Present, ARMS.', cite: [{ pub: AFMAN, para: '7.28.1' }, { pub: D025, page: 16 }] },
          { do: 'When the flag is low enough to be received and the music has ended, drop the salute.', say: 'Order, ARMS.', cite: [{ pub: AFMAN, para: '7.28.1' }, { pub: D025, page: 16 }] },
          { do: 'Unclip the flag(s) and direct the folding (see “Folding,” below). Then hold the folded flag(s).', cite: [{ pub: D025, page: 17 }, { pub: AFMAN, para: '7.28.2' }] },
          { do: 'Recall the guards, face about, and march the detail away from the pole without arm swing; halt across from the pole and fall out.', say: 'Guards, POST. … Forward, MARCH.', cite: [{ pub: D025, page: 17 }] },
          { do: 'If an officer of the day is present, march the detail to three paces from them, salute and report. (This is the formal ceremony; Det 855 has not said whether it reports to anyone.)', say: 'Sir/Ma’am, the flag is secured.', cite: [{ pub: AFMAN, para: '7.27.11' }] },
        ],
      },
      {
        role: 'Halyard members (two cadets)',
        steps: [
          { do: 'On “Guards, POST,” take one pace forward and halt; left member faces right, right member faces left, so you face the pole.', cite: [{ pub: D025, page: 16 }] },
          { do: 'Unwrap the halyard from the cleat and get ready to lower. Work from the leeward side.', cite: [{ pub: D025, page: 16 }, { pub: AFMAN, para: '7.28.1' }] },
          { do: 'When the music starts, lower the flag slowly and with dignity, timing it so the flag and the music finish together. On a half-staff day, first raise the flag briskly to the top, then lower it.', cite: [{ pub: AFMAN, para: '7.28.1' }, { pub: AFMAN, para: '7.27.8' }, { pub: D025, page: 16 }] },
          { do: 'Never let the flag touch the ground. Help fold it (below), then run the empty hooks to the top and secure the halyard to the cleat.', cite: [{ pub: D025, page: 17 }, { pub: AFMAN, para: '7.28.2' }] },
          { do: 'On the second “Guards, POST,” the left member does a right face and the right member a left face, then both take one pace forward while the commander does an about face. The whole detail now faces away from the pole.', cite: [{ pub: D025, page: 17 }] },
        ],
      },
      {
        role: 'Fourth cadet',
        steps: [
          { do: 'The Air Force standard for lowering the all-purpose flag is an NCO and three Airmen: the members not lowering the flag salute during the music. At Det 855 that is you, until it is time to receive and fold the flag.', cite: [{ pub: AFMAN, para: '7.28.1' }] },
          { do: 'Help receive the flag as it comes down so no part touches the ground, then help fold it.', cite: [{ pub: AFMAN, para: '7.28.1' }, { pub: AFMAN, para: '7.27.10' }] },
        ],
      },
    ],
    notes: [
      { text: 'Folding, as Arizona State’s detachment does it with two flags: the Air Force flag is folded into a square with the right guard while the left guard keeps the halyard and the United States flag off the ground; then the United States flag is folded into a triangle. The commander holds both with arms crossed, the United States flag in front.', cite: [{ pub: D025, page: 17 }] },
      { text: 'During the fold, the senior member stays at attention unless needed to control the flag.', cite: [{ pub: AFMAN, para: '7.27.10' }] },
      { text: 'Retreat marks the end of the duty day and pays respect to the flag; the commander sets its time.', cite: [{ pub: AFMAN, para: '7.26.1' }] },
    ],
    open: [
      'Det 855 has not posted its own retreat checklist where I can read it (Teams has the sign-up sheet and reminders, not the procedure). Which of the four cadets does what at the ASB flagpole is a question for the POC on your first slot. The GMC knowledge quiz for 9 to 14 Nov said to “review customs, courtesies, and reveille & retreat procedures,” so a Det version probably exists.',
      'Folding the United States flag (13 folds into a triangle) is LLAB objective 4.8. The step-by-step fold is in AFPAM 34-1202 / DAFI 90-1201, which are not on the site yet.',
    ],
  },

  {
    slug: 'ori', level: 'complex', title: 'Open Ranks Inspection (ORI), start to finish',
    summary: 'The whole inspection as Det 855 runs it (its 10 July 2025 procedure, built on DAFPAM 34-1203): falling in, sizing, counting off, opening ranks, the inspection, the debrief and closing ranks.',
    llab: { pub: 'afrotci36-2011v1', para: '7.9', label: 'LLAB objective 7.9: demonstrate Open Ranks Inspection (member for P1, commander for P2)' },
    practice: { href: '/flight-drill/index.html', label: 'Practice the drill in the Drill Sim' },
    roles: [
      {
        role: 'Flight commander',
        steps: [
          { phase: '1. Form the flight', do: 'Fall the flight in, size it and count it off.', ref: 'fall-in', cite: [{ pub: ORI, page: 1 }, { pub: ORI, page: 3 }] },
          { phase: '2. Open ranks', do: 'March to a position directly next to the guidon bearer, take six paces forward, then re-center yourself on the flight.', cite: [{ pub: ORI, page: 3 }] },
          { phase: '2. Open ranks', do: 'Open the ranks. Each element steps forward as many steps as there are elements behind it (with four: first element 3, second 2, third 1, fourth stands fast with an automatic dress right dress). Elements end 64 inches apart.', say: 'Open ranks, MARCH!', cite: [{ pub: ORI, page: 3 }, { pub: ORI, page: 4 }, { pub: AFMAN, para: '4.5.1' }] },
          { phase: '3. Align', do: 'Stand to the side of the first element and correct each person by number. There is no command “steady”: never use it.', say: 'Cadet (number), move up / move back.', cite: [{ pub: ORI, page: 4 }] },
          { phase: '3. Align', do: 'To get to the next element: left face, three paces forward, right face, one small step right. Repeat for every element.', cite: [{ pub: ORI, page: 4 }] },
          { phase: '3. Align', do: 'March to one pace to the right and three paces in front of the guidon bearer, left face, and bring the flight to the front.', say: 'Ready, FRONT!', cite: [{ pub: ORI, page: 4 }, { pub: AFMAN, para: '4.5.2' }] },
          { phase: '4. Report to the inspector', do: 'Move one pace forward and right face, so you are directly in front of the guidon bearer. As the inspector approaches, salute (whatever the inspector’s rank) and report.', say: 'Good morning/afternoon/evening Sir/Ma’am, ____ Flight is prepared for inspection.', cite: [{ pub: ORI, page: 4 }, { pub: AFMAN, para: '4.5.3' }] },
          { phase: '4. Report to the inspector', do: 'The inspector inspects you, then says “Good morning, accompany me on this inspection.” Answer:', say: 'Accompany you on this inspection. Yes Sir/Ma’am. Thank you Sir/Ma’am.', cite: [{ pub: ORI, page: 4 }] },
          { phase: '4. Report to the inspector', do: 'Left face and put the rest of the flight at parade rest.', say: 'Second, third, and fourth elements, Parade, REST!', cite: [{ pub: ORI, page: 4 }, { pub: AFMAN, para: '4.5.3' }] },
          { phase: '5. The inspection', do: 'Do the “diagonal three step” automatically: one diagonal step that turns you toward the first element, a second diagonal step, and a final step back to attention. You end directly in front of the first element leader and one pace behind the inspector.', cite: [{ pub: ORI, page: 5 }] },
          { phase: '5. The inspection', do: 'Shadow the inspector, moving when they move, one pace to the right and one pace behind. The inspector checks uniforms and appearance and may ask questions.', cite: [{ pub: ORI, page: 5 }] },
          { phase: '5. The inspection', do: 'The duck walk: on the inspector’s verbal or physical cue, move to the next person in the element with them. The inspector may tell someone to about face to inspect their back.', cite: [{ pub: ORI, page: 5 }, { pub: AFMAN, para: '4.5.3.1' }] },
          { phase: '5. The inspection', do: 'After the last person in an element, or when the inspector says “Cursory” or “To the end,” do a half duck walk straight into a forward march down the element.', cite: [{ pub: ORI, page: 6 }] },
          { phase: '5. The inspection', do: 'The inspector calls “Left flank, MARCH” to reach the next element; you both do it, then an automatic second left flank. Watch for automatic halts: the inspector may stop at any time, with no cue, to inspect the backs of the element in front.', cite: [{ pub: ORI, page: 6 }] },
          { phase: '5. The inspection', do: 'The inspector usually halts at the next element leader; you both right face, which puts you in front of the first two people. Stay one step right of and behind the inspector. Repeat until the whole flight is inspected.', cite: [{ pub: ORI, page: 6 }] },
          { phase: '6. Debrief', do: 'When the inspector moves off, go directly to three paces in front of the guidon bearer, left face, and call the flight to attention.', say: 'Flight, ATTENTION!', cite: [{ pub: ORI, page: 6 }, { pub: AFMAN, para: '4.5.4' }] },
          { phase: '6. Debrief', do: 'When the inspector approaches, greet them and report out, then take their list of discrepancies.', say: 'Sir/Ma’am, ____ Flight has completed the Open Ranks Inspection.', cite: [{ pub: ORI, page: 6 }] },
          { phase: '6. Debrief', do: 'Left face and put the flight at rest (parade rest, but they may talk). Move to the center of the flight and debrief the discrepancies.', say: 'REST!', cite: [{ pub: ORI, page: 6 }] },
          { phase: '7. Close ranks', do: 'Call the flight to attention and close ranks: fourth element 3 steps forward, third 2, second 1, first stands fast. Then bring them to the front and fall them out.', say: 'Flight, ATTENTION. … Close ranks, MARCH! … Ready, FRONT! … FALL OUT!', cite: [{ pub: ORI, page: 7 }, { pub: AFMAN, para: '4.6' }] },
        ],
      },
      {
        role: 'Element leader',
        steps: [
          { do: 'Fall in as an element leader (see “Fall in a flight”), and say “one” when counting off.', ref: 'fall-in', cite: [{ pub: ORI, page: 1 }, { pub: ORI, page: 3 }] },
          { do: 'After the flight commander puts the second to fourth elements at parade rest, it is your job to call your own element to attention as the inspector approaches it, and back to parade rest when the inspector leaves it.', say: '(Number) Element, ATTENTION! … (Number) Element, Parade, REST!', cite: [{ pub: ORI, page: 5 }, { pub: ORI, page: 6 }, { pub: AFMAN, para: '4.5.6' }] },
          { do: 'When giving those commands, pin your head 45 degrees to the left (down the line).', cite: [{ pub: ORI, page: 6 }] },
        ],
      },
      {
        role: 'Guidon bearer',
        steps: [
          { do: 'Form the flight as the guide (see “Fall in a flight”). You do not count off.', ref: 'fall-in', cite: [{ pub: ORI, page: 1 }, { pub: ORI, page: 3 }] },
          { do: 'At every dress right dress, including after opening ranks, hold the guidon at the carry.', cite: [{ pub: ORI, page: 4 }] },
        ],
      },
      {
        role: 'Flight member',
        steps: [
          { do: 'Fall in, size and count off.', ref: 'size-count', cite: [{ pub: ORI, page: 2 }, { pub: ORI, page: 3 }] },
          { do: 'On “Open ranks, MARCH,” take the number of steps for your element, halt, and immediately pop your arm and turn your head for dress right dress. Move up or back when your number is called.', cite: [{ pub: ORI, page: 3 }, { pub: ORI, page: 4 }] },
          { do: 'At attention while being inspected; at parade rest when your element leader calls it. Answer the inspector’s questions at attention. Be ready to about face if the inspector tells you to.', cite: [{ pub: ORI, page: 5 }] },
          { do: 'On “Close ranks, MARCH,” take your element’s steps forward (fourth 3, third 2, second 1, first stands fast).', cite: [{ pub: ORI, page: 7 }] },
        ],
      },
    ],
    notes: [
      { text: 'Recording: the flight commander may take notes as long as they return to attention before giving commands or moving. Det 855 does not use the deputy flight commander for this in a flight ORI (it does in a squadron inspection).', cite: [{ pub: ORI, page: 7 }] },
      { text: 'Det 855’s flight procedure is edited from the squadron inspection figure in DAFPAM 34-1203 (Figure 5.3). Where the Det document and the Air Force paragraph word a movement differently (the Det’s “diagonal three step,” the Air Force’s “half left in marching without arm swing”), do it the Det’s way: that is what you are graded on.', cite: [{ pub: ORI, page: 5 }, { pub: AFMAN, para: '4.5.3' }] },
    ],
    open: [
      'Teams mentions an ODC ORI OPORD and “ORI instructions” posted as files. The capture tool reads messages, not attachments; if those differ from the 10 July 2025 procedure, save them to Drive and they will be added.',
    ],
  },
];

export const howToBySlug = (slug) => HOWTOS.find((h) => h.slug === slug);

/** Every step and note as plain text, for the page's search box. */
export function howToSearchText(h) {
  const parts = [h.summary];
  for (const r of h.roles) for (const s of r.steps) parts.push(`${r.role}: ${s.do}${s.say ? ` “${s.say}”` : ''}`);
  for (const n of [...(h.local ?? []), ...(h.notes ?? [])]) parts.push(n.text);
  for (const o of h.open ?? []) parts.push(o);
  return parts.join('\n');
}

/* Flight Drill Sim: the practice scripts. Each step is one thing the flight commander does:
     cmd   - give a command (or say a report) from the panel
     fc    - move / face yourself; target(S) is the regulation spot, computed from where the flight is NOW
     align - fix the misaligned cadets of one element with "Cadet ___, move up/back"
     insp  - something the inspector (or the element leaders) do; the tool plays it for you
   Wording follows the source each script names, quoted where it is short. */
(function (root) {
  'use strict';
  const E = root.DrillEngine;
  const { C, dir, add, sub, mul, dot, nh, hdg } = E;

  const frame = (S) => { const A = E.analyze(S); return { A, f: A.f, r: A.right, h: S.flight.h }; };
  const guide = (S) => E.guideSlot(S) || E.slot(S, 0, 0);
  const PACE = C.PACE;

  // The regulation post in front of the flight, n paces out, centered per Det ORI p.1.
  function frontCenter(S, paces) {
    const { f, h } = frame(S);
    const front = E.analyze(S).type === 'invline' ? S.flight.elements.length - 1 : 0;
    const p = add(E.slot(S, front, E.centerFile(S)), mul(f, paces * PACE));
    return { x: p.x, y: p.y, h: nh(h + 180) };
  }
  // Behind the flight, centered on its rear rank, facing the way the flight faces (Det ORI p.3: sizing).
  function behind(S) {
    const { f, h } = frame(S);
    const rear = S.flight.elements.map((ids) => ids.map((id) => S.ppl[id])).flat()
      .sort((a, b) => dot(a, f) - dot(b, f));
    const minLon = dot(rear[0], f);
    const rank = rear.filter((p) => dot(p, f) < minLon + 6);
    const c = { x: rank.reduce((s, p) => s + p.x, 0) / rank.length, y: rank.reduce((s, p) => s + p.y, 0) / rank.length };
    const p = sub(c, mul(f, 3 * PACE));
    return { x: p.x, y: p.y, h };
  }
  // Count off: 45° in front of and to the right of the flight, facing it (Det ORI p.3).
  function countOffSpot(S) {
    const { f, r } = frame(S);
    const ids = S.flight.elements.map((e) => e[0]).map((id) => S.ppl[id]).sort((a, b) => dot(b, r) - dot(a, r));
    const corner = S.flight.guide ? S.ppl[S.flight.guide] : ids[0];
    const u = E.mul(add(f, r), Math.SQRT1_2);
    const p = add(corner, mul(u, 3 * PACE));
    return { x: p.x, y: p.y, h: hdg(mul(u, -1)) };
  }
  // One pace beyond the right flank, in prolongation of a rank, facing down the line (¶4.4.1.4; Det ORI p.4).
  function flankOf(S, el) {
    const { r } = frame(S);
    const g = S.flight.grid;
    const p = add(E.slot(S, el, 0), mul(r, (S.flight.guide ? g.su : 0) + PACE));
    return { x: p.x, y: p.y, h: hdg(mul(r, -1)) };
  }
  function shadowSpot(S) {
    const I = S.ppl.insp;
    const p = add(I, add(mul(dir(I.h + 90), PACE), mul(dir(I.h + 180), PACE)));
    return { x: p.x, y: p.y, h: I.h };
  }

  const at = (fn, tol) => (S) => ({ ...fn(S), tol: tol || PACE });

  function ori(S) {
    const En = S.flight.elements.length;
    const K = root.DrillCommands;
    const rest = K.label(K.byId.elemsParade, S).text;
    const steps = [
      { sec: 'Falling in', kind: 'cmd', cmd: 'fallIn', text: 'Face where you want the flight, then call FALL IN. The guidon bearer posts on your left so the first element is centered on you, three paces away.', quote: 'On this command, the Guidon Bearer takes a position facing the Flight Commander (FLT/CC), and to the FLT/CCs left...' },
      { sec: 'Sizing the flight', kind: 'cmd', cmd: 'rightFace', text: 'Face the flight into column.', quote: 'Command: "Right, FACE!" (Column formation)' },
      { sec: 'Sizing the flight', kind: 'fc', target: at(behind), text: 'March to a position behind the flight (whichever direction they are facing).', quote: 'FLT/CC will be in position behind the flight (whichever direction they are facing)' },
      { sec: 'Sizing the flight', kind: 'cmd', cmd: 'sizing', text: 'Size the column. Guidon bearer and element leaders stand fast.', quote: '"If you are taller than the airman/trainee/cadet in front of you, tap and move forward."' },
      { sec: 'Sizing the flight', kind: 'cmd', cmd: 'rightFace', text: 'Face them into inverse line.', quote: 'Command: "Right, FACE!" (Inverse line)' },
      { sec: 'Sizing the flight', kind: 'fc', target: at(behind), text: 'Behind the flight again: they now face the rear, so behind is back on your original side.' },
      { sec: 'Sizing the flight', kind: 'cmd', cmd: 'sizing', text: 'Size the inverse line. No exceptions.', quote: 'Exceptions: No exceptions' },
      { sec: 'Sizing the flight', kind: 'cmd', cmd: 'leftFace', text: 'Back into column.', quote: 'Command: "Left, FACE!" (Column formation)' },
      { sec: 'Sizing the flight', kind: 'fc', target: at(behind), text: 'Behind the flight once more.' },
      { sec: 'Sizing the flight', kind: 'cmd', cmd: 'sizing', text: 'Size the column a final time. Guidon bearer and element leaders excepted.' },
      { sec: 'Counting off', kind: 'fc', target: at(countOffSpot), text: 'Move 45 degrees in front of and to the right of the flight, facing them.', quote: 'FLT/CC will be 45 degrees in front of and to the right of the flight, facing them (while they are in column formation).' },
      { sec: 'Counting off', kind: 'cmd', cmd: 'countOff', text: 'Count them off. Element leaders say ONE; each rank calls its number.', quote: 'Command: "Count, OFF!"' },
      { sec: 'Counting off', kind: 'cmd', cmd: 'countOff', text: 'Count off a second time.', quote: 'Command: "Count, OFF!" (Second time)' },
      { sec: 'Counting off', kind: 'cmd', cmd: 'leftFace', text: 'Face them back into line.', quote: 'Command: "Left, FACE!"' },
      {
        sec: 'Opening the ranks', kind: 'fc', target: at((s) => frontCenter(s, 6)),
        route: (s) => { const { f, r } = frame(s); const g = guide(s); const a = add(g, mul(r, PACE)); const b = add(a, mul(f, 6 * PACE)); const c = frontCenter(s, 6); return [a, b, c]; },
        text: 'March to a position directly next to the guidon bearer, take six paces forward, then re-center on the flight, facing it.', quote: 'The FLT/CC will march to a position directly next to the guidon bearer, take six paces forward, and then re-center themselves with the flight.',
      },
      { sec: 'Opening the ranks', kind: 'cmd', cmd: 'openRanks', text: 'Open the ranks. Each element steps forward once for every element behind it, then dresses right automatically.', quote: 'Elements take as many steps forward as there are elements behind you.' },
    ];
    for (let el = 0; el < En; el++) {
      steps.push({
        sec: 'Aligning', kind: 'fc', target: at((s) => flankOf(s, el)),
        text: el === 0
          ? 'Verify the first element: stand at its right flank, one pace beyond the guidon bearer, looking down the line.'
          : `Left face, three paces forward, right face, one small step right: in line with the ${E.ORD[el].toLowerCase()} element, looking down it.`,
        quote: el === 0 ? 'FLT/CC will stand to the side of the first element and correct the positioning of those cadets.' : 'The FLT/CC will then perform a left face, take three paces forward, perform a right face, and then take one small step to the right...',
      });
      steps.push({ sec: 'Aligning', kind: 'align', el, text: `Correct the ${E.ORD[el].toLowerCase()} element: click each cadet who is out of line and call "Cadet ___, move up" or "move back". There is no command "steady".`, quote: 'Command: "Cadet/Trainee/Airman (number) move up/back". Note: There is no command "steady" and it will NOT be used.' });
    }
    steps.push(
      { sec: 'Aligning', kind: 'fc', target: at((s) => { const { f, r } = frame(s); const p = add(guide(s), add(mul(r, PACE), mul(f, 3 * PACE))); return { x: p.x, y: p.y, h: hdg(mul(r, -1)) }; }), text: 'March to one pace right of and three paces in front of the guidon bearer, then left face.', quote: 'FLT/CC will march to a position one pace to the right and three paces in front of the guidon bearer, perform a "left face", and call...' },
      { sec: 'Aligning', kind: 'cmd', cmd: 'readyFront', text: 'Bring the flight to the front.', quote: 'Command: "Ready, FRONT!"' },
      { sec: 'Inspection', kind: 'fc', target: at((s) => { const { f, h } = frame(s); const p = add(guide(s), mul(f, 3 * PACE)); return { x: p.x, y: p.y, h }; }), text: 'One pace forward and right face: directly in front of the guidon bearer, facing out toward the inspector.', quote: 'FLT/CC moves one pace forward and performs a right face. Positioning themselves DIRECTLY in front of the Guidon Bearer.' },
      { sec: 'Inspection', kind: 'insp', cmd: 'inspApproach', text: 'The inspector approaches.' },
      { sec: 'Inspection', kind: 'cmd', cmd: 'reportIn', text: 'Salute and report. Salute no matter the inspector\'s rank.', quote: '"Good Morning/Afternoon/Evening Sir/Ma\'am, ____ Flight is prepared for inspection."' },
      { sec: 'Inspection', kind: 'fc', target: at((s) => { const { f, r } = frame(s); const p = add(guide(s), mul(f, 3 * PACE)); return { x: p.x, y: p.y, h: hdg(mul(r, -1)) }; }), text: 'Left face, down the line.', quote: 'FLT/CC will perform a "left face" and call...' },
      { sec: 'Inspection', kind: 'cmd', cmd: 'elemsParade', text: `Put every element but the first at parade rest: "${rest}!"`, quote: 'Command: "Second, third, and fourth elements, Parade, REST!"' },
      { sec: 'Inspection', kind: 'insp', cmd: 'inspBegin', text: 'The inspector starts with the guidon bearer.' },
      { sec: 'Inspection', kind: 'fc', target: at(shadowSpot), text: 'Diagonal three step: in front of the first element leader, one pace to the inspector\'s right and one pace behind. Hold this shadow position.', quote: 'FLT/CC will automatically perform the "diagonal three step" to position themselves directly in front of the first Element Leader and one pace behind the Inspector.' },
    );
    for (let el = 0; el < En; el++) {
      const n = S.flight.elements[el].length;
      steps.push({ sec: 'Inspection', kind: 'insp', cmd: 'inspNext', times: n, text: `Duck walk with the inspector down the ${E.ORD[el].toLowerCase()} element, one cadet at a time, holding your shadow.`, quote: 'FLT/CC shadows (moves simultaneously with the) inspector, one pace to the right and one pace behind.' });
      if (el + 1 < En) steps.push({ sec: 'Inspection', kind: 'insp', cmd: 'inspNextElement', text: 'Half duck walk into a forward march, Left Flank, MARCH, then the automatic second Left Flank down the next element; halt at its leader and right face together. Element leaders call their elements up and down.', quote: 'After the first "Left flank" is called an automatic second "Left flank" will be performed by both.' });
    }
    steps.push(
      { sec: 'Debrief', kind: 'insp', cmd: 'inspDepart', text: 'The inspector moves off to a spot of their choosing.' },
      { sec: 'Debrief', kind: 'fc', target: at((s) => { const { f, r } = frame(s); const p = add(guide(s), mul(f, 3 * PACE)); return { x: p.x, y: p.y, h: hdg(mul(r, -1)) }; }), text: 'Go directly three paces in front of the guidon bearer and left face.', quote: 'FLT/CC will go directly three paces in front of the Guidon Bearer and perform a "Left, face" and call...' },
      { sec: 'Debrief', kind: 'cmd', cmd: 'attention', text: 'Call the whole flight to attention.', quote: 'Command: "Flight, ATTENTION!"' },
      { sec: 'Debrief', kind: 'insp', cmd: 'inspDebrief', text: 'The inspector comes to you for the debrief.' },
      { sec: 'Debrief', kind: 'cmd', cmd: 'reportOut', text: 'Greet the inspector and report the inspection complete.', quote: '"Sir/Ma\'am ____ Flight has completed the Open Ranks Inspection".' },
      { sec: 'Debrief', kind: 'insp', cmd: 'inspLeave', text: 'Salute the inspector as they depart.' },
      { sec: 'Debrief', kind: 'fc', target: at((s) => { const { f, h } = frame(s); const p = add(guide(s), mul(f, 3 * PACE)); return { x: p.x, y: p.y, h: nh(h + 180) }; }), text: 'Left face, toward the flight.', quote: 'FLT/CC will now perform a "Left, face".' },
      { sec: 'Debrief', kind: 'cmd', cmd: 'rest', text: 'Rest the flight so they can talk.', quote: 'Command: "REST!" (the flight will stand at the position of "Parade, rest", but be permitted to talk).' },
      { sec: 'Debrief', kind: 'fc', target: at((s) => frontCenter(s, 3), 1.5 * PACE), text: 'Move to the center of the flight and debrief the discrepancies.', quote: 'Lastly, the FLT/CC will move to the center of the flight and debrief any discrepancies noted or debriefed from the evaluator.' },
      { sec: 'Closing the ranks', kind: 'cmd', cmd: 'attention', text: 'Back to attention.', quote: 'Command: "Flight, ATTENTION"' },
      { sec: 'Closing the ranks', kind: 'cmd', cmd: 'closeRanks', text: 'Close the ranks: the first element stands fast, each one behind steps up one more pace.', quote: 'Command: "Close Ranks, MARCH!"' },
      { sec: 'Closing the ranks', kind: 'cmd', cmd: 'readyFront', text: 'Ready, FRONT, as the Det procedure calls it here.', quote: 'Once "Close ranks" is executed, the FLT/CC will... Command: "Ready, FRONT!"', note: 'DAFPAM\'s Close Ranks ends at attention with no dress, so this Ready, FRONT is a Det 855 habit; give it the way your cadre teaches.' },
      { sec: 'Closing the ranks', kind: 'cmd', cmd: 'fallOut', text: 'Fall them out.', quote: 'Command: "FALL OUT!"' },
    );
    return steps;
  }

  function step30(S) {
    const say = (n, cmd, text, extra) => ({ sec: `Step ${n}`, kind: 'cmd', cmd, text, ...(extra || {}) });
    const steps = [
      say(1, 'fallIn', 'Fall in. (Sizing and count off are not part of the 30-step.)'),
      { sec: 'Report in', kind: 'cmd', cmd: 'report30In', text: 'Report in to the evaluator.', quote: '"Sir/Ma\'am, Unit Number, is prepared for the 30-step drill sequence. Request permission to use your drill area, Sir/Ma\'am!"' },
      { sec: 'Step 2', kind: 'fc', target: at((s) => frontCenter(s, 6)), text: 'Before Open Ranks you should be six paces from the flight, facing it.', quote: 'The flight commander (FC) should be six paces away and facing the flight.' },
      say(2, 'openRanks', 'Open ranks. On MARCH, step off toward where the guidon bearer will finish to start aligning.'),
    ];
    const En = S.flight.elements.length;
    for (let el = 0; el < En; el++) {
      steps.push({ sec: 'Aligning', kind: 'fc', target: at((s) => flankOf(s, el)), text: `In line with the ${E.ORD[el].toLowerCase()} element, one pace off its right flank, looking down it.` });
      steps.push({ sec: 'Aligning', kind: 'align', el, text: `Correct the ${E.ORD[el].toLowerCase()} element (move up / move back).` });
    }
    steps.push(
      { sec: 'Step 3', kind: 'fc', target: at((s) => { const { f, r } = frame(s); const p = add(guide(s), add(mul(r, PACE), mul(f, 3 * PACE))); return { x: p.x, y: p.y, h: hdg(mul(r, -1)) }; }), text: 'Three paces past the guidon bearer, halt, left face.', quote: 'they will proceed back toward the guide-on bearer taking three paces past the guide-on bearer, halt and then execute a left face.' },
      say(3, 'readyFront', 'Ready, FRONT.'),
      { sec: 'Step 4', kind: 'fc', target: at((s) => { const { f, r } = frame(s); const p = add(guide(s), mul(f, 3 * PACE)); return { x: p.x, y: p.y, h: hdg(mul(r, -1)) }; }), text: 'One step forward: in front of the guidon bearer, looking down line.', quote: 'take one step forward placing themselves in front of the guide-on bearer and looking down line' },
      say(4, 'closeRanks', 'Close ranks.'),
      { sec: 'Step 5', kind: 'fc', target: at((s) => frontCenter(s, 3), 1.5 * PACE), text: 'Post in front of and centered on the flight. From here on, keep that same relative position (3 paces, centered) as the flight moves.', quote: 'The commander will maintain their relative position on the flight as the flight fell in (3 Paces, centered off the flight).' },
      say(5, 'presentArms', 'Present arms.'), say(6, 'orderArms', 'Order arms.'), say(7, 'paradeRest', 'Parade rest.'), say(8, 'attention', 'Attention.'),
      say(9, 'leftFace', 'Left face.'), say(10, 'aboutFace', 'About face. You are now on the flight\'s left: the outside of every column right to come.'),
      say(11, 'forward', 'Forward march. Let them march a few steps (Space) before each next command.'),
      say(12, 'rightFlank', 'Right flank.'), say(13, 'leftFlank', 'Left flank.'),
      say(14, 'columnRight', 'Column right.'), say(15, 'forward', 'Forward march (the only command allowed once the column has turned).'),
      say(16, 'toTheRear', 'To the rear.'), say(17, 'toTheRear', 'To the rear again.'),
      say(18, 'columnRight', 'Column right.'), say(19, 'forward', 'Forward march.'),
      say(20, 'eyesRight', 'Eyes right: salute the evaluator.'), say(21, 'readyFront', 'Ready, front.'),
      say(22, 'columnRight', 'Column right.'), say(23, 'forward', 'Forward march.'),
      say(24, 'changeStep', 'Change step.'),
      say(25, 'columnRight', 'Column right.'), say(26, 'forward', 'Forward march.'),
      say(27, 'halt', 'Flight, halt.'), say(28, 'leftFace', 'Left face.'), say(29, 'rightStep', 'Right step.'), say(30, 'halt', 'Flight, halt.'),
      { sec: 'Report out', kind: 'cmd', cmd: 'report30Out', text: 'Report out to the evaluator.', quote: '"Sir/Ma\'am, Unit Number, request permission to exit your drill area, Sir/Ma\'am!"' },
    );
    return steps;
  }

  const SCRIPTS = [
    { id: 'ori', title: 'Open Ranks Inspection', source: 'Det 855 ORI Procedures, 10 Jul 2025 (DAFPAM 34-1203)', build: ori, setup: 'scatter', fcFollow: false },
    { id: 'step30', title: '30-Step Drill Sequence', source: 'AFJROTC Drill Pamphlet & 30-Step (Aug 2022)', build: step30, setup: 'scatter', fcFollow: true },
  ];

  function fcCheck(step, S) {
    const t = step.target(S);
    const fc = S.ppl.fc;
    const d = E.dist(fc, t);
    const dh = Math.abs(E.hdiff(fc.h, t.h));
    return { ok: d <= t.tol && dh < 1, d, dh, t };
  }
  const alignDone = (step, S) => E.misaligned(S, step.el).length === 0 && !E.busy(S);

  root.DrillScripts = { SCRIPTS, fcCheck, alignDone, frontCenter, behind, countOffSpot, flankOf, shadowSpot };
})(typeof globalThis !== 'undefined' ? globalThis : this);

// Course flashcard decks merged into TKB review (the same open-recall cards as every other subject).
// Each deck is added ONCE per account, the way the ASVAB deck is: tkbStorage.mergeCourseDecksIfMissing
// (guest, localStorage) and TkbFirestore.mergeCourseDecks (signed in). A deck only ever ADDS what is
// missing (the subject, its subtopics, question ids), so it never touches cards or stats already there.
// To ship a new deck: append it to COURSE_DECKS with its own new `key`.

const MICR2065_SUBJECT_ID = 'subj-micr2065';

const BLOOD_TOPICS = [
  ['blood-job', "Blood's Job (slide 3)"],
  ['blood-components', 'Components of Blood (slide 4)'],
  ['blood-made', 'Where Blood Cells Are Made (slide 5)'],
  ['blood-cell-functions', 'Blood Cell Functions (slide 6)'],
  ['blood-tests', 'What Blood Tests Show (slide 7)'],
  ['blood-typing', 'Blood Typing (slide 8)'],
  ['blood-rh', 'Rh Factor (slide 9)'],
  ['blood-microscopy', 'Blood Microscopy and Smears (slides 10-12)'],
  ['blood-glucose', 'Blood Glucose (slide 13)'],
];

export const MICR2065_SUBJECT = {
  id: MICR2065_SUBJECT_ID,
  // The name must equal the course code: CourseDetail finds a course's review deck by subject name.
  name: 'MICR 2065',
  color: 'hsl(350, 55%, 55%)',
  visibleToProfiles: ['main_recall', 'quick_facts', 'auto_all', 'auto_scoped', 'focused_review'],
  subtopics: BLOOD_TOPICS.map(([id, name]) => ({
    id: `subtopic-micr2065-${id}`,
    name,
    checklist: { basic: [], intermediate: [], advanced: [] },
  })),
};

// [topic, question, answer]. Source: MICR 2065 lab presentation "Blood Microscopy and Blood Testing"
// (Spring 2026 deck, slides 3-13; the lab-procedure slides are left out on purpose).
const BLOOD_CARDS = [
  ['blood-job', 'Name 4 things blood carries TO the body tissues.', 'Any 4 of: nourishment, electrolytes, hormones, vitamins, antibodies, heat, oxygen, immune cells.'],
  ['blood-job', 'What does blood carry AWAY from the tissues, and where does the waste go?', 'Waste matter (to the kidneys and liver, which filter and clean the blood) and carbon dioxide.'],
  ['blood-components', 'What percent of blood is plasma, and what is plasma?', 'About 55%. It is the liquid part of blood; the blood cells are suspended in it.'],
  ['blood-components', 'What percent of blood is red blood cells?', 'About 45% (it varies between males and females).'],
  ['blood-components', 'What percent of blood is white blood cells?', 'Less than 1%.'],
  ['blood-components', 'Which white blood cells are granulocytes?', 'Eosinophils, basophils, and neutrophils.'],
  ['blood-components', 'Which white blood cells are agranulocytes?', 'Lymphocytes and monocytes.'],
  ['blood-components', 'What is the technical name for platelets?', 'Thrombocytes.'],
  ['blood-components', 'What are the technical names for red and white blood cells?', 'Erythrocytes (red) and leukocytes (white).'],
  ['blood-made', 'Where are blood cells made, and what is the process called?', 'In the bone marrow (the spongy material in the center of bones), by hematopoiesis.'],
  ['blood-made', 'What do all blood cells start out as?', 'A hematopoietic stem cell, which matures into red blood cells, white blood cells, or platelets.'],
  ['blood-made', 'Which 3 organs help regulate blood cell production, destruction, and function?', 'The lymph nodes, spleen, and liver.'],
  ['blood-cell-functions', 'How do red blood cells carry oxygen and carbon dioxide?', 'With hemoglobin.'],
  ['blood-cell-functions', 'Which white blood cell is the most abundant and the first responder to infection?', 'The neutrophil.'],
  ['blood-cell-functions', 'How do neutrophils trap bacteria?', 'They form a NET (neutrophil extracellular trap) made of their own DNA and other proteins.'],
  ['blood-cell-functions', 'Which white blood cell controls parasitic infections and is involved in allergy and asthma?', 'The eosinophil.'],
  ['blood-cell-functions', 'What are the 3 lymphocyte types, and what does each do?', 'T cells and NK (natural killer) cells attack pathogens; B cells produce antibodies.'],
  ['blood-cell-functions', 'Which white blood cell is the immune system’s “garbage truck,” and what does it become?', 'The monocyte. It moves from the blood into the tissues and becomes a macrophage.'],
  ['blood-cell-functions', 'Which white blood cell is the least abundant?', 'The basophil.'],
  ['blood-cell-functions', 'What 3 chemicals do basophils secrete, and what do they cause?', 'Serotonin, histamine, and heparin. They cause inflammation and airway tightening (bronchoconstriction), as in asthma.'],
  ['blood-cell-functions', 'What do platelets do, and how big are they?', 'They make blood clot. They are much smaller than the other blood cells.'],
  ['blood-tests', 'Why does blood type matter?', 'It is required for blood transfusions and organ transplants.'],
  ['blood-tests', 'What does a CMP (complete metabolic panel) measure?', 'Electrolytes, proteins, liver enzymes, and kidney waste products. It shows organ function and the effects of medications or treatments.'],
  ['blood-tests', 'Which 2 tests measure blood clotting, and what drug do they help monitor?', 'The PT (prothrombin time) and APTT (activated partial thromboplastin time) tests. They monitor anticoagulants such as warfarin.'],
  ['blood-tests', 'Which tests check whether blood cell numbers are outside normal ranges?', 'A CBC (complete blood count) and a white blood cell differential. They are useful in diagnosing diseases such as cancer.'],
  ['blood-tests', 'Name 2 uses of blood analysis besides blood type, organ function, clotting, and cell counts.', 'Forensic evidence and infection detection.'],
  ['blood-typing', 'Blood typing is a form of what kind of testing?', 'Serotyping.'],
  ['blood-typing', 'Name the 4 ABO genotype pairs listed on the slide.', 'AO, BO, AB, and OO.'],
  ['blood-typing', 'What happens when antibodies bind their matching antigen on red blood cells?', 'The red blood cells agglutinate (clump together).'],
  ['blood-typing', 'Type O blood: which antigens, which antibodies, and what is it called?', 'No A or B antigens; antibodies against both A and B; the universal donor.'],
  ['blood-typing', 'Type AB blood: which antibodies, and what is it called?', 'No antibodies against A or B, because its red blood cells carry both antigens; the universal receiver.'],
  ['blood-rh', 'What is the Rh factor?', 'A protein on the surface of red blood cells. Having it makes you Rh-positive (+); lacking it makes you Rh-negative (−).'],
  ['blood-rh', 'About what percent of people are Rh-positive?', 'About 85%.'],
  ['blood-rh', 'When does Rh incompatibility happen?', 'When an Rh-negative person is pregnant with an Rh-positive fetus (usually the second time). The mother makes antibodies that tag the fetal red blood cells for destruction.'],
  ['blood-rh', 'What is the Rh incompatibility condition called?', 'Rh sensitization, or Rh disease of the newborn.'],
  ['blood-rh', 'How is Rh disease of the newborn prevented?', 'A RhoGAM injection, which prevents the antibodies from forming.'],
  ['blood-microscopy', 'Why are blood cells stained for microscopy?', 'To see their shape (morphology) and identify abnormalities such as cancer.'],
  ['blood-microscopy', 'Name 3 dyes used to stain blood cells.', 'Any 3 of: Congo Red, May-Grunwald, Giemsa’s, Jenner’s, Leishman’s, Wright’s.'],
  ['blood-microscopy', 'Which stain does the MICR 2065 blood lab use, and why?', 'Wright-Giemsa: one of the best for telling blood cell types apart, and versatile and consistent.'],
  ['blood-microscopy', 'What does the Wright-Giemsa stain show more intensely?', 'The nuclei (more intense basophilic, or nuclear, staining).'],
  ['blood-microscopy', 'Name 4 conditions a blood smear helps diagnose or monitor.', 'Anemia, infection, certain cancers, and sickle cell disease.'],
  ['blood-microscopy', 'When would someone need a blood smear?', 'After abnormal results on a CBC (complete blood count).'],
  ['blood-glucose', 'What is blood glucose, and what does a rise in it signal?', 'The main sugar in the blood and the body’s primary energy source. A rise signals the pancreas to release insulin.'],
  ['blood-glucose', 'Which panels report blood glucose?', 'The BMP (basic metabolic panel) or the CMP (comprehensive metabolic panel).'],
  ['blood-glucose', 'What is the normal FASTING blood sugar range?', '50–99 mg/dL.'],
  ['blood-glucose', 'What does a fasting blood sugar of 100–125 mg/dL suggest?', 'Prediabetes.'],
  ['blood-glucose', 'What does a fasting blood sugar of 126 mg/dL or higher suggest?', 'Diabetes or another condition.'],
  ['blood-glucose', 'Which test confirms diabetes, and what does it measure?', 'The A1c (glycated hemoglobin) test, which measures blood glucose over the past few months.'],
  ['blood-glucose', 'What are the 3 key symptoms of diabetes?', 'Frequent urination, excessive thirst, and excessive hunger.'],
];

const NOT_ON_SLIDE = new Set(['What are the 3 key symptoms of diabetes?']);

export const MICR2065_BLOOD_QUESTIONS = BLOOD_CARDS.map(([topic, question, answer], i) => ({
  id: `q-micr2065-blood-${String(i + 1).padStart(3, '0')}`,
  question,
  answer,
  answerAlternates: [],
  subjectId: MICR2065_SUBJECT_ID,
  subtopicId: `subtopic-micr2065-${topic}`,
  difficulty: 'basic',
  pipeline: 'main_recall',
  styleTags: ['micr2065', 'blood'],
  sourceNote: 'MICR 2065 lab presentation: Blood Microscopy and Blood Testing (Spring 2026)',
  source: 'seed',
  status: 'active',
  flagged: false,
  createdAt: '2026-11-13T00:00:00.000Z',
  stats: { timesShown: 0, timesCorrect: 0, timesWrong: 0, lastShownAt: null, correctDays: [] },
  explanation: NOT_ON_SLIDE.has(question)
    ? 'Slide 13 asks this question but does not give the answer; this is the standard answer.'
    : `From the MICR 2065 Blood Microscopy slides: ${BLOOD_TOPICS.find(([id]) => id === topic)[1]}.`,
}));

/** @type {{key: string, subject: Object, questions: Object[]}[]} */
export const COURSE_DECKS = [
  { key: 'micr2065_blood_v1', subject: MICR2065_SUBJECT, questions: MICR2065_BLOOD_QUESTIONS },
];

// Pure merge used by both storage layers: returns what to ADD, never what to change.
// If the account already has a subject with the deck's NAME under another id (an earlier
// importQuestions() deck for the same course), the deck joins that subject instead of making a
// second one with the same name, because CourseDetail only finds the first match by name.
export function planDeckMerge(deck, existingSubjects, existingQuestionIds) {
  const current = existingSubjects.find((s) => s.id === deck.subject.id)
    ?? existingSubjects.find((s) => s.name.toLowerCase() === deck.subject.name.toLowerCase());
  const subjectId = current ? current.id : deck.subject.id;
  let subject = null;
  if (!current) {
    subject = deck.subject;
  } else {
    const have = new Set((current.subtopics ?? []).map((st) => st.id));
    const missing = deck.subject.subtopics.filter((st) => !have.has(st.id));
    if (missing.length) subject = { ...current, subtopics: [...(current.subtopics ?? []), ...missing] };
  }
  const ids = existingQuestionIds instanceof Set ? existingQuestionIds : new Set(existingQuestionIds);
  const questions = deck.questions
    .filter((q) => !ids.has(q.id))
    .map((q) => (q.subjectId === subjectId ? q : { ...q, subjectId }));
  return { subject, questions };
}

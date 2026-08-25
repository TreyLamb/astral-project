import { useState } from 'react';
import { useCourses } from '../CoursesApp';

const emptyQuestion = () => ({ verbatimText: '', myAnswer: '', correctAnswer: '', topicTags: '' });

// Logs a quiz/exam/homework AND the real questions it asked — this is Tier 1
// of the question-capture strategy (ground truth: what the professor
// actually asked), and the raw material patternAnalysis.js counts over.
export default function AssessmentCapture({ courseId, onDone }) {
  const { addAssessment, addRealQuestion } = useCourses();
  const [name, setName] = useState('');
  const [type, setType] = useState('quiz');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [score, setScore] = useState('');
  const [totalPossible, setTotalPossible] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);

  const updateQ = (i, patch) => setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const addRow = () => setQuestions((qs) => [...qs, emptyQuestion()]);
  const removeRow = (i) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const assessment = await addAssessment({
      courseId,
      name: name.trim(),
      type,
      date,
      score: score === '' ? null : Number(score),
      totalPossible: totalPossible === '' ? null : Number(totalPossible),
    });
    for (const q of questions) {
      if (!q.verbatimText.trim()) continue;
      await addRealQuestion({
        courseId,
        assessmentId: assessment.id,
        verbatimText: q.verbatimText.trim(),
        myAnswer: q.myAnswer.trim(),
        correctAnswer: q.correctAnswer.trim(),
        topicTags: q.topicTags.split(',').map((t) => t.trim()).filter(Boolean),
      });
    }
    onDone?.();
  };

  return (
    <form className="crs-form" onSubmit={submit}>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="quiz">Quiz</option>
        <option value="exam">Exam</option>
        <option value="homework">Homework</option>
      </select>
      <input placeholder="Name (e.g. Quiz 1)" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input placeholder="Score" value={score} onChange={(e) => setScore(e.target.value)} />
        <input placeholder="Out of" value={totalPossible} onChange={(e) => setTotalPossible(e.target.value)} />
      </div>

      <div style={{ fontWeight: 600, marginTop: '0.5rem' }}>
        Questions asked — the whole point of capturing this
      </div>
      {questions.map((q, i) => (
        <div key={i} className="crs-form" style={{ border: '1px solid var(--tkb-border)', borderRadius: '8px', padding: '0.6rem' }}>
          <textarea placeholder="Verbatim question text" value={q.verbatimText} onChange={(e) => updateQ(i, { verbatimText: e.target.value })} />
          <input placeholder="What I answered" value={q.myAnswer} onChange={(e) => updateQ(i, { myAnswer: e.target.value })} />
          <input placeholder="Correct answer" value={q.correctAnswer} onChange={(e) => updateQ(i, { correctAnswer: e.target.value })} />
          <input placeholder="Topic tags, comma separated" value={q.topicTags} onChange={(e) => updateQ(i, { topicTags: e.target.value })} />
          {questions.length > 1 && (
            <button type="button" className="crs-btn secondary" onClick={() => removeRow(i)}>Remove</button>
          )}
        </div>
      ))}
      <button type="button" className="crs-btn secondary" onClick={addRow}>+ Add another question</button>
      <button className="crs-btn" type="submit">Save assessment</button>
    </form>
  );
}

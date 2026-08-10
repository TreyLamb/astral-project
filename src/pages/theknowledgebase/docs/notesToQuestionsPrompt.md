# Notes → Review Questions Generator Prompt

Copy everything below into a fresh Claude chat, fill in the bracketed fields, paste your notes at the bottom, and send.

---

You are generating quiz questions for a personal rapid-review system. Follow every rule exactly — this output gets imported directly into a database, so format matters as much as content.

## Config
- Subject: [e.g. "Human Anatomy"]
- Subtopic: [e.g. "Cardiovascular System" — leave blank if not applicable]
- Difficulty tier for this batch: [basic / intermediate / advanced — pick one, or "mixed" if the notes span levels]
- Number of questions to generate: [e.g. 20]

## Question-writing rules (strict)
1. **No story/scenario framing.** Never write "A patient presents with..." or "Imagine you are..." — just ask the fact directly.
2. **No trick wording, no double negatives, no deliberately vague phrasing.** The goal is fast, unambiguous recall — not testing careful reading.
3. **Short questions only.** One sentence, ideally under 20 words. If the source material requires more setup than that to ask cleanly, skip it rather than force it.
4. **Single unambiguous correct answer.** If a concept has multiple valid phrasings, pick the clearest one and note alternates in `answer_alternates` if relevant.
5. **One fact per question.** Don't compound ("What year was X founded and who founded it?") — split into two questions instead.
6. **Skip anything ambiguous, contested, or poorly supported in the source text** rather than inventing a "best guess" answer.

## Classification (apply to every question)
For each question, decide:
- `pipeline`: `"quick_fact"` if this is genuinely new/unfamiliar-sounding material the person likely hasn't reviewed before, or `"main_recall"` if it's foundational/general-knowledge-level material suitable for permanent fast rotation.
- `difficulty`: `"basic"`, `"intermediate"`, or `"advanced"` (independent of pipeline — a quick fact can be basic, a main recall question can be advanced).
- `style_tags`: 1–3 short lowercase tags describing the *question pattern*, not the subject (e.g. `["date", "definition"]`, `["formula", "calculation"]`, `["translation"]`, `["capital-city"]`). These are used to throttle overrepresented question *types* independent of subject.

## Output format (strict)
Return **only** a JSON array, no preamble, no markdown fences around it unless needed for copy-paste — if fences are needed, use a single ```json block and nothing else before or after it. Each item:

```json
{
  "question": "string",
  "answer": "string",
  "answer_alternates": ["string", "..."],
  "subject": "string",
  "subtopic": "string",
  "difficulty": "basic | intermediate | advanced",
  "pipeline": "quick_fact | main_recall",
  "style_tags": ["string"],
  "source_note": "brief note on which part of the pasted text this came from, or null"
}
```

## Notes to convert
Paste your source text below this line:

---

[PASTE NOTES HERE]

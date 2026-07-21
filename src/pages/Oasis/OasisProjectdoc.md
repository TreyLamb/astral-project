PROJECT OASIS:

User prompt in plain words - followed by prompt for ai more organized. THe ai prompt was given from a different ai agent. 
i want this to be a discussion. beggniningthis project is only step 1. there will be many many additions and changes. this theoretically will be an ongoing project for a long time.

user plain words "
i need AI opinion and get ideas and get help with this project that I think is the scale is rather large, but it's fairly easy to identify the different parts of it. Basically, with how useful AI is nowadays, I really want to automate as much of my life as I possibly can. Um, for 99% I'm confident that I can do it using free methods. Um, maybe if I automate like 20 things in my life, I'll have to find something that requires paying a couple dollars a month. You know, something I don't imagine it's going to really cost me anything. Um, I have the capabilities to make my own websites and trackers and stuff like that. I'm not a full expert with everything, but I know that there's a lot of people out there that are pretty much have their their lives so extremely automated. I want to get to the same point, but I don't always know what options I have for what AI can do for me. I don't know where it's going to fail me. Um, a lot of stuff like that. So, I know the possibilities are out there, but I don't even I'm not even sure where to start. And it's not even just setting up automation. It's also automating things that I would never even think to automate. Like, um, setting up automations for my emails. I don't know how to do that without paying for something. I've seen things on social media that maybe has ways that can like maybe scan your emails in the morning and like filter them for you and stuff like that. Um, maybe things like planning for me. Maybe things like if I've done if I make a fitness tracker and I enter four or five workouts, um, in a row that are extremely hard, it'll flag that I need to slowly on take a break. Some of those things a lot of these things are things that can be programmed into a website. They don't necessarily need AI to do them, but it might need AI help to build them. Just all of these things I just um, another one that I saw was a finance tracker. Now, I'm not going to just go and give all my financial information to AI, but that can actually be a really big one for a lot of people. Um, for people that have terrible finances, having basically your own little accountant unofficially, unofficially your own accountant in the form of an AI agent, that's huge. And again, same thing, I can make a website out of that. So, I think a lot of these things um, maybe could be made into a website or a tool, some sort of tool for 90% of it, and then sometimes there may need to be an AI agent. Um, and sometimes that could be free API calls, and maybe sometimes that would require more than a free API call. Uh, but these are the types of things I'm talking about. All of these things like uh reminding me when to pay my bills. Just all that stuff, you know. Um, I want help figuring out how to make this. Maybe we can talk about it, and maybe maybe what I need from you is I want a prompt to give to an AI agent to start helping me build it. I want to make a project document so that I can have everything documented from A to Z what I want so that nothing gets left out at the end. So, I think maybe it's a prompt, and it's also help building the document too to actually start making it.

The AI prompt was created after this user-prompt was given.




# Project Oasis: The Self-Hosted Life Automation Engine

## 1. Project Overview & Philosophy
The goal of this project is to build a centralized personal dashboard and automation engine that handles life tracking, filtering, and alerting. 
- **Core Principle:** 90% deterministic code (React/Node/Cron), 10% tactical AI.
- **Budget Goal:** $0/month using generous hobby-tier cloud infrastructure and free API quotas.
- **Data Privacy:** Local execution where possible; no raw financial or highly sensitive data passed to third-party AI models without strict local scrubbing.

---

## 2. Technical Stack (The Free Tier Architecture)
- **Frontend & Core Dashboard:** React (Vite) or Next.js, styled with Tailwind CSS. Hosted on Vercel or Netlify (Free Tier).
- **Database:** FIREBASE
- **Automation & Ingestion:** 
  - **Google Apps Script:** Free cron-style execution tied directly to Gmail, Calendar, and Drive.
  - **GitHub Actions:** Free scheduled workflows (cron jobs) to trigger backend syncs or API calls.

---

## 3. Module Breakdown & Execution Plans

### Module A: The Tactical Email Scanner
- **Objective:** Get a daily 7:00 AM summary of critical emails without paying for Zapier or specialized AI tools.
- **Mechanism:** Google Apps Script runs daily on a time-based trigger. It pulls unread emails from specific folders, strips HTML boilerplate, sends the text payload to a free Gemini API endpoint using a strict summarization prompt, and writes the output directly to the Supabase database.
- **AI Touchpoint:** Single daily API call (Free Tier).

### Module B: The Intelligent Fitness & Fatigue Monitor
- **Objective:** Track workout loads and flag overtraining automatically.
- **Mechanism:** A simple CRUD interface on the dashboard to log workouts. The Supabase database calculates a rolling average of a custom metric (e.g., `(Duration * Intensity Rank)` over a 5-day window). If the metric crosses a hard threshold, the frontend flags a warning.
- **AI Touchpoint:** None needed for calculation. AI is used *only* during the development phase to write the PostgreSQL triggers or math functions.

### Module C: The Zero-Knowledge Finance & Bill Tracker
- **Objective:** Aggregated bill alerts and budget health tracking without connecting live banking APIs (like Plaid).
- **Mechanism:** A relational database table stores recurring bill due dates and amounts. A weekly GitHub Action script queries the table, flags any due dates within the next 7 days, and fires a local notification or email alert. For budgeting, data is input via manual csv uploads parsed entirely client-side.
- **AI Touchpoint:** None. Purely relational logic.

---

## 4. Security & Privacy Safeguards
1. **Local Scrubbing:** Any text sent to external APIs must pass through a local regex filter to strip out explicit credit card formats, SSNs, or exact account numbers.
2. **Environment Variables:** All API keys (`SUPABASE_KEY`, `GEMINI_API_KEY`) must strictly live in hidden environment files (`.env`) and never be committed to public repositories.
# 📚 FlipWise AI Flashcard Engine

Turn any PDF into a smart, practice-ready flashcard system powered by active recall and spaced repetition.

🔗 **Live Demo:** https://flipwise-pdf-mastery.lovable.app  

<img width="1893" height="903" alt="image" src="https://github.com/user-attachments/assets/badbcd0e-ed21-4ae9-b4b0-fce5b7d668d3" />

<img width="1887" height="794" alt="image" src="https://github.com/user-attachments/assets/4f1a4aa2-6104-4dec-9e02-4876248dfea6" />

<img width="1892" height="908" alt="image" src="https://github.com/user-attachments/assets/bdb3d81b-b251-4eee-8d34-8e52b8ee7b7f" />

---

## ✨ The Problem

Students don't struggle because they don't study 
they struggle because they forget.

Most tools optimize for input (reading, highlighting) 
but not retention. Cognitive science shows active recall 
and spaced repetition are the most effective study 
techniques yet most students still re-read notes passively.

**FlipWise fixes this.**

---

## 🧠 What It Does

FlipWise helps students **learn and retain information**, not just read it.

- Upload any PDF (notes, textbook, etc.)
- Automatically generate high-quality flashcards
- Study using active recall
- Cards adapt based on your performance (spaced repetition)

<img width="1743" height="1492" alt="_- visual selection" src="https://github.com/user-attachments/assets/a5b6e9dc-b879-42dc-98f6-a06b24249836" />

---

## 🧩 Key Features

### 📄 PDF → Smart Flashcards
- Upload any text-based PDF
- AI generates 20-30 deep, teacher-quality cards
- Covers definitions, relationships, edge cases, 
  application scenarios
- Topic tags: Concept / Application / Definition / 
  Relationship

### 🔁 SM-2 Spaced Repetition
- Rate each card: Again / Hard / Good / Easy
- SM-2 algorithm schedules next review per card
- Hard cards appear sooner, easy cards fade away
- Cards stored with ease_factor, interval, repetitions

### 📊 Progress Tracking
- Mastery states: New → Learning → Review → Mastered
- Dashboard: total cards, due today, streak, XP
- 52-week activity heatmap (GitHub-style)
- Per-deck progress rings and mastery bars

### 🎮 Gamification
- XP system with level progression
- Daily streak tracking with milestone celebrations
- Combo counter during study sessions
- Confetti on session completion

### 🔐 Guest Mode
- One click → dashboard, no signup required
- Anonymous Supabase auth (real user_id)
- Data persists in same browser session

---

## ⚙️ How It Works

```

PDF → Text Extraction → AI Flashcard Generation → Deck Creation → Study Session → Spaced Repetition

```

1. Upload PDF  
2. AI generates 20–30 meaningful flashcards  
3. Study one-by-one  
4. Rate difficulty (Again / Hard / Good / Easy)  
5. System schedules cards intelligently  

---

## ⚖️ Key Decisions

- **SM-2 Algorithm over Leitner**  
  More precise scheduling per card  

- **Quality over Quantity**  
  Fewer, deeper flashcards instead of shallow ones  

- **Backend-secured AI calls**  
  No API keys exposed in frontend  

---

## 🧰 Tech Stack

- **Frontend:** React + TypeScript + Tailwind (Lovable)
- **Backend:** Supabase Edge Functions (Deno)
- **Database:** PostgreSQL (Supabase)
- **AI Layer:** Lovable AI Gateway
- **Auth:** Supabase Anonymous Auth
- **Deployment:** Lovable Cloud

---

## 🧩 Challenges & Learnings

- Debugging AI Gateway errors using server logs instead of frontend assumptions  
- Switching from local build to Lovable + Supabase for faster iteration and better UI  
- Designing flashcards that test understanding, not just memorization  

---

## 🔮 Future Improvements

- OCR for scanned PDFs  
- Shareable decks via public links for peer learning
- Export to Anki (popular spaced repetition app for advanced users)  
- Multi-language support detect input language and allow flashcards in different languages  

---

## 🎯 Built For

Cuemath AI Builder Challenge — Problem 1  
**The Flashcard Engine**

---

## 💡 Core Idea

> Don’t just convert content.  
> Build a system that helps students remember.

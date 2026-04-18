# 📚 FlipWise AI Flashcard Engine

Turn any PDF into a smart, practice-ready flashcard system powered by active recall and spaced repetition.


## 🚀 Live Demo
🔗 https://flipwise-pdf-mastery.lovable.app


## 🧠 What It Does

FlipWise helps students **learn and retain information**, not just read it.

- Upload any PDF (notes, textbook, etc.)
- Automatically generate high-quality flashcards
- Study using active recall
- Cards adapt based on your performance (spaced repetition)

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

## 🧩 Key Features

- 📄 PDF → Flashcards (AI-powered)
- 🧠 Active Recall (question → answer flow)
- 🔁 Spaced Repetition (adaptive scheduling)
- 📊 Progress Tracking (mastery, due cards)
- 📚 Deck Management (multiple decks, revisit anytime)
- ⚡ Guest Mode (no login required)

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
- Multi-language support — detect input language and allow flashcards in different languages  

---

## 🎯 Built For

Cuemath AI Builder Challenge — Problem 1  
**The Flashcard Engine**

---

## 💡 Core Idea

> Don’t just convert content.  
> Build a system that helps students remember.

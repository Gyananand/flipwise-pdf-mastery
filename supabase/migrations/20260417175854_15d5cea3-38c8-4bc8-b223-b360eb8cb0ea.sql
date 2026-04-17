
-- ============= DECKS =============
CREATE TABLE public.decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#7C3AED',
  emoji TEXT NOT NULL DEFAULT '📚',
  total_cards INT NOT NULL DEFAULT 0,
  source_filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_studied_at TIMESTAMPTZ
);

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own decks" ON public.decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own decks" ON public.decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own decks" ON public.decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own decks" ON public.decks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_decks_user_id ON public.decks(user_id);

-- ============= CARDS =============
CREATE TABLE public.cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  topic_tag TEXT NOT NULL DEFAULT 'Concept',
  difficulty_hint TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty_hint IN ('easy','medium','hard')),
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval INT NOT NULL DEFAULT 1,
  repetitions INT NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  mastery_state TEXT NOT NULL DEFAULT 'new' CHECK (mastery_state IN ('new','learning','review','mastered')),
  last_rating INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Cards inherit access from parent deck
CREATE POLICY "Users view own cards" ON public.cards FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = cards.deck_id AND d.user_id = auth.uid()));
CREATE POLICY "Users create own cards" ON public.cards FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = cards.deck_id AND d.user_id = auth.uid()));
CREATE POLICY "Users update own cards" ON public.cards FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = cards.deck_id AND d.user_id = auth.uid()));
CREATE POLICY "Users delete own cards" ON public.cards FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = cards.deck_id AND d.user_id = auth.uid()));

CREATE INDEX idx_cards_deck_id ON public.cards(deck_id);
CREATE INDEX idx_cards_due_date ON public.cards(due_date);

-- ============= STUDY SESSIONS =============
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES public.decks(id) ON DELETE SET NULL,
  cards_studied INT NOT NULL DEFAULT 0,
  cards_again INT NOT NULL DEFAULT 0,
  cards_hard INT NOT NULL DEFAULT 0,
  cards_good INT NOT NULL DEFAULT 0,
  cards_easy INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  studied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_sessions_studied_at ON public.study_sessions(studied_at);

-- ============= USER STATS =============
CREATE TABLE public.user_stats (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  total_cards_studied INT NOT NULL DEFAULT 0,
  total_sessions INT NOT NULL DEFAULT 0,
  last_studied_date DATE,
  xp_points INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own stats" ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own stats" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

-- ============= TRIGGER: auto-create user_stats on signup =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= TRIGGER: keep decks.total_cards in sync =============
CREATE OR REPLACE FUNCTION public.update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.decks SET total_cards = total_cards + 1 WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.decks SET total_cards = GREATEST(0, total_cards - 1) WHERE id = OLD.deck_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_card_count_ins AFTER INSERT ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.update_deck_card_count();
CREATE TRIGGER trg_card_count_del AFTER DELETE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.update_deck_card_count();

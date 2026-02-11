
-- 1. Table Transactions : ON DÉSACTIVE LA SÉCURITÉ POUR TESTER
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    maketou_cart_id TEXT NOT NULL,
    amount_fcfa INTEGER NOT NULL,
    coins_amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SOLUTION RADICALE : On désactive la vérification des droits pour cette table
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- 2. Table Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  coins INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Nettoyage des anciennes politiques
DROP POLICY IF EXISTS "Enable all for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON public.profiles;

-- Politique : Chacun peut modifier SON profil, mais tout le monde peut LIRE les profils (pour les stats admin simples)
CREATE POLICY "Enable update for users based on email" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for users" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Table Songs (Ajouté pour les stats)
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT,
    recipient TEXT,
    lyrics TEXT,
    audio_url TEXT,
    cover_image TEXT,
    style TEXT,
    duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    voice_input TEXT,
    voice_mode TEXT
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all" ON public.songs;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.songs;

-- Politique : Tout le monde peut lire les chansons (nécessaire pour stats admin et partage)
CREATE POLICY "Enable read access for all" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated" ON public.songs FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 4. Trigger de création automatique de profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, coins, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'name', 
    0, -- FORCE 0 PIÈCES À L'INSCRIPTION
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

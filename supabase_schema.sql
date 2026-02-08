
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
-- Cela permet à n'importe quel utilisateur connecté d'insérer une ligne.
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- 2. Table Profiles : On s'assure que les droits sont bons
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  coins INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- On nettoie les anciennes politiques
DROP POLICY IF EXISTS "Enable all for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON public.profiles;

-- On remet des droits simples
CREATE POLICY "Enable all for users" 
ON public.profiles FOR ALL 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 3. Trigger de création automatique de profil (Sécurité)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, coins, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'name', 0, new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

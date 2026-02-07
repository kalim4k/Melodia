-- 1. CONFIGURATION DE LA TABLE SONGS
CREATE TABLE IF NOT EXISTS public.songs (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT,
    recipient TEXT,
    lyrics TEXT,
    audio_url TEXT,
    cover_image TEXT,
    style TEXT,
    duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    voice_input TEXT,
    voice_mode TEXT
);

-- Ajouter les colonnes si la table existe déjà
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS voice_input TEXT;
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS voice_mode TEXT;

-- Activer la sécurité (RLS)
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Songs are viewable by everyone" ON public.songs;
DROP POLICY IF EXISTS "Users can insert their own songs" ON public.songs;
DROP POLICY IF EXISTS "Users can update their own songs" ON public.songs;
DROP POLICY IF EXISTS "Users can delete their own songs" ON public.songs;

-- Créer les nouvelles politiques
-- 1. Lecture : Tout le monde peut voir les chansons (nécessaire pour le partage)
CREATE POLICY "Songs are viewable by everyone" ON public.songs FOR SELECT USING (true);

-- 2. Insertion : Un utilisateur connecté peut ajouter une chanson liée à son ID
CREATE POLICY "Users can insert their own songs" ON public.songs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Modification/Suppression : Uniquement le créateur
CREATE POLICY "Users can update their own songs" ON public.songs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own songs" ON public.songs FOR DELETE USING (auth.uid() = user_id);


-- 2. CONFIGURATION DES BUCKETS DE STOCKAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-inputs', 'audio-inputs', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT (id) DO NOTHING;

-- Politiques de stockage pour 'audio-inputs'
DROP POLICY IF EXISTS "Public Access Audio" ON storage.objects;
CREATE POLICY "Public Access Audio" ON storage.objects FOR SELECT USING ( bucket_id = 'audio-inputs' );

DROP POLICY IF EXISTS "Auth Upload Audio" ON storage.objects;
CREATE POLICY "Auth Upload Audio" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'audio-inputs' AND auth.role() = 'authenticated' );

-- Politiques de stockage pour 'covers'
DROP POLICY IF EXISTS "Public Access Covers" ON storage.objects;
CREATE POLICY "Public Access Covers" ON storage.objects FOR SELECT USING ( bucket_id = 'covers' );

DROP POLICY IF EXISTS "Auth Upload Covers" ON storage.objects;
CREATE POLICY "Auth Upload Covers" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'covers' AND auth.role() = 'authenticated' );

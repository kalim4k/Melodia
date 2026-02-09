
import { GenerationParams } from "../types";

// URL mise à jour selon votre documentation
const API_BASE = "https://kieai.erweima.ai/api/v1";

// CONFIGURATION DE LA CLÉ API
const getApiKey = () => {
  let key = typeof __VITE_KIE_API_KEY__ !== 'undefined' ? __VITE_KIE_API_KEY__ : '';
  
  if (!key || key === "undefined") {
      key = "ffc67aa92b32521540881121dab456dd"; 
  }
  
  if (!key) {
      console.error("Clé API Suno/Kie manquante. Vérifiez votre fichier .env ou le service.");
      return "";
  }
  return key;
};

interface SunoGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface SunoTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: string;
    errorMessage?: string;
    response?: {
      sunoData?: Array<{
        id: string;
        audioUrl: string;
        imageUrl: string;
        title: string;
        duration: number;
        model_name: string;
      }>;
    };
  };
}

export interface GeneratedMusic {
  audioUrl: string;
  coverImage: string;
  duration: string;
  title: string;
}

export interface GeneratedLyrics {
  title: string;
  lyrics: string;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Polling pour la MUSIQUE uniquement (Suno est asynchrone)
async function pollMusicTask(taskId: string): Promise<GeneratedMusic> {
  const apiKey = getApiKey();
  const maxAttempts = 60; // 3 min
  const interval = 3000;

  console.log(`[Kie.ai] Polling Music task: ${taskId}`);

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, interval));

    try {
        const response = await fetch(`${API_BASE}/generate/record-info?taskId=${taskId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) continue;
        const json: SunoTaskResponse = await response.json();
        
        // Certains endpoints renvoient directement la data, d'autres encapsulés
        // On gère les structures standard Suno API wrappers
        const status = json.data?.status;
        
        // SUCCÈS
        if (status === 'SUCCESS' || status === 'FIRST_SUCCESS') {
            const data = json.data?.response;
            const tracks = data?.sunoData;
            
            if (tracks && tracks.length > 0) {
                const track = tracks[0];
                if (!track.audioUrl) continue;
                return {
                    audioUrl: track.audioUrl,
                    coverImage: track.imageUrl || 'https://picsum.photos/400/400',
                    duration: formatDuration(track.duration || 180),
                    title: track.title || 'Chanson sans titre'
                };
            }
        }
        
        // ECHECS
        if (['FAILED', 'ERROR', 'CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR'].includes(status)) {
            const errorMsg = json.data?.errorMessage || "Erreur inconnue";
            throw new Error(`Échec de la génération musicale : ${errorMsg}`);
        }
        
    } catch (e: any) {
        if (e.message && e.message.includes("Échec")) throw e;
    }
  }
  throw new Error(`Le serveur met trop de temps à répondre pour la musique.`);
}

// 1. Génération de paroles via Kie AI LLM (Endpoint Chat Completions)
export const generateSunoLyrics = async (prompt: string): Promise<GeneratedLyrics> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Clé API manquante.");

    console.log("[Kie.ai] Envoi prompt paroles (LLM deepseek-chat)...", prompt);

    try {
        const response = await fetch(`${API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat", // Modèle indiqué dans votre documentation
                messages: [
                    {
                        role: "system", 
                        content: "Tu es un parolier expert pour la Saint-Valentin. Génère des paroles de chanson structurées (Couplets, Refrain) basées sur la demande. La première ligne doit être le TITRE de la chanson uniquement. Le reste doit être les paroles. Écris en Français sauf demande contraire."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                stream: false
            })
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`Erreur API LLM (${response.status}): ${txt}`);
        }

        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;

        if (!content) throw new Error("L'IA n'a renvoyé aucun texte.");

        // Parsing : Première ligne = Titre, Reste = Paroles
        const lines = content.split('\n');
        let title = "Chanson d'Amour";
        let lyrics = content;

        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // Nettoyage basique du titre
            title = firstLine.replace(/^Titre\s*:?\s*/i, '').replace(/^"|"$/g, '').replace(/^\*\*|\*\*$/g, '');
            // On retire la première ligne du contenu pour avoir juste les paroles
            if (lines.length > 1) {
                lyrics = lines.slice(1).join('\n').trim();
            }
        }

        return {
            title,
            lyrics
        };

    } catch (err: any) {
        console.error("Erreur generateSunoLyrics:", err);
        throw err;
    }
};

// 2. Génération de musique via Kie AI (Suno model)
export const generateSunoMusic = async (params: {
  lyrics: string;
  style: string;
  title: string;
  voice: 'male' | 'female';
  audioInput?: string; 
  voiceMode?: 'dedication' | 'inspiration';
}): Promise<GeneratedMusic> => {
  const apiKey = getApiKey();
  
  if (!apiKey) throw new Error("Clé API manquante.");
  
  const vocalTag = params.voice === 'male' ? 'Male vocals' : 'Female vocals';
  const fullStyle = `${params.style}, ${vocalTag}`;

  console.log("[Kie.ai] Envoi prompt musique...", { style: fullStyle });
  
  const payload: any = {
    customMode: true,
    callBackUrl: "https://google.com", 
    instrumental: false,
    model: 'V3_5', 
    mv: 'chirp-v3-5', 
    title: params.title.substring(0, 80),
    prompt: params.lyrics.substring(0, 2000), 
    tags: fullStyle,
    style: fullStyle 
  };

  if (params.voiceMode === 'inspiration' && params.audioInput) {
    payload.audio_prompt_url = params.audioInput;
  } 

  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur serveur Musique (${response.status}) : ${errorText}`);
    }

    const json: SunoGenerateResponse = await response.json();
    
    // Vérification du code de retour (parfois 200, parfois pas présent selon le wrapper)
    if (json.code !== undefined && json.code !== 200) {
        throw new Error(json.msg || "Erreur inconnue API Musique");
    }

    // Si data.taskId existe
    if (json.data && json.data.taskId) {
        return pollMusicTask(json.data.taskId);
    } else {
        throw new Error("Pas de taskId retourné par l'API Musique.");
    }

  } catch (err: any) {
    console.error("Erreur generateSunoMusic:", err);
    throw new Error(err.message || "Impossible de contacter le service de musique");
  }
};

import { GenerationParams } from "../types";

const API_BASE = "https://api.kie.ai/api/v1";

// CONFIGURATION DE LA CLÉ API
const getApiKey = () => {
  return "ffc67aa92b32521540881121dab456dd";
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

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

async function pollTask(taskId: string): Promise<GeneratedMusic> {
  const apiKey = getApiKey();
  const maxAttempts = 60; // Environ 3 minutes max
  const interval = 3000; // 3 secondes

  console.log(`[Suno] Démarrage du polling pour la tâche: ${taskId}`);

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, interval));

    try {
        const response = await fetch(`${API_BASE}/generate/record-info?taskId=${taskId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
           console.warn(`[Suno] Erreur HTTP polling: ${response.status}`);
           continue;
        }

        const json: SunoTaskResponse = await response.json();
        
        // Log de progression tous les 3 appels
        if (i % 3 === 0) console.log(`[Suno] Statut polling (${i}):`, json.data?.status);

        if (json.code !== 200) {
           console.warn("[Suno] Erreur API polling code:", json.msg);
           continue;
        }

        const status = json.data.status;
        
        // Succès
        if (status === 'SUCCESS' || status === 'FIRST_SUCCESS') {
            const tracks = json.data.response?.sunoData;
            
            if (tracks && tracks.length > 0) {
                const track = tracks[0];
                if (!track.audioUrl) continue;

                console.log("[Suno] Génération réussie !", track);

                return {
                    audioUrl: track.audioUrl,
                    coverImage: track.imageUrl || 'https://picsum.photos/400/400',
                    duration: formatDuration(track.duration || 180),
                    title: track.title || 'Chanson sans titre'
                };
            }
        }
        
        // Echecs
        if (['CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR'].includes(status)) {
            const errorMsg = json.data.errorMessage || "Erreur inconnue";
            console.error("[Suno] Échec critique:", errorMsg);
            throw new Error(`Échec de la génération : ${errorMsg}`);
        }
        
    } catch (e: any) {
        if (e.message && e.message.includes("Échec de la génération")) throw e;
        console.warn(`[Suno] Erreur réseau polling (${i}):`, e);
    }
  }
  throw new Error("Le serveur met trop de temps à répondre. Veuillez réessayer.");
}

export const generateSunoMusic = async (params: {
  lyrics: string;
  style: string;
  title: string;
  voice: 'male' | 'female';
}): Promise<GeneratedMusic> => {
  const apiKey = getApiKey();
  
  // Construction du style complet (Tags + Genre Vocal)
  const vocalTag = params.voice === 'male' ? 'Male vocals' : 'Female vocals';
  const fullStyle = `${params.style}, ${vocalTag}`;

  console.log("[Suno] Envoi de la requête de génération...", {
    style: fullStyle,
    title: params.title
  });
  
  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // Paramètres obligatoires pour cette API spécifique
        customMode: true,
        callBackUrl: "https://google.com", // Dummy URL obligatoire
        instrumental: false,
        model: 'V3_5', // CORRECTION: Paramètre requis par l'API
        
        // Modèle et contenu
        mv: 'chirp-v3-5', 
        title: params.title.substring(0, 80),
        prompt: params.lyrics.substring(0, 2000), 
        
        // Style
        tags: fullStyle,
        style: fullStyle 
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[Suno] Erreur HTTP Initiale:", response.status, errorText);
        throw new Error(`Erreur serveur Suno (${response.status}) : ${errorText}`);
    }

    const json: SunoGenerateResponse = await response.json();

    if (json.code !== 200) {
      console.error("[Suno] Erreur Code API:", json);
      throw new Error(json.msg || "Erreur API lors de l'initialisation");
    }

    console.log("[Suno] Tâche créée avec succès, ID:", json.data.taskId);
    return pollTask(json.data.taskId);

  } catch (err: any) {
    console.error("Erreur generateSunoMusic:", err);
    throw new Error(err.message || "Impossible de contacter le service de musique");
  }
};
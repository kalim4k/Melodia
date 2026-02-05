import { GenerationParams } from "../types";

const API_BASE = "https://api.kie.ai/api/v1";

// CONFIGURATION DE LA CLÉ API
const getApiKey = () => "ffc67aa92b32521540881121dab456dd";

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
    status: string; // 'PENDING', 'TEXT_SUCCESS', 'FIRST_SUCCESS', 'SUCCESS', 'GENERATE_AUDIO_FAILED', etc.
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
  const maxAttempts = 60; // Environ 3 minutes max (60 * 3s)
  const interval = 3000; // 3 secondes

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, interval));

    try {
        // CORRECTION: Utilisation de l'endpoint record-info documenté
        const response = await fetch(`${API_BASE}/generate/record-info?taskId=${taskId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.ok) {
            const json: SunoTaskResponse = await response.json();
            
            if (json.code !== 200) {
               console.warn("Erreur API:", json.msg);
               continue;
            }

            const status = json.data.status;
            
            // Succès : 'SUCCESS' (tout fini) ou 'FIRST_SUCCESS' (premier morceau prêt)
            if (status === 'SUCCESS' || status === 'FIRST_SUCCESS') {
                const tracks = json.data.response?.sunoData;
                
                if (tracks && tracks.length > 0) {
                    // On prend la première piste générée
                    const track = tracks[0];
                    
                    // Vérification de sécurité si l'URL est vide (parfois arrive en FIRST_SUCCESS prématuré)
                    if (!track.audioUrl) continue;

                    return {
                        audioUrl: track.audioUrl,
                        coverImage: track.imageUrl || 'https://picsum.photos/400/400',
                        duration: formatDuration(track.duration || 180),
                        title: track.title || 'Chanson sans titre'
                    };
                }
            }
            
            // Gestion des erreurs explicites
            if (['CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR'].includes(status)) {
                throw new Error(json.data.errorMessage || "La génération a échoué.");
            }
            
            // Si 'PENDING' ou 'TEXT_SUCCESS', on continue d'attendre
        }
    } catch (e: any) {
        // On ne relance pas l'erreur tout de suite sauf si c'est une erreur critique
        if (e.message.includes("La génération a échoué")) throw e;
        console.warn("Polling en cours (tentative " + (i+1) + ")...", e);
    }
  }
  throw new Error("Délai d'attente dépassé pour la génération de musique.");
}

export const generateSunoMusic = async (params: {
  lyrics: string;
  style: string;
  title: string;
  voice: 'male' | 'female';
}): Promise<GeneratedMusic> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API Suno manquante.");

  // Appel initial pour lancer la génération
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'V5',
      customMode: true,
      instrumental: false,
      prompt: params.lyrics.substring(0, 3000), // Limite de sécurité pour V5
      style: params.style,
      title: params.title.substring(0, 80),
      vocalGender: params.voice === 'male' ? 'm' : 'f',
      callBackUrl: 'https://example.com/callback-placeholder' 
    })
  });

  const json: SunoGenerateResponse = await response.json();

  if (json.code !== 200) {
    throw new Error(json.msg || "Erreur lors de la demande de génération");
  }

  // Démarrer le polling pour attendre le résultat
  return pollTask(json.data.taskId);
};
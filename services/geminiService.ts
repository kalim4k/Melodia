
import { GoogleGenAI, Modality } from "@google/genai";
import { GenerationParams } from "../types";

// Helper to decode base64 audio string to AudioBuffer
export async function decodeAudioData(
  base64String: string,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await audioContext.decodeAudioData(bytes.buffer);
}

export const generateLyrics = async (params: GenerationParams): Promise<{ title: string; lyrics: string }> => {
  // On récupère la clé et on enlève les espaces potentiels (souvent le cas lors d'un copier/coller)
  const apiKey = (process.env.API_KEY || '').trim();

  if (!apiKey) {
    throw new Error("Clé API Google manquante. Vérifiez la configuration 'API_KEY' sur Netlify.");
  }

  // Initialisation avec la clé nettoyée
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Agis comme un compositeur professionnel. Écris les paroles d'une chanson pour la Saint-Valentin.
    
    Détails de la demande :
    - De la part de : ${params.sender}
    - Pour : ${params.recipient}
    - Ambiance : ${params.vibe}
    - Style musical souhaité : ${params.musicStyle} (adapte le rythme des rimes à ce style)
    - Anecdotes/Détails à inclure : ${params.details}
    
    Instructions :
    - Structure la chanson avec des couplets et un refrain.
    - Sois créatif et touchant.
    - Inclus le nom de l'expéditeur et du destinataire dans le texte si cela s'y prête.
    
    Format de réponse attendu (JSON uniquement):
    {
      "title": "Un titre créatif pour la chanson",
      "lyrics": "Le texte complet de la chanson avec structure (Couplet 1, Refrain, etc.)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error("Réponse vide de l'IA");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Erreur lors de la génération des paroles:", error);
    // On propage l'erreur avec un message clair
    if (error.message && (error.message.includes("API key") || error.status === 400 || error.status === 403)) {
        throw new Error("Clé API invalide ou expirée. Vérifiez qu'il n'y a pas d'espaces dans votre variable Netlify.");
    }
    throw error;
  }
};

export const generateSpeech = async (text: string, voice: 'male' | 'female'): Promise<string> => {
  // On récupère la clé et on enlève les espaces potentiels
  const apiKey = (process.env.API_KEY || '').trim();

  const ai = new GoogleGenAI({ apiKey });

  // Sélection de la voix basée sur le choix de l'utilisateur
  // Fenrir/Charon = Homme, Kore/Puck/Zephyr = Femme/Neutre
  let voiceName = 'Kore'; // Default Female
  
  if (voice === 'male') {
    voiceName = 'Fenrir'; 
  } else {
    voiceName = 'Kore';
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error("Pas de données audio générées");
    }
    
    return `data:audio/mp3;base64,${audioData}`;
  } catch (error) {
    console.error("Erreur lors de la génération audio:", error);
    throw error;
  }
};

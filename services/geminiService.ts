
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

// Fonction utilitaire pour récupérer la clé
const getApiKey = () => {
  const key = import.meta.env.VITE_API_KEY;
  if (!key) {
    console.error("[Melodia] VITE_API_KEY est introuvable. Vérifiez la configuration Netlify.");
    return '';
  }
  return key;
};

export const generateLyrics = async (params: GenerationParams): Promise<{ title: string; lyrics: string }> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Configuration manquante : Clé API Gemini (VITE_API_KEY) introuvable.");
  }

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
    console.error("Erreur Gemini:", error);
    
    if (error.message && (error.message.includes("API key") || error.status === 400 || error.status === 403)) {
        throw new Error(`Erreur d'autorisation Google. Vérifiez VITE_API_KEY.`);
    }
    throw error;
  }
};

export const generateSpeech = async (text: string, voice: 'male' | 'female'): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  let voiceName = 'Kore'; 
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

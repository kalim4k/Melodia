
// Ce service est désactivé. Nous utilisons désormais Kie.ai pour les paroles et la musique.
// Le TTS (Text-to-Speech) de dédicace est géré nativement ou retiré pour le moment.

export const generateSpeech = async (text: string, voice: 'male' | 'female'): Promise<string> => {
  console.warn("Le service Gemini TTS a été désactivé.");
  return Promise.reject("Service désactivé");
};

import { GoogleGenAI, Type } from "@google/genai";
import { AIResponseSchema } from '../types';

export const decomposeTask = async (taskInput: string): Promise<AIResponseSchema> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key is missing. Please check environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prompt ajustado para gerar passos detalhados e ricos, mantendo a estrutura tática.
  const prompt = `
    Atue como "NOISE GATE", um estrategista de produtividade de elite.
    O usuário tem o seguinte objetivo: "${taskInput}".
    
    Gere um plano tático operacional em JSON.
    
    Requisitos de Conteúdo:
    1. one_thing: Identifique a "Única Coisa" essencial. O objetivo central, direto e impactante (Máx 15 palavras).
    2. steps: Decomponha em 3 a 5 etapas táticas e detalhadas.
       - IMPORTANTE: NÃO seja vago ou excessivamente resumido.
       - Cada passo deve ser uma instrução rica e clara sobre O QUE fazer e COMO fazer.
       - Dê contexto suficiente para que o usuário execute sem dúvidas.
       - Use verbos no imperativo (ex: "Analise os dados X...", "Escreva o rascunho focando em Y...").
    3. call_to_action: Uma frase de comando estilo cyberpunk/militar para motivar a ação imediata (Máx 8 palavras).
    
    Idioma: Português (Brasil).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Temperatura ajustada para 0.4 para permitir descrições um pouco mais elaboradas, mas ainda focadas.
        temperature: 0.4,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            one_thing: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            call_to_action: { type: Type.STRING },
          },
          required: ["one_thing", "steps", "call_to_action"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AIResponseSchema;
  } catch (error) {
    console.error("Gemini decomposition failed:", error);
    throw error;
  }
};
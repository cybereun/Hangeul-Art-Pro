
import { GoogleGenAI } from "@google/genai";

// Nano Banana Pro alias for gemini-3-pro-image-preview
const IMAGE_MODEL = 'gemini-3-pro-image-preview';

export async function generateHangeulImage(prompt: string): Promise<string | null> {
  // Use the mandatory GoogleGenAI client initialization with process.env.API_KEY directly as required by guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      },
    });

    // Iterate through all parts to find the image part as per guidelines
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    return null;
  } catch (error: any) {
    console.error("Gemini Image Generation Error:", error);
    // If request fails due to missing entity (often linked to key selection issues), signal a reset
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("RESET_KEY");
    }
    throw error;
  }
}

export async function testApiConnection(): Promise<boolean> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Perform a lightweight test request
    // Correctly setting thinkingBudget: 0 when maxOutputTokens is set for Gemini 3 models
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Ping',
      config: { 
        maxOutputTokens: 1,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return true;
  } catch (error) {
    console.error("API Connection Test Failed:", error);
    return false;
  }
}

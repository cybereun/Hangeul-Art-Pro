
import { GoogleGenAI } from "@google/genai";

const IMAGE_MODEL = 'gemini-3-pro-image-preview';

/**
 * Gemini 3 Pro Image 모델을 사용하여 이미지를 생성합니다.
 * 플랫폼 가이드라인에 따라 호출 시점에 인스턴스를 생성합니다.
 */
export async function generateHangeulImage(prompt: string): Promise<string | null> {
  // Always use process.env.API_KEY directly as required by guidelines.
  // Create a new GoogleGenAI instance right before making an API call.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      // Find the image part as it may not be the first part.
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    return null;
  } catch (error: any) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
}

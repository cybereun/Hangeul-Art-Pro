
import { GoogleGenAI } from "@google/genai";

const IMAGE_MODEL = 'gemini-3-pro-image-preview';

/**
 * Gemini 3 Pro Image 모델을 사용하여 이미지를 생성합니다.
 * 플랫폼 가이드라인에 따라 호출 직전에 GoogleGenAI 인스턴스를 생성합니다.
 */
export async function generateHangeulImage(prompt: string): Promise<string | null> {
  // process.env.API_KEY는 플랫폼에 의해 자동 주입됩니다.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  // 매번 새로운 인스턴스를 생성하여 대화상자에서 선택된 최신 키를 반영합니다.
  const ai = new GoogleGenAI({ apiKey });

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
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    return null;
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    throw error;
  }
}

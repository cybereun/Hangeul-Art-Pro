import { GoogleGenAI } from "@google/genai";

const IMAGE_MODEL = 'gemini-3-pro-image-preview';

/**
 * Gemini 3 Pro Image 모델을 사용하여 이미지를 생성합니다.
 */
export async function generateHangeulImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.API_KEY;
  
  // 브라우저 런타임에서 키가 아직 주입되지 않은 경우를 위한 체크
  if (!apiKey) {
    throw new Error("API_KEY_NOT_FOUND");
  }

  // 매 호출 시 최신 API 키를 사용하도록 인스턴스 생성
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
      // 이미지 파트를 찾아 반환 (첫 번째 파트가 아닐 수 있음)
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
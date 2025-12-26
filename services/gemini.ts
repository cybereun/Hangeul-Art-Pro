import { GoogleGenAI } from "@google/genai";

const IMAGE_MODEL = 'gemini-3-pro-image-preview';

/**
 * Gemini 3 Pro Image 모델을 사용하여 이미지를 생성합니다.
 */
export async function generateHangeulImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.API_KEY;
  
  // 브라우저 런타임에서 키가 비어있으면 라이브러리 오류를 피하기 위해 명시적 에러 발생
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("MISSING_API_KEY");
  }

  // 가이드라인: 호출 직전에 새 인스턴스 생성 (최신 키 반영)
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
    console.error("Gemini API Error:", error);
    throw error;
  }
}
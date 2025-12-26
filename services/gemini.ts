import { GoogleGenAI } from "@google/genai";

const IMAGE_MODEL = 'gemini-3-pro-image-preview';

/**
 * 사용자가 제공한 API 키를 사용하여 이미지를 생성합니다.
 */
export async function generateHangeulImage(prompt: string, apiKey: string): Promise<string | null> {
  if (!apiKey) throw new Error("API 키가 설정되지 않았습니다.");
  
  const ai = new GoogleGenAI({ apiKey: apiKey });

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
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
}

/**
 * API 키의 유효성을 가벼운 쿼리로 테스트합니다.
 */
export async function testApiConnection(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  const ai = new GoogleGenAI({ apiKey: apiKey });
  try {
    // 가장 가벼운 모델로 응답 여부만 확인
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Ping',
      config: { 
        maxOutputTokens: 1
      }
    });
    return true;
  } catch (error) {
    console.error("API Connection Test Failed:", error);
    return false;
  }
}
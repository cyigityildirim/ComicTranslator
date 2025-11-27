import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TargetLanguage, TranslationResult } from "../types";
import { resizeImage } from "./imageUtils";

// Define the response schema for Gemini
const translationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    bubbles: {
      type: Type.ARRAY,
      description: "List of detected speech bubbles and their translations.",
      items: {
        type: Type.OBJECT,
        properties: {
          originalText: {
            type: Type.STRING,
            description: "The text content extracted from the bubble.",
          },
          translatedText: {
            type: Type.STRING,
            description: "Translated text.",
          },
          box_2d: {
            type: Type.ARRAY,
            description: "Bounding box [ymin, xmin, ymax, xmax] 0-1000.",
            items: { type: Type.INTEGER },
          },
          confidence: {
            type: Type.INTEGER,
            description: "Confidence score (0-100).",
          },
        },
        required: ["originalText", "translatedText", "box_2d", "confidence"],
      },
    },
  },
  required: ["bubbles"],
};

export const translateComicImage = async (
  base64Image: string,
  targetLanguage: TargetLanguage
): Promise<TranslationResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Resize image to max 1536px for faster processing
    // This reduces token count and upload time significantly
    const resizedBase64 = await resizeImage(base64Image, 1536);

    const prompt = `
      Task: Comic Book Translation.
      1. Detect all speech bubbles.
      2. Extract text.
      3. Translate to ${targetLanguage}.
      4. Return bounding boxes (0-1000 scale) and confidence (0-100).
      
      Constraint:
      - Keep translations CONCISE and SHORT to fit inside the original bubble area.
      - Match the informal tone of a comic.
      - Return JSON only.
    `;

    // Remove header if present
    const cleanBase64 = resizedBase64.split(',')[1] || resizedBase64;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", 
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: translationSchema,
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini.");
    }

    const data = JSON.parse(text);
    
    const bubblesWithIds = (data.bubbles || []).map((b: any, index: number) => ({
      ...b,
      id: `bubble-${index}-${Date.now()}`
    }));

    return {
      bubbles: bubblesWithIds,
    };

  } catch (error) {
    console.error("Translation Error:", error);
    throw new Error("Failed to process the comic page. Please try again.");
  }
};

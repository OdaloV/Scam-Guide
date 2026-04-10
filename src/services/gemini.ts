import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ScamAnalysisResult {
  isScam: boolean;
  confidence: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  patterns: string[];
  explanation: string;
  recommendations: string[];
}

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isScam: { type: Type.BOOLEAN, description: "Whether the content is likely a scam" },
    confidence: { type: Type.NUMBER, description: "Confidence score from 0 to 1" },
    riskLevel: { 
      type: Type.STRING, 
      enum: ["Low", "Medium", "High", "Critical"],
      description: "The severity of the risk" 
    },
    patterns: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of detected scam patterns (e.g., 'Urgency', 'Impersonation')" 
    },
    explanation: { type: Type.STRING, description: "Detailed explanation of why this was flagged" },
    recommendations: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Actionable advice for the user" 
    }
  },
  required: ["isScam", "confidence", "riskLevel", "patterns", "explanation", "recommendations"]
};

export async function analyzeText(text: string): Promise<ScamAnalysisResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `Analyze the following message for potential scam patterns. Be thorough and look for psychological manipulation, suspicious links, impersonation, or unusual requests for money/info.\n\nMessage: "${text}"` }]
        }
      ],
      config: {
        systemInstruction: "You are an expert cybersecurity analyst specializing in fraud and scam detection. Your goal is to protect users by identifying even subtle signs of deception.",
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing text:", error);
    throw error;
  }
}

export async function analyzeAudio(base64Data: string, mimeType: string): Promise<ScamAnalysisResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            { text: "Analyze this audio for potential scam patterns. Listen for voice synthesis (deepfakes), high-pressure tactics, impersonation of authority figures, or requests for sensitive information." }
          ]
        }
      ],
      config: {
        systemInstruction: "You are an expert cybersecurity analyst specializing in voice-based fraud and social engineering detection.",
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing audio:", error);
    throw error;
  }
}

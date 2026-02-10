
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RecognitionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const RECOGNITION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Short common name of the object" },
    category: { type: Type.STRING, description: "General category" },
    description: { type: Type.STRING, description: "One-sentence informative description" },
    funFact: { type: Type.STRING, description: "Detailed facts" },
    visualPrompt: { type: Type.STRING, description: "Prompt for AI image generation" },
    confidence: { type: Type.NUMBER, description: "Confidence score" }
  },
  required: ["name", "category", "description", "funFact", "visualPrompt", "confidence"]
};

// High-reliability architectural grayscale image sources
const WHITE_HOUSE_IMAGE = "https://images.unsplash.com/photo-1501466044931-62695aada8e9?auto=format&fit=crop&w=1200&q=80";
const DATA_CENTER_IMAGE = "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&w=1200&q=80";

export async function recognizeObject(
  base64Image: string,
  clickX?: number,
  clickY?: number
): Promise<RecognitionResult | null> {
  try {
    const prompt = `Identify the object at coordinates (${Math.round(clickX || 50)}%, ${Math.round(clickY || 50)}%). 
    SPECIAL RULES: 
    1. If the object is a SILVER or METAL push pin, set:
       - name: 'White House'
       - description: 'Washington D.C'
       - funFact: "Coldest Inauguration (1985): President Ronald Reagan's second inauguration recorded a noon temperature of 7F and a low of -4, forcing the ceremony indoors.\n\nSnowiest Inauguration (1909): Nearly 10 inches of snow forced William H. Taft's ceremony indoors.\n\nWarmest Inauguration (1981): Ronald Reagan's first inauguration reached 55F.\n\nWettest Inauguration (1937): Franklin D. Roosevelt’s second inauguration saw 1.77 inches of rain."
       - visualPrompt: 'The White House facade in Washington DC, cinematic monochrome architectural photography'

    2. If the object is a CLEAR or TRANSPARENT push pin, set:
       - name: 'IAD13 Data Center'
       - description: 'Ashburn Virginia'
       - funFact: "The IAD13 Data center is a Microsoft Data center that houses the Azure Data chip racks, currently being leased out by Open AI for it's AI products and needs."
       - visualPrompt: 'Futuristic server racks in a dark data center corridor, monochrome technological aesthetic'

    3. For all other objects, identify them normally but keep descriptions professional and concise.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RECOGNITION_SCHEMA
      }
    });

    const result = JSON.parse(response.text || '{}') as RecognitionResult;
    
    // Normalize and robust matching
    const nameLower = (result.name || "").toLowerCase();
    if (nameLower.includes('white house') || nameLower.includes('president')) {
      result.name = 'White House';
      result.referenceImage = WHITE_HOUSE_IMAGE;
    } else if (nameLower.includes('iad13') || nameLower.includes('data center') || nameLower.includes('ashburn')) {
      result.name = 'IAD13 Data Center';
      result.referenceImage = DATA_CENTER_IMAGE;
      result.weatherFacts = `Blizzards
The Blizzard of 2016 ("Jonas"): This remains one of the heaviest snowfalls on record for the area, burying Ashburn under approximately 36 inches of snow in a single weekend.
"Snowmageddon" (2010): A massive February storm that dumped over 32 inches at nearby Dulles, causing widespread power outages and collapsing roofs across Loudoun County.

Storms & Tornadoes
June 1996 Tornado Outbreak: A severe weather system produced a notable F2 tornado that tracked from southeastern Loudoun into Fairfax, causing significant structural damage near the Ashburn border.
July 2003 Tornado: A smaller F0 tornado touched down directly in the Ashburn area, specifically damaging trees and fences in the Ashburn Farms neighborhood.

Extreme Heat
July 2024 Heat Wave: Ashburn experienced one of its hottest days in recent history, with temperatures soaring to 104°F and heat indices reaching dangerous levels.
Historical High (1930/1954): While Ashburn usually stays in the 90s, it has been part of regional heatwaves where temperatures across Northern Virginia hit the 105°F–110°F range.`;
    }

    return result;
  } catch (error) {
    console.error("Gemini Recognition Error:", error);
    return null;
  }
}

export async function speakMessage(text: string): Promise<void> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function generateAIVisual(prompt: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A grayscale, monochrome, artistic noir rendering of: ${prompt}. High contrast, 8k, cinematic architectural photography.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
}

import { ExtractedPatientData } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

export const extractPatientData = async (transcript: string): Promise<ExtractedPatientData> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  if (!transcript || transcript.trim().length === 0) {
    throw new Error('Transcript is empty. Please record some speech first.');
  }

  const prompt = `Extract the following JSON structure from this medical check-in transcript. Handle mixed English/Roman Urdu by translating to English. Return only valid JSON:
{
  "patient_name": "string",
  "age": "string",
  "symptoms": ["array of symptoms"],
  "duration": "string describing how long symptoms have been present"
}
If any field cannot be determined, use null.

Transcript: ${transcript}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.statusText}. ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const textContent = data.candidates[0].content.parts[0].text;

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Gemini response');
    }

    const extractedData: ExtractedPatientData = JSON.parse(jsonMatch[0]);

    return {
      patient_name: extractedData.patient_name || null,
      age: extractedData.age || null,
      symptoms: Array.isArray(extractedData.symptoms) ? extractedData.symptoms : null,
      duration: extractedData.duration || null,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract patient data: ${error.message}`);
    }
    throw new Error('Failed to extract patient data: Unknown error');
  }
};

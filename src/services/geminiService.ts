export async function processTranscriptWithGemini(transcript) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing");

  console.log("Vector Protocol: Connected to Gemini 2.5 Pro...");

  // UPDATED: Using the exact model ID found in your diagnostic
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

  const prompt = `
    You are a medical data structure engine for the Global South. 
    Analyze this transcript: "${transcript}"
    
    Extract the following JSON strictly. Do not use Markdown formatting.
    If the text is in "Roman Urdu" or mixed English/Urdu, translate and standardize it.
    
    Structure:
    {
      "patient_data": { "name": "string or null", "age": "string or null", "gender": "string or null" },
      "symptoms_data": { "primary_symptom": "string", "duration": "string", "severity": "string" }
    }
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    
    // Aggressive cleanup to ensure pure JSON
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Critical AI Failure:", error);
    throw error;
  }
}
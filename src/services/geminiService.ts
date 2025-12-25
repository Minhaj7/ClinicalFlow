export async function processTranscriptWithGemini(transcript) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing");

  // UPDATED: Matches your exact JSON inventory
  // Priority: 2.5 Flash (Newest Free) -> 2.0 Flash (Stable Free) -> Generic Flash
  const modelsToTry = [
    "gemini-2.5-flash", 
    "gemini-2.0-flash",
    "gemini-flash-latest"
  ];

  const prompt = `
    You are a medical data engine. Analyze this transcript: "${transcript}"
    
    Extract the following JSON strictly. No Markdown.
    
    Structure:
    {
      "patient_data": { "name": "string", "age": "string", "gender": "string" },
      "symptoms_data": { "primary_symptom": "string", "duration": "string", "severity": "string" }
    }
  `;

  // LOOP THROUGH VALID MODELS
  for (const model of modelsToTry) {
    console.log(`Vector Protocol: Attempting model '${model}'...`);
    
    try {
      // Note: We use the exact model name from your list
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        const err = await response.json();
        console.warn(`Model ${model} failed:`, err.error?.message);
        // If 404 or Quota limit, we simply try the next one
        continue; 
      }

      // SUCCESS
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) throw new Error("Empty response");

      console.log(`Success with model: ${model}`);
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);

    } catch (e) {
      console.warn(`Network/Parse error on ${model}:`, e);
    }
  }

  throw new Error("Vector Alert: All Flash models failed. Please check your Quota in Google AI Studio.");
}

export async function extractPatientData(transcript) {
  const result = await processTranscriptWithGemini(transcript);

  return {
    patient_name: result.patient_data?.name || null,
    age: result.patient_data?.age || null,
    symptoms: result.symptoms_data?.primary_symptom ? [result.symptoms_data.primary_symptom] : null,
    duration: result.symptoms_data?.duration || null,
  };
}
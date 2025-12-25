import { useState, useEffect } from 'react';
import { Stethoscope, CheckCircle, AlertTriangle } from 'lucide-react';
import { RecordingInterface } from './components/RecordingInterface';
import { RecentCheckIns } from './components/RecentCheckIns';
import { extractPatientData } from './services/geminiService';
import { savePatientVisit, getRecentVisits } from './services/databaseService';
import { PatientVisit } from './types';
import { supabase } from './lib/supabase';

function App() {
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  console.log("=== ENVIRONMENT CHECK ===");
  console.log("Supabase URL present:", !!supabaseUrl);
  console.log("Supabase Key present:", !!supabaseKey);
  console.log("Gemini Key present:", !!geminiKey);

  const loadRecentVisits = async () => {
    try {
      setIsLoading(true);
      const recentVisits = await getRecentVisits(10);
      setVisits(recentVisits);
    } catch (error) {
      console.error('Error loading visits:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load recent check-ins');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecentVisits();
  }, []);

  const testConnection = async () => {
    console.log("=== TESTING SUPABASE CONNECTION ===");

    if (!supabaseUrl || !supabaseKey) {
      alert("CRITICAL ERROR: Supabase Keys are MISSING in .env file!");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('patient_visits')
        .select('id')
        .limit(1);

      if (error) {
        console.error("Connection Test Failed:", error);
        alert(`Connection Failed: ${error.message}`);
      } else {
        console.log("Connection Test Success:", data);
        alert("SUCCESS: Supabase connection is working!");
      }
    } catch (err) {
      console.error("Connection Test Error:", err);
      alert(`Connection Error: ${err}`);
    }
  };

  const testAIExtraction = async () => {
    console.log("=== TESTING AI EXTRACTION ===");

    const testTranscript = "My name is John Smith. I am 35 years old. I have a severe headache for the past 3 days.";

    try {
      const result = await extractPatientData(testTranscript);
      console.log("AI Extraction Result:", result);
      alert(`AI Test Success!\nName: ${result.patient_data?.name}\nAge: ${result.patient_data?.age}\nSymptom: ${result.symptoms_data?.primary_symptom}`);
    } catch (err) {
      console.error("AI Extraction Failed:", err);
      alert(`AI Test Failed: ${err}`);
    }
  };

  const handleTranscriptComplete = async (transcript: string) => {
    setIsProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    console.log("=== HANDLING TRANSCRIPT ===");
    console.log("Transcript received:", transcript);

    try {
      const aiJson = await extractPatientData(transcript);
      console.log("AI Extracted Data:", aiJson);

      await savePatientVisit(transcript, aiJson);
      console.log("Saved to database successfully");

      setSuccessMessage('Patient check-in saved successfully!');

      await loadRecentVisits();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error processing check-in:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process check-in');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-black text-white py-8 border-b-4 border-black">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex items-center gap-4">
            <Stethoscope className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Voice Check-in System</h1>
          </div>
          <p className="text-xl mt-2">Medical Clinic Patient Registration</p>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-4xl mx-auto px-8 mb-6">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="bg-gray-800 text-white px-4 py-2 border-2 border-black font-bold hover:bg-gray-700 flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            {showDebug ? 'Hide' : 'Show'} Debug Panel
          </button>
        </div>

        {showDebug && (
          <div className="max-w-4xl mx-auto px-8 mb-6">
            <div className="bg-yellow-100 border-4 border-black p-6">
              <h3 className="text-2xl font-bold text-black mb-4">Debug Status</h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full ${supabaseUrl ? 'bg-green-600' : 'bg-red-600'}`}></span>
                  <span className="text-lg font-bold">Supabase URL:</span>
                  <span className="text-lg">{supabaseUrl ? 'Present' : 'MISSING'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full ${supabaseKey ? 'bg-green-600' : 'bg-red-600'}`}></span>
                  <span className="text-lg font-bold">Supabase Key:</span>
                  <span className="text-lg">{supabaseKey ? 'Present' : 'MISSING'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full ${geminiKey ? 'bg-green-600' : 'bg-red-600'}`}></span>
                  <span className="text-lg font-bold">Gemini API Key:</span>
                  <span className="text-lg">{geminiKey ? 'Present' : 'MISSING'}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={testConnection}
                  className="bg-blue-600 text-white px-6 py-3 border-2 border-black font-bold hover:bg-blue-700"
                >
                  Test Database Connection
                </button>
                <button
                  onClick={testAIExtraction}
                  className="bg-green-600 text-white px-6 py-3 border-2 border-black font-bold hover:bg-green-700"
                >
                  Test AI Extraction
                </button>
              </div>

              <div className="mt-4 p-4 bg-white border-2 border-black">
                <p className="text-sm font-bold text-black">Tip: Open browser console (F12) to see detailed logs</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="max-w-4xl mx-auto px-8 mb-6">
            <div className="bg-white border-4 border-black p-6 flex items-center gap-4">
              <CheckCircle className="w-8 h-8 text-black" />
              <p className="text-xl font-bold text-black">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="max-w-4xl mx-auto px-8 mb-6">
            <div className="bg-white border-4 border-black p-6">
              <p className="text-xl font-bold text-black">Error: {errorMessage}</p>
            </div>
          </div>
        )}

        <RecordingInterface onTranscriptComplete={handleTranscriptComplete} isProcessing={isProcessing} />

        <div className="my-12 max-w-4xl mx-auto px-8">
          <div className="border-t-4 border-black"></div>
        </div>

        <RecentCheckIns visits={visits} isLoading={isLoading} />
      </main>

      <footer className="bg-black text-white py-6 mt-12 border-t-4 border-black">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="text-lg">Voice-to-Data Patient Check-in System</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

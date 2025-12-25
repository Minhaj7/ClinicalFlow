import { useState, useEffect } from 'react';
import { Stethoscope, CheckCircle } from 'lucide-react';
import { RecordingInterface } from './components/RecordingInterface';
import { RecentCheckIns } from './components/RecentCheckIns';
import { extractPatientData } from './services/geminiService';
import { savePatientVisit, getRecentVisits } from './services/databaseService';
import { PatientVisit } from './types';

function App() {
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleTranscriptComplete = async (transcript: string) => {
    setIsProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const aiJson = await extractPatientData(transcript);

      await savePatientVisit(transcript, aiJson);

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

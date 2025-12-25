import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { PatientVisit, Symptom } from '../types';
import { supabase } from '../lib/supabase';

interface EditPatientDialogProps {
  visit: PatientVisit;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedVisit: Partial<PatientVisit>) => Promise<void>;
  onRefresh?: () => void;
}

export const EditPatientDialog = ({ visit, isOpen, onClose, onSave, onRefresh }: EditPatientDialogProps) => {
  const [rawTranscript, setRawTranscript] = useState(visit.raw_transcript);
  const [patientName, setPatientName] = useState(visit.patient_data?.name || '');
  const [patientAge, setPatientAge] = useState(visit.patient_data?.age || '');
  const [patientGender, setPatientGender] = useState(visit.patient_data?.gender || '');
  const [symptoms, setSymptoms] = useState<Symptom[]>(visit.symptoms_data || []);
  const [newSymptomName, setNewSymptomName] = useState('');
  const [newSymptomSeverity, setNewSymptomSeverity] = useState('');
  const [newSymptomDuration, setNewSymptomDuration] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddSymptom = () => {
    if (!newSymptomName.trim()) return;

    const newSymptom: Symptom = {
      name: newSymptomName.trim(),
      severity: newSymptomSeverity || undefined,
      duration: newSymptomDuration || undefined,
    };

    setSymptoms([...symptoms, newSymptom]);
    setNewSymptomName('');
    setNewSymptomSeverity('');
    setNewSymptomDuration('');
  };

  const handleRemoveSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    console.log("Vector Protocol: Initiating Save...");

    const formData = {
      raw_transcript: rawTranscript,
      patient_data: {
        name: patientName || null,
        age: patientAge || null,
        gender: patientGender || null,
      },
      symptoms_data: symptoms,
    };

    setIsSaving(true);

    try {
      // STEP 1: EXISTENCE CHECK
      // We ask the database: "Do you have this ID?"
      const { data: checkData, error: checkError } = await supabase
        .from('patient_visits')
        .select('id')
        .eq('id', visit.id)
        .maybeSingle();

      if (checkError) {
        alert(`DIAGNOSTIC FAIL: Database Connection Error during check.\n${checkError.message}`);
        setIsSaving(false);
        return;
      }

      if (!checkData) {
        // THIS IS THE SMOKING GUN
        alert(`CRITICAL ERROR: The Database says Patient ID ${visit.id} DOES NOT EXIST.\n\nYour list is showing 'Ghost Data'. Please refresh the page completely.`);
        setIsSaving(false);
        return;
      }

      // STEP 2: IF EXISTS, EXECUTE UPDATE
      alert(`CONFIRMED: Row exists. Attempting Update on ID: ${visit.id}...`);

      const { data, error } = await supabase
        .from('patient_visits')
        .update({
          raw_transcript: formData.raw_transcript,
          patient_data: formData.patient_data,
          symptoms_data: formData.symptoms_data
        })
        .eq('id', visit.id)
        .select();

      if (error) {
        alert(`UPDATE ERROR: ${error.message}`);
        setIsSaving(false);
      } else if (!data || data.length === 0) {
        alert("UPDATE STALLED: Row exists, but Update returned 0 rows. This is 100% a Policy (RLS) block.");
        setIsSaving(false);
      } else {
        alert("SUCCESS: Data Securely Updated.");
        console.log("Update Success:", data[0]);

        await onSave(formData);

        if (onRefresh) {
          onRefresh();
        }

        onClose();
      }
    } catch (error) {
      console.error('Error saving patient data:', error);
      alert('Failed to save changes. Please try again.');
      setIsSaving(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Edit Patient Record</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Raw Transcript</h3>
            <textarea
              value={rawTranscript}
              onChange={(e) => setRawTranscript(e.target.value)}
              className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-serif text-sm"
              placeholder="Audio transcript..."
            />
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Patient name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Age
                </label>
                <input
                  type="text"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Age"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gender
                </label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Symptoms</h3>

            {symptoms.length > 0 && (
              <div className="space-y-2 mb-4">
                {symptoms.map((symptom, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900">{symptom.name}</span>
                        {symptom.severity && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
                            {symptom.severity}
                          </span>
                        )}
                        {symptom.duration && (
                          <span className="text-sm text-slate-600">
                            Duration: {symptom.duration}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSymptom(index)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                    >
                      <X className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Add New Symptom</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={newSymptomName}
                  onChange={(e) => setNewSymptomName(e.target.value)}
                  placeholder="Symptom name"
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSymptom()}
                />
                <select
                  value={newSymptomSeverity}
                  onChange={(e) => setNewSymptomSeverity(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Severity (optional)</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <input
                  type="text"
                  value={newSymptomDuration}
                  onChange={(e) => setNewSymptomDuration(e.target.value)}
                  placeholder="Duration (optional)"
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSymptom()}
                />
                <button
                  onClick={handleAddSymptom}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

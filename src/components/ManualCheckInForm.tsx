import { useState } from 'react';
import { Plus, Trash2, Save, Activity, TestTube, Pill } from 'lucide-react';
import { Patient, Symptom, PatientMedicalHistory } from '../types';

interface VitalsData {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  temperature: string;
  temperatureUnit: string;
  pulseRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
}

interface TestData {
  testName: string;
  result: string;
  notes: string;
}

interface MedicineData {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface ManualCheckInFormProps {
  onSubmit: (patientData: any, symptoms: Symptom[], notes: string, vitals?: VitalsData, tests?: TestData[], medicines?: MedicineData[]) => void;
  isProcessing: boolean;
  selectedPatient: Patient;
  patientHistory: PatientMedicalHistory | null;
}

export const ManualCheckInForm = ({
  onSubmit,
  isProcessing,
  selectedPatient,
  patientHistory
}: ManualCheckInFormProps) => {
  const [symptoms, setSymptoms] = useState<Symptom[]>([{ name: '', duration: '', severity: 'Mild' }]);
  const [notes, setNotes] = useState('');

  const [vitals, setVitals] = useState<VitalsData>({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    temperature: '',
    temperatureUnit: 'F',
    pulseRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: ''
  });

  const [tests, setTests] = useState<TestData[]>([{ testName: '', result: '', notes: '' }]);
  const [medicines, setMedicines] = useState<MedicineData[]>([{ name: '', dosage: '', frequency: '', duration: '' }]);

  const handleAddSymptom = () => {
    setSymptoms([...symptoms, { name: '', duration: '', severity: 'Mild' }]);
  };

  const handleRemoveSymptom = (index: number) => {
    if (symptoms.length > 1) {
      setSymptoms(symptoms.filter((_, i) => i !== index));
    }
  };

  const handleSymptomChange = (index: number, field: keyof Symptom, value: string) => {
    const newSymptoms = [...symptoms];
    newSymptoms[index] = { ...newSymptoms[index], [field]: value };
    setSymptoms(newSymptoms);
  };

  const handleAddTest = () => {
    setTests([...tests, { testName: '', result: '', notes: '' }]);
  };

  const handleRemoveTest = (index: number) => {
    if (tests.length > 1) {
      setTests(tests.filter((_, i) => i !== index));
    }
  };

  const handleTestChange = (index: number, field: keyof TestData, value: string) => {
    const newTests = [...tests];
    newTests[index] = { ...newTests[index], [field]: value };
    setTests(newTests);
  };

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleRemoveMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const handleMedicineChange = (index: number, field: keyof MedicineData, value: string) => {
    const newMedicines = [...medicines];
    newMedicines[index] = { ...newMedicines[index], [field]: value };
    setMedicines(newMedicines);
  };

  const handleVitalsChange = (field: keyof VitalsData, value: string) => {
    setVitals({ ...vitals, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filteredSymptoms = symptoms.filter(s => s.name.trim() !== '');

    if (filteredSymptoms.length === 0) {
      alert('Please add at least one symptom');
      return;
    }

    const patientData = {
      name: selectedPatient.full_name,
      age: selectedPatient.date_of_birth
        ? Math.floor((Date.now() - new Date(selectedPatient.date_of_birth).getTime()) / 31557600000).toString()
        : null,
      gender: selectedPatient.gender
    };

    const filteredTests = tests.filter(t => t.testName.trim() !== '');
    const filteredMedicines = medicines.filter(m => m.name.trim() !== '');

    onSubmit(patientData, filteredSymptoms, notes, vitals, filteredTests, filteredMedicines);

    setSymptoms([{ name: '', duration: '', severity: 'Mild' }]);
    setNotes('');
    setVitals({
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      temperature: '',
      temperatureUnit: 'F',
      pulseRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: ''
    });
    setTests([{ testName: '', result: '', notes: '' }]);
    setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
  };

  return (
    <div className="space-y-6">
      {patientHistory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Patient Medical Context</h4>
          <div className="text-sm text-blue-800 space-y-1">
            {patientHistory.known_allergies && patientHistory.known_allergies.length > 0 && (
              <p>
                <span className="font-semibold">Allergies:</span>{' '}
                {patientHistory.known_allergies.map(a => a.name).join(', ')}
              </p>
            )}
            {patientHistory.chronic_conditions && patientHistory.chronic_conditions.length > 0 && (
              <p>
                <span className="font-semibold">Chronic Conditions:</span>{' '}
                {patientHistory.chronic_conditions.map(c => c.name).join(', ')}
              </p>
            )}
            {patientHistory.current_medications && patientHistory.current_medications.length > 0 && (
              <p>
                <span className="font-semibold">Current Medications:</span>{' '}
                {patientHistory.current_medications.map(m => m.name).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-700" />
            <h3 className="text-lg font-semibold text-blue-900">Vital Signs</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Blood Pressure (mmHg)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={vitals.bloodPressureSystolic}
                  onChange={(e) => handleVitalsChange('bloodPressureSystolic', e.target.value)}
                  placeholder="Systolic"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="flex items-center text-gray-500">/</span>
                <input
                  type="number"
                  value={vitals.bloodPressureDiastolic}
                  onChange={(e) => handleVitalsChange('bloodPressureDiastolic', e.target.value)}
                  placeholder="Diastolic"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Temperature
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                  placeholder="98.6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={vitals.temperatureUnit}
                  onChange={(e) => handleVitalsChange('temperatureUnit', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="F">°F</option>
                  <option value="C">°C</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Pulse Rate (bpm)
              </label>
              <input
                type="number"
                value={vitals.pulseRate}
                onChange={(e) => handleVitalsChange('pulseRate', e.target.value)}
                placeholder="72"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Respiratory Rate (breaths/min)
              </label>
              <input
                type="number"
                value={vitals.respiratoryRate}
                onChange={(e) => handleVitalsChange('respiratoryRate', e.target.value)}
                placeholder="16"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Oxygen Saturation (%)
              </label>
              <input
                type="number"
                value={vitals.oxygenSaturation}
                onChange={(e) => handleVitalsChange('oxygenSaturation', e.target.value)}
                placeholder="98"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={vitals.weight}
                onChange={(e) => handleVitalsChange('weight', e.target.value)}
                placeholder="70"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={vitals.height}
                onChange={(e) => handleVitalsChange('height', e.target.value)}
                placeholder="170"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Symptoms <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddSymptom}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Symptom
            </button>
          </div>

          <div className="space-y-3">
            {symptoms.map((symptom, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-5">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Symptom Name
                    </label>
                    <input
                      type="text"
                      value={symptom.name}
                      onChange={(e) => handleSymptomChange(index, 'name', e.target.value)}
                      placeholder="e.g., Headache, Fever, Cough"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={symptom.duration || ''}
                      onChange={(e) => handleSymptomChange(index, 'duration', e.target.value)}
                      placeholder="e.g., 2 days"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Severity
                    </label>
                    <select
                      value={symptom.severity || 'Mild'}
                      onChange={(e) => handleSymptomChange(index, 'severity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>

                  <div className="md:col-span-1 flex items-end">
                    {symptoms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSymptom(index)}
                        className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Remove symptom"
                      >
                        <Trash2 className="w-5 h-5 mx-auto" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <TestTube className="w-4 h-4" />
              Tests & Investigations
            </label>
            <button
              type="button"
              onClick={handleAddTest}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Test
            </button>
          </div>

          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Test Name
                    </label>
                    <input
                      type="text"
                      value={test.testName}
                      onChange={(e) => handleTestChange(index, 'testName', e.target.value)}
                      placeholder="e.g., Blood Sugar, X-Ray"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Result
                    </label>
                    <input
                      type="text"
                      value={test.result}
                      onChange={(e) => handleTestChange(index, 'result', e.target.value)}
                      placeholder="e.g., 120 mg/dL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={test.notes}
                      onChange={(e) => handleTestChange(index, 'notes', e.target.value)}
                      placeholder="Additional notes"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-1 flex items-end">
                    {tests.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTest(index)}
                        className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Remove test"
                      >
                        <Trash2 className="w-5 h-5 mx-auto" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Pill className="w-4 h-4" />
              Prescribed Medicines
            </label>
            <button
              type="button"
              onClick={handleAddMedicine}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Medicine
            </button>
          </div>

          <div className="space-y-3">
            {medicines.map((medicine, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Medicine Name
                    </label>
                    <input
                      type="text"
                      value={medicine.name}
                      onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                      placeholder="e.g., Paracetamol"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={medicine.dosage}
                      onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                      placeholder="e.g., 500mg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Frequency
                    </label>
                    <input
                      type="text"
                      value={medicine.frequency}
                      onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                      placeholder="e.g., 3x/day"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={medicine.duration}
                      onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                      placeholder="e.g., 5 days"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-1 flex items-end">
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(index)}
                        className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-5 h-5 mx-auto" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional observations, patient concerns, or relevant information..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed font-medium"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Check-In
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { X, Search, Calendar, AlertTriangle } from 'lucide-react';
import { createMedication, updateMedication } from '../services/ehrService';
import { MedicationPrescribed } from '../types';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  medication?: MedicationPrescribed | null;
  patientId: string;
  providerId: string;
}

const commonMedications = [
  { name: 'Metformin', strength: '500mg', form: 'Tablet' },
  { name: 'Lisinopril', strength: '10mg', form: 'Tablet' },
  { name: 'Atorvastatin', strength: '20mg', form: 'Tablet' },
  { name: 'Amlodipine', strength: '5mg', form: 'Tablet' },
  { name: 'Levothyroxine', strength: '50mcg', form: 'Tablet' },
  { name: 'Omeprazole', strength: '20mg', form: 'Capsule' },
  { name: 'Metoprolol', strength: '50mg', form: 'Tablet' },
  { name: 'Losartan', strength: '50mg', form: 'Tablet' },
  { name: 'Albuterol', strength: '90mcg', form: 'Inhaler' },
  { name: 'Gabapentin', strength: '300mg', form: 'Capsule' }
];

const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Patch'];
const frequencies = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 12 hours', 'Every 8 hours', 'As needed', 'Before meals', 'After meals', 'At bedtime'];

export const MedicationModal = ({ isOpen, onClose, onSuccess, medication, patientId, providerId }: MedicationModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [medicationSearch, setMedicationSearch] = useState('');
  const [showMedicationSuggestions, setShowMedicationSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    medicationName: '',
    strength: '',
    dosageForm: 'Tablet',
    dosageInstructions: '',
    frequency: 'Once daily',
    quantity: 30,
    refills: 0,
    startDate: '',
    status: 'Active' as MedicationPrescribed['status'],
    isControlledSubstance: false
  });

  useEffect(() => {
    if (medication) {
      setFormData({
        medicationName: medication.medication_name,
        strength: medication.strength,
        dosageForm: medication.dosage_form,
        dosageInstructions: medication.dosage_instructions,
        frequency: medication.frequency,
        quantity: medication.quantity,
        refills: medication.refills,
        startDate: medication.start_date.split('T')[0],
        status: medication.status,
        isControlledSubstance: medication.is_controlled_substance
      });
    } else {
      setFormData(prev => ({
        ...prev,
        startDate: new Date().toISOString().split('T')[0]
      }));
    }
  }, [medication]);

  const filteredMedications = medicationSearch
    ? commonMedications.filter((med) =>
        med.name.toLowerCase().includes(medicationSearch.toLowerCase())
      )
    : commonMedications;

  const handleSelectMedication = (name: string, strength: string, form: string) => {
    setFormData({ ...formData, medicationName: name, strength, dosageForm: form });
    setShowMedicationSuggestions(false);
    setMedicationSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.medicationName.trim()) {
      setErrorMessage('Medication name is required');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const medicationData: Partial<MedicationPrescribed> = {
        patient_id: patientId,
        prescriber_id: providerId,
        medication_name: formData.medicationName,
        strength: formData.strength,
        dosage_form: formData.dosageForm,
        dosage_instructions: formData.dosageInstructions,
        frequency: formData.frequency,
        quantity: formData.quantity,
        refills: formData.refills,
        start_date: formData.startDate,
        status: formData.status,
        is_controlled_substance: formData.isControlledSubstance
      };

      if (medication) {
        await updateMedication(medication.id, medicationData);
      } else {
        await createMedication(medicationData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving medication:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save medication');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {medication ? 'Edit Medication' : 'Prescribe Medication'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medication Name *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.medicationName || medicationSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  if (formData.medicationName) {
                    setFormData({ ...formData, medicationName: value });
                  } else {
                    setMedicationSearch(value);
                  }
                }}
                onFocus={() => setShowMedicationSuggestions(true)}
                placeholder="Search or enter medication name"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {showMedicationSuggestions && filteredMedications.length > 0 && !formData.medicationName && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredMedications.map((med) => (
                    <button
                      key={med.name}
                      type="button"
                      onClick={() => handleSelectMedication(med.name, med.strength, med.form)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-semibold text-gray-900">{med.name}</p>
                      <p className="text-sm text-gray-600">{med.strength} - {med.form}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strength *
              </label>
              <input
                type="text"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g., 500mg, 10mcg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage Form *
              </label>
              <select
                value={formData.dosageForm}
                onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {dosageForms.map((form) => (
                  <option key={form} value={form}>{form}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosage Instructions *
            </label>
            <input
              type="text"
              value={formData.dosageInstructions}
              onChange={(e) => setFormData({ ...formData, dosageInstructions: e.target.value })}
              placeholder="e.g., Take 1 tablet, Take 2 capsules"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {frequencies.map((freq) => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refills
              </label>
              <input
                type="number"
                value={formData.refills}
                onChange={(e) => setFormData({ ...formData, refills: parseInt(e.target.value) })}
                min="0"
                max="12"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MedicationPrescribed['status'] })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Discontinued">Discontinued</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="controlled"
              checked={formData.isControlledSubstance}
              onChange={(e) => setFormData({ ...formData, isControlledSubstance: e.target.checked })}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <label htmlFor="controlled" className="text-sm font-medium text-gray-700 cursor-pointer">
                Controlled Substance
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Check this box if the medication is a controlled substance requiring special handling
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-blue-300"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : medication ? 'Update Medication' : 'Prescribe Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

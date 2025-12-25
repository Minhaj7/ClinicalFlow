import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, Calendar, AlertTriangle, Shield, Loader2, Sparkles, Pill } from 'lucide-react';
import { createMedication, updateMedication, searchFormularyMedications, getQuickSelectMedicationsBySpecialty } from '../services/ehrService';
import { MedicationPrescribed, DrugFormulary } from '../types';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  medication?: MedicationPrescribed | null;
  patientId: string;
  providerId: string;
  providerSpecialty?: string | null;
}

const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Patch', 'Solution', 'Suspension', 'Powder', 'Gel', 'Spray', 'Suppository'];
const frequencies = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 12 hours', 'Every 8 hours', 'Every 6 hours', 'Every 4 hours', 'As needed', 'Before meals', 'After meals', 'At bedtime', 'Weekly', 'Every other day'];

export const MedicationModal = ({ isOpen, onClose, onSuccess, medication, patientId, providerId, providerSpecialty }: MedicationModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [medicationSearch, setMedicationSearch] = useState('');
  const [showMedicationSuggestions, setShowMedicationSuggestions] = useState(false);
  const [formularyResults, setFormularyResults] = useState<DrugFormulary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFormularyMed, setSelectedFormularyMed] = useState<DrugFormulary | null>(null);
  const [quickSelectMeds, setQuickSelectMeds] = useState<DrugFormulary[]>([]);
  const [isLoadingQuickSelect, setIsLoadingQuickSelect] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (isOpen && !medication) {
      loadQuickSelectMedications();
    }
  }, [isOpen, providerSpecialty, medication]);

  const loadQuickSelectMedications = async () => {
    setIsLoadingQuickSelect(true);
    try {
      const meds = await getQuickSelectMedicationsBySpecialty(providerSpecialty || null);
      setQuickSelectMeds(meds);
    } catch (error) {
      console.error('Error loading quick select medications:', error);
    } finally {
      setIsLoadingQuickSelect(false);
    }
  };

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

  const searchMedications = useCallback(async (term: string) => {
    if (term.length < 2) {
      setFormularyResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchFormularyMedications(term, 15);
      setFormularyResults(results);
    } catch (error) {
      console.error('Error searching formulary:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (medicationSearch.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchMedications(medicationSearch);
      }, 300);
    } else {
      setFormularyResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [medicationSearch, searchMedications]);

  const handleSelectFormularyMedication = (med: DrugFormulary) => {
    setSelectedFormularyMed(med);
    const defaultStrength = med.default_strengths?.[0] || '';
    const defaultForm = med.default_dosage_forms?.[0] || 'Tablet';

    setFormData({
      ...formData,
      medicationName: med.medication_name,
      strength: defaultStrength,
      dosageForm: defaultForm,
      isControlledSubstance: med.is_controlled
    });
    setShowMedicationSuggestions(false);
    setMedicationSearch('');
    setFormularyResults([]);
  };

  const handleManualMedicationEntry = () => {
    setFormData({ ...formData, medicationName: medicationSearch });
    setShowMedicationSuggestions(false);
    setFormularyResults([]);
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

          {!medication && quickSelectMeds.length > 0 && !formData.medicationName && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                  Quick Select {providerSpecialty ? `for ${providerSpecialty}` : ''}
                </span>
              </div>
              {isLoadingQuickSelect ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-blue-600">Loading recommendations...</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {quickSelectMeds.map((med) => (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => handleSelectFormularyMedication(med)}
                      className="group flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-sm"
                    >
                      <Pill className="w-4 h-4 text-blue-500 group-hover:text-white" />
                      <span className="font-medium text-gray-800 group-hover:text-white">{med.medication_name}</span>
                      {med.is_controlled && (
                        <Shield className="w-3 h-3 text-orange-500 group-hover:text-orange-200" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medication Name *
            </label>
            <div className="relative">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
              <input
                type="text"
                value={formData.medicationName || medicationSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  if (formData.medicationName) {
                    setFormData({ ...formData, medicationName: value });
                    setSelectedFormularyMed(null);
                  } else {
                    setMedicationSearch(value);
                  }
                }}
                onFocus={() => setShowMedicationSuggestions(true)}
                placeholder="Type at least 2 characters to search formulary"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {showMedicationSuggestions && !formData.medicationName && medicationSearch.length < 2 && medicationSearch.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                  <p className="text-sm text-gray-500 text-center">
                    Type at least 2 characters to search
                  </p>
                </div>
              )}
              {showMedicationSuggestions && !formData.medicationName && medicationSearch.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Searching formulary...
                    </div>
                  ) : formularyResults.length > 0 ? (
                    <>
                      {formularyResults.map((med) => (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => handleSelectFormularyMedication(med)}
                          className="w-full p-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{med.medication_name}</p>
                              {med.generic_name && med.generic_name !== med.medication_name && (
                                <p className="text-xs text-gray-500 truncate">Generic: {med.generic_name}</p>
                              )}
                              <p className="text-sm text-gray-600 mt-1">
                                {med.therapeutic_class || 'General'}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {med.default_strengths?.slice(0, 3).map((str, idx) => (
                                  <span key={idx} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                    {str}
                                  </span>
                                ))}
                                {(med.default_strengths?.length || 0) > 3 && (
                                  <span className="text-xs text-gray-500">+{(med.default_strengths?.length || 0) - 3} more</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                med.tier === 'Tier 1' ? 'bg-green-100 text-green-700' :
                                med.tier === 'Tier 2' ? 'bg-blue-100 text-blue-700' :
                                med.tier === 'Tier 3' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {med.tier}
                              </span>
                              {med.is_controlled && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                  <Shield className="w-3 h-3" />
                                  {med.dea_schedule || 'Controlled'}
                                </span>
                              )}
                              {med.is_combination && (
                                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs">
                                  Combination
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleManualMedicationEntry}
                        className="w-full p-3 text-left hover:bg-gray-50 border-t border-gray-200 text-blue-600 font-medium"
                      >
                        Use "{medicationSearch}" as custom medication
                      </button>
                    </>
                  ) : (
                    <div className="p-4">
                      <p className="text-gray-500 text-center mb-3">No medications found in formulary</p>
                      <button
                        type="button"
                        onClick={handleManualMedicationEntry}
                        className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                      >
                        Use "{medicationSearch}" as custom medication
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedFormularyMed && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Selected from formulary</p>
                    <p className="text-xs text-blue-700 mt-0.5">{selectedFormularyMed.therapeutic_class}</p>
                    {selectedFormularyMed.requires_prior_auth && (
                      <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Prior authorization required
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFormularyMed(null);
                      setFormData({ ...formData, medicationName: '', strength: '', isControlledSubstance: false });
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strength *
              </label>
              {selectedFormularyMed?.default_strengths && selectedFormularyMed.default_strengths.length > 0 ? (
                <select
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select strength</option>
                  {selectedFormularyMed.default_strengths.map((str) => (
                    <option key={str} value={str}>{str}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  placeholder="e.g., 500mg, 10mcg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
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
                {selectedFormularyMed?.default_dosage_forms && selectedFormularyMed.default_dosage_forms.length > 0 ? (
                  selectedFormularyMed.default_dosage_forms.map((form) => (
                    <option key={form} value={form}>{form}</option>
                  ))
                ) : (
                  dosageForms.map((form) => (
                    <option key={form} value={form}>{form}</option>
                  ))
                )}
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

import { useState, useEffect } from 'react';
import { X, Search, Calendar, AlertTriangle } from 'lucide-react';
import { createProblem, updateProblem } from '../services/ehrService';
import { Problem } from '../types';

interface ProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  problem?: Problem | null;
  patientId: string;
  providerId: string;
}

const commonICD10Codes = [
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'M19.90', description: 'Unspecified osteoarthritis, unspecified site' },
  { code: 'F41.9', description: 'Anxiety disorder, unspecified' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified' },
  { code: 'E66.9', description: 'Obesity, unspecified' },
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
  { code: 'N18.9', description: 'Chronic kidney disease, unspecified' }
];

export const ProblemModal = ({ isOpen, onClose, onSuccess, problem, patientId, providerId }: ProblemModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [icd10Search, setIcd10Search] = useState('');
  const [showIcd10Suggestions, setShowIcd10Suggestions] = useState(false);

  const [formData, setFormData] = useState({
    problemName: '',
    icd10Code: '',
    status: 'Active' as Problem['status'],
    severity: '' as Problem['severity'] | '',
    onsetDate: '',
    resolvedDate: '',
    notes: ''
  });

  useEffect(() => {
    if (problem) {
      setFormData({
        problemName: problem.problem_name,
        icd10Code: problem.icd10_code || '',
        status: problem.status,
        severity: problem.severity || '',
        onsetDate: problem.onset_date || '',
        resolvedDate: problem.resolved_date || '',
        notes: problem.notes || ''
      });
    } else {
      setFormData({
        problemName: '',
        icd10Code: '',
        status: 'Active',
        severity: '',
        onsetDate: new Date().toISOString().split('T')[0],
        resolvedDate: '',
        notes: ''
      });
    }
  }, [problem]);

  const filteredICD10Codes = icd10Search
    ? commonICD10Codes.filter(
        (item) =>
          item.code.toLowerCase().includes(icd10Search.toLowerCase()) ||
          item.description.toLowerCase().includes(icd10Search.toLowerCase())
      )
    : commonICD10Codes;

  const handleSelectICD10 = (code: string, description: string) => {
    setFormData({ ...formData, icd10Code: code, problemName: formData.problemName || description });
    setShowIcd10Suggestions(false);
    setIcd10Search('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.problemName.trim()) {
      setErrorMessage('Problem name is required');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const problemData: Partial<Problem> = {
        patient_id: patientId,
        provider_id: providerId,
        problem_name: formData.problemName,
        icd10_code: formData.icd10Code || undefined,
        status: formData.status,
        severity: formData.severity || undefined,
        onset_date: formData.onsetDate || undefined,
        resolved_date: formData.resolvedDate || undefined,
        notes: formData.notes || undefined
      };

      if (problem) {
        await updateProblem(problem.id, problemData);
      } else {
        await createProblem(problemData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving problem:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save problem');
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
            {problem ? 'Edit Problem' : 'Add New Problem'}
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
              Problem / Diagnosis *
            </label>
            <input
              type="text"
              value={formData.problemName}
              onChange={(e) => setFormData({ ...formData, problemName: e.target.value })}
              placeholder="e.g., Type 2 Diabetes Mellitus"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ICD-10 Code
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.icd10Code || icd10Search}
                onChange={(e) => {
                  const value = e.target.value;
                  if (formData.icd10Code) {
                    setFormData({ ...formData, icd10Code: value });
                  } else {
                    setIcd10Search(value);
                  }
                }}
                onFocus={() => setShowIcd10Suggestions(true)}
                placeholder="Search or enter ICD-10 code"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showIcd10Suggestions && filteredICD10Codes.length > 0 && !formData.icd10Code && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredICD10Codes.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSelectICD10(item.code, item.description)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-semibold text-gray-900">{item.code}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Start typing to search common diagnoses or enter code directly
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Problem['status'] })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Active">Active</option>
                <option value="Chronic">Chronic</option>
                <option value="Resolved">Resolved</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: (e.target.value || undefined) as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not specified</option>
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Onset Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.onsetDate}
                  onChange={(e) => setFormData({ ...formData, onsetDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolved Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.resolvedDate}
                  onChange={(e) => setFormData({ ...formData, resolvedDate: e.target.value })}
                  disabled={formData.status !== 'Resolved'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              {formData.status !== 'Resolved' && (
                <p className="text-xs text-gray-500 mt-1">
                  Set status to "Resolved" to enter resolved date
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Additional clinical notes, treatment plans, or relevant information..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              {isLoading ? 'Saving...' : problem ? 'Update Problem' : 'Add Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

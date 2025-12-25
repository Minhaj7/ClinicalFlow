import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  XCircle
} from 'lucide-react';
import { DashboardHeader } from '../components/DashboardHeader';
import { MedicationModal } from '../components/MedicationModal';
import { getPatientMedications, getHealthcareProvider } from '../services/ehrService';
import { searchPatients } from '../services/databaseService';
import { MedicationPrescribed, Patient } from '../types';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type FilterStatus = 'all' | 'Active' | 'Completed' | 'Discontinued' | 'On Hold';

export const Medications = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [medications, setMedications] = useState<MedicationPrescribed[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<MedicationPrescribed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationPrescribed | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadProviderInfo();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientMedications();
    }
  }, [selectedPatient]);

  useEffect(() => {
    applyFilters();
  }, [medications, searchTerm, filterStatus]);

  useEffect(() => {
    if (patientSearchTerm.length > 2) {
      handleSearchPatients();
    } else {
      setPatientSearchResults([]);
    }
  }, [patientSearchTerm]);

  const loadProviderInfo = async () => {
    if (!user) return;
    try {
      const provider = await getHealthcareProvider(user.id);
      if (provider) {
        setProviderId(provider.id);
      }
    } catch (error) {
      console.error('Error loading provider info:', error);
    }
  };

  const loadPatientMedications = async () => {
    if (!selectedPatient) return;

    try {
      setIsLoading(true);
      const patientMedications = await getPatientMedications(selectedPatient.id);
      setMedications(patientMedications);
    } catch (error) {
      console.error('Error loading medications:', error);
      setErrorMessage('Failed to load medications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchPatients = async () => {
    try {
      const results = await searchPatients(patientSearchTerm, user?.id || '');
      setPatientSearchResults(results);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSearch(false);
    setPatientSearchTerm('');
    setPatientSearchResults([]);
  };

  const applyFilters = () => {
    let filtered = [...medications];

    if (searchTerm) {
      filtered = filtered.filter((med) =>
        med.medication_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((med) => med.status === filterStatus);
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setFilteredMedications(filtered);
  };

  const handleNewMedication = () => {
    if (!selectedPatient) {
      setErrorMessage('Please select a patient first');
      return;
    }
    setSelectedMedication(null);
    setShowMedicationModal(true);
  };

  const handleEditMedication = (medication: MedicationPrescribed) => {
    setSelectedMedication(medication);
    setShowMedicationModal(true);
  };

  const handleMedicationSaved = () => {
    setShowMedicationModal(false);
    setSelectedMedication(null);
    setSuccessMessage('Medication saved successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
    loadPatientMedications();
  };

  const getStatusColor = (status: MedicationPrescribed['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-300';
      case 'Completed': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Discontinued': return 'bg-red-100 text-red-800 border-red-300';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Pill className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Medications</h1>
                <p className="text-slate-600 mt-1">Manage patient prescriptions and medications</p>
              </div>
            </div>
            <button
              onClick={handleNewMedication}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5" />
              Prescribe Medication
            </button>
          </div>

          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          )}

          {!selectedPatient ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Patient</h3>
              <p className="text-slate-600 mb-6">
                Search and select a patient to view their medication list
              </p>
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patient by name, CNIC, or phone..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  onFocus={() => setShowPatientSearch(true)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showPatientSearch && patientSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {patientSearchResults.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <p className="font-semibold text-gray-900">{patient.full_name}</p>
                        <p className="text-sm text-gray-600">
                          {patient.cnic} • {patient.phone_number}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{selectedPatient.full_name}</h3>
                    <p className="text-sm text-slate-600">
                      {selectedPatient.cnic} • {selectedPatient.phone_number}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Change Patient
                  </button>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search medications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Discontinued">Discontinued</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-4 text-slate-600">Loading medications...</p>
                </div>
              ) : filteredMedications.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                  <Pill className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Medications Found</h3>
                  <p className="text-slate-600 mb-6">
                    {medications.length === 0
                      ? 'No medications have been prescribed for this patient'
                      : 'No medications match your current filters'}
                  </p>
                  {medications.length === 0 && (
                    <button
                      onClick={handleNewMedication}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Prescribe First Medication
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMedications.map((medication) => (
                    <div
                      key={medication.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <Pill className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                {medication.medication_name}
                              </h3>
                              <div className="space-y-1 text-sm text-slate-600 mb-3">
                                <p>
                                  <span className="font-medium">Strength:</span> {medication.strength}
                                </p>
                                <p>
                                  <span className="font-medium">Form:</span> {medication.dosage_form}
                                </p>
                                <p>
                                  <span className="font-medium">Dosage:</span> {medication.dosage_instructions}
                                </p>
                                <p>
                                  <span className="font-medium">Frequency:</span> {medication.frequency}
                                </p>
                                <p>
                                  <span className="font-medium">Quantity:</span> {medication.quantity} • <span className="font-medium">Refills:</span> {medication.refills}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Started: {formatDate(medication.start_date)}
                                </span>
                                {medication.is_controlled_substance && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                                    Controlled Substance
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(medication.status)}`}>
                              {medication.status}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleEditMedication(medication)}
                          className="ml-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showMedicationModal && selectedPatient && providerId && (
        <MedicationModal
          isOpen={showMedicationModal}
          onClose={() => {
            setShowMedicationModal(false);
            setSelectedMedication(null);
          }}
          onSuccess={handleMedicationSaved}
          medication={selectedMedication}
          patientId={selectedPatient.id}
          providerId={providerId}
        />
      )}
    </div>
  );
};

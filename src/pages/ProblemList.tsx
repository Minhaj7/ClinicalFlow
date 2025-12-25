import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  X
} from 'lucide-react';
import { DashboardHeader } from '../components/DashboardHeader';
import { ProblemModal } from '../components/ProblemModal';
import { getPatientProblems, ensureHealthcareProvider } from '../services/ehrService';
import { searchPatients } from '../services/databaseService';
import { Problem, Patient } from '../types';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type FilterStatus = 'all' | 'Active' | 'Resolved' | 'Chronic' | 'Inactive';
type FilterSeverity = 'all' | 'Mild' | 'Moderate' | 'Severe' | 'Critical';

export const ProblemList = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);
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
      loadPatientProblems();
    }
  }, [selectedPatient]);

  useEffect(() => {
    applyFilters();
  }, [problems, searchTerm, filterStatus, filterSeverity]);

  useEffect(() => {
    if (patientSearchTerm.length > 2) {
      handleSearchPatients();
    } else {
      setPatientSearchResults([]);
    }
  }, [patientSearchTerm]);

  const loadProviderInfo = async () => {
    if (!user) return;
    setIsLoadingProvider(true);
    try {
      const provider = await ensureHealthcareProvider(user.id);
      setProviderId(provider?.id || null);
    } catch (error) {
      console.error('Error loading provider info:', error);
      setProviderId(null);
    } finally {
      setIsLoadingProvider(false);
    }
  };

  const loadPatientProblems = async () => {
    if (!selectedPatient) return;

    try {
      setIsLoading(true);
      const patientProblems = await getPatientProblems(selectedPatient.id);
      setProblems(patientProblems);
    } catch (error) {
      console.error('Error loading problems:', error);
      setErrorMessage('Failed to load problem list');
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
    let filtered = [...problems];

    if (searchTerm) {
      filtered = filtered.filter(
        (problem) =>
          problem.problem_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          problem.icd10_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((problem) => problem.status === filterStatus);
    }

    if (filterSeverity !== 'all') {
      filtered = filtered.filter((problem) => problem.severity === filterSeverity);
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setFilteredProblems(filtered);
  };

  const handleNewProblem = () => {
    if (!selectedPatient) {
      setErrorMessage('Please select a patient first');
      return;
    }
    if (isLoadingProvider) {
      setErrorMessage('Loading provider information, please wait...');
      return;
    }
    if (!providerId) {
      setErrorMessage('You need to be registered as a healthcare provider to add problems. Please complete your profile setup.');
      return;
    }
    setErrorMessage(null);
    setSelectedProblem(null);
    setShowProblemModal(true);
  };

  const handleEditProblem = (problem: Problem) => {
    if (!providerId) {
      setErrorMessage('You need to be registered as a healthcare provider to edit problems.');
      return;
    }
    setSelectedProblem(problem);
    setShowProblemModal(true);
  };

  const handleProblemSaved = () => {
    setShowProblemModal(false);
    setSelectedProblem(null);
    setSuccessMessage('Problem saved successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
    loadPatientProblems();
  };

  const getStatusColor = (status: Problem['status']) => {
    switch (status) {
      case 'Active': return 'bg-red-100 text-red-800 border-red-300';
      case 'Chronic': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-300';
      case 'Inactive': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityColor = (severity?: Problem['severity']) => {
    if (!severity) return 'bg-gray-100 text-gray-800';
    switch (severity) {
      case 'Critical': return 'bg-red-600 text-white';
      case 'Severe': return 'bg-orange-600 text-white';
      case 'Moderate': return 'bg-yellow-600 text-white';
      case 'Mild': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
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
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Problem List</h1>
                <p className="text-slate-600 mt-1">Manage patient diagnoses and health problems</p>
              </div>
            </div>
            <button
              onClick={handleNewProblem}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Problem
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

          {isLoadingProvider && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
              <p className="text-sm font-medium text-blue-800">Setting up provider access...</p>
            </div>
          )}

          {!isLoadingProvider && !providerId && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-800">
                Provider access not available. Please ensure your profile is complete with a valid clinic name.
              </p>
            </div>
          )}

          {!selectedPatient ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Patient</h3>
              <p className="text-slate-600 mb-6">
                Search and select a patient to view their problem list
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
                      placeholder="Search problems or ICD-10 codes..."
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
                    <option value="Chronic">Chronic</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value as FilterSeverity)}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Severity</option>
                    <option value="Critical">Critical</option>
                    <option value="Severe">Severe</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Mild">Mild</option>
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-4 text-slate-600">Loading problem list...</p>
                </div>
              ) : filteredProblems.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Problems Found</h3>
                  <p className="text-slate-600 mb-6">
                    {problems.length === 0
                      ? 'No problems have been documented for this patient'
                      : 'No problems match your current filters'}
                  </p>
                  {problems.length === 0 && (
                    <button
                      onClick={handleNewProblem}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Add First Problem
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProblems.map((problem) => (
                    <div
                      key={problem.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                              problem.status === 'Active' ? 'text-red-600' :
                              problem.status === 'Chronic' ? 'text-orange-600' :
                              problem.status === 'Resolved' ? 'text-green-600' :
                              'text-gray-600'
                            }`} />
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                {problem.problem_name}
                              </h3>
                              {problem.icd10_code && (
                                <p className="text-sm text-slate-600 mb-2">
                                  ICD-10: <span className="font-mono font-semibold">{problem.icd10_code}</span>
                                </p>
                              )}
                              {problem.notes && (
                                <p className="text-sm text-slate-700 mb-3">{problem.notes}</p>
                              )}
                              <div className="flex items-center gap-3 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Onset: {formatDate(problem.onset_date)}
                                </span>
                                {problem.resolved_date && (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    Resolved: {formatDate(problem.resolved_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(problem.status)}`}>
                              {problem.status}
                            </span>
                            {problem.severity && (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(problem.severity)}`}>
                                {problem.severity}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleEditProblem(problem)}
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

      {showProblemModal && selectedPatient && providerId && (
        <ProblemModal
          isOpen={showProblemModal}
          onClose={() => {
            setShowProblemModal(false);
            setSelectedProblem(null);
          }}
          onSuccess={handleProblemSaved}
          problem={selectedProblem}
          patientId={selectedPatient.id}
          providerId={providerId}
        />
      )}
    </div>
  );
};

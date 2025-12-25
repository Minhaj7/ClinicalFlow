import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Filter,
  X
} from 'lucide-react';
import { DashboardHeader } from '../components/DashboardHeader';
import PatientRegistrationModal from '../components/PatientRegistrationModal';
import { PatientHistoryModal } from '../components/PatientHistoryModal';
import { MedicalTestUploadModal } from '../components/MedicalTestUploadModal';
import { searchPatients, deletePatient } from '../services/databaseService';
import { Patient } from '../types';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export const Patients = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientHistory, setShowPatientHistory] = useState(false);
  const [showTestUpload, setShowTestUpload] = useState(false);
  const [filterGender, setFilterGender] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadPatients = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const allPatients = await searchPatients('', user.id);
      setPatients(allPatients);
      setFilteredPatients(allPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPatients();
    }
  }, [user]);

  useEffect(() => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.cnic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterGender !== 'all') {
      filtered = filtered.filter((patient) => patient.gender === filterGender);
    }

    setFilteredPatients(filtered);
  }, [searchTerm, filterGender, patients]);

  const handlePatientRegistered = async (patient: Patient) => {
    setShowRegistrationModal(false);
    setSuccessMessage(`Patient ${patient.full_name} registered successfully!`);
    setTimeout(() => setSuccessMessage(null), 5000);
    await loadPatients();
  };

  const handleViewHistory = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientHistory(true);
  };

  const handleUploadTests = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowTestUpload(true);
  };

  const handleTestUploadSuccess = () => {
    setShowTestUpload(false);
    setSuccessMessage('Test results uploaded successfully!');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleDeletePatient = async (patientId: string, patientName: string) => {
    if (!confirm(`Are you sure you want to delete ${patientName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deletePatient(patientId);
      setSuccessMessage(`Patient ${patientName} deleted successfully!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete patient');
    }
  };

  const calculateAge = (dateOfBirth: string | null): string => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} years`;
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
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
                <p className="text-slate-600 mt-1">
                  {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'} registered
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRegistrationModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add New Patient
            </button>
          </div>

          {successMessage && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, CNIC, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium transition-colors ${
                  showFilters
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-slate-700">Gender:</label>
                  <div className="flex gap-2">
                    {['all', 'Male', 'Female', 'Other'].map((gender) => (
                      <button
                        key={gender}
                        onClick={() => setFilterGender(gender)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          filterGender === gender
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </button>
                    ))}
                  </div>
                  {filterGender !== 'all' && (
                    <button
                      onClick={() => setFilterGender('all')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {patients.length === 0 ? 'No Patients Yet' : 'No Patients Found'}
            </h3>
            <p className="text-slate-600 mb-6">
              {patients.length === 0
                ? 'Start by adding your first patient to the system'
                : 'Try adjusting your search or filters'}
            </p>
            {patients.length === 0 && (
              <button
                onClick={() => setShowRegistrationModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Add First Patient
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold text-sm">
                              {patient.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{patient.full_name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {patient.cnic && (
                                <span className="text-xs text-slate-600 flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" />
                                  {patient.cnic}
                                </span>
                              )}
                              {patient.gender && (
                                <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                                  {patient.gender}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {patient.phone_number && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{patient.phone_number}</span>
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="w-3.5 h-3.5" />
                              <span className="truncate max-w-xs">{patient.email}</span>
                            </div>
                          )}
                          {!patient.phone_number && !patient.email && (
                            <span className="text-sm text-slate-400">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {patient.date_of_birth ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{calculateAge(patient.date_of_birth)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {patient.city ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{patient.city}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleViewHistory(patient)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            History
                          </button>
                          <button
                            onClick={() => handleUploadTests(patient)}
                            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            Tests
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <PatientRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={handlePatientRegistered}
        receptionistId={user.id}
      />

      {selectedPatient && (
        <PatientHistoryModal
          isOpen={showPatientHistory}
          onClose={() => {
            setShowPatientHistory(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
          onUploadTests={() => {
            setShowPatientHistory(false);
            setShowTestUpload(true);
          }}
        />
      )}

      {selectedPatient && (
        <MedicalTestUploadModal
          isOpen={showTestUpload}
          onClose={() => {
            setShowTestUpload(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
          receptionistId={user.id}
          onSuccess={handleTestUploadSuccess}
        />
      )}
    </div>
  );
};

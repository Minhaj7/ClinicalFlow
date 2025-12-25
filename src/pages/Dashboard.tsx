import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Building2, UserPlus, FileText, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { ManualCheckInForm } from '../components/ManualCheckInForm';
import { RecentCheckIns } from '../components/RecentCheckIns';
import { EditPatientVisitModal } from '../components/EditPatientVisitModal';
import PatientSearchModal from '../components/PatientSearchModal';
import PatientRegistrationModal from '../components/PatientRegistrationModal';
import VitalSignsModal from '../components/VitalSignsModal';
import { PatientHistoryModal } from '../components/PatientHistoryModal';
import { MedicalTestUploadModal } from '../components/MedicalTestUploadModal';
import {
  savePatientVisit,
  getRecentVisits,
  deletePatientVisit,
  updatePatientVisit,
  getMedicalHistory
} from '../services/databaseService';
import { PatientVisit, Symptom, Patient, PatientMedicalHistory, VitalSigns } from '../types';
import { supabase } from '../lib/supabase';
import { useProfile } from '../contexts/ProfileContext';
import type { User } from '@supabase/supabase-js';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [user, setUser] = useState<User | null>(null);
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingVisit, setEditingVisit] = useState<PatientVisit | null>(null);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientMedicalHistory | null>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [showPatientRegistration, setShowPatientRegistration] = useState(false);
  const [showVitalSigns, setShowVitalSigns] = useState(false);
  const [showPatientHistory, setShowPatientHistory] = useState(false);
  const [showTestUpload, setShowTestUpload] = useState(false);
  const [lastSavedVisitId, setLastSavedVisitId] = useState<string | null>(null);

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
    if (user) {
      loadRecentVisits();
    }
  }, [user]);

  const handleDeleteVisit = async (visitId: string) => {
    setVisits((prev) => prev.filter((v) => v.id !== visitId));

    try {
      await deletePatientVisit(visitId);
    } catch (error) {
      console.error('Error deleting visit:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete visit');
      await loadRecentVisits();
    }
  };

  const handleEditVisit = (visit: PatientVisit) => {
    setEditingVisit(visit);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSaveEdit = async (
    visitId: string,
    transcript: string,
    patientData: any,
    symptomsData: Symptom[]
  ) => {
    const previousVisits = [...visits];

    setVisits((prev) =>
      prev.map((v) =>
        v.id === visitId
          ? { ...v, patient_data: patientData, symptoms_data: symptomsData }
          : v
      )
    );

    try {
      await updatePatientVisit(visitId, transcript, patientData, symptomsData);
      setSuccessMessage('Patient visit updated successfully!');

      await loadRecentVisits();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error updating visit:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update visit');
      setVisits(previousVisits);
    }
  };

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSearch(false);

    try {
      const history = await getMedicalHistory(patient.id);
      setPatientHistory(history);
    } catch (error) {
      console.error('Failed to load patient history:', error);
    }
  };

  const handleNewPatient = () => {
    setShowPatientSearch(false);
    setShowPatientRegistration(true);
  };

  const handlePatientRegistered = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientRegistration(false);
    setSuccessMessage(`Patient ${patient.full_name} registered successfully!`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleVitalSignsSaved = (vitalSigns: VitalSigns) => {
    setShowVitalSigns(false);
    setSuccessMessage('Vital signs recorded successfully!');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setPatientHistory(null);
  };

  const handleViewHistory = () => {
    if (selectedPatient) {
      setShowPatientHistory(true);
    }
  };

  const handleUploadTests = () => {
    if (selectedPatient) {
      setShowTestUpload(true);
    }
  };

  const handleTestUploadSuccess = () => {
    setShowTestUpload(false);
    setSuccessMessage('Test results uploaded successfully!');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleHistoryModalUploadTests = () => {
    setShowPatientHistory(false);
    setShowTestUpload(true);
  };

  const handleManualCheckIn = async (
    patientData: any,
    symptomsData: Symptom[],
    notes: string,
    vitals?: any,
    tests?: any[],
    medicines?: any[]
  ) => {
    if (!user) {
      setErrorMessage('You must be logged in to save patient check-ins');
      return;
    }

    if (!selectedPatient) {
      setErrorMessage('Please select a patient before recording');
      return;
    }

    setIsProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const checkInData = {
        patient_data: patientData,
        symptoms_data: symptomsData,
        vitals_data: vitals,
        tests_data: tests || [],
        medicines_data: medicines || []
      };

      const visit = await savePatientVisit(
        notes || 'Manual check-in',
        checkInData,
        user.id,
        selectedPatient.id,
        'New Visit'
      );

      setLastSavedVisitId(visit.id);
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Patient Check-in</h1>
              <p className="text-slate-600 mt-1">
                Clinic: <span className="font-semibold text-slate-900">{profile?.clinic_name || 'Loading...'}</span>
              </p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
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

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 mb-8">
          {!selectedPatient ? (
            <div className="text-center py-12">
              <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Patient to Continue</h3>
              <p className="text-gray-600 mb-6">
                Search for an existing patient or register a new one to start the check-in process
              </p>
              <button
                onClick={() => setShowPatientSearch(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Select Patient
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recording for: {selectedPatient.full_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedPatient.cnic ? `CNIC: ${selectedPatient.cnic}` : 'Walk-in Patient'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleViewHistory}
                    className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                  >
                    <History className="w-4 h-4" />
                    View History
                  </button>
                  <button
                    onClick={handleUploadTests}
                    className="flex items-center gap-2 px-4 py-2 text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                  >
                    <FileText className="w-4 h-4" />
                    Upload Tests
                  </button>
                  <button
                    onClick={handleClearPatient}
                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                  >
                    Change Patient
                  </button>
                </div>
              </div>
              <ManualCheckInForm
                onSubmit={handleManualCheckIn}
                isProcessing={isProcessing}
                selectedPatient={selectedPatient}
                patientHistory={patientHistory}
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <RecentCheckIns visits={visits} isLoading={isLoading} onDelete={handleDeleteVisit} onEdit={handleEditVisit} />
        </div>
      </main>

      {editingVisit && (
        <EditPatientVisitModal
          visit={editingVisit}
          isOpen={!!editingVisit}
          onClose={() => setEditingVisit(null)}
          onSave={handleSaveEdit}
        />
      )}

      <PatientSearchModal
        isOpen={showPatientSearch}
        onClose={() => setShowPatientSearch(false)}
        onSelectPatient={handleSelectPatient}
        onNewPatient={handleNewPatient}
        receptionistId={user.id}
      />

      <PatientRegistrationModal
        isOpen={showPatientRegistration}
        onClose={() => setShowPatientRegistration(false)}
        onSuccess={handlePatientRegistered}
        receptionistId={user.id}
      />

      {selectedPatient && (
        <VitalSignsModal
          isOpen={showVitalSigns}
          onClose={() => setShowVitalSigns(false)}
          onSuccess={handleVitalSignsSaved}
          patientId={selectedPatient.id}
          visitId={lastSavedVisitId || undefined}
          measuredBy={user.id}
        />
      )}

      {selectedPatient && (
        <PatientHistoryModal
          isOpen={showPatientHistory}
          onClose={() => setShowPatientHistory(false)}
          patient={selectedPatient}
          onUploadTests={handleHistoryModalUploadTests}
        />
      )}

      {selectedPatient && (
        <MedicalTestUploadModal
          isOpen={showTestUpload}
          onClose={() => setShowTestUpload(false)}
          patient={selectedPatient}
          receptionistId={user.id}
          onSuccess={handleTestUploadSuccess}
        />
      )}
    </div>
  );
};

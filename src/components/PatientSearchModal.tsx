import { useState, useEffect } from 'react';
import { Search, X, UserPlus, User, Trash2 } from 'lucide-react';
import { Patient } from '../types';
import { searchPatients, getRecentPatients, deletePatient } from '../services/databaseService';

interface PatientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patient: Patient) => void;
  onNewPatient: () => void;
  receptionistId: string;
}

export default function PatientSearchModal({
  isOpen,
  onClose,
  onSelectPatient,
  onNewPatient,
  receptionistId
}: PatientSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRecentPatients();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadRecentPatients = async () => {
    try {
      const patients = await searchPatients('', receptionistId);
      setRecentPatients(patients.slice(0, 10));
    } catch (error) {
      console.error('Failed to load recent patients:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const results = await searchPatients(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string | null): string => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} years`;
  };

  const formatCNIC = (cnic: string | null): string => {
    if (!cnic) return 'Walk-in';
    return cnic;
  };

  const handleDeletePatient = async (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete patient ${patient.full_name}? This will also delete all associated visits, medical history, tests, and vital signs. This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deletePatient(patient.id);
      setRecentPatients(prev => prev.filter(p => p.id !== patient.id));
      setSearchResults(prev => prev.filter(p => p.id !== patient.id));
    } catch (error) {
      alert('Failed to delete patient: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const PatientCard = ({ patient }: { patient: Patient }) => (
    <div
      onClick={() => onSelectPatient(patient)}
      className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all relative group"
    >
      <button
        onClick={(e) => handleDeletePatient(patient, e)}
        className="absolute top-3 right-3 p-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
        title="Delete patient"
      >
        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0 pr-10">
          <h3 className="font-semibold text-gray-900">{patient.full_name}</h3>
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-600">
              {patient.cnic ? (
                <span>CNIC: {formatCNIC(patient.cnic)}</span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Walk-in Patient
                </span>
              )}
            </p>
            {patient.phone_number && (
              <p className="text-sm text-gray-600">Phone: {patient.phone_number}</p>
            )}
            {patient.date_of_birth && (
              <p className="text-sm text-gray-600">Age: {calculateAge(patient.date_of_birth)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Select Patient</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-3">
            <p className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              Search across all facilities - Patient records are shared system-wide via CNIC
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, CNIC, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          <button
            onClick={onNewPatient}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <UserPlus className="w-5 h-5" />
            Register New Patient
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center py-8 text-gray-500">Searching...</div>
          )}

          {searchTerm && !loading && searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No patients found matching "{searchTerm}"
            </div>
          )}

          {searchTerm && searchResults.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Search Results ({searchResults.length})
              </h3>
              <div className="space-y-3">
                {searchResults.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
              </div>
            </div>
          )}

          {!searchTerm && recentPatients.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Recent Patients
              </h3>
              <div className="space-y-3">
                {recentPatients.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
              </div>
            </div>
          )}

          {!searchTerm && recentPatients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent patients. Start by registering a new patient.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

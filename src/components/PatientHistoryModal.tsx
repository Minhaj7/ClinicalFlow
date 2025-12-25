import { useState, useEffect } from 'react';
import { X, User, Activity, FileText, Heart, Upload, Download, Calendar, Clock, FileDown } from 'lucide-react';
import { Patient, PatientVisit, MedicalTest, VitalSigns, PatientMedicalHistory } from '../types';
import {
  getPatientVisits,
  getMedicalTests,
  getVitalSigns,
  getMedicalHistory
} from '../services/databaseService';
import { getSignedUrl } from '../services/storageService';
import { generateVisitReportPDF } from '../services/pdfService';

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onUploadTests: () => void;
}

type TabType = 'visits' | 'tests' | 'vitals' | 'history';

export const PatientHistoryModal = ({ isOpen, onClose, patient, onUploadTests }: PatientHistoryModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('visits');
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [tests, setTests] = useState<MedicalTest[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<PatientMedicalHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && patient) {
      loadPatientData();
    }
  }, [isOpen, patient]);

  const loadPatientData = async () => {
    setIsLoading(true);
    try {
      const [visitsData, testsData, vitalsData, historyData] = await Promise.all([
        getPatientVisits(patient.id),
        getMedicalTests(patient.id),
        getVitalSigns(patient.id),
        getMedicalHistory(patient.id)
      ]);
      setVisits(visitsData);
      setTests(testsData);
      setVitalSigns(vitalsData);
      setMedicalHistory(historyData);
    } catch (error) {
      console.error('Failed to load patient data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      const signedUrl = await getSignedUrl(filePath);
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDownloadVisitPDF = (visit: PatientVisit) => {
    generateVisitReportPDF(visit, patient);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{patient.full_name}</h2>
              <p className="text-blue-100">
                {patient.cnic && `CNIC: ${patient.cnic}`}
                {patient.phone_number && ` • ${patient.phone_number}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex gap-1 p-4">
            <button
              onClick={() => setActiveTab('visits')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'visits'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:bg-opacity-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              Visits ({visits.length})
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'tests'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:bg-opacity-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Tests ({tests.length})
            </button>
            <button
              onClick={() => setActiveTab('vitals')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'vitals'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:bg-opacity-50'
              }`}
            >
              <Heart className="w-4 h-4" />
              Vital Signs ({vitalSigns.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:bg-opacity-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Medical History
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading patient data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'visits' && (
                <div className="space-y-4">
                  {visits.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>No visits recorded yet</p>
                    </div>
                  ) : (
                    visits.map((visit) => (
                      <div key={visit.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-sm font-semibold text-blue-600">
                              {visit.visit_type || 'Visit'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(visit.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {visit.doctor_name && (
                              <span className="text-sm text-gray-600">Dr. {visit.doctor_name}</span>
                            )}
                            <button
                              onClick={() => handleDownloadVisitPDF(visit)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                              title="Download Visit Report PDF"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              PDF
                            </button>
                          </div>
                        </div>

                        {visit.symptoms_data && visit.symptoms_data.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Symptoms:</h4>
                            <div className="space-y-2">
                              {visit.symptoms_data.map((symptom, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-sm text-gray-700">• {symptom.name}</span>
                                  {symptom.severity && (
                                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                                      {symptom.severity}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {visit.visit_notes && (
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
                            <span className="font-semibold">Notes: </span>
                            {visit.visit_notes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={onUploadTests}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Test Results
                    </button>
                  </div>

                  {tests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>No test results uploaded yet</p>
                    </div>
                  ) : (
                    tests.map((test) => (
                      <div key={test.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{test.test_type}</h4>
                            <p className="text-sm text-gray-600">{test.lab_name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(test.test_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {test.test_values && test.test_values.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Test Values:</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {test.test_values.map((value, idx) => (
                                <div key={idx} className="bg-white p-2 rounded border border-gray-200 text-sm">
                                  <span className="font-medium">{value.parameter}:</span> {value.value} {value.unit}
                                  {value.referenceRange && (
                                    <span className="text-xs text-gray-500 block">
                                      Range: {value.referenceRange}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {test.doctor_notes && (
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200 mb-3">
                            <span className="font-semibold">Notes: </span>
                            {test.doctor_notes}
                          </div>
                        )}

                        {test.file_attachments && test.file_attachments.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Attachments:</h5>
                            <div className="space-y-2">
                              {test.file_attachments.map((file) => (
                                <button
                                  key={file.id}
                                  onClick={() => handleDownloadFile(file.filePath, file.fileName)}
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded w-full text-left"
                                >
                                  <Download className="w-4 h-4" />
                                  <span className="flex-1">{file.fileName}</span>
                                  <span className="text-xs text-gray-500">
                                    {(file.fileSize / 1024).toFixed(0)} KB
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'vitals' && (
                <div className="space-y-4">
                  {vitalSigns.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>No vital signs recorded yet</p>
                    </div>
                  ) : (
                    vitalSigns.map((vital) => (
                      <div key={vital.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <p className="text-sm text-gray-600">{formatDate(vital.measured_at)}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-xs text-gray-500">Blood Pressure</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                              </p>
                              <p className="text-xs text-gray-500">mmHg</p>
                            </div>
                          )}
                          {vital.pulse_rate && (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-xs text-gray-500">Pulse Rate</p>
                              <p className="text-lg font-semibold text-gray-900">{vital.pulse_rate}</p>
                              <p className="text-xs text-gray-500">bpm</p>
                            </div>
                          )}
                          {vital.temperature && (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-xs text-gray-500">Temperature</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {vital.temperature}°{vital.temperature_unit}
                              </p>
                            </div>
                          )}
                          {vital.respiratory_rate && (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-xs text-gray-500">Respiratory Rate</p>
                              <p className="text-lg font-semibold text-gray-900">{vital.respiratory_rate}</p>
                              <p className="text-xs text-gray-500">breaths/min</p>
                            </div>
                          )}
                          {vital.oxygen_saturation && (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-xs text-gray-500">O2 Saturation</p>
                              <p className="text-lg font-semibold text-gray-900">{vital.oxygen_saturation}%</p>
                            </div>
                          )}
                          {vital.weight && (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-xs text-gray-500">Weight</p>
                              <p className="text-lg font-semibold text-gray-900">{vital.weight}</p>
                              <p className="text-xs text-gray-500">kg</p>
                            </div>
                          )}
                          {vital.height && (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-xs text-gray-500">Height</p>
                              <p className="text-lg font-semibold text-gray-900">{vital.height}</p>
                              <p className="text-xs text-gray-500">cm</p>
                            </div>
                          )}
                        </div>
                        {vital.notes && (
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200 mt-3">
                            <span className="font-semibold">Notes: </span>
                            {vital.notes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  {!medicalHistory ? (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>No medical history recorded yet</p>
                    </div>
                  ) : (
                    <>
                      {medicalHistory.known_allergies && medicalHistory.known_allergies.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                          <h4 className="font-semibold text-red-900 mb-3">Allergies</h4>
                          <div className="space-y-2">
                            {medicalHistory.known_allergies.map((allergy, idx) => (
                              <div key={idx} className="bg-white p-3 rounded border border-red-200">
                                <div className="flex justify-between items-start">
                                  <span className="font-medium text-gray-900">{allergy.name}</span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    allergy.severity === 'Severe' ? 'bg-red-100 text-red-800' :
                                    allergy.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {allergy.severity}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{allergy.reaction}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {medicalHistory.chronic_conditions && medicalHistory.chronic_conditions.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Chronic Conditions</h4>
                          <div className="space-y-2">
                            {medicalHistory.chronic_conditions.map((condition, idx) => (
                              <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                                <span className="font-medium text-gray-900">{condition.name}</span>
                                <p className="text-sm text-gray-600 mt-1">
                                  Diagnosed: {new Date(condition.diagnosisDate).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {medicalHistory.current_medications && medicalHistory.current_medications.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-3">Current Medications</h4>
                          <div className="space-y-2">
                            {medicalHistory.current_medications.map((med, idx) => (
                              <div key={idx} className="bg-white p-3 rounded border border-blue-200">
                                <span className="font-medium text-gray-900">{med.name}</span>
                                <p className="text-sm text-gray-600 mt-1">
                                  {med.dosage} - {med.frequency}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Started: {new Date(med.startDate).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {medicalHistory.past_surgeries && medicalHistory.past_surgeries.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Past Surgeries</h4>
                          <div className="space-y-2">
                            {medicalHistory.past_surgeries.map((surgery, idx) => (
                              <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                                <span className="font-medium text-gray-900">{surgery.name}</span>
                                <p className="text-sm text-gray-600 mt-1">{surgery.hospital}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(surgery.date).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {medicalHistory.smoking_status && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-600">Smoking Status</p>
                            <p className="font-semibold text-gray-900">{medicalHistory.smoking_status}</p>
                          </div>
                        )}
                        {medicalHistory.alcohol_consumption && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-600">Alcohol Consumption</p>
                            <p className="font-semibold text-gray-900">{medicalHistory.alcohol_consumption}</p>
                          </div>
                        )}
                      </div>

                      {medicalHistory.family_medical_history && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2">Family Medical History</h4>
                          <p className="text-sm text-gray-700">{medicalHistory.family_medical_history}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

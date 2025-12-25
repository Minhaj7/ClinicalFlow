import { useState } from 'react';
import { PatientVisit } from '../types';
import {
  Clock,
  User,
  Activity,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Edit2,
  Download,
  Heart,
  Pill,
  FlaskConical,
  Stethoscope,
  CalendarClock,
  FileText,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Wind,
  Scale,
  Ruler
} from 'lucide-react';
import { generateVisitReportPDF } from '../services/pdfService';

interface RecentCheckInsProps {
  visits: PatientVisit[];
  isLoading: boolean;
  onDelete: (visitId: string) => void;
  onEdit: (visit: PatientVisit) => void;
}

interface ExpandedSections {
  [visitId: string]: {
    vitals: boolean;
    medicines: boolean;
    tests: boolean;
    notes: boolean;
  };
}

export const RecentCheckIns = ({ visits, isLoading, onDelete, onEdit }: RecentCheckInsProps) => {
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({});

  const toggleSection = (visitId: string, section: 'vitals' | 'medicines' | 'tests' | 'notes') => {
    setExpandedSections(prev => ({
      ...prev,
      [visitId]: {
        ...prev[visitId],
        [section]: !prev[visitId]?.[section]
      }
    }));
  };

  const isSectionExpanded = (visitId: string, section: 'vitals' | 'medicines' | 'tests' | 'notes') => {
    return expandedSections[visitId]?.[section] ?? true;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFollowUpDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSeverityBadgeStyle = (severity?: string) => {
    if (!severity) return 'bg-gray-100 text-gray-700 border-gray-200';
    const lower = severity.toLowerCase();
    if (lower.includes('high') || lower.includes('severe')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (lower.includes('medium') || lower.includes('moderate')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (lower.includes('low') || lower.includes('mild')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const isUrduTranscript = (transcript: string) => {
    const urduPatterns = /[\u0600-\u06FF]/;
    const romanUrduKeywords = /\b(bhai|mein|hai|hoon|thik|nahi|kya|acha|bahar)\b/i;
    return urduPatterns.test(transcript) || romanUrduKeywords.test(transcript);
  };

  const handleDelete = (visit: PatientVisit) => {
    const patientName = visit.patient_data?.name || 'this patient';
    const confirmed = window.confirm(
      `Are you sure you want to delete the check-in for ${patientName}? This action cannot be undone.`
    );

    if (confirmed) {
      onDelete(visit.id);
    }
  };

  const handleDownloadPDF = (visit: PatientVisit) => {
    generateVisitReportPDF(visit, null);
  };

  const hasVitalsData = (visit: PatientVisit) => {
    return visit.vitals_data && Object.keys(visit.vitals_data).length > 0;
  };

  const hasMedicinesData = (visit: PatientVisit) => {
    return visit.medicines_data && Array.isArray(visit.medicines_data) && visit.medicines_data.length > 0;
  };

  const hasTestsData = (visit: PatientVisit) => {
    return visit.tests_data && Array.isArray(visit.tests_data) && visit.tests_data.length > 0;
  };

  const hasAdditionalData = (visit: PatientVisit) => {
    return hasVitalsData(visit) || hasMedicinesData(visit) || hasTestsData(visit) ||
           visit.diagnosis_summary || visit.next_visit || visit.follow_up_date || visit.visit_notes;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-2xl font-bold text-slate-900">Live Data Feed</h2>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-lg text-slate-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
            <h2 className="text-2xl font-bold text-slate-900">Live Data Feed</h2>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-lg text-slate-600">No check-ins yet. Start by recording your first patient visit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h2 className="text-2xl font-bold text-slate-900">Live Data Feed</h2>
        </div>
        <span className="text-sm text-slate-500">
          {visits.length} {visits.length === 1 ? 'patient' : 'patients'}
        </span>
      </div>

      <div className="space-y-6">
        {visits.map((visit) => (
          <div
            key={visit.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative"
          >
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <button
                onClick={() => handleDownloadPDF(visit)}
                className="p-2 bg-white hover:bg-green-50 border border-slate-200 hover:border-green-300 rounded-lg transition-all group"
                title="Download PDF Report"
              >
                <Download className="w-4 h-4 text-slate-400 group-hover:text-green-600" />
              </button>
              <button
                onClick={() => onEdit(visit)}
                className="p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all group"
                title="Edit this check-in"
              >
                <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </button>
              <button
                onClick={() => handleDelete(visit)}
                className="p-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-lg transition-all group"
                title="Delete this check-in"
              >
                <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
              </button>
            </div>

            <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-0">
              <div className="bg-slate-50 p-6 border-b lg:border-b-0 lg:border-r border-slate-200">
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Audio Transcript
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(visit.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-serif italic">
                  "{visit.raw_transcript}"
                </p>
                {isUrduTranscript(visit.raw_transcript) && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="font-medium">Roman Urdu Translated</span>
                  </div>
                )}
              </div>

              <div className="hidden lg:flex items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-white">
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
                    AI Extracted
                  </h4>

                  {visit.patient_data ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-2xl font-bold text-slate-900 truncate">
                            {visit.patient_data.name || 'Name Not Captured'}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-slate-600">
                            {visit.patient_data.age && (
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                                Age {visit.patient_data.age}
                              </span>
                            )}
                            {visit.patient_data.gender && (
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                                {visit.patient_data.gender}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {Array.isArray(visit.symptoms_data) && visit.symptoms_data.length > 0 && (
                        <div className="pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-4 h-4 text-slate-600" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              {visit.symptoms_data.length > 1 ? 'Symptoms' : 'Symptom'}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {visit.symptoms_data.map((symptom, index) => (
                              <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <div className="flex items-start justify-between gap-3">
                                  <span className="text-sm font-semibold text-slate-900 flex-1">
                                    {symptom.name}
                                  </span>
                                  {symptom.severity && (
                                    <span
                                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${getSeverityBadgeStyle(symptom.severity)}`}
                                    >
                                      {symptom.severity}
                                    </span>
                                  )}
                                </div>
                                {symptom.duration && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span className="text-xs text-slate-600">
                                      {symptom.duration}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-sm">
                      Processing...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {hasAdditionalData(visit) && (
              <div className="border-t border-slate-200 bg-slate-50/50">
                {visit.diagnosis_summary && (
                  <div className="px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-900">Diagnosis Summary</span>
                    </div>
                    <p className="text-sm text-slate-700 bg-blue-50 rounded-lg p-3 border border-blue-200">
                      {visit.diagnosis_summary}
                    </p>
                  </div>
                )}

                {(visit.next_visit || visit.follow_up_date) && (
                  <div className="px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <CalendarClock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Next Visit</span>
                        <p className="text-base font-medium text-slate-900">
                          {formatFollowUpDate(visit.next_visit || visit.follow_up_date || '')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {hasVitalsData(visit) && (
                  <div className="border-b border-slate-200">
                    <button
                      onClick={() => toggleSection(visit.id, 'vitals')}
                      className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-semibold text-slate-900">Vital Signs</span>
                      </div>
                      {isSectionExpanded(visit.id, 'vitals') ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    {isSectionExpanded(visit.id, 'vitals') && (
                      <div className="px-6 pb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {visit.vitals_data.blood_pressure && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Heart className="w-4 h-4 text-red-500" />
                                <span className="text-xs text-slate-500">Blood Pressure</span>
                              </div>
                              <span className="text-lg font-bold text-slate-900">{visit.vitals_data.blood_pressure}</span>
                              <span className="text-xs text-slate-500 ml-1">mmHg</span>
                            </div>
                          )}
                          {visit.vitals_data.temperature && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Thermometer className="w-4 h-4 text-orange-500" />
                                <span className="text-xs text-slate-500">Temperature</span>
                              </div>
                              <span className="text-lg font-bold text-slate-900">{visit.vitals_data.temperature}</span>
                              <span className="text-xs text-slate-500 ml-1">{visit.vitals_data.temperature_unit || 'F'}</span>
                            </div>
                          )}
                          {visit.vitals_data.pulse_rate && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Activity className="w-4 h-4 text-pink-500" />
                                <span className="text-xs text-slate-500">Pulse Rate</span>
                              </div>
                              <span className="text-lg font-bold text-slate-900">{visit.vitals_data.pulse_rate}</span>
                              <span className="text-xs text-slate-500 ml-1">bpm</span>
                            </div>
                          )}
                          {visit.vitals_data.respiratory_rate && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Wind className="w-4 h-4 text-cyan-500" />
                                <span className="text-xs text-slate-500">Respiratory Rate</span>
                              </div>
                              <span className="text-lg font-bold text-slate-900">{visit.vitals_data.respiratory_rate}</span>
                              <span className="text-xs text-slate-500 ml-1">/min</span>
                            </div>
                          )}
                          {visit.vitals_data.oxygen_saturation && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Activity className="w-4 h-4 text-blue-500" />
                                <span className="text-xs text-slate-500">SpO2</span>
                              </div>
                              <span className="text-lg font-bold text-slate-900">{visit.vitals_data.oxygen_saturation}</span>
                              <span className="text-xs text-slate-500 ml-1">%</span>
                            </div>
                          )}
                          {visit.vitals_data.weight && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Scale className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-slate-500">Weight</span>
                              </div>
                              <span className="text-lg font-bold text-slate-900">{visit.vitals_data.weight}</span>
                              <span className="text-xs text-slate-500 ml-1">kg</span>
                            </div>
                          )}
                          {visit.vitals_data.height && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Ruler className="w-4 h-4 text-teal-500" />
                                <span className="text-xs text-slate-500">Height</span>
                              </div>
                              <span className="text-lg font-bold text-slate-900">{visit.vitals_data.height}</span>
                              <span className="text-xs text-slate-500 ml-1">cm</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {hasMedicinesData(visit) && (
                  <div className="border-b border-slate-200">
                    <button
                      onClick={() => toggleSection(visit.id, 'medicines')}
                      className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Pill className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-semibold text-slate-900">
                          Prescribed Medicines ({visit.medicines_data?.length})
                        </span>
                      </div>
                      {isSectionExpanded(visit.id, 'medicines') ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    {isSectionExpanded(visit.id, 'medicines') && (
                      <div className="px-6 pb-4">
                        <div className="space-y-2">
                          {visit.medicines_data?.map((med: any, index: number) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <Pill className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{med.name || med.medication_name}</p>
                                  <p className="text-xs text-slate-500">
                                    {med.dosage || med.strength} - {med.frequency}
                                  </p>
                                </div>
                              </div>
                              {med.duration && (
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                  {med.duration}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {hasTestsData(visit) && (
                  <div className="border-b border-slate-200">
                    <button
                      onClick={() => toggleSection(visit.id, 'tests')}
                      className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-violet-500" />
                        <span className="text-sm font-semibold text-slate-900">
                          Ordered Tests ({visit.tests_data?.length})
                        </span>
                      </div>
                      {isSectionExpanded(visit.id, 'tests') ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    {isSectionExpanded(visit.id, 'tests') && (
                      <div className="px-6 pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {visit.tests_data?.map((test: any, index: number) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-slate-200 flex items-center gap-3">
                              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                                <FlaskConical className="w-4 h-4 text-violet-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{test.name || test.test_name}</p>
                                {test.notes && (
                                  <p className="text-xs text-slate-500">{test.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {visit.visit_notes && (
                  <div>
                    <button
                      onClick={() => toggleSection(visit.id, 'notes')}
                      className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-900">Doctor Notes</span>
                      </div>
                      {isSectionExpanded(visit.id, 'notes') ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    {isSectionExpanded(visit.id, 'notes') && (
                      <div className="px-6 pb-4">
                        <p className="text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200">
                          {visit.visit_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

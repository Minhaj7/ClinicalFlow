import { PatientVisit } from '../types';
import { Clock, User, Activity, ArrowRight, CheckCircle2, Trash2 } from 'lucide-react';

interface RecentCheckInsProps {
  visits: PatientVisit[];
  isLoading: boolean;
  onDelete: (visitId: string) => void;
}

export const RecentCheckIns = ({ visits, isLoading, onDelete }: RecentCheckInsProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
            <button
              onClick={() => handleDelete(visit)}
              className="absolute top-3 right-3 z-10 p-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-lg transition-all group"
              title="Delete this check-in"
            >
              <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
            </button>

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

                      {visit.symptoms_data?.primary_symptom && (
                        <div className="pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-slate-600" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Primary Symptom
                            </span>
                          </div>
                          <p className="text-base font-semibold text-slate-900 mb-2">
                            {visit.symptoms_data.primary_symptom}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {visit.symptoms_data.severity && (
                              <span
                                className={`px-3 py-1 text-xs font-semibold rounded-full border ${getSeverityBadgeStyle(visit.symptoms_data.severity)}`}
                              >
                                {visit.symptoms_data.severity}
                              </span>
                            )}
                            {visit.symptoms_data.duration && (
                              <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                                {visit.symptoms_data.duration}
                              </span>
                            )}
                          </div>
                          {visit.symptoms_data.additional_notes && (
                            <p className="mt-2 text-sm text-slate-600">
                              {visit.symptoms_data.additional_notes}
                            </p>
                          )}
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
          </div>
        ))}
      </div>
    </div>
  );
};

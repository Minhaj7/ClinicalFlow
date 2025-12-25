import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  X
} from 'lucide-react';
import { DashboardHeader } from '../components/DashboardHeader';
import { AppointmentModal } from '../components/AppointmentModal';
import { getAppointments, updateAppointment, getHealthcareProvider } from '../services/ehrService';
import { searchPatients } from '../services/databaseService';
import { Appointment, Patient } from '../types';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type ViewMode = 'day' | 'week' | 'month';
type FilterStatus = 'all' | 'Scheduled' | 'Confirmed' | 'Checked In' | 'Completed' | 'Cancelled';

export const Appointments = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
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
      loadAppointments();
    }
  }, [user, currentDate]);

  useEffect(() => {
    applyFilters();
  }, [appointments, filterStatus]);

  const loadAppointments = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const provider = await getHealthcareProvider(user.id);

      if (provider) {
        setProviderId(provider.id);
        const allAppointments = await getAppointments(provider.id);
        setAppointments(allAppointments);
      } else {
        const allAppointments = await getAppointments();
        setAppointments(allAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setErrorMessage('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    if (viewMode === 'day') {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.start_time);
        return aptDate >= startOfDay && aptDate <= endOfDay;
      });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.start_time);
        return aptDate >= startOfWeek && aptDate <= endOfWeek;
      });
    }

    filtered.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    setFilteredAppointments(filtered);
  };

  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      await updateAppointment(appointmentId, { status: newStatus });
      setSuccessMessage('Appointment status updated');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      setErrorMessage('Failed to update appointment status');
    }
  };

  const handleCheckIn = (appointment: Appointment) => {
    handleStatusChange(appointment.id, 'Checked In');
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setShowAppointmentModal(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleAppointmentSaved = () => {
    setShowAppointmentModal(false);
    setSelectedAppointment(null);
    loadAppointments();
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'Checked In': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'In Progress': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Completed': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-300';
      case 'No Show': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getVisitTypeIcon = (visitType: string) => {
    switch (visitType) {
      case 'Telemedicine': return <Video className="w-4 h-4" />;
      case 'Phone': return <Phone className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
                <p className="text-slate-600 mt-1">Manage your schedule and patient appointments</p>
              </div>
            </div>
            <button
              onClick={handleNewAppointment}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Appointment
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

          <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousDay}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-sm transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={handleNextDay}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="ml-4 text-lg font-semibold text-slate-900">
                  {formatDate(currentDate)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-600" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked In">Checked In</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Appointments</h3>
            <p className="text-slate-600 mb-6">
              {filterStatus !== 'all'
                ? `No ${filterStatus.toLowerCase()} appointments for this period`
                : 'No appointments scheduled for this period'}
            </p>
            <button
              onClick={handleNewAppointment}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Schedule Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {appointment.patient?.full_name || 'Unknown Patient'}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                          </span>
                          <span className="flex items-center gap-1">
                            {getVisitTypeIcon(appointment.visit_type)}
                            {appointment.visit_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {appointment.visit_reason && (
                      <p className="text-slate-700 mb-3">
                        <span className="font-medium">Reason:</span> {appointment.visit_reason}
                      </p>
                    )}

                    {appointment.notes && (
                      <p className="text-sm text-slate-600 mb-3">{appointment.notes}</p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      {appointment.location && (
                        <span className="flex items-center gap-1 text-xs text-slate-600">
                          <MapPin className="w-3 h-3" />
                          {appointment.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {appointment.status === 'Scheduled' && (
                      <button
                        onClick={() => handleCheckIn(appointment)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
                      >
                        Check In
                      </button>
                    )}
                    {appointment.status === 'Confirmed' && (
                      <button
                        onClick={() => handleCheckIn(appointment)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm transition-colors"
                      >
                        Check In
                      </button>
                    )}
                    {(appointment.status === 'Checked In' || appointment.status === 'In Progress') && (
                      <button
                        onClick={() => handleStatusChange(appointment.id, 'Completed')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => handleEditAppointment(appointment)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showAppointmentModal && (
        <AppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedAppointment(null);
          }}
          onSuccess={handleAppointmentSaved}
          appointment={selectedAppointment}
          providerId={providerId}
        />
      )}
    </div>
  );
};

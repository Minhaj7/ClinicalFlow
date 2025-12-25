import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, AlertTriangle, Users, Activity, Pill, FileText, TrendingUp, Clock } from 'lucide-react';
import { getDashboardStats, getClinicalAlerts, getAppointments, getHealthcareProvider } from '../services/ehrService';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  todayAppointments: number;
  pendingAlerts: number;
  activePatients: number;
  recentActivity: any[];
}

export const EHRDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    pendingAlerts: 0,
    activePatients: 0,
    recentActivity: []
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('role:roles(name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (userRoleData?.role) {
        setUserRole(userRoleData.role.name);
      }

      const provider = await getHealthcareProvider(user.id);
      if (provider) {
        setProviderId(provider.id);
      }

      const dashStats = await getDashboardStats(user.id);
      setStats(dashStats);

      const alertsData = await getClinicalAlerts();
      setAlerts(alertsData.slice(0, 5));

      if (provider) {
        const appointmentsData = await getAppointments(provider.id);
        const today = new Date();
        const upcoming = appointmentsData.filter((apt: any) => {
          const aptDate = new Date(apt.start_time);
          return aptDate >= today && apt.status !== 'Cancelled';
        }).slice(0, 5);
        setUpcomingAppointments(upcoming);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          title="Today's Appointments"
          value={stats.todayAppointments}
          color="blue"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          title="Pending Alerts"
          value={stats.pendingAlerts}
          color="red"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Active Patients"
          value={stats.activePatients}
          color="green"
        />
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          title="System Status"
          value="Operational"
          color="purple"
          isText
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {alerts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Clinical Alerts
              </h3>
              <span className="text-sm text-gray-500">{alerts.length} pending</span>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.severity === 'Critical' ? 'border-red-600 bg-red-50' :
                    alert.severity === 'High' ? 'border-orange-600 bg-orange-50' :
                    alert.severity === 'Medium' ? 'border-yellow-600 bg-yellow-50' :
                    'border-blue-600 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{alert.alert_type}</p>
                      <p className="text-sm text-gray-700 mt-1">{alert.alert_message}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      alert.severity === 'Critical' ? 'bg-red-600 text-white' :
                      alert.severity === 'High' ? 'bg-orange-600 text-white' :
                      alert.severity === 'Medium' ? 'bg-yellow-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingAppointments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Upcoming Appointments
              </h3>
              <span className="text-sm text-gray-500">{upcomingAppointments.length} scheduled</span>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{apt.patient?.full_name || 'Unknown Patient'}</p>
                      <p className="text-sm text-gray-600 mt-1">{apt.visit_reason || 'General Check-up'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      apt.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                      apt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Welcome to Your EHR Dashboard</h3>
            <p className="text-blue-100">
              {userRole === 'Doctor' && 'Manage patient care, prescriptions, and appointments'}
              {userRole === 'Nurse' && 'Monitor patients and assist with care delivery'}
              {userRole === 'Receptionist' && 'Schedule appointments and manage patient check-ins'}
              {userRole === 'Lab Technician' && 'Process tests and upload results'}
              {userRole === 'Pharmacist' && 'Dispense medications and monitor prescriptions'}
              {!userRole && 'Access your complete healthcare management system'}
            </p>
          </div>
          <div className="hidden md:block">
            <Activity className="w-16 h-16 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionCard
          icon={<Calendar className="w-6 h-6" />}
          title="Appointments"
          description="View & schedule"
          color="blue"
          onClick={() => navigate('/appointments')}
        />
        <QuickActionCard
          icon={<Pill className="w-6 h-6" />}
          title="Medications"
          description="Prescribe & manage"
          color="green"
          onClick={() => navigate('/medications')}
        />
        <QuickActionCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Problem List"
          description="Track diagnoses"
          color="orange"
          onClick={() => navigate('/problem-list')}
        />
        <QuickActionCard
          icon={<Users className="w-6 h-6" />}
          title="Patients"
          description="Manage records"
          color="purple"
          onClick={() => navigate('/patients')}
        />
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  color: 'blue' | 'red' | 'green' | 'purple';
  isText?: boolean;
}

const StatCard = ({ icon, title, value, color, isText }: StatCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`${isText ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>{value}</p>
    </div>
  );
};

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  onClick?: () => void;
}

const QuickActionCard = ({ icon, title, description, color, onClick }: QuickActionCardProps) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 text-white hover:shadow-lg hover:scale-105 transition-all cursor-pointer`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-2">{icon}</div>
        <p className="font-semibold text-sm mb-1">{title}</p>
        <p className="text-xs opacity-90">{description}</p>
      </div>
    </button>
  );
};

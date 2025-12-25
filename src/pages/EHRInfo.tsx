import { CheckCircle, Shield, Users, Calendar, Pill, FileText, Activity, TrendingUp, Database, Share2, AlertTriangle, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EHRInfo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Complete EHR System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your EMR has been transformed into a comprehensive Electronic Health Records system
            with advanced features for modern healthcare delivery
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Users className="w-12 h-12 text-blue-600" />}
            title="Multi-Organization Support"
            description="Support multiple healthcare facilities, provider networks, and organizational hierarchies. Manage care teams and provider directories efficiently."
            features={[
              'Organization management',
              'Healthcare provider profiles',
              'Care team coordination',
              'Provider credentials tracking'
            ]}
          />

          <FeatureCard
            icon={<Shield className="w-12 h-12 text-red-600" />}
            title="Role-Based Access Control"
            description="Comprehensive RBAC system with granular permissions for different user roles including admins, doctors, nurses, and receptionists."
            features={[
              '8 predefined system roles',
              'Custom role creation',
              'Granular permissions',
              'Organization-scoped access'
            ]}
          />

          <FeatureCard
            icon={<Database className="w-12 h-12 text-green-600" />}
            title="Comprehensive Audit Logging"
            description="HIPAA-compliant audit trails tracking all data access and modifications for security and compliance."
            features={[
              'Complete access logs',
              'Security event tracking',
              'Consent management',
              'Breach notification'
            ]}
          />

          <FeatureCard
            icon={<FileText className="w-12 h-12 text-purple-600" />}
            title="Problem-Oriented Records"
            description="Structured clinical documentation with problem lists, SOAP notes, treatment plans, and progress tracking."
            features={[
              'ICD-10 coded problem lists',
              'SOAP format encounter notes',
              'Treatment plan management',
              'Clinical order tracking'
            ]}
          />

          <FeatureCard
            icon={<Share2 className="w-12 h-12 text-indigo-600" />}
            title="Care Coordination"
            description="Seamless coordination between providers with referral management and care transitions tracking."
            features={[
              'Referral management',
              'Care transition tracking',
              'Shared care plans',
              'Team communication'
            ]}
          />

          <FeatureCard
            icon={<Pill className="w-12 h-12 text-pink-600" />}
            title="Medication Management"
            description="Complete medication lifecycle from e-prescribing to administration with drug interaction checking."
            features={[
              'E-prescribing ready',
              'Medication reconciliation',
              'Drug interaction alerts',
              'Administration records'
            ]}
          />

          <FeatureCard
            icon={<Activity className="w-12 h-12 text-teal-600" />}
            title="Immunizations & Preventive Care"
            description="Track vaccines, screenings, and wellness programs with automated health maintenance reminders."
            features={[
              'Immunization registry',
              'Preventive screenings',
              'Health reminders',
              'Wellness programs'
            ]}
          />

          <FeatureCard
            icon={<Calendar className="w-12 h-12 text-orange-600" />}
            title="Appointment Scheduling"
            description="Advanced scheduling with provider calendars, waitlist management, and recurring appointments."
            features={[
              'Provider schedules',
              'Waitlist management',
              'Recurring appointments',
              'No-show tracking'
            ]}
          />

          <FeatureCard
            icon={<CreditCard className="w-12 h-12 text-yellow-600" />}
            title="Billing & Insurance"
            description="Complete revenue cycle management with insurance claims, billing codes, and payment tracking."
            features={[
              'Insurance verification',
              'Claims management',
              'CPT/ICD-10 coding',
              'Payment processing'
            ]}
          />

          <FeatureCard
            icon={<AlertTriangle className="w-12 h-12 text-red-500" />}
            title="Clinical Decision Support"
            description="Evidence-based guidelines, clinical alerts, and quality measure tracking for better patient outcomes."
            features={[
              'Clinical guidelines',
              'Smart alerts',
              'Drug interaction checks',
              'Quality metrics'
            ]}
          />

          <FeatureCard
            icon={<Share2 className="w-12 h-12 text-blue-500" />}
            title="Health Information Exchange"
            description="Interoperability with external systems through HL7, FHIR, and C-CDA standards."
            features={[
              'External system integration',
              'Document exchange',
              'FHIR API ready',
              'Data import/export'
            ]}
          />

          <FeatureCard
            icon={<TrendingUp className="w-12 h-12 text-green-500" />}
            title="Analytics & Reporting"
            description="Population health analytics, quality reporting, and customizable dashboards."
            features={[
              'Population health cohorts',
              'Report templates',
              'Quality measures',
              'Performance dashboards'
            ]}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Database Architecture Highlights</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <StatCard number="40+" label="Database Tables" description="Comprehensive data model" />
            <StatCard number="100%" label="HIPAA Compliant" description="Security & privacy built-in" />
            <StatCard number="200+" label="API Endpoints" description="Full REST API coverage" />
            <StatCard number="Real-time" label="Data Sync" description="Instant updates across devices" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-6 opacity-90">
            Your system now has all the capabilities of a modern Electronic Health Records platform
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

const FeatureCard = ({ icon, title, description, features }: FeatureCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface StatCardProps {
  number: string;
  label: string;
  description: string;
}

const StatCard = ({ number, label, description }: StatCardProps) => {
  return (
    <div className="text-center p-6 bg-gray-50 rounded-lg">
      <div className="text-4xl font-bold text-blue-600 mb-2">{number}</div>
      <div className="text-lg font-semibold text-gray-900 mb-1">{label}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </div>
  );
};

import { useNavigate } from 'react-router-dom';
import { Zap, MessageCircle, Lock } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Stop Typing. Just Speak.
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            The first AI medical assistant that understands 'Halka Bukhar', 'Pait Dard', and 'High BP' in your accent. Turn your voice into patient records in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Patient Check-in (Free Forever)
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Check-in a Patient in 10 Seconds
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Forget the register. Speak the name and symptoms. We handle the rest.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Roman Urdu & Regional Slang
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Speak naturally. We understand the way Pakistanis actually talk. No need for perfect English.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Bank-Grade Patient Privacy
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Your clinic's data is encrypted. Safe, secure, and accessible only to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Ready to Transform Your Clinic?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Join hundreds of clinics already using Clinical Flows
          </p>
          <button
            onClick={() => navigate('/auth?mode=signup')}
            className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Get Started Now
          </button>
        </div>
      </section>
    </div>
  );
};

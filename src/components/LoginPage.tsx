import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [company, setCompany] = useState('Demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const fillDemoCredentials = (type: 'hr' | 'employee') => {
    setCompany('Demo');
    setPassword('demo123');
    setEmail(type === 'hr' ? 'hr@gmail.com' : 'user@gmail.com');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login({ company, email, password });

    if (!success) {
      setError('Credenziali non valide. Usa gli account demo di Demo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-2">QuandoVuoi</h1>
          <p className="text-gray-600">Il tuo stipendio, quando vuoi</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-6">
            <LogIn className="w-6 h-6 text-purple-600" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            Accedi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => fillDemoCredentials('employee')}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-medium py-2 px-3 rounded-lg text-sm transition"
            >
              Usa demo Dipendente
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('hr')}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-medium py-2 px-3 rounded-lg text-sm transition"
            >
              Usa demo HR
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Azienda
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="Demo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="tuo@email.it"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Demo credentials (azienda: Demo):
              <br />
              <span className="font-mono">Dipendente: user@gmail.com / demo123</span>
              <br />
              <span className="font-mono">HR: hr@gmail.com / demo123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

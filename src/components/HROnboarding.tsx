import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databases, DB_ID, CONFIG_COL, ID, Query } from '../lib/appwrite';
import { Building2, ChevronLeft, CheckCircle, Copy } from 'lucide-react';

export default function HROnboarding() {
  const [step, setStep] = useState(1);
  const { user, completeOnboarding } = useAuth();
  const [formData, setFormData] = useState({
    ragione_sociale: 'Demo Srl',
    piva: '12345678901',
    numero_dipendenti: 50,
    referente_hr: 'HR Demo',
    max_advance_percent: 50,
    request_frequency: 'Settimanale',
    welcome_message: 'Benvenuto in QuandoVuoi! Il tuo stipendio, quando vuoi.'
  });

  const [copied, setCopied] = useState(false);

  const handleComplete = async () => {
    if (!user) return;

    const existing = await databases.listDocuments(DB_ID, CONFIG_COL, [
      Query.equal('company_name', user.company_name)
    ]);
    if (existing.documents.length > 0) {
      await databases.updateDocument(DB_ID, CONFIG_COL, existing.documents[0].$id, {
        company_name: user.company_name,
        ...formData
      });
    } else {
      await databases.createDocument(DB_ID, CONFIG_COL, ID.unique(), {
        company_name: user.company_name,
        ...formData
      });
    }

    await completeOnboarding();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('https://quandovuoi.it/invite/demo-12345');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-6">
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Benvenuto nel Portale HR
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              QuandoVuoi ti permette di offrire ai tuoi dipendenti l'accesso anticipato
              allo stipendio maturato. Gestisci le richieste, monitora le statistiche e
              configura il servizio secondo le esigenze della tua azienda.
            </p>
            <button
              onClick={() => setStep(2)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
            >
              Inizia la configurazione
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Dati aziendali
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ragione sociale
                </label>
                <input
                  type="text"
                  value={formData.ragione_sociale}
                  onChange={(e) => setFormData({ ...formData, ragione_sociale: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partita IVA
                </label>
                <input
                  type="text"
                  value={formData.piva}
                  onChange={(e) => setFormData({ ...formData, piva: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numero dipendenti
                </label>
                <input
                  type="number"
                  value={formData.numero_dipendenti}
                  onChange={(e) => setFormData({ ...formData, numero_dipendenti: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referente HR
                </label>
                <input
                  type="text"
                  value={formData.referente_hr}
                  onChange={(e) => setFormData({ ...formData, referente_hr: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex items-center text-gray-600 hover:text-gray-800 font-medium"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Indietro
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
              >
                Continua
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Configurazione servizio
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentuale massima anticipo (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={formData.max_advance_percent}
                    onChange={(e) => setFormData({ ...formData, max_advance_percent: Number(e.target.value) })}
                    className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <span className="text-xl font-bold text-purple-600 w-16">
                    {formData.max_advance_percent}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequenza richieste
                </label>
                <select
                  value={formData.request_frequency}
                  onChange={(e) => setFormData({ ...formData, request_frequency: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option>Giornaliera</option>
                  <option>Settimanale</option>
                  <option>Quindicinale</option>
                  <option>Mensile</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Messaggio di benvenuto
                </label>
                <textarea
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex items-center text-gray-600 hover:text-gray-800 font-medium"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Indietro
              </button>
              <button
                onClick={() => setStep(4)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
              >
                Continua
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Configurazione completata!
            </h2>
            <p className="text-gray-600 mb-8">
              Il servizio è ora attivo. Condividi questo link con i tuoi dipendenti
              per permettere loro di registrarsi.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm text-purple-700 flex-1 text-left">
                  https://quandovuoi.it/invite/demo-12345
                </code>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copiato!' : 'Copia'}
                </button>
              </div>
            </div>
            <button
              onClick={handleComplete}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
            >
              Vai alla dashboard
            </button>
          </div>
        )}

        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === step ? 'bg-purple-600' : 'bg-purple-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

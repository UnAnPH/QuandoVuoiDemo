import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databases, DB_ID, REQUESTS_COL, ID, Query } from '../lib/appwrite';
import { Request } from '../types';
import { Wallet, LogOut, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function EmployeeHome() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [amount, setAmount] = useState(620);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const availableBalance = 1240;

  useEffect(() => {
    loadRequests();
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    const res = await databases.listDocuments(DB_ID, REQUESTS_COL, [
      Query.equal('user_id', user.id),
      Query.orderDesc('$createdAt')
    ]);
    setRequests(res.documents.map((d: any) => ({
      id: d.$id,
      user_id: d.user_id,
      request_number: d.request_number,
      amount: d.amount,
      status: d.status,
      created_at: d.$createdAt,
      updated_at: d.$updatedAt
    })) as Request[]);
  };

  const handleRequestAdvance = async () => {
    if (!user) return;
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    const requestNumber = `REQ-${Date.now().toString().slice(-6)}`;

    try {
      await databases.createDocument(DB_ID, REQUESTS_COL, ID.unique(), {
        user_id: user.id,
        request_number: requestNumber,
        amount,
        status: 'In attesa'
      });
      setConfirmation(requestNumber);
      setShowRequestModal(false);
      loadRequests();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'In attesa': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Approvato': 'bg-blue-100 text-blue-800 border-blue-200',
      'Erogato': 'bg-green-100 text-green-800 border-green-200'
    };

    const icons = {
      'In attesa': <Clock className="w-4 h-4" />,
      'Approvato': <AlertCircle className="w-4 h-4" />,
      'Erogato': <CheckCircle className="w-4 h-4" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Elaborazione richiesta...</p>
        </div>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Richiesta inviata!
          </h2>
          <p className="text-gray-600 mb-2">
            La tua richiesta è stata inviata correttamente.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Numero richiesta</p>
            <p className="text-xl font-bold text-purple-600">{confirmation}</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Riceverai una notifica quando la richiesta sarà approvata.
          </p>
          <button
            onClick={() => setConfirmation(null)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Torna alla home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-purple-600">QuandoVuoi</h1>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Esci</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="w-8 h-8" />
              <h2 className="text-xl font-semibold">Saldo disponibile</h2>
            </div>
            <div className="text-5xl font-bold mb-6">
              €{availableBalance.toLocaleString('it-IT')}
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-white text-purple-600 hover:bg-purple-50 font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Richiedi anticipo
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Le tue richieste
          </h3>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nessuna richiesta ancora</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-gray-500">
                      {request.request_number}
                    </span>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-800">
                      €{request.amount.toLocaleString('it-IT')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Richiedi anticipo
            </h3>
            <div className="mb-6">
              <div className="flex justify-between items-baseline mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Importo richiesto
                </label>
                <span className="text-sm text-gray-500">
                  Max €{availableBalance.toLocaleString('it-IT')}
                </span>
              </div>
              <div className="text-4xl font-bold text-purple-600 mb-4">
                €{amount.toLocaleString('it-IT')}
              </div>
              <input
                type="range"
                min="50"
                max={availableBalance}
                step="10"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>€50</span>
                <span>€{availableBalance.toLocaleString('it-IT')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Annulla
              </button>
              <button
                onClick={handleRequestAdvance}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

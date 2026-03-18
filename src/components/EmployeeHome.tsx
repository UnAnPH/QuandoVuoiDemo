import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databases, DB_ID, REQUESTS_COL, ID, Query } from '../lib/appwrite';
import { Request } from '../types';
import { Wallet, LogOut, Clock, CheckCircle, AlertCircle, Loader2, Euro, TrendingUp, History } from 'lucide-react';

const DEMO_EMPLOYEE_REQUESTS: Request[] = [
  {
    id: 'demo-req-1',
    user_id: 'demo-employee',
    request_number: 'REQ-240301',
    amount: 260,
    status: 'Erogato',
    created_at: '2026-03-01T09:12:00.000Z',
    updated_at: '2026-03-01T09:12:00.000Z'
  },
  {
    id: 'demo-req-2',
    user_id: 'demo-employee',
    request_number: 'REQ-240307',
    amount: 420,
    status: 'Approvato',
    created_at: '2026-03-07T11:25:00.000Z',
    updated_at: '2026-03-07T11:25:00.000Z'
  },
  {
    id: 'demo-req-3',
    user_id: 'demo-employee',
    request_number: 'REQ-240315',
    amount: 610,
    status: 'In attesa',
    created_at: '2026-03-15T15:40:00.000Z',
    updated_at: '2026-03-15T15:40:00.000Z'
  }
];

export default function EmployeeHome() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [amount, setAmount] = useState(620);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const baseAvailableBalance = 1240;
  const dailyGain = 76;
  const usedAmount = requests
    .filter((request) => request.status !== 'Erogato')
    .reduce((sum, request) => sum + Number(request.amount), 0);
  const availableBalance = Math.max(baseAvailableBalance - usedAmount, 120);

  const getSystemStatus = (requestedAmount: number): Request['status'] => {
    if (requestedAmount <= 300) return 'Erogato';
    if (requestedAmount <= 700) return 'Approvato';
    return 'In attesa';
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  const storageKey = user ? `quandovuoi_requests_${user.id}` : '';

  const setDemoRequests = () => {
    const seeded = DEMO_EMPLOYEE_REQUESTS.map((request) => ({
      ...request,
      user_id: user?.id || request.user_id
    }));
    setRequests(seeded);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(seeded));
    }
  };

  const loadRequests = async () => {
    if (!user) return;

    if (storageKey) {
      const local = localStorage.getItem(storageKey);
      if (local) {
        try {
          setRequests(JSON.parse(local) as Request[]);
          return;
        } catch {
          localStorage.removeItem(storageKey);
        }
      }
    }

    try {
      const res = await databases.listDocuments(DB_ID, REQUESTS_COL, [
        Query.equal('user_id', user.id),
        Query.orderDesc('$createdAt')
      ]);
      const mapped = res.documents.map((d: any) => ({
        id: d.$id,
        user_id: d.user_id,
        request_number: d.request_number,
        amount: d.amount,
        status: d.status,
        created_at: d.$createdAt,
        updated_at: d.$updatedAt
      })) as Request[];
      setRequests(mapped);
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(mapped));
      }
    } catch {
      setDemoRequests();
    }
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
        status: getSystemStatus(amount)
      });
      setConfirmation(requestNumber);
      setShowRequestModal(false);
      loadRequests();
    } catch (e) {
      const now = new Date().toISOString();
      const localRequest: Request = {
        id: `local-${Date.now()}`,
        user_id: user.id,
        request_number: requestNumber,
        amount,
        status: getSystemStatus(amount),
        created_at: now,
        updated_at: now
      };
      const updatedRequests = [localRequest, ...requests];
      setRequests(updatedRequests);
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(updatedRequests));
      }
      setConfirmation(requestNumber);
      setShowRequestModal(false);
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
            La valutazione viene eseguita automaticamente dal sistema, senza approvazione manuale HR.
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Euro rimanenti</span>
              <Euro className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">€{availableBalance.toLocaleString('it-IT')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Guadagno giornaliero</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">+€{dailyGain.toLocaleString('it-IT')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Richieste precedenti</span>
              <History className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{requests.length}</p>
          </div>
        </div>

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

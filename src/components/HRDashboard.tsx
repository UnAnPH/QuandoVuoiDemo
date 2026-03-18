import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databases, DB_ID, REQUESTS_COL, Query } from '../lib/appwrite';
import { Request } from '../types';
import { TrendingUp, DollarSign, Clock, CheckCircle, LogOut } from 'lucide-react';

export default function HRDashboard() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const res = await databases.listDocuments(DB_ID, REQUESTS_COL, [
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
    setLoading(false);
  };

  const updateRequestStatus = async (id: string, status: string) => {
    await databases.updateDocument(DB_ID, REQUESTS_COL, id, { status });
    loadRequests();
  };

  const totalRequests = requests.length;
  const averageAmount = requests.length > 0
    ? requests.reduce((sum, r) => sum + Number(r.amount), 0) / requests.length
    : 0;
  const pendingRequests = requests.filter(r => r.status === 'In attesa').length;
  const paidOutRequests = requests.filter(r => r.status === 'Erogato').length;

  const getLast4Weeks = () => {
    const weeks = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weeks.push({
        label: weekStart.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
        count: requests.filter(r => {
          const requestDate = new Date(r.created_at);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          return requestDate >= weekStart && requestDate < weekEnd;
        }).length
      });
    }
    return weeks;
  };

  const weeklyData = getLast4Weeks();
  const maxCount = Math.max(...weeklyData.map(w => w.count), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <p className="text-gray-600">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-purple-600">QuandoVuoi</h1>
            <p className="text-sm text-gray-600">Portale HR - {user?.company_name}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Esci</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {totalRequests}
            </div>
            <div className="text-sm text-gray-600">Richieste totali</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              €{Math.round(averageAmount)}
            </div>
            <div className="text-sm text-gray-600">Importo medio</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {pendingRequests}
            </div>
            <div className="text-sm text-gray-600">In attesa</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {paidOutRequests}
            </div>
            <div className="text-sm text-gray-600">Erogati</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Richieste ultime 4 settimane
          </h3>
          <div className="flex items-end justify-between gap-4 h-48">
            {weeklyData.map((week, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-end justify-center mb-2" style={{ height: '160px' }}>
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                    style={{
                      height: `${(week.count / maxCount) * 100}%`,
                      minHeight: week.count > 0 ? '30px' : '0'
                    }}
                  >
                    {week.count > 0 && (
                      <span className="text-white font-bold text-sm">
                        {week.count}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {week.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Gestione richieste
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    ID Richiesta
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Data
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Importo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Stato
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-500">
                      Nessuna richiesta
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-gray-700">
                          {request.request_number}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(request.created_at).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-800">
                          €{Number(request.amount).toLocaleString('it-IT')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={request.status}
                          onChange={(e) => updateRequestStatus(request.id, e.target.value as any)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border outline-none cursor-pointer ${
                            request.status === 'In attesa'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : request.status === 'Approvato'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-green-100 text-green-800 border-green-200'
                          }`}
                        >
                          <option value="In attesa">In attesa</option>
                          <option value="Approvato">Approvato</option>
                          <option value="Erogato">Erogato</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

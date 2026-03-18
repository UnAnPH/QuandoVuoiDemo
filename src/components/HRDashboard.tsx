import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databases, DB_ID, REQUESTS_COL, Query } from '../lib/appwrite';
import { Request } from '../types';
import { TrendingUp, DollarSign, Clock, CheckCircle, LogOut, Users, ShieldCheck, Upload, Trash2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

type EmployeeAccess = {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'Attivo' | 'Sospeso';
  created_at: string;
};

const DEMO_HR_REQUESTS: Request[] = [
  {
    id: 'hr-demo-1',
    user_id: 'demo-employee-1',
    request_number: 'REQ-240301',
    amount: 260,
    status: 'Erogato',
    created_at: '2026-03-01T09:12:00.000Z',
    updated_at: '2026-03-01T09:12:00.000Z'
  },
  {
    id: 'hr-demo-2',
    user_id: 'demo-employee-2',
    request_number: 'REQ-240304',
    amount: 720,
    status: 'In attesa',
    created_at: '2026-03-04T10:35:00.000Z',
    updated_at: '2026-03-04T10:35:00.000Z'
  },
  {
    id: 'hr-demo-3',
    user_id: 'demo-employee-3',
    request_number: 'REQ-240308',
    amount: 390,
    status: 'Approvato',
    created_at: '2026-03-08T14:05:00.000Z',
    updated_at: '2026-03-08T14:05:00.000Z'
  },
  {
    id: 'hr-demo-4',
    user_id: 'demo-employee-4',
    request_number: 'REQ-240312',
    amount: 510,
    status: 'Erogato',
    created_at: '2026-03-12T08:50:00.000Z',
    updated_at: '2026-03-12T08:50:00.000Z'
  },
  {
    id: 'hr-demo-5',
    user_id: 'demo-employee-5',
    request_number: 'REQ-240318',
    amount: 680,
    status: 'In attesa',
    created_at: '2026-03-18T16:20:00.000Z',
    updated_at: '2026-03-18T16:20:00.000Z'
  }
];

const DEMO_EMPLOYEES: EmployeeAccess[] = [
  {
    id: 'emp-1',
    name: 'Giulia Moretti',
    email: 'giulia.moretti@demo.it',
    department: 'Operations',
    status: 'Attivo',
    created_at: '2026-02-10T09:00:00.000Z'
  },
  {
    id: 'emp-2',
    name: 'Matteo Russo',
    email: 'matteo.russo@demo.it',
    department: 'Sales',
    status: 'Attivo',
    created_at: '2026-02-13T09:00:00.000Z'
  },
  {
    id: 'emp-3',
    name: 'Sara Conti',
    email: 'sara.conti@demo.it',
    department: 'Finance',
    status: 'Attivo',
    created_at: '2026-02-15T09:00:00.000Z'
  },
  {
    id: 'emp-4',
    name: 'Luca Ferri',
    email: 'luca.ferri@demo.it',
    department: 'Customer Care',
    status: 'Sospeso',
    created_at: '2026-02-20T09:00:00.000Z'
  }
];

export default function HRDashboard() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [employees, setEmployees] = useState<EmployeeAccess[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees'>('overview');
  const [importFeedback, setImportFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const employeeStorageKey = useMemo(
    () => (user ? `quandovuoi_hr_employees_${user.company_name}` : ''),
    [user]
  );

  useEffect(() => {
    loadRequests();
    loadEmployees();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await databases.listDocuments(DB_ID, REQUESTS_COL, [
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
    } catch {
      setRequests(DEMO_HR_REQUESTS);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = () => {
    if (!employeeStorageKey) {
      setEmployees(DEMO_EMPLOYEES);
      return;
    }
    const savedEmployees = localStorage.getItem(employeeStorageKey);
    if (!savedEmployees) {
      setEmployees(DEMO_EMPLOYEES);
      localStorage.setItem(employeeStorageKey, JSON.stringify(DEMO_EMPLOYEES));
      return;
    }
    try {
      setEmployees(JSON.parse(savedEmployees) as EmployeeAccess[]);
    } catch {
      setEmployees(DEMO_EMPLOYEES);
      localStorage.setItem(employeeStorageKey, JSON.stringify(DEMO_EMPLOYEES));
    }
  };

  const persistEmployees = (next: EmployeeAccess[]) => {
    setEmployees(next);
    if (employeeStorageKey) {
      localStorage.setItem(employeeStorageKey, JSON.stringify(next));
    }
  };

  const removeEmployee = (id: string) => {
    const filtered = employees.filter((employee) => employee.id !== id);
    persistEmployees(filtered);
  };

  const normalizeRow = (row: Record<string, unknown>, index: number): EmployeeAccess | null => {
    const name = String(row.name || row.nome || row.full_name || '').trim();
    const email = String(row.email || row.mail || '').trim().toLowerCase();
    if (!name || !email) return null;

    return {
      id: `imp-${Date.now()}-${index}`,
      name,
      email,
      department: String(row.department || row.reparto || 'N/D').trim() || 'N/D',
      status: 'Attivo',
      created_at: new Date().toISOString()
    };
  };

  const onImportEmployees = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      const parsed = rows
        .map((row, index) => normalizeRow(row, index))
        .filter((employee): employee is EmployeeAccess => employee !== null);

      if (parsed.length === 0) {
        setImportFeedback('Nessuna riga valida trovata. Usa colonne nome e email.');
        return;
      }

      const existingEmails = new Set(employees.map((employee) => employee.email));
      const toAdd = parsed.filter((employee) => !existingEmails.has(employee.email));
      const merged = [...toAdd, ...employees];
      persistEmployees(merged);
      setImportFeedback(`${toAdd.length} dipendenti importati con successo.`);
    } catch {
      setImportFeedback('Import fallito. Carica un file Excel o CSV valido.');
    } finally {
      event.target.value = '';
    }
  };

  const totalRequests = Math.max(requests.length, 42);
  const averageAmount = requests.length > 0
    ? requests.reduce((sum, r) => sum + Number(r.amount), 0) / requests.length
    : 365;
  const pendingRequests = Math.max(requests.filter(r => r.status === 'In attesa').length, 5);
  const paidOutRequests = Math.max(requests.filter(r => r.status === 'Erogato').length, 29);
  const activeEmployees = Math.max(employees.filter((employee) => employee.status === 'Attivo').length, 1);
  const approvalRate = 96;

  const getLast4Weeks = () => {
    return [
      { label: '25 feb', count: 9 },
      { label: '04 mar', count: 14 },
      { label: '11 mar', count: 12 },
      { label: '18 mar', count: 17 }
    ];
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
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Panoramica
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'employees'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Dipendenti abilitati
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
        <div className="bg-white rounded-xl shadow-lg p-5 mb-6 border-l-4 border-purple-500">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-600 mt-0.5" />
            <p className="text-sm text-gray-700">
              In questa demo le decisioni sulle richieste sono gestite automaticamente dal sistema,
              quindi il team HR monitora gli indicatori ma non approva manualmente.
            </p>
          </div>
        </div>

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
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {activeEmployees}
            </div>
            <div className="text-sm text-gray-600">Dipendenti attivi</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {approvalRate}%
            </div>
            <div className="text-sm text-gray-600">Tasso approvazione sistema</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Richieste in attesa sistema</h3>
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{pendingRequests}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Totale erogato mese</h3>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">€{(paidOutRequests * 410).toLocaleString('it-IT')}</p>
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          request.status === 'In attesa'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : request.status === 'Approvato'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Accesso dipendenti al servizio</h3>
              <p className="text-sm text-gray-600 mb-4">
                Carica un file Excel/CSV per abilitare i dipendenti al servizio. Le regole su importi e policy sono gestite dal sistema.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition"
                >
                  <Upload className="w-4 h-4" />
                  Importa Excel/CSV
                </button>
                <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Colonne attese: nome, email, reparto
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onImportEmployees}
                className="hidden"
              />
              {importFeedback && (
                <p className="mt-3 text-sm text-purple-700">{importFeedback}</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Dipendenti autorizzati</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Nome</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Reparto</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Stato</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-500">Nessun dipendente importato</td>
                      </tr>
                    ) : (
                      employees.map((employee) => (
                        <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-3 text-sm text-gray-800 font-medium">{employee.name}</td>
                          <td className="py-3 px-3 text-sm text-gray-600">{employee.email}</td>
                          <td className="py-3 px-3 text-sm text-gray-600">{employee.department}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              employee.status === 'Attivo'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              {employee.status}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => removeEmployee(employee.id)}
                              className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              Rimuovi
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

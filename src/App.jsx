import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  UserCircle, Building2, Zap,
  Calendar, Check, Search, Download, Plus, ShieldCheck, Copy,
  LogOut, Users, Lock, X, Info, FileDown,
  Receipt, ChevronLeft, ChevronRight, Bell, User, Camera, FileText, Landmark, Pencil
} from 'lucide-react';
import * as XLSX from 'xlsx';
import logoDark from './Favicon (Dark).png';
import IbanModal from './IbanModal';

// --- STYLES & GLOBALS ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --rosa-50: #FFF6F7; --rosa-100: #F9D4D8; --rosa-200: #F4BFC5; --rosa-300: #E89CAC; --rosa-400: #D47A8E; --rosa-500: #B85A6E;
    --pervinca-50: #F0EFF8; --pervinca-100: #DDD9EE; --pervinca-300: #B8B0D4; --pervinca-500: #7E74A8;
    --acqua-50: #ECF5F3; --acqua-100: #D2EBE5; --acqua-300: #9DD4C8; --acqua-500: #5EA89C;
    --malva-50: #F5EFF5; --malva-100: #E3D4E4; --malva-300: #C4A6C6; --malva-500: #9B739E;
    --ardesia-50: #F0F3F5; --ardesia-100: #E8ECF0; --ardesia-300: #B8C8D4; --ardesia-500: #4A6070;
    --fumo: #F5F2F1; --polvere: #C4BFBD; --grafite: #6B6360; --carbone: #3D3735; --antracite: #272322; --nero: #0F0D0C;
  }

  body {
    font-family: 'Inter', sans-serif;
    background-color: #FFFFFF;
    color: var(--carbone);
    -webkit-font-smoothing: antialiased;
    margin: 0;
    padding: 0;
  }

  .gradient-rosa {
    background: linear-gradient(135deg, var(--rosa-200), var(--rosa-300));
  }
  .gradient-rosa-hover:hover {
    background: linear-gradient(135deg, var(--rosa-300), var(--rosa-400));
  }

  .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--polvere); border-radius: 4px; }

  /* Hide scrollbar for the phone shell to feel native */
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* Animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-up { animation: fadeUp 0.4s ease-out forwards; }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(100%); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

  @keyframes drawCheck {
    to { stroke-dashoffset: 0; }
  }
  .animate-check {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: drawCheck 0.4s ease-out forwards 0.1s;
  }

  @keyframes popIn {
    0% { transform: scale(0.8); opacity: 0; }
    60% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

  @keyframes modalEnter {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-modal-enter { animation: modalEnter 0.2s ease-out forwards; }

  @keyframes pulseSubtle {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }
  .animate-pulse-subtle { animation: pulseSubtle 0.6s ease-in-out; }

  /* Confetti */
  .confetti-container {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 100%; height: 100%;
    pointer-events: none; z-index: 50;
  }
  .confetti-particle {
    position: absolute; width: 8px; height: 8px; border-radius: 50%;
    opacity: 0;
    animation: floatConfetti 1.5s ease-out forwards;
  }
  @keyframes floatConfetti {
    0% { transform: translateY(0) scale(0); opacity: 1; }
    30% { opacity: 1; }
    100% { transform: translateY(-120px) translateX(var(--tx)) scale(1.2); opacity: 0; }
  }
`;

// --- UTILS ---
const formatEur = (val, showDecimals = false) => {
  return "€" + val.toLocaleString('it-IT', { 
    minimumFractionDigits: showDecimals ? 2 : 0, 
    maximumFractionDigits: showDecimals ? 2 : 0 
  });
};

const cn = (...classes) => classes.filter(Boolean).join(' ');
const calculateNetMonthly = (ral) => Math.round((Number(ral) / 12) * 0.72);
const fullEmployeeName = (employee) => `${employee.firstName} ${employee.lastName}`.trim();
const employeeInitials = (employee) => `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase();

const MONTHLY_SALARY = 2000;
const WORKDAYS_PER_MONTH = 21;
const ADVANCE_PERCENT = 0.55;
const PAY_DAY = 10;
const ITALIAN_MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

const formatPayrollDate = (date) => `${date.getDate()} ${ITALIAN_MONTHS[date.getMonth()]}`;

const EMP_PAYROLL_SNAPSHOT = (() => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let periodStart;
  let periodEnd;

  if (currentDay >= PAY_DAY) {
    periodStart = new Date(currentYear, currentMonth, PAY_DAY);
    periodEnd = new Date(currentYear, currentMonth + 1, PAY_DAY);
  } else {
    periodStart = new Date(currentYear, currentMonth - 1, PAY_DAY);
    periodEnd = new Date(currentYear, currentMonth, PAY_DAY);
  }

  const totalDays = Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysWorked = Math.round((today.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysWorkedClamped = Math.max(0, Math.min(daysWorked, totalDays));
  const daysUntilPayday = Math.max(0, Math.round((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const accrued = Math.round((daysWorkedClamped / totalDays) * MONTHLY_SALARY);
  const available = Math.round(accrued * ADVANCE_PERCENT);
  const remainingPaycheck = MONTHLY_SALARY - available;
  const progressPercent = Math.round((daysWorkedClamped / totalDays) * 100);
  const periodLabel = `${formatPayrollDate(periodStart)} → ${formatPayrollDate(periodEnd)}`;
  const paydayLabel = `${periodEnd.getDate()} ${ITALIAN_MONTHS[periodEnd.getMonth()]}`;
  const daysWorkedLabel = `${daysWorkedClamped} giorni lavorati su ${totalDays} · periodo ${periodLabel}`;
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Buongiorno' : 'Buonasera';

  return {
    accrued,
    available,
    remainingPaycheck,
    progressPercent,
    periodLabel,
    paydayLabel,
    daysWorkedLabel,
    daysUntilPayday,
    greeting,
    periodStart,
    today
  };
})();

const createEmployee = (employee) => ({
  ...employee,
  netMonthly: calculateNetMonthly(employee.ral)
});

// Hooks
const useAnimatedValue = (end, duration = 1000) => {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    let animationFrame;
    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); 
      setValue(Math.floor(easeProgress * end));
      
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      } else {
        setValue(end);
      }
    };
    startRef.current = null;
    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return value;
};

// --- MOCK DATA ---
const INITIAL_EMP_STATE = {
  balance: EMP_PAYROLL_SNAPSHOT.available,
  monthlyWithdrawn: 1380, 
  totalWithdrawals: 6,
  salary: 3200,
  iban: 'IT00 X000 0000 0000 0000 0003 456',
  history: [
    { id: 'REQ-2621', date: '24 mar 2026', amount: 220, status: 'Programmato' },
    { id: 'REQ-2618', date: '18 mar 2026', amount: 620, status: 'In elaborazione' },
    { id: 'REQ-2614', date: '6 mar 2026', amount: 380, status: 'Erogato' },
    { id: 'REQ-2610', date: '19 feb 2026', amount: 380, status: 'Erogato' },
    { id: 'REQ-2607', date: '5 feb 2026', amount: 380, status: 'Erogato' },
  ],
  notifications: [
    { id: 1, type: 'success', title: 'Bonifico accreditato', body: '€300 ricevuti su ••••3456', time: 'Oggi, 09:14', read: false },
    { id: 2, type: 'info', title: 'Nuovo saldo disponibile', body: `Da oggi puoi prelevare fino a ${formatEur(EMP_PAYROLL_SNAPSHOT.available)}`, time: 'Ieri, 08:00', read: false },
    { id: 3, type: 'payday', title: 'Busta paga in arrivo', body: `Il ${EMP_PAYROLL_SNAPSHOT.paydayLabel} ricevi ${formatEur(EMP_PAYROLL_SNAPSHOT.remainingPaycheck)} su ••••3456`, time: '2 giorni fa', read: true }
  ]
};

const HR_EMPLOYEES_SEED = [
  createEmployee({ id: 1, firstName: 'Mario', lastName: 'Rossi', role: 'Sviluppatore Senior', ral: 38400, codiceFiscale: 'RSSMRA85M01H501Z', yearsAtCompany: 8, contractType: 'Tempo indeterminato', ibanVero: 'IT60X0542811101000001234567', ibanVirtuale: 'QV-IT001-MR', email: 'mario.rossi@acme.it', status: 'Attivo', payDay: 10, activationDate: '15 gen 2026' }),
  createEmployee({ id: 2, firstName: 'Luigi', lastName: 'Bianchi', role: 'Contabile', ral: 31200, codiceFiscale: 'BNCLGU78E15F205X', yearsAtCompany: 11, contractType: 'Tempo indeterminato', ibanVero: 'IT40L0123456789000000987654', ibanVirtuale: 'QV-IT002-LB', email: 'luigi.bianchi@acme.it', status: 'Attivo', payDay: 10, activationDate: '15 gen 2026' }),
  createEmployee({ id: 3, firstName: 'Anna', lastName: 'Verdi', role: 'Designer', ral: 34800, codiceFiscale: 'VRDNNA90A41L219K', yearsAtCompany: 4, contractType: 'Tempo indeterminato', ibanVero: 'IT15S9999888887777666655544', ibanVirtuale: 'QV-IT003-AV', email: 'anna.verdi@acme.it', status: 'Attivo', payDay: 10, activationDate: '15 gen 2026' }),
  createEmployee({ id: 4, firstName: 'Marco', lastName: 'Neri', role: 'Commerciale', ral: 28800, codiceFiscale: 'NREMRC82H10A944P', yearsAtCompany: 7, contractType: 'Tempo determinato', ibanVero: 'IT28W0300203280000400123456', ibanVirtuale: 'QV-IT004-MN', email: 'marco.neri@acme.it', status: 'Attivo', payDay: 10, activationDate: '15 gen 2026' }),
  createEmployee({ id: 5, firstName: 'Sara', lastName: 'Russo', role: 'HR Specialist', ral: 32400, codiceFiscale: 'RSSSRA91C44H501W', yearsAtCompany: 5, contractType: 'Tempo indeterminato', ibanVero: 'IT65Q0306901234100000000000', ibanVirtuale: 'QV-IT005-SR', email: 'sara.russo@acme.it', status: 'Attivo', payDay: 10, activationDate: '15 gen 2026' }),
  createEmployee({ id: 6, firstName: 'Davide', lastName: 'Conti', role: 'Magazziniere', ral: 25200, codiceFiscale: 'CNTDVD95A01F205J', yearsAtCompany: 2, contractType: 'Tempo determinato', ibanVero: 'IT64S0542811101000000012345', ibanVirtuale: 'QV-IT006-DC', email: 'davide.conti@acme.it', status: 'Attivo', payDay: 10, activationDate: '15 gen 2026' }),
  createEmployee({ id: 7, firstName: 'Francesca', lastName: 'Moro', role: 'Marketing Manager', ral: 37200, codiceFiscale: 'MROFNC88L44H501B', yearsAtCompany: 6, contractType: 'Tempo indeterminato', ibanVero: 'IT60X0542811101000000054321', ibanVirtuale: 'QV-IT007-FM', email: 'francesca.moro@acme.it', status: 'Attivo', payDay: 10, activationDate: '15 gen 2026' }),
  createEmployee({ id: 8, firstName: 'Luca', lastName: 'Ferrari', role: 'Tecnico IT', ral: 33600, codiceFiscale: 'FRRLCU79M15H501A', yearsAtCompany: 9, contractType: 'Tempo indeterminato', ibanVero: 'IT40X0200811201000100440022', ibanVirtuale: '—', email: 'luca.ferrari@acme.it', status: 'Non attivo', payDay: 10, activationDate: '—' }),
  createEmployee({ id: 9, firstName: 'Elena', lastName: 'Ricci', role: 'Receptionist', ral: 26400, codiceFiscale: 'RCCLNE86D44F205T', yearsAtCompany: 10, contractType: 'Part-time', ibanVero: 'IT20L0569611111000000X00000', ibanVirtuale: '—', email: 'elena.ricci@acme.it', status: 'Non attivo', payDay: 10, activationDate: '—' }),
  createEmployee({ id: 10, firstName: 'Giovanni', lastName: 'Sala', role: 'Direttore Vendite', ral: 49200, codiceFiscale: 'SLAGNN72T10A001Z', yearsAtCompany: 13, contractType: 'Tempo indeterminato', ibanVero: 'IT90X0200802040000100219979', ibanVirtuale: '—', email: 'giovanni.sala@acme.it', status: 'Non attivo', payDay: 10, activationDate: '—' }),
  createEmployee({ id: 11, firstName: 'Chiara', lastName: 'Esposito', role: 'UX Designer', ral: 34200, codiceFiscale: 'SPTCHR92L53F205V', yearsAtCompany: 3, contractType: 'Tempo indeterminato', ibanVero: 'IT75A0306909606100000123456', ibanVirtuale: 'QV-IT011-CE', email: 'chiara.esposito@acme.it', status: 'Attivo', payDay: 10, activationDate: '15 gen 2026' }),
  createEmployee({ id: 12, firstName: 'Roberto', lastName: 'Marini', role: 'Responsabile Logistica', ral: 36000, codiceFiscale: 'MRNRRT84C18H501Q', yearsAtCompany: 9, contractType: 'Tempo indeterminato', ibanVero: 'IT39R0760103200000012345678', ibanVirtuale: 'QV-IT012-RM', email: 'roberto.marini@acme.it', status: 'Attivo', payDay: 10, activationDate: '15 gen 2026' }),
  createEmployee({ id: 13, firstName: 'Valentina', lastName: 'Bruno', role: 'Assistente Contabile', ral: 27600, codiceFiscale: 'BRNVNT93E52L219R', yearsAtCompany: 4, contractType: 'Tempo determinato', ibanVero: 'IT48U0501803200000011223344', ibanVirtuale: 'QV-IT013-VB', email: 'valentina.bruno@acme.it', status: 'Attivo', payDay: 10, activationDate: '15 gen 2026' }),
  createEmployee({ id: 14, firstName: 'Andrea', lastName: 'Colombo', role: 'Sviluppatore Junior', ral: 28800, codiceFiscale: 'CLMNDR97B11F205M', yearsAtCompany: 2, contractType: 'Tempo determinato', ibanVero: 'IT12H0200811001000003344556', ibanVirtuale: 'QV-IT014-AC', email: 'andrea.colombo@acme.it', status: 'Attivo', payDay: 10, activationDate: '15 gen 2026' }),
  createEmployee({ id: 15, firstName: 'Stefania', lastName: 'Greco', role: 'Customer Success', ral: 30000, codiceFiscale: 'GRCSTF89P48A944Y', yearsAtCompany: 6, contractType: 'Part-time', ibanVero: 'IT83P0100511701000000678912', ibanVirtuale: '—', email: 'stefania.greco@acme.it', status: 'Non attivo', payDay: 10, activationDate: '—' }),
  createEmployee({ id: 16, firstName: 'Matteo', lastName: 'Romano', role: 'Data Analyst', ral: 38400, codiceFiscale: 'RMNMTT94R09H501D', yearsAtCompany: 3, contractType: 'Tempo indeterminato', ibanVero: 'IT58C0760103200000099988776', ibanVirtuale: '—', email: 'matteo.romano@acme.it', status: 'Non attivo', payDay: 10, activationDate: '—' }),
  createEmployee({ id: 17, firstName: 'Alessia', lastName: 'Fontana', role: 'Office Manager', ral: 28800, codiceFiscale: 'FNTLSS90S62F205K', yearsAtCompany: 7, contractType: 'Tempo indeterminato', ibanVero: 'IT11N0623011000000001230001', ibanVirtuale: '—', email: 'alessia.fontana@acme.it', status: 'Non attivo', payDay: 10, activationDate: '—' }),
  createEmployee({ id: 18, firstName: 'Simone', lastName: 'De Luca', role: 'Tecnico Assistenza', ral: 25800, codiceFiscale: 'DLCSMN96A22L219P', yearsAtCompany: 2, contractType: 'Tempo determinato', ibanVero: 'IT52E0542811101000000098765', ibanVirtuale: '—', email: 'simone.deluca@acme.it', status: 'Non attivo', payDay: 10, activationDate: '—' }),
  createEmployee({ id: 19, firstName: 'Paola', lastName: 'Gallo', role: 'Social Media Manager', ral: 28200, codiceFiscale: 'GLLPLA91D63H501N', yearsAtCompany: 4, contractType: 'Part-time', ibanVero: 'IT21M0306901234100000045678', ibanVirtuale: '—', email: 'paola.gallo@acme.it', status: 'Non attivo', payDay: 10, activationDate: '—' }),
  createEmployee({ id: 20, firstName: 'Claudio', lastName: 'Serra', role: 'Responsabile Acquisti', ral: 34800, codiceFiscale: 'SRRCLD83T20F205G', yearsAtCompany: 8, contractType: 'Tempo indeterminato', ibanVero: 'IT37Q0300203280000400678901', ibanVirtuale: '—', email: 'claudio.serra@acme.it', status: 'Non attivo', payDay: 10, activationDate: '—' }),
  createEmployee({ id: 21, firstName: 'Martina', lastName: 'Rizzo', role: 'Graphic Designer', ral: 31200, codiceFiscale: 'RZZMRT95E42H501S', yearsAtCompany: 3, contractType: 'Tempo determinato', ibanVero: 'IT69L0200811201000100789123', ibanVirtuale: '—', email: 'martina.rizzo@acme.it', status: 'Non attivo', payDay: 10, activationDate: '—' }),
  createEmployee({ id: 22, firstName: 'Filippo', lastName: 'Caruso', role: 'Project Manager', ral: 40800, codiceFiscale: 'CRSFPP87M11A001H', yearsAtCompany: 9, contractType: 'Tempo indeterminato', ibanVero: 'IT44S0501803200000055566778', ibanVirtuale: '—', email: 'filippo.caruso@acme.it', status: 'Non attivo', payDay: 10, activationDate: '—' }),
  createEmployee({ id: 23, firstName: 'Nadia', lastName: 'Ferretti', role: 'Segreteria', ral: 24600, codiceFiscale: 'FRRNDA92H67F205L', yearsAtCompany: 5, contractType: 'Part-time', ibanVero: 'IT87D0760103200000001122334', ibanVirtuale: '—', email: 'nadia.ferretti@acme.it', status: 'Non attivo', payDay: 10, activationDate: '—' })
];

// --- SHARED COMPONENTS ---
const ToastContainer = ({ message }) => {
  if (!message) return null;
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-up w-max max-w-[90%]">
      <div className="bg-[var(--nero)] text-white px-4 py-3 rounded-[12px] shadow-xl flex items-center gap-2 text-sm font-medium justify-center">
        {message.includes('✓') ? <Check size={16} className="text-[var(--acqua-300)] shrink-0" /> : null}
        <span className="truncate">{message.replace('✓ ', '')}</span>
      </div>
    </div>
  );
};

const CircularProgress = ({
  value,
  max,
  size = 200,
  strokeWidth = 12,
  trackStroke = 'rgba(255,255,255,0.15)',
  progressStroke = 'var(--rosa-200)'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const targetOffset = circumference - (value / max) * circumference;
  
  const [offset, setOffset] = useState(circumference);
  
  useEffect(() => {
    const t = setTimeout(() => setOffset(targetOffset), 100);
    return () => clearTimeout(t);
  }, [targetOffset]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle stroke={trackStroke} fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
        <circle stroke={progressStroke} fill="transparent" strokeWidth={strokeWidth} strokeLinecap="round" r={radius} cx={size / 2} cy={size / 2}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
        />
      </svg>
    </div>
  );
};


// --- VIEWS ---

const LoginView = ({ onLogin }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--rosa-50)] text-[var(--carbone)]">
      <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(15,13,12,0.07)] p-8 max-w-[480px] w-full animate-fade-up">
        
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-[var(--nero)] mb-2">QuandoVuoi</h1>
          <p className="text-[var(--grafite)]">Anticipa lo stipendio netto, senza interessi.</p>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--grafite)] mb-4 text-center">
          Scegli la demo
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button 
            onClick={() => setSelected('emp')}
            className={cn(
              "flex-1 p-5 rounded-[16px] border text-left transition-all duration-200 relative group",
              selected === 'emp' ? "bg-[var(--rosa-50)] border-[var(--rosa-400)] shadow-md" : "bg-white border-[var(--rosa-100)] hover:-translate-y-1 hover:border-[var(--rosa-200)] hover:shadow-md"
            )}
          >
            {selected === 'emp' && (
              <div className="absolute top-3 right-3 text-[var(--rosa-500)] bg-[var(--rosa-100)] rounded-full p-0.5 animate-pop-in">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
            <UserCircle size={48} className="text-[var(--rosa-400)] mb-3" />
            <div className="font-bold text-[var(--nero)] mb-1">Mario Rossi</div>
            <div className="inline-block px-2 py-0.5 rounded bg-[var(--pervinca-100)] text-[var(--pervinca-500)] text-[11px] font-medium mb-1">
              Sviluppatore Senior
            </div>
            <div className="text-[12px] text-[var(--grafite)]">Acme SpA</div>
          </button>

          <button 
            onClick={() => setSelected('hr')}
            className={cn(
              "flex-1 p-5 rounded-[16px] border text-left transition-all duration-200 relative group",
              selected === 'hr' ? "bg-[var(--ardesia-50)] border-[var(--ardesia-400)] shadow-md" : "bg-white border-[var(--ardesia-100)] hover:-translate-y-1 hover:border-[var(--ardesia-300)] hover:shadow-md"
            )}
          >
            {selected === 'hr' && (
              <div className="absolute top-3 right-3 text-[var(--ardesia-500)] bg-[var(--ardesia-100)] rounded-full p-0.5 animate-pop-in">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
            <Building2 size={48} className="text-[var(--ardesia-400)] mb-3" />
            <div className="font-bold text-[var(--nero)] mb-1">Maria Bianchi</div>
            <div className="inline-block px-2 py-0.5 rounded bg-[var(--ardesia-100)] text-[var(--ardesia-500)] text-[11px] font-medium mb-1">
              HR Manager
            </div>
            <div className="text-[12px] text-[var(--grafite)]">Acme SpA</div>
          </button>
        </div>

        <button 
          disabled={!selected}
          onClick={() => onLogin(selected, false)}
          className="w-full h-[52px] gradient-rosa text-white font-bold rounded-[12px] transition-all duration-200 disabled:opacity-50 disabled:grayscale hover:-translate-y-px hover:shadow-lg disabled:hover:translate-y-0 disabled:hover:shadow-none mb-4"
        >
          {selected === 'emp' ? 'Accedi come Mario Rossi' : selected === 'hr' ? 'Accedi come Maria Bianchi' : 'Seleziona demo per accedere'}
        </button>

        <p className="text-center text-[12px] text-[var(--grafite)] mb-4">
          Demo interattiva · Nessun dato reale
        </p>

        {selected && (
          <div className="text-center animate-fade-up">
            <button 
              onClick={() => onLogin(selected, true)}
              className="text-[13px] text-[var(--grafite)] hover:underline hover:text-[var(--nero)] transition-colors"
            >
              Salta l'introduzione e vai direttamente alla dashboard &rarr;
            </button>
          </div>
        )}

      </div>
    </div>
  );
};


// --- EMPLOYEE ONBOARDING ---
const EmployeeOnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [kycSubStep, setKycSubStep] = useState('selfie');
  const [contractSubStep, setContractSubStep] = useState('contract');
  const [acceptedContract, setAcceptedContract] = useState(false);
  const [showSigned, setShowSigned] = useState(false);
  const [ringBalance, setRingBalance] = useState(0);
  const { available, accrued, progressPercent, daysWorkedLabel, paydayLabel, remainingPaycheck } = EMP_PAYROLL_SNAPSHOT;

  const goToStep3 = () => {
    setStep(3);
    setContractSubStep('contract');
  };

  const signContract = () => {
    if (!acceptedContract) return;
    setShowSigned(true);
    setTimeout(() => {
      setContractSubStep('balance');
      setShowSigned(false);
    }, 300);
  };

  const profileRows = [
    { icon: '👤', label: 'Nome', value: 'Mario Rossi' },
    { icon: '🏢', label: 'Azienda', value: 'Acme SpA' },
    { icon: '💼', label: 'Ruolo', value: 'Sviluppatore Senior' },
    { icon: '💰', label: 'Stipendio netto', value: `${formatEur(MONTHLY_SALARY)}/mese` },
    { icon: '📅', label: 'Busta paga', value: 'il 10 di ogni mese' }
  ];

  useEffect(() => {
    if (!(step === 3 && contractSubStep === 'balance')) return;

    let raf1 = 0;
    const firstStart = performance.now();

    const firstTick = (now) => {
      const elapsed = now - firstStart;
      const progress = Math.min(elapsed / 1500, 1);
      setRingBalance(Math.round(available * progress));
      if (progress < 1) {
        raf1 = requestAnimationFrame(firstTick);
      }
    };

    raf1 = requestAnimationFrame(firstTick);

    return () => {
      cancelAnimationFrame(raf1);
    };
  }, [step, contractSubStep, available]);

  return (
    <div className="flex-1 bg-white flex flex-col relative overflow-hidden h-full">
      <div className="absolute top-0 w-full p-6 flex justify-end z-20">
        <button onClick={onComplete} className="text-[13px] text-[var(--grafite)] hover:underline">
          Salta &rarr;
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {step === 1 && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white animate-fade-up">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-20 [WebkitOverflowScrolling:touch]">
              <div className="text-center pb-6 border-b border-[var(--ardesia-100)]">
                <h2 className="text-[24px] font-bold text-[var(--nero)]">QuandoVuoi</h2>
                <h1 className="text-[32px] font-bold text-[var(--nero)] mt-4">Ciao, Mario 👋</h1>
                <p className="text-[16px] text-[var(--grafite)] mt-2">Il tuo stipendio è già qui.</p>
              </div>

              <div className="pt-4">
                {profileRows.map((row) => (
                  <div key={row.label} className="flex items-center gap-3 py-3 border-b border-[var(--ardesia-100)]">
                    <span className="text-[16px]">{row.icon}</span>
                    <span className="text-[13px] text-[var(--grafite)]">{row.label}</span>
                    <span className="ml-auto text-[14px] font-bold text-[var(--nero)] text-right">{row.value}</span>
                  </div>
                ))}
              </div>

              <p className="text-[12px] text-[var(--grafite)] text-center mt-5 mb-2">
                🔒 Dati forniti dalla tua azienda · Crittografia end-to-end
              </p>
            </div>

            <div className="shrink-0 p-4 px-6 pb-[max(16px,env(safe-area-inset-bottom))] bg-white border-t border-[#F0F0F0]">
              <button onClick={() => setStep(2)} className="w-full h-[52px] rounded-[12px] bg-[var(--nero)] text-white font-bold text-[16px]">
                Continua &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white animate-fade-up">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-20 [WebkitOverflowScrolling:touch]">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    if (kycSubStep === 'selfie') setStep(1);
                    else setKycSubStep('selfie');
                  }}
                  className="p-2 rounded-full text-[var(--grafite)] hover:bg-[var(--ardesia-50)]"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                  <h3 className="text-[20px] font-bold text-[var(--nero)]">Verifica identità</h3>
                  <p className="text-[13px] text-[var(--grafite)]">Richiesto una sola volta per legge</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (kycSubStep === 'selfie') setKycSubStep('document');
                    else goToStep3();
                  }}
                  className="p-2 rounded-full text-[var(--grafite)] hover:bg-[var(--ardesia-50)]"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {kycSubStep === 'selfie' ? (
                <>
                  <div className="w-[200px] h-[200px] rounded-full mx-auto mt-6 mb-4 bg-[var(--ardesia-50)] border-2 border-dashed border-[var(--ardesia-300)] flex flex-col items-center justify-center">
                    <Camera size={48} className="text-[var(--ardesia-300)]" />
                    <p className="text-[13px] text-[var(--grafite)] mt-2">Il tuo viso qui</p>
                  </div>
                  <p className="text-[13px] text-[var(--grafite)] text-center mb-2">
                    Assicurati di essere in un posto ben illuminato.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-center mt-2 mb-5">
                    <h4 className="text-[18px] font-bold text-[var(--nero)]">Fotografa il documento</h4>
                    <p className="text-[13px] text-[var(--grafite)]">Carta d'identità o passaporto</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[var(--ardesia-50)] border border-[var(--ardesia-200)] rounded-[12px] h-[100px] flex flex-col items-center justify-center">
                      <Receipt size={24} className="text-[var(--grafite)]" />
                      <span className="text-[12px] text-[var(--grafite)] mt-1">Fronte</span>
                    </div>
                    <div className="bg-[var(--ardesia-50)] border border-[var(--ardesia-200)] rounded-[12px] h-[100px] flex flex-col items-center justify-center">
                      <Receipt size={24} className="text-[var(--grafite)] rotate-180" />
                      <span className="text-[12px] text-[var(--grafite)] mt-1">Retro</span>
                    </div>
                  </div>

                  <p className="text-[12px] text-[var(--grafite)] text-center mb-2">
                    Il documento deve essere in corso di validità.
                  </p>
                </>
              )}
            </div>

            <div className="shrink-0 p-4 px-6 pb-[max(16px,env(safe-area-inset-bottom))] bg-white border-t border-[#F0F0F0]">
              {kycSubStep === 'selfie' ? (
                <>
                  <button type="button" onClick={() => setKycSubStep('document')} className="w-full h-[48px] rounded-[12px] bg-[var(--nero)] text-white font-bold mb-3">
                    📷 Scatta selfie
                  </button>
                  <button type="button" onClick={() => setKycSubStep('document')} className="w-full text-[13px] text-[var(--grafite)] text-center">
                    Salta questo step &rarr;
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={goToStep3} className="w-full h-[48px] rounded-[12px] bg-[var(--nero)] text-white font-bold mb-3">
                    📷 Fotografa documento
                  </button>
                  <button type="button" onClick={goToStep3} className="w-full text-[13px] text-[var(--grafite)] text-center">
                    Salta questo step &rarr;
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {step === 3 && contractSubStep === 'contract' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white animate-fade-up">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-20 [WebkitOverflowScrolling:touch]">
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => setStep(2)} className="p-2 rounded-full text-[var(--grafite)] hover:bg-[var(--ardesia-50)]">
                  <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                  <FileText size={32} className="text-[var(--rosa-400)] mx-auto mb-2" />
                  <h3 className="text-[20px] font-bold text-[var(--nero)]">Contratto di servizio</h3>
                </div>
                <div className="w-9" />
              </div>

              <div className="relative bg-[var(--ardesia-50)] rounded-[12px] h-[300px] overflow-y-auto p-4 text-[13px] text-[var(--carbone)] leading-[1.7] mb-4 custom-scrollbar">
                <div className="whitespace-pre-line">
INFORMAZIONI EUROPEE DI BASE
SUL CREDITO AI CONSUMATORI

Creditore: QuandoVuoi S.r.l.

Tipo di credito:
Accesso anticipato al salario maturato (EWA)

Importo massimo:
50% del salario maturato nel periodo corrente

Costo per il lavoratore:
€0 — il servizio è finanziato dall'azienda datrice di lavoro

Modalità di rimborso:
Automatica alla prossima busta paga

Diritto di recesso:
14 giorni dalla firma

Il presente servizio non costituisce un prestito
ai sensi del D.Lgs. 385/1993. L'importo rappresenta
una quota del salario già maturato e non ancora erogato.
                </div>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[var(--ardesia-50)] to-transparent" />
              </div>

              <button
                type="button"
                onClick={() => setAcceptedContract((value) => !value)}
                className="flex items-start gap-3 text-left mb-2"
              >
                <span className={cn(
                  'w-5 h-5 rounded-[6px] border mt-0.5 flex items-center justify-center',
                  acceptedContract ? 'bg-[var(--rosa-500)] border-[var(--rosa-500)] text-white' : 'border-[var(--ardesia-300)]'
                )}>
                  {acceptedContract ? <Check size={13} /> : null}
                </span>
                <span className="text-[14px] text-[var(--nero)]">Ho letto e accetto i termini del contratto QuandoVuoi</span>
              </button>
            </div>

            <div className="shrink-0 p-4 px-6 pb-[max(16px,env(safe-area-inset-bottom))] bg-white border-t border-[#F0F0F0]">
              <button
                type="button"
                onClick={signContract}
                disabled={!acceptedContract}
                className="w-full h-[52px] rounded-[12px] bg-[var(--nero)] text-white font-bold text-[16px] disabled:opacity-40 relative"
              >
                Firma e continua &rarr;
                {showSigned ? (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white text-[var(--rosa-500)] flex items-center justify-center">
                    <Check size={14} />
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        )}

        {step === 3 && contractSubStep === 'balance' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[var(--nero)] animate-fade-up text-white">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-20 [WebkitOverflowScrolling:touch]">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  <CircularProgress value={progressPercent} max={100} size={200} strokeWidth={12} trackStroke="rgba(255,255,255,0.15)" progressStroke="var(--rosa-200)" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[48px] font-bold leading-none text-white">€{ringBalance.toLocaleString('it-IT')}</div>
                    <div className="text-[14px] text-[var(--rosa-300)]">disponibili</div>
                  </div>
                </div>

                <div className="w-full mb-4">
                  <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-[var(--rosa-200)] transition-all duration-[1500ms] ease-out" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="text-[13px] text-[var(--rosa-300)] text-center">{daysWorkedLabel}</p>
                </div>

                <div className="w-full grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[var(--antracite)] rounded-[12px] p-3 text-left">
                    <div className="text-[12px] text-[var(--grafite)]">Maturato</div>
                    <div className="text-[22px] font-bold text-white">{formatEur(accrued)}</div>
                  </div>
                  <div className="bg-[var(--antracite)] rounded-[12px] p-3 text-left">
                    <div className="text-[12px] text-[var(--grafite)]">Disponibile</div>
                    <div className="text-[22px] font-bold text-white">{formatEur(available)}</div>
                  </div>
                </div>

                <p className="text-[13px] text-[var(--grafite)] text-center mb-2">Il {paydayLabel} ricevi {formatEur(remainingPaycheck)} con la busta paga.</p>
              </div>
            </div>

            <div className="shrink-0 p-4 px-6 pb-[max(16px,env(safe-area-inset-bottom))] bg-[#0F0D0C]">
              <button onClick={onComplete} className="w-full h-[52px] rounded-[12px] bg-white text-[#0F0D0C] font-bold text-[16px]">
                Inizia adesso &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 w-full flex justify-center gap-2 py-3 pb-[max(10px,env(safe-area-inset-bottom))] pointer-events-none bg-transparent">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn('h-2 rounded-full transition-all duration-300', step === index ? 'w-6 bg-[var(--nero)]' : 'w-2 bg-[var(--ardesia-100)]')}
          />
        ))}
      </div>
    </div>
  );
};


// --- EMPLOYEE APP SHELL & TABS ---
const EmployeeAppShell = ({ state, onWithdraw, onUpdateIban, onLogout, isMobileViewport, usePhoneShell }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [ibanModalOpen, setIbanModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const unreadNotifications = state.notifications.filter(n => !n.read).length;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  };

  const handleSaveIban = (newIban) => {
    onUpdateIban(newIban);
    setIbanModalOpen(false);
    showToast(`✓ IBAN aggiornato · ••••${newIban.replace(/\s/g, '').slice(-4)}`);
  };

  return (
    <div className={cn(
      "mx-auto bg-white overflow-hidden relative flex flex-col font-sans transition-all duration-500",
      isMobileViewport
        ? "w-full h-full rounded-none border-0 shadow-none"
        : usePhoneShell
          ? "w-full max-w-[390px] h-[844px] rounded-[32px] border-[8px] border-[var(--nero)] shadow-2xl"
          : "w-full max-w-4xl h-[844px] rounded-[32px] border border-[#F0F0F0] shadow-[0_1px_8px_rgba(0,0,0,0.05)]"
    )}>
      <header className="bg-white text-[var(--nero)] px-4 py-3 sticky top-0 z-30 border-b border-[#F0F0F0] flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveTab('profilo')}
          className="w-9 h-9 rounded-full bg-[var(--rosa-300)] text-[var(--nero)] font-bold flex items-center justify-center text-sm shadow-sm"
          aria-label="Apri profilo"
        >
          MR
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifiche')}
          className="relative w-9 h-9 rounded-full bg-[var(--ardesia-50)] flex items-center justify-center"
          aria-label="Apri notifiche"
        >
          <Bell size={18} className="text-[var(--grafite)]" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-[var(--rosa-500)] min-w-[17px] h-[17px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center border border-white">
              {unreadNotifications}
            </span>
          )}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'home' && (
          <TabPanoramica
            state={state}
            onOpenPreleva={() => setActiveTab('preleva')}
          />
        )}
        {activeTab === 'preleva' && (
          <TabPreleva
            state={state}
            onClose={() => setActiveTab('home')}
            onWithdraw={(amount, date, isScheduled) => {
              onWithdraw(amount, date, isScheduled);
              showToast(isScheduled ? '✓ Prelievo programmato' : '✓ Bonifico inviato');
            }}
            onDone={() => setActiveTab('home')}
            onEditIban={() => setIbanModalOpen(true)}
          />
        )}
        {activeTab === 'notifiche' && <TabNotifiche notifications={state.notifications} />}
        {activeTab === 'profilo' && <TabProfilo state={state} onBack={() => setActiveTab('home')} onEditIban={() => setIbanModalOpen(true)} onLogout={onLogout} />}
      </div>

      <IbanModal isOpen={ibanModalOpen} currentIban={state.iban} onClose={() => setIbanModalOpen(false)} onSave={handleSaveIban} />
      <ToastContainer message={toastMsg} />
    </div>
  );
};


// --- TAB: PANORAMICA ---
const TabPanoramica = ({ state, onOpenPreleva }) => {
  const { available, accrued, periodLabel, daysUntilPayday, greeting, periodStart, today } = EMP_PAYROLL_SNAPSHOT;
  const START_BALANCE = Math.round(available * 0.62);
  const animationRan = useRef(false);
  const [displayBalance, setDisplayBalance] = useState(START_BALANCE);

  const monthToIndex = {
    gen: 0, feb: 1, mar: 2, apr: 3, mag: 4, giu: 5,
    lug: 6, ago: 7, set: 8, ott: 9, nov: 10, dic: 11
  };

  const parseHistoryDate = (dateLabel) => {
    const [dayRaw, monthRaw, yearRaw] = String(dateLabel || '').split(' ');
    const day = Number(dayRaw);
    const month = monthToIndex[(monthRaw || '').toLowerCase()];
    const year = Number(yearRaw);
    if (!Number.isFinite(day) || month === undefined || !Number.isFinite(year)) return null;
    return new Date(year, month, day);
  };

  const withdrawnThisPeriod = state.history
    .filter((w) => {
      const withdrawalDate = parseHistoryDate(w.date);
      return withdrawalDate && withdrawalDate >= periodStart && withdrawalDate <= today;
    })
    .reduce((sum, w) => sum + w.amount, 0);

  useEffect(() => {
    if (animationRan.current) return;
    animationRan.current = true;

    const delay = setTimeout(() => {
      const from = START_BALANCE;
      const to = available;
      const duration = 1200;
      const startTime = performance.now();

      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayBalance(Math.round(from + (to - from) * eased));
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    }, 800);

    return () => clearTimeout(delay);
  }, [START_BALANCE, available]);

  return (
    <div className="p-4 space-y-4 bg-white min-h-full animate-fade-up">
      <div>
        <p className="text-[13px] text-[var(--grafite)] mb-1">{greeting}, Mario.</p>
        <h2 className="text-[20px] font-bold text-[var(--nero)]">Il tuo stipendio è cresciuto.</h2>
      </div>

      <div className="bg-[var(--nero)] rounded-[20px] p-4 pb-7 shadow-[0_1px_8px_rgba(0,0,0,0.05)] text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase tracking-wider text-[var(--rosa-300)]">Disponibile ora</div>
          <div className="text-[11px] text-[var(--rosa-300)]">{periodLabel}</div>
        </div>

        <div className="text-[72px] font-extrabold tracking-[-0.03em] leading-none text-white">
          <span>€{displayBalance.toLocaleString('it-IT')}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenPreleva}
        className="w-full h-[56px] rounded-[14px] bg-[var(--rosa-200)] hover:bg-[var(--rosa-300)] active:bg-[var(--rosa-300)] text-[var(--nero)] font-bold text-[17px]"
      >
        Preleva adesso
      </button>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Importo maturato finora" value={formatEur(accrued)} />
        <MetricCard label="Prelevato nel periodo" value={formatEur(withdrawnThisPeriod)} />
        <div className="col-span-2">
          <MetricCard label="Giorni al prossimo stipendio" value={`${daysUntilPayday} giorni`} />
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-[#F0F0F0] shadow-[0_1px_8px_rgba(0,0,0,0.05)] p-4">
        <h3 className="text-[15px] font-semibold text-[var(--nero)] mb-3">Ultime richieste</h3>
        <div className="space-y-2">
          {state.history.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-white border border-[#F0F0F0] rounded-[10px] p-2.5">
              <div>
                <div className="text-[11px] font-mono text-[var(--grafite)]">{item.id}</div>
                <div className="text-[12px] text-[var(--carbone)]">{item.date}</div>
              </div>
              <div className="text-right">
                <div className="text-[14px] font-bold text-[var(--nero)]">{formatEur(item.amount)}</div>
                <div className="text-[10px] text-[var(--grafite)]">{item.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value }) => {
  return (
    <div className="rounded-[14px] border border-[#F0F0F0] bg-white shadow-[0_1px_8px_rgba(0,0,0,0.05)] p-3.5">
      <div className="text-[11px] text-[var(--grafite)] font-semibold mb-1">{label}</div>
      <div className="text-[18px] font-bold text-[var(--nero)] leading-tight">{value}</div>
    </div>
  );
};


// --- TAB: PRELEVA (CIRCULAR DIAL) ---
const CircularDial = ({ maxAmount, amount, setAmount, onInteraction }) => {
  const svgRef = useRef(null);
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasTappedCenter, setHasTappedCenter] = useState(false);
  const [inputValue, setInputValue] = useState(String(Math.max(0, Math.round(amount || 0))));
  const cx = 150;
  const cy = 150;
  const r = 125;
  const c = 2 * Math.PI * r;

  const clampedAmount = Math.max(0, Math.min(maxAmount, amount));

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(Math.max(0, Math.round(amount || 0))));
    }
  }, [amount, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handlePointer = useCallback((e) => {
    if (!svgRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left - cx;
    const y = clientY - rect.top - cy;

    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    let progress = 0;
    if (angle >= 135 && angle <= 360) progress = (angle - 135) / 270;
    else if (angle >= 0 && angle <= 45) progress = (angle + 360 - 135) / 270;
    else if (angle > 45 && angle < 90) progress = 1;
    else if (angle >= 90 && angle < 135) progress = 0;

    let newAmt = Math.round(progress * maxAmount);
    newAmt = Math.round(newAmt / 10) * 10;
    setAmount(Math.min(Math.max(newAmt, 0), maxAmount));
    onInteraction();
  }, [maxAmount, setAmount, onInteraction]);

  useEffect(() => {
    if (!isDragging) return;
    const stopDragging = () => setIsDragging(false);
    window.addEventListener('pointermove', handlePointer);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('touchmove', handlePointer, { passive: false });
    window.addEventListener('touchend', stopDragging);
    return () => {
      window.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('touchmove', handlePointer);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging, handlePointer]);

  const progress = maxAmount > 0 ? clampedAmount / maxAmount : 0;
  const angleRad = (135 + progress * 270) * Math.PI / 180;
  const thumbX = cx + r * Math.cos(angleRad);
  const thumbY = cy + r * Math.sin(angleRad);

  const commitEditing = () => {
    const parsed = parseInt(String(inputValue).replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setAmount(0);
      setInputValue('0');
      setIsEditing(false);
      return;
    }
    const clamped = Math.max(10, Math.min(parsed, maxAmount));
    setAmount(clamped);
    setInputValue(String(clamped));
    setIsEditing(false);
  };

  const handleInputChange = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setInputValue(cleaned);
    if (cleaned === '') {
      setAmount(0);
      return;
    }
    const parsed = parseInt(cleaned, 10);
    if (Number.isFinite(parsed)) {
      setAmount(parsed);
      onInteraction();
    }
  };

  const amountLabel = formatEur(Math.max(0, Math.round(Number.isNaN(amount) ? 0 : amount)));

  return (
    <div className="relative w-[300px] h-[300px] mx-auto select-none touch-none mt-2 mb-2 pointer-events-none">
      <svg ref={svgRef} width="300" height="300" className="absolute inset-0 z-10 pointer-events-auto">
        <defs>
          <linearGradient id="dialRosa" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--rosa-500)" />
            <stop offset="100%" stopColor="var(--rosa-300)" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#E8E8E8"
          strokeWidth="14"
          strokeDasharray={`${c * 0.75} ${c * 0.25}`}
          transform={`rotate(135 ${cx} ${cy})`}
          strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#dialRosa)"
          strokeWidth="14"
          strokeDasharray={`${c * 0.75 * progress} ${c}`}
          transform={`rotate(135 ${cx} ${cy})`}
          strokeLinecap="round"
          style={{ transition: isDragging ? 'none' : 'stroke-dasharray 0.2s ease' }}
        />
        <circle
          cx={thumbX}
          cy={thumbY}
          r="13"
          fill="white"
          stroke="var(--nero)"
          strokeWidth="3"
          className="cursor-grab active:cursor-grabbing pointer-events-auto"
          onPointerDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
            handlePointer(e);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            handlePointer(e);
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
        <span className="text-[13px] text-[var(--grafite)] mb-1">da prelevare</span>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={commitEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEditing();
            }}
            className={cn(
              'text-[40px] font-bold leading-none tracking-tight text-center bg-transparent border-none outline-none w-[140px]',
              amount > maxAmount ? 'text-[var(--rosa-500)]' : 'text-[var(--nero)]'
            )}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setHasTappedCenter(true);
              onInteraction();
            }}
            className={cn(
              'text-[40px] font-bold leading-none tracking-tight cursor-pointer hover:opacity-90 transition-opacity',
              amount > maxAmount ? 'text-[var(--rosa-500)]' : 'text-[var(--nero)]'
            )}
          >
            {amountLabel}
          </button>
        )}
        {!hasTappedCenter && !isEditing && (
          <span className="text-[11px] text-[var(--grafite)] mt-1">Tocca per modificare</span>
        )}
      </div>
    </div>
  );
};

const TabPreleva = ({ state, onClose, onWithdraw, onDone, onEditIban }) => {
  const [amount, setAmount] = useState(Math.min(250, state.balance));
  const [flowStep, setFlowStep] = useState('amount'); // amount | timing | dates
  const [selectedDate, setSelectedDate] = useState('');

  const availableBalance = state.balance;
  const displayIban = `••••${state.iban.replace(/\s/g, '').slice(-4)}`;

  const isOverBalance = amount > availableBalance;
  const amountValid = !Number.isNaN(amount) && amount > 0 && !isOverBalance;

  const generateDateChips = () => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const monthNames = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() + 1);
    const periodEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 10);

    const items = [];
    const cursor = new Date(start);
    while (cursor <= periodEndDate) {
      const day = cursor.getDay();
      if (day >= 1 && day <= 5) {
        const hasMonthSuffix = cursor.getMonth() !== today.getMonth();
        const label = hasMonthSuffix
          ? `${dayNames[day]} ${cursor.getDate()} ${monthNames[cursor.getMonth()]}`
          : `${dayNames[day]} ${cursor.getDate()}`;
        const value = `${cursor.getDate()} ${monthNames[cursor.getMonth()]}`;
        items.push({ label, value });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return items;
  };

  const dateChips = generateDateChips();

  useEffect(() => {
    if (!selectedDate && dateChips.length > 0) {
      setSelectedDate(dateChips[0].value);
    }
  }, [selectedDate, dateChips]);

  const applyQuickAmount = (value) => {
    setAmount(value);
  };

  const performWithdraw = (isScheduled) => {
    if (!amountValid) return;
    onWithdraw(Math.round(amount), selectedDate, isScheduled);
    onDone();
  };

  return (
    <div className="flex-1 bg-white flex flex-col h-full animate-fade-up relative">
      <div className="pt-4 pb-2 px-4 flex items-center justify-between border-b border-[#F0F0F0]">
        <button onClick={() => (flowStep === 'amount' ? onClose() : setFlowStep(flowStep === 'dates' ? 'timing' : 'amount'))} className="p-2 -ml-2 text-[var(--grafite)] hover:bg-[#F7F7F7] rounded-full transition-colors"><ChevronLeft size={24}/></button>
        <span className="text-[16px] font-semibold text-[var(--nero)]">
          {flowStep === 'amount' ? 'Preleva adesso' : flowStep === 'timing' ? 'Quando vuoi i soldi?' : 'Scegli una data'}
        </span>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 px-4 pt-4 pb-6 overflow-y-auto no-scrollbar bg-white">
        {flowStep === 'amount' && (
          <>
            <div className="flex items-center gap-3 p-3 bg-white border border-[#F0F0F0] rounded-[12px] mb-3">
              <div className="w-8 h-8 bg-[#F7F7F7] rounded-full flex items-center justify-center"><Landmark size={16} className="text-[var(--grafite)]" /></div>
              <div className="flex-1 text-[13px] font-medium text-[var(--carbone)]">Conto {displayIban}</div>
              <button type="button" onClick={onEditIban} className="p-1.5 rounded-full hover:bg-[#F7F7F7] text-[var(--grafite)]"><Pencil size={16} /></button>
            </div>

            <CircularDial
              maxAmount={availableBalance}
              amount={amount}
              setAmount={setAmount}
              onInteraction={() => {}}
            />

            <div className="grid grid-cols-2 gap-2 mb-3">
              {[50, 100, 200, 300].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => applyQuickAmount(value)}
                  className={cn(
                    'h-[44px] rounded-[12px] border text-[14px] font-semibold',
                    amount === value ? 'bg-[var(--rosa-200)] text-[var(--nero)] border-[var(--rosa-300)]' : 'bg-white text-[var(--nero)] border-[#E8E8E8]'
                  )}
                >
                  {formatEur(value)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => applyQuickAmount(availableBalance)}
              className={cn(
                'w-full h-[44px] rounded-[12px] border text-[14px] font-semibold mb-4',
                amount === availableBalance ? 'bg-[var(--rosa-200)] text-[var(--nero)] border-[var(--rosa-300)]' : 'bg-white text-[var(--nero)] border-[#E8E8E8]'
              )}
            >
              Tutto il disponibile
            </button>

            {isOverBalance && <p className="text-[12px] text-[var(--rosa-500)] mb-3">Importo superiore al saldo disponibile.</p>}

            <button
              type="button"
              disabled={!amountValid}
              onClick={() => setFlowStep('timing')}
              className="w-full h-[52px] bg-[var(--nero)] hover:bg-[var(--antracite)] text-white rounded-[14px] font-bold disabled:opacity-40"
            >
              {amountValid ? `Preleva ${formatEur(Math.round(amount))}` : 'Inserisci un importo valido'}
            </button>
          </>
        )}

        {flowStep === 'timing' && (
          <div className="pt-8">
            <h3 className="text-[15px] font-semibold text-[var(--nero)] mb-2 text-center">Quando vuoi i soldi?</h3>
            <p className="text-center text-[44px] font-bold text-[var(--nero)] mb-6">{formatEur(Math.round(Math.max(0, amount)))}</p>

            <div className="space-y-3">
              <button type="button" onClick={() => performWithdraw(false)} className="w-full h-[52px] bg-[var(--nero)] hover:bg-[var(--antracite)] text-white rounded-[14px] font-bold">
                Adesso
              </button>
              <button type="button" onClick={() => setFlowStep('dates')} className="w-full h-[52px] bg-white border border-[#E8E8E8] text-[var(--nero)] rounded-[14px] font-bold">
                Scegli una data
              </button>
            </div>
          </div>
        )}

        {flowStep === 'dates' && (
          <div className="pt-3">
            <h3 className="text-[15px] font-semibold text-[var(--nero)] mb-3">Data di erogazione</h3>
            <div className="relative">
              <div className="overflow-x-auto no-scrollbar pr-8">
                <div className="flex gap-2 w-max">
                  {dateChips.map((chip) => (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => setSelectedDate(chip.value)}
                      className={cn(
                        'px-4 h-[40px] rounded-[10px] text-[13px] font-semibold border whitespace-nowrap',
                        selectedDate === chip.value
                          ? 'bg-[var(--nero)] text-white border-[var(--nero)]'
                          : 'bg-white text-[var(--nero)] border-[#E8E8E8]'
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
              {dateChips.length > 6 && (
                <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent" />
              )}
            </div>

            <button
              type="button"
              onClick={() => performWithdraw(true)}
              className="mt-6 w-full h-[52px] bg-[var(--nero)] hover:bg-[var(--antracite)] text-white rounded-[14px] font-bold"
            >
              Programma prelievo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


// --- TAB: NOTIFICHE ---
const TabNotifiche = ({ notifications }) => (
  <div className="bg-white min-h-full animate-fade-up">
    <div className="p-6 pb-2 border-b border-[#F0F0F0]">
      <h2 className="text-[15px] font-semibold text-[var(--nero)]">Notifiche</h2>
    </div>
    <div>
      {notifications.map(n => (
        <div key={n.id} className="p-4 border-b border-[#F0F0F0] hover:bg-white transition-colors flex gap-4 relative cursor-pointer">
          {!n.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--rosa-500)]" />}
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white border border-[#F0F0F0] text-[var(--grafite)]">
            {n.type === 'success' && <Check size={20} />}
            {n.type === 'info' && <Calendar size={20} />}
            {n.type === 'payday' && <Receipt size={20} />}
          </div>
          <div className="flex-1">
            <h4 className="text-[14px] font-bold text-[var(--nero)] leading-tight mb-1">{n.title}</h4>
            <p className="text-[13px] text-[var(--grafite)] leading-snug mb-1">{n.body}</p>
            <p className="text-[11px] text-[var(--polvere)] font-medium text-right">{n.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);


// --- TAB: PROFILO ---
const TabProfilo = ({ state, onBack, onEditIban, onLogout }) => (
  <div className="p-6 bg-white min-h-full animate-fade-up flex flex-col items-center">
    <div className="w-full flex items-center mb-2">
      <button type="button" onClick={onBack} className="p-2 -ml-2 text-[var(--grafite)] hover:bg-[var(--fumo)] rounded-full" aria-label="Torna alla home">
        <ChevronLeft size={20} />
      </button>
    </div>
    <div className="w-20 h-20 rounded-full bg-[var(--rosa-300)] text-white text-[24px] font-bold flex items-center justify-center shadow-md mb-4 mt-4">
      MR
    </div>
    <h2 className="text-[24px] font-bold text-[var(--nero)] mb-1">Mario Rossi</h2>
    <p className="text-[13px] text-[var(--grafite)] font-medium mb-8">Sviluppatore Senior · Acme SpA</p>

    <div className="w-full bg-white rounded-[20px] p-2 shadow-[0_1px_8px_rgba(0,0,0,0.05)] border border-[#F0F0F0] mb-6">
      <div className="flex items-center p-3 rounded-[12px] mb-1">
        <Building2 size={20} className="text-[var(--grafite)] shrink-0 mr-3" />
        <span className="text-[13px] text-[var(--grafite)] w-20">Azienda</span>
        <span className="text-[14px] font-bold text-[var(--nero)] flex-1 text-right">Acme SpA</span>
      </div>
      <div className="flex items-center p-3 rounded-[12px] mb-1">
        <Receipt size={20} className="text-[var(--grafite)] shrink-0 mr-3" />
        <span className="text-[13px] text-[var(--grafite)] w-20">Stipendio netto</span>
        <span className="text-[14px] font-bold text-[var(--nero)] flex-1 text-right">€3.200/mese</span>
      </div>
      <button type="button" className="w-full p-3 rounded-[12px] mb-1 hover:bg-[var(--fumo)] text-left" onClick={onEditIban}>
        <div className="flex items-center">
        <Building2 size={20} className="text-[var(--grafite)] shrink-0 mr-3" />
        <span className="text-[13px] text-[var(--grafite)] w-14">IBAN</span>
        <div className="flex-1 flex justify-end items-center gap-2">
           <span className="text-[14px] font-bold text-[var(--nero)]">••••{state.iban.replace(/\s/g, '').slice(-4)}</span>
           <Pencil size={16} className="text-[var(--grafite)]" />
        </div>
        </div>
      </button>
      <div className="flex items-center p-3 rounded-[12px]">
        <User size={20} className="text-[var(--grafite)] shrink-0 mr-3" />
        <span className="text-[13px] text-[var(--grafite)] w-20">Email</span>
        <span className="text-[14px] font-bold text-[var(--nero)] flex-1 text-right">mario@acme.it</span>
      </div>
    </div>

    <button onClick={onLogout} className="w-full h-[48px] bg-white text-[var(--grafite)] font-bold rounded-[14px] shadow-sm hover:text-[var(--rosa-500)] hover:bg-[var(--rosa-50)] transition-colors mt-auto mb-4">
      Esci dall'account
    </button>
  </div>
);


// --- EMPLOYEE CALENDAR (Shared) ---
const EmployeeCalendar = ({ history }) => {
  const [monthIdx, setMonthIdx] = useState(1);
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
  const monthsData = [
    { name: 'Gennaio 2026', days: 31, offset: 2, id: 'gen 2026', short: 'gen' },
    { name: 'Febbraio 2026', days: 28, offset: 5, id: 'feb 2026', short: 'feb' },
    { name: 'Marzo 2026', days: 31, offset: 6, id: 'mar 2026' },
    { name: 'Aprile 2026', days: 30, offset: 2, id: 'apr 2026' }
  ];
  const paydayByMonth = {
    'feb 2026': 10,
    'mar 2026': 10,
    'apr 2026': 10
  };
  
  const currentMonth = monthsData[monthIdx];
  const daysArray = Array.from({length: currentMonth.days}, (_, i) => i + 1);
  const blanksArray = Array.from({length: currentMonth.offset}, (_, i) => i);
  
  const monthHistory = history.filter(h => h.date.includes(currentMonth.id));
  const erogatiHistory = monthHistory.filter(h => h.status !== 'Programmato');
  const totalWithdrawn = erogatiHistory.reduce((sum, h) => sum + h.amount, 0);

  const prevMonth = () => setMonthIdx(Math.max(0, monthIdx - 1));
  const nextMonth = () => setMonthIdx(Math.min(3, monthIdx + 1));
  const closeDetails = () => setSelectedDayDetails(null);

  const openDayDetails = (day, monthId, matchDays, isPayday) => {
    const monthShort = monthId.split(' ')[0];
    const dateLabel = `${day} ${monthShort} 2026`;
    setSelectedDayDetails({
      day,
      monthId,
      dateLabel,
      isPayday,
      requests: matchDays
    });
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm p-5 animate-fade-up relative">
      <div className="flex justify-between items-center mb-6">
        <button onClick={prevMonth} disabled={monthIdx === 0} className="p-1.5 text-[var(--grafite)] hover:bg-[var(--fumo)] rounded-full transition-colors disabled:opacity-30"><ChevronLeft size={20}/></button>
        <h3 className="text-[16px] font-bold text-[var(--nero)]">{currentMonth.name}</h3>
        <button onClick={nextMonth} disabled={monthIdx === 3} className="p-1.5 text-[var(--grafite)] hover:bg-[var(--fumo)] rounded-full transition-colors disabled:opacity-30"><ChevronRight size={20}/></button>
      </div>
      
      <div className="grid grid-cols-7 gap-1.5 mb-6">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-[var(--grafite)] uppercase">{d}</div>
        ))}
        {blanksArray.map(b => <div key={`blank-${b}`} className="h-10"></div>)}
        {daysArray.map(d => {
          const isToday = currentMonth.id === 'mar 2026' && d === 19;
          const isPayday = paydayByMonth[currentMonth.id] === d;
          const isWorked = monthIdx < 2 ? true : d <= 16;
          const isWeekend = ((d + currentMonth.offset - 1) % 7) >= 5;

          const matchDays = history.filter(h => h.date.startsWith(`${d} ${currentMonth.id.split(' ')[0]}`));
          const hasErogato = matchDays.some(h => h.status === 'Erogato' || h.status === 'In elaborazione');
          const hasProgrammato = matchDays.some(h => h.status === 'Programmato');
          const hasActionableEvent = matchDays.length > 0 || isPayday;

          let bgClass = "bg-transparent";
          if (hasErogato) bgClass = "bg-[var(--rosa-200)]";
          else if (hasProgrammato) bgClass = "bg-[var(--pervinca-100)]";
          else if (isPayday) bgClass = "bg-[var(--acqua-100)]";
          else if (isWorked && currentMonth.id === 'mar 2026') bgClass = "bg-[var(--fumo)]";

          let textClass = "text-[var(--carbone)]";
          if (isWeekend && !hasErogato && !hasProgrammato && !isPayday) textClass = "text-[var(--grafite)] opacity-60";
          if (isToday) textClass = "font-bold text-[var(--nero)]";

          return (
            <button
              key={d}
              type="button"
              onClick={() => hasActionableEvent && openDayDetails(d, currentMonth.id, matchDays, isPayday)}
              className={cn(
                "h-10 rounded-[10px] flex flex-col items-center justify-center relative",
                bgClass,
                isToday && "border-[1.5px] border-[var(--nero)]",
                hasActionableEvent ? "cursor-pointer hover:brightness-95" : "cursor-default"
              )}
            >
              <span className={cn("text-[13px]", textClass, isToday && "font-bold")}>{d}</span>
              {hasErogato && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--rosa-500)]" />}
              {hasProgrammato && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--pervinca-500)]" />}
              {isPayday && <div className="absolute bottom-[1px] text-[8px]">💰</div>}
            </button>
          );
        })}
      </div>
      
      <div className="flex flex-wrap gap-x-3 gap-y-2 text-[11px] font-medium text-[var(--grafite)] justify-center border-t border-[var(--ardesia-100)] pt-4 mb-4">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--rosa-500)]"></div> Prelievo</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--pervinca-500)]"></div> Programmato</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--acqua-500)]"></div> Busta paga</div>
      </div>
      
      <div className="text-center text-[12px] font-medium text-[var(--carbone)] bg-[var(--ardesia-50)] p-2.5 rounded-[10px]">
        {monthHistory.length} richieste · erogato {formatEur(totalWithdrawn)}
      </div>

      {selectedDayDetails && (
        <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center">
          <button type="button" className="absolute inset-0 bg-[var(--nero)]/45" onClick={closeDetails} aria-label="Chiudi dettagli" />
          <div className="relative w-full sm:w-[420px] bg-white rounded-t-[20px] sm:rounded-[16px] p-5 shadow-2xl animate-slide-up">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-[18px] font-bold text-[var(--nero)]">Dettaglio {selectedDayDetails.dateLabel}</h4>
                <p className="text-[12px] text-[var(--grafite)]">Richieste e stato della giornata</p>
              </div>
              <button type="button" onClick={closeDetails} className="w-8 h-8 rounded-full bg-[var(--fumo)] text-[var(--grafite)] hover:bg-[var(--ardesia-100)] flex items-center justify-center" aria-label="Chiudi">
                <X size={16} />
              </button>
            </div>

            {selectedDayDetails.isPayday && (
              <div className="mb-3 p-3 rounded-[10px] bg-[var(--acqua-50)] border border-[var(--acqua-100)] text-[13px] text-[var(--carbone)]">
                💰 Giorno busta paga: accredito dello stipendio netto.
              </div>
            )}

            {selectedDayDetails.requests.length === 0 ? (
              <p className="text-[13px] text-[var(--grafite)]">Nessuna richiesta registrata in questa data.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {selectedDayDetails.requests.map((request) => (
                  <div key={request.id} className="p-3 rounded-[10px] border border-[var(--ardesia-100)] bg-[var(--fumo)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-mono text-[var(--grafite)]">{request.id}</span>
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full",
                        request.status === 'Programmato' ? "bg-[var(--pervinca-100)] text-[var(--pervinca-500)]" :
                        request.status === 'In elaborazione' ? "bg-[var(--rosa-100)] text-[var(--rosa-500)]" :
                        "bg-[var(--acqua-100)] text-[var(--acqua-500)]"
                      )}>{request.status}</span>
                    </div>
                    <div className="text-[15px] font-bold text-[var(--nero)]">{formatEur(request.amount)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button type="button" onClick={closeDetails} className="px-4 h-10 rounded-[10px] gradient-rosa text-white font-bold text-[13px]">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- HR ONBOARDING ---
const HROnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [toggles, setToggles] = useState(HR_EMPLOYEES_SEED.map((employee) => employee.status === 'Attivo'));

  const nextStep = () => setStep((current) => Math.min(current + 1, 4));
  const prevStep = () => setStep((current) => Math.max(current - 1, 1));

  const handleToggle = (index) => {
    setToggles((current) => {
      const next = [...current];
      next[index] = !next[index];
      return next;
    });
  };

  const activeCount = toggles.filter(Boolean).length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('https://app.quandovuoi.it/join/acme-k7x2');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="w-full max-w-[560px] h-full md:h-[844px] bg-white rounded-none md:rounded-[24px] border-0 md:border border-[var(--ardesia-100)] shadow-none md:shadow-xl overflow-hidden min-h-0">
      <div className="h-full min-h-0 flex flex-col relative">
        <div className="absolute top-0 w-full p-6 flex justify-end z-20">
          <button onClick={onComplete} className="text-[13px] text-[var(--grafite)] hover:underline">
            Salta introduzione &rarr;
          </button>
        </div>

        {step === 1 && (
          <div className="flex-1 bg-[var(--pervinca-50)] p-8 flex flex-col justify-center animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-[var(--pervinca-100)] flex items-center justify-center mb-8">
              <Building2 size={32} className="text-[var(--pervinca-500)]" />
            </div>
            <h1 className="text-[36px] font-bold leading-tight mb-2 text-[var(--nero)]">Benvenuta, Maria.</h1>
            <h2 className="text-[20px] font-medium text-[var(--rosa-500)] mb-6">Zero approvazioni. Zero burocrazia.</h2>
            <p className="text-[16px] leading-relaxed text-[var(--carbone)] mb-10">
              Attivi il servizio per i tuoi dipendenti. Noi gestiamo tutto il resto automaticamente.
            </p>

            <div className="flex gap-3 mb-12">
              <div className="flex-1 bg-white border border-[var(--pervinca-100)] p-4 rounded-[12px]">
                <div className="text-[24px] font-bold mb-1 text-[var(--nero)]">15 min</div>
                <div className="text-[12px] text-[var(--grafite)]">tempo medio di setup</div>
              </div>
              <div className="flex-1 bg-white border border-[var(--pervinca-100)] p-4 rounded-[12px]">
                <div className="text-[24px] font-bold mb-1 text-[var(--nero)]">0</div>
                <div className="text-[12px] text-[var(--grafite)]">approvazioni manuali</div>
              </div>
            </div>

            <button onClick={nextStep} className="mt-auto mb-2 w-full gradient-rosa text-white h-[52px] rounded-[12px] font-bold text-[16px] hover:opacity-95 transition-opacity">
              Configura il servizio &rarr;
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 bg-[var(--ardesia-50)] p-8 flex flex-col pt-20 animate-fade-up">
            <h2 className="text-[24px] font-bold text-[var(--nero)] mb-6">Dati aziendali</h2>

            <div className="bg-white p-6 rounded-[16px] shadow-sm space-y-4 mb-6">
              <div>
                <label className="block text-[12px] font-medium text-[var(--grafite)] mb-1">Ragione sociale</label>
                <input type="text" defaultValue="Acme SpA" className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2.5" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--grafite)] mb-1">Partita IVA</label>
                <input type="text" defaultValue="IT12345678901" className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2.5" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--grafite)] mb-1">Referente HR</label>
                <input type="text" defaultValue="Maria Bianchi" className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2.5" />
              </div>
            </div>

            <div className="flex gap-3 mt-auto mb-2">
              <button onClick={prevStep} className="px-6 h-[52px] rounded-[12px] border border-[var(--ardesia-300)] text-[var(--carbone)] bg-white">
                &larr; Indietro
              </button>
              <button onClick={nextStep} className="flex-1 gradient-rosa text-white h-[52px] rounded-[12px] font-bold">
                Continua &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 min-h-0 bg-white p-6 flex flex-col pt-16 animate-fade-up">
            <h2 className="text-[24px] font-bold text-[var(--nero)] mb-1">Chi puo usare QuandoVuoi?</h2>
            <p className="text-[13px] text-[var(--grafite)] mb-6">Puoi modificarlo in qualsiasi momento dalla dashboard.</p>

            <div className="flex justify-between items-center bg-[var(--ardesia-50)] p-3 rounded-[12px] mb-4">
              <span className="text-[13px] font-medium text-[var(--carbone)]">{activeCount} su {HR_EMPLOYEES_SEED.length} selezionati</span>
              <button onClick={() => setToggles(Array(HR_EMPLOYEES_SEED.length).fill(true))} className="text-[13px] font-bold text-[var(--rosa-500)]">
                Attiva tutti
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-8 [overscroll-behavior:contain]">
              {HR_EMPLOYEES_SEED.map((employee, index) => (
                <div key={employee.id} className="flex items-center justify-between p-3 hover:bg-[var(--rosa-50)] rounded-[12px]" onClick={() => handleToggle(index)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--ardesia-100)] text-[var(--ardesia-500)] flex items-center justify-center text-[12px] font-bold">
                      {employeeInitials(employee)}
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[var(--nero)]">{fullEmployeeName(employee)}</div>
                      <div className="text-[12px] text-[var(--grafite)]">{employee.role}</div>
                    </div>
                  </div>
                  <div className={cn('w-11 h-6 rounded-full relative transition-colors', toggles[index] ? 'bg-[var(--acqua-300)]' : 'bg-[var(--polvere)]')}>
                    <div className={cn('absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm', toggles[index] ? 'translate-x-5' : 'translate-x-0')} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-4 mb-4 pt-4 border-t border-[var(--ardesia-100)]">
              <button onClick={prevStep} className="px-6 h-[52px] rounded-[12px] border border-[var(--ardesia-100)] text-[var(--carbone)]">
                &larr; Indietro
              </button>
              <button onClick={nextStep} className="flex-1 gradient-rosa text-white h-[52px] rounded-[12px] font-bold">
                Attiva servizio &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 bg-[var(--acqua-50)] p-8 flex flex-col justify-center animate-fade-up text-center relative z-10">
            <div className="w-24 h-24 mx-auto mb-8 relative">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 52 52">
                <circle className="text-[var(--acqua-100)]" cx="26" cy="26" r="25" fill="currentColor" />
                <path className="animate-check text-[var(--acqua-500)]" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h2 className="text-[28px] font-bold text-[var(--nero)] mb-3 leading-tight">Servizio attivo per {activeCount} dipendenti.</h2>
            <p className="text-[15px] text-[var(--carbone)] mb-10">I dipendenti riceveranno un invito via email.</p>

            <div className="bg-white p-4 rounded-[16px] shadow-sm mb-10 text-left">
              <label className="block text-[12px] font-bold text-[var(--grafite)] mb-2 uppercase tracking-wider">Link invito</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-[var(--fumo)] text-[13px] text-[var(--carbone)] p-3 rounded-[10px] overflow-hidden text-ellipsis whitespace-nowrap font-mono">
                  https://app.quandovuoi.it/join/acme-k7x2
                </div>
                <button onClick={handleCopy} className="bg-[var(--rosa-100)] text-[var(--rosa-500)] px-4 rounded-[10px] font-bold text-[13px] hover:bg-[var(--rosa-200)] transition-colors flex items-center gap-1">
                  <Copy size={16} /> {copied ? 'Copiato' : 'Copia'}
                </button>
              </div>
            </div>

            <button onClick={onComplete} className="w-full bg-[var(--nero)] text-white h-[52px] rounded-[12px] font-bold">
              Vai alla dashboard &rarr;
            </button>
          </div>
        )}

        <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 pb-safe pointer-events-none z-0">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className={cn('h-2 rounded-full transition-all duration-300', step === index ? 'w-6 bg-[var(--rosa-500)]' : 'w-2 bg-[var(--ardesia-300)]')} />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- HR DASHBOARD ---
const HRDashboard = ({ onLogout }) => {
  const [employees, setEmployees] = useState(HR_EMPLOYEES_SEED);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [draftEmployee, setDraftEmployee] = useState(null);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);
  const [importFeedback, setImportFeedback] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    ral: '',
    contractType: 'Tempo indeterminato',
    email: '',
    codiceFiscale: '',
    yearsAtCompany: '0',
    ibanVero: '',
    payDay: '10'
  });

  const fileInputRef = useRef(null);
  const rowsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(''), 2500);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId) || null;
  const activeCount = employees.filter((employee) => employee.status === 'Attivo').length;
  const inactiveCount = employees.length - activeCount;

  const statusStyles = {
    Attivo: 'bg-[var(--acqua-100)] text-[var(--acqua-500)]',
    'Non attivo': 'bg-[var(--ardesia-100)] text-[var(--grafite)]',
    Invitato: 'bg-[var(--rosa-100)] text-[var(--rosa-500)]'
  };

  const contractStyles = {
    'Tempo indeterminato': { label: 'Indeterminato', className: 'bg-[var(--acqua-50)] text-[var(--acqua-500)]' },
    'Tempo determinato': { label: 'Determinato', className: 'bg-[var(--rosa-50)] text-[var(--rosa-500)]' },
    'Part-time': { label: 'Part-time', className: 'bg-[var(--malva-50)] text-[var(--malva-500)]' }
  };

  const normalizeContractType = (value) => {
    const normalized = String(value || '').toLowerCase().trim();
    if (normalized.includes('part')) return 'Part-time';
    if (normalized.includes('determin')) return 'Tempo determinato';
    return 'Tempo indeterminato';
  };

  const cleanIban = (value) => String(value || '').toUpperCase().replace(/\s+/g, '');
  const formatIbanInput = (value) => {
    const normalized = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return normalized.match(/.{1,4}/g)?.join(' ') || '';
  };
  const isValidIban = (value) => {
    const normalized = cleanIban(value);
    return normalized.startsWith('IT') && normalized.length >= 15;
  };

  const getAvatarColors = (index) => {
    const colors = [
      { bg: 'var(--rosa-300)', text: 'white' },
      { bg: 'var(--pervinca-300)', text: 'white' },
      { bg: 'var(--acqua-300)', text: 'white' },
      { bg: 'var(--malva-300)', text: 'white' }
    ];
    return colors[index % 4];
  };

  const nextEmployeeId = () => Math.max(...employees.map((employee) => employee.id), 0) + 1;

  const assignVirtualIban = (employee) => {
    if (employee.status !== 'Attivo') return '—';
    if (employee.ibanVirtuale && employee.ibanVirtuale !== '—') return employee.ibanVirtuale;
    return `QV-IT${String(employee.id).padStart(3, '0')}-${employeeInitials(employee)}`;
  };

  const toggleStatus = (id) => {
    setEmployees((current) => current.map((employee) => {
      if (employee.id !== id) return employee;
      const nextStatus = employee.status === 'Attivo' ? 'Non attivo' : 'Attivo';
      const updated = {
        ...employee,
        status: nextStatus,
        activationDate: nextStatus === 'Attivo' ? (employee.activationDate === '—' ? '15 gen 2026' : employee.activationDate) : '—'
      };
      return { ...updated, ibanVirtuale: assignVirtualIban(updated) };
    }));
  };

  const handleOpenFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const normalizeImportRow = (row) => {
    return Object.entries(row).reduce((acc, [key, value]) => {
      acc[String(key).toLowerCase().replace(/[^a-z0-9]/g, '')] = value;
      return acc;
    }, {});
  };

  const parseEmployeeRow = (row) => {
    const normalized = normalizeImportRow(row);
    const firstName = String(normalized.nome || '').trim();
    const lastName = String(normalized.cognome || '').trim();
    const ral = Number(normalized.ral || 0);
    if (!firstName || !lastName || !ral) return null;

    const id = nextEmployeeId() + Math.floor(Math.random() * 10000);
    const role = String(normalized.ruolo || normalized.role || 'Dipendente').trim() || 'Dipendente';
    const contractType = normalizeContractType(normalized.tipocontratto);

    return createEmployee({
      id,
      firstName,
      lastName,
      role,
      ral,
      codiceFiscale: String(normalized.cf || normalized.codicefiscale || '').trim().toUpperCase(),
      yearsAtCompany: Math.max(0, Number(normalized.anniinazienda || 0)),
      contractType,
      ibanVero: formatIbanInput(normalized.ibanvero || ''),
      ibanVirtuale: '—',
      email: String(normalized.email || `${firstName}.${lastName}@acme.it`).replace(/\s+/g, '').toLowerCase(),
      status: 'Invitato',
      payDay: 10,
      activationDate: '—'
    });
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const parsedEmployees = rows
        .map(parseEmployeeRow)
        .filter(Boolean)
        .filter((employee) => !employees.some((existing) => fullEmployeeName(existing).toLowerCase() === fullEmployeeName(employee).toLowerCase()));

      if (parsedEmployees.length === 0) {
        setImportFeedback('Nessun dipendente valido trovato nel file.');
      } else {
        setEmployees((current) => [...parsedEmployees, ...current]);
        setImportFeedback(`${parsedEmployees.length} dipendenti importati con successo.`);
        setShowImportModal(false);
      }
    } catch {
      setImportFeedback('Import non riuscito. Usa un file Excel o CSV valido.');
    } finally {
      event.target.value = '';
    }
  };

  const handleAddEmployee = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.role.trim() || !Number(formData.ral)) return;

    const created = createEmployee({
      id: nextEmployeeId(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      role: formData.role.trim(),
      ral: Number(formData.ral),
      codiceFiscale: formData.codiceFiscale.trim().toUpperCase(),
      yearsAtCompany: Math.max(0, Number(formData.yearsAtCompany) || 0),
      contractType: formData.contractType,
      ibanVero: formatIbanInput(formData.ibanVero),
      ibanVirtuale: '—',
      email: formData.email.trim().toLowerCase(),
      status: 'Invitato',
      payDay: Math.min(31, Math.max(1, Number(formData.payDay) || 10)),
      activationDate: '—'
    });

    setEmployees((current) => [created, ...current]);
    setFormData({
      firstName: '',
      lastName: '',
      role: '',
      ral: '',
      contractType: 'Tempo indeterminato',
      email: '',
      codiceFiscale: '',
      yearsAtCompany: '0',
      ibanVero: '',
      payDay: '10'
    });
    setShowAddModal(false);
  };

  const openEmployeeModal = (employee) => {
    setSelectedEmployeeId(employee.id);
    setDraftEmployee({ ...employee });
    setShowDiscardWarning(false);
  };

  const closeEmployeeModal = () => {
    setSelectedEmployeeId(null);
    setDraftEmployee(null);
    setShowDiscardWarning(false);
  };

  const draftWithNet = draftEmployee ? { ...draftEmployee, netMonthly: calculateNetMonthly(Number(draftEmployee.ral) || 0) } : null;
  const selectedWithNet = selectedEmployee ? { ...selectedEmployee, netMonthly: calculateNetMonthly(Number(selectedEmployee.ral) || 0) } : null;
  const hasUnsavedChanges = Boolean(draftWithNet && selectedWithNet && JSON.stringify(draftWithNet) !== JSON.stringify(selectedWithNet));

  const requestCloseEmployeeModal = () => {
    if (hasUnsavedChanges) {
      setShowDiscardWarning(true);
      return;
    }
    closeEmployeeModal();
  };

  const updateDraft = (field, value) => {
    setDraftEmployee((current) => {
      if (!current) return current;
      const next = { ...current, [field]: value };
      if (field === 'status') {
        if (value !== 'Attivo') {
          next.ibanVirtuale = '—';
          next.activationDate = '—';
        } else {
          next.activationDate = current.activationDate === '—' ? '15 gen 2026' : current.activationDate;
          next.ibanVirtuale = assignVirtualIban(next);
        }
      }
      return next;
    });
    setShowDiscardWarning(false);
  };

  const saveEmployeeChanges = () => {
    if (!draftEmployee || !hasUnsavedChanges) return;

    const updated = {
      ...draftEmployee,
      ral: Number(draftEmployee.ral) || 0,
      yearsAtCompany: Math.max(0, Number(draftEmployee.yearsAtCompany) || 0),
      payDay: Math.min(31, Math.max(1, Number(draftEmployee.payDay) || 10)),
      contractType: normalizeContractType(draftEmployee.contractType),
      codiceFiscale: String(draftEmployee.codiceFiscale || '').trim().toUpperCase(),
      email: String(draftEmployee.email || '').trim().toLowerCase(),
      ibanVero: formatIbanInput(draftEmployee.ibanVero),
      netMonthly: calculateNetMonthly(Number(draftEmployee.ral) || 0)
    };

    updated.status = updated.status === 'Attivo' ? 'Attivo' : 'Non attivo';
    updated.activationDate = updated.status === 'Attivo' ? (updated.activationDate === '—' ? '15 gen 2026' : updated.activationDate) : '—';
    updated.ibanVirtuale = assignVirtualIban(updated);

    setEmployees((current) => current.map((employee) => (employee.id === updated.id ? updated : employee)));
    setToastMessage(`✓ Profilo aggiornato · ${fullEmployeeName(updated)}`);
    closeEmployeeModal();
  };

  const exportEmployees = () => {
    const headers = ['Nome', 'Cognome', 'RAL', 'Netto', 'CF', 'Anni in azienda', 'Tipo contratto', 'IBAN Vero'];
    const rows = employees.map((employee) => [
      employee.firstName,
      employee.lastName,
      employee.ral,
      employee.netMonthly,
      employee.codiceFiscale,
      employee.yearsAtCompany,
      employee.contractType,
      cleanIban(employee.ibanVero)
    ]);
    const csv = [headers, ...rows].map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', 'dipendenti-quandovuoi.csv');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const downloadImportTemplate = () => {
    const headers = ['Nome', 'Cognome', 'RAL', 'Netto', 'CF', 'Anni in azienda', 'Tipo contratto', 'IBAN Vero'];
    const blob = new Blob([`${headers.join(',')}\n`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', 'template-dipendenti-quandovuoi.csv');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const filteredEmployees = employees.filter((employee) => {
    const searchLower = search.toLowerCase();
    const matches =
      fullEmployeeName(employee).toLowerCase().includes(searchLower) ||
      employee.role.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      employee.codiceFiscale.toLowerCase().includes(searchLower);
    if (filter === 'active') return matches && employee.status === 'Attivo';
    if (filter === 'inactive') return matches && employee.status !== 'Attivo';
    return matches;
  });

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / rowsPerPage));
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const startIdx = filteredEmployees.length ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const endIdx = Math.min(currentPage * rowsPerPage, filteredEmployees.length);

  return (
    <div className="min-h-screen bg-[var(--fumo)] pb-20 font-sans w-full">
      <header className="bg-white border-b border-[var(--ardesia-100)] sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="h-12 w-12 md:h-14 md:w-14 rounded-[14px] bg-[var(--nero)] shadow-md flex items-center justify-center hover:scale-[1.03] transition-transform"
            aria-label="Vai in alto"
          >
            <img src={logoDark} alt="QuandoVuoi" className="h-7 w-7 md:h-8 md:w-8 object-contain" />
          </button>
          <div className="w-px h-6 bg-[var(--ardesia-100)] hidden sm:block" />
          <div className="text-[13px] text-[var(--grafite)] hidden sm:block font-medium">Portale HR · Acme SpA</div>
        </div>
        <button onClick={onLogout} className="text-[var(--grafite)] hover:text-[var(--nero)] transition-colors p-2 bg-[var(--fumo)] rounded-full flex items-center justify-center">
          <LogOut size={18} />
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-up">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 bg-[var(--rosa-50)] rounded-[16px] p-6 shadow-sm flex flex-col justify-between border border-[var(--rosa-100)]">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] text-[var(--carbone)] font-bold uppercase tracking-wider">Dipendenti attivi</span>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"><Users className="text-[var(--rosa-400)]" size={16} /></div>
            </div>
            <div>
              <div className="text-[32px] font-bold text-[var(--nero)] leading-none mb-1">{activeCount} <span className="text-[20px] text-[var(--grafite)]">/ {employees.length}</span></div>
              <div className="text-[13px] text-[var(--grafite)]">{Math.round((activeCount / employees.length) * 100)}% del personale</div>
            </div>
          </div>

          <div className="lg:col-span-1 bg-[var(--pervinca-50)] rounded-[16px] p-6 shadow-sm flex flex-col justify-between border border-[var(--pervinca-100)]">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] text-[var(--carbone)] font-bold uppercase tracking-wider">Prelievi questo periodo</span>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"><ShieldCheck className="text-[var(--pervinca-500)]" size={16} /></div>
            </div>
            <div>
              <div className="text-[32px] font-bold text-[var(--nero)] leading-none mb-1">12</div>
              <div className="text-[13px] text-[var(--grafite)]">10 mar; 10 apr · tutti i dipendenti</div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[16px] p-6 shadow-sm border border-[var(--ardesia-100)] flex flex-col relative overflow-hidden">
            <div className="mb-2">
              <h3 className="text-[18px] font-bold text-[var(--nero)] mb-0.5">Crescita di adozione</h3>
              <p className="text-[13px] text-[var(--grafite)]">Dipendenti attivi nel tempo · Acme SpA</p>
            </div>
            <div className="flex-1 relative min-h-[180px] mt-4">
              <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--acqua-500)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--acqua-500)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={`grid-y-${i}`}>
                    <line x1="20" y1={20 + i * 24} x2="380" y2={20 + i * 24} stroke="var(--ardesia-100)" strokeWidth="1" />
                    <text x="15" y={24 + i * 24} textAnchor="end" fontSize="10" fill="var(--grafite)">{16 - i * 4}</text>
                  </g>
                ))}
                <path d="M 40,116 L 100,108 L 160,84 L 220,92 L 280,52 L 340,36 L 340,128 L 40,128 Z" fill="url(#chartGradient)" />
                <path d="M 40,116 L 100,108 L 160,84 L 220,92 L 280,52 L 340,36" fill="none" stroke="var(--acqua-500)" strokeWidth="2.5" />
                {[
                  { x: 40, y: 116, label: 'Ott' }, { x: 100, y: 108, label: 'Nov' },
                  { x: 160, y: 84, label: 'Dic' }, { x: 220, y: 92, label: 'Gen' },
                  { x: 280, y: 52, label: 'Feb' }, { x: 340, y: 36, label: 'Mar' }
                ].map((pt, i) => (
                  <g key={`pt-${i}`}>
                    <circle cx={pt.x} cy={pt.y} r="4" fill="var(--acqua-500)" stroke="white" strokeWidth="1.5" />
                    <text x={pt.x} y="150" textAnchor="middle" fontSize="10" fill="var(--grafite)">{pt.label}</text>
                  </g>
                ))}
                <g transform="translate(285, 0)">
                  <rect width="85" height="20" rx="10" fill="var(--acqua-100)" />
                  <text x="42.5" y="14" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--acqua-500)">14 attivi oggi</text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] shadow-sm border border-[var(--ardesia-100)] overflow-hidden">
          <div className="p-6 border-b border-[var(--ardesia-100)]">
            <h2 className="text-[20px] font-bold text-[var(--nero)] mb-6">Gestione Dipendenti</h2>
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--grafite)]" size={18} />
                <input type="text" placeholder="Cerca dipendente..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] pl-10 pr-4 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowImportModal(true)} className="px-4 py-2 border-2 border-[var(--rosa-200)] text-[var(--rosa-500)] bg-white rounded-[10px] font-bold text-[14px] flex items-center gap-2 hover:bg-[var(--rosa-50)] transition-colors">
                  <Download size={16} /> <span className="hidden sm:inline">Importa</span>
                </button>
                <button type="button" onClick={exportEmployees} className="px-4 py-2 border border-[var(--ardesia-100)] text-[var(--grafite)] bg-white rounded-[10px] font-bold text-[14px] flex items-center gap-2 hover:bg-[var(--fumo)] transition-colors">
                  <FileDown size={16} /> <span className="hidden sm:inline">Esporta CSV</span>
                </button>
                <button type="button" onClick={() => setShowAddModal(true)} className="px-4 py-2 gradient-rosa text-white rounded-[10px] font-bold text-[14px] flex items-center gap-2 hover:shadow-md transition-shadow">
                  <Plus size={16} /> Aggiungi
                </button>
              </div>
            </div>
            {importFeedback ? <p className="text-[13px] text-[var(--grafite)] mb-4">{importFeedback}</p> : null}
            <div className="flex bg-[var(--fumo)] p-1 rounded-[10px] inline-flex">
              <button onClick={() => setFilter('all')} className={cn('px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors', filter === 'all' ? 'bg-[var(--nero)] text-white shadow-sm' : 'text-[var(--grafite)]')}>Tutti · {employees.length}</button>
              <button onClick={() => setFilter('active')} className={cn('px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors', filter === 'active' ? 'bg-[var(--nero)] text-white shadow-sm' : 'text-[var(--grafite)]')}>Attivi · {activeCount}</button>
              <button onClick={() => setFilter('inactive')} className={cn('px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors', filter === 'inactive' ? 'bg-[var(--nero)] text-white shadow-sm' : 'text-[var(--grafite)]')}>Non attivi · {inactiveCount}</button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-[var(--ardesia-50)]">
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase">Dipendente</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase">Tipo contratto</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase">RAL</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase">Netto</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase">Stato</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--grafite)]">Nessun dipendente trovato</td>
                  </tr>
                ) : paginatedEmployees.map((employee) => {
                  const avatar = getAvatarColors(employee.id - 1);
                  const contractStyle = contractStyles[employee.contractType] || contractStyles['Tempo indeterminato'];
                  return (
                    <tr key={employee.id} className="border-b border-[var(--ardesia-100)] hover:bg-[var(--rosa-50)] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm" style={{ backgroundColor: avatar.bg, color: avatar.text }}>
                            {employeeInitials(employee)}
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-[var(--nero)]">{fullEmployeeName(employee)}</div>
                            <div className="text-[12px] text-[var(--grafite)]">{employee.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6"><span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold', contractStyle.className)}>{contractStyle.label}</span></td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-2 text-[13px] text-[var(--carbone)] font-medium" title="Visibile solo all'HR">
                          {formatEur(employee.ral)}
                          <Lock size={12} className="text-[var(--polvere)]" />
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-2 text-[13px] text-[var(--carbone)] font-medium" title="Visibile solo all'HR">
                          {formatEur(employee.netMonthly)}
                          <Lock size={12} className="text-[var(--polvere)]" />
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-[6px]', statusStyles[employee.status])}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', employee.status === 'Attivo' ? 'bg-[var(--acqua-500)]' : employee.status === 'Invitato' ? 'bg-[var(--rosa-500)]' : 'bg-[var(--grafite)]')} />
                          {employee.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleStatus(employee.id)}
                            className={cn(
                              'text-[12px] font-bold px-3 py-1.5 rounded-[999px] transition-colors',
                              employee.status === 'Attivo' ? 'bg-[var(--malva-50)] text-[var(--malva-500)] hover:bg-[var(--malva-100)]' : 'bg-[var(--acqua-50)] text-[var(--acqua-500)] hover:bg-[var(--acqua-100)]'
                            )}
                          >
                            {employee.status === 'Attivo' ? 'Disattiva' : 'Attiva'}
                          </button>
                          <button type="button" onClick={() => openEmployeeModal(employee)} className="text-[13px] text-[var(--grafite)] hover:text-[var(--nero)] hover:underline font-medium">Dettaglio</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 border-t border-[#F0F0F0]">
              <div className="flex items-center justify-between">
              <div className="text-[12px] text-[var(--grafite)]">Mostrando {startIdx}–{endIdx} di {filteredEmployees.length} dipendenti</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="text-[13px] font-medium text-[var(--grafite)] disabled:text-[var(--polvere)] hover:text-[var(--nero)] disabled:hover:text-[var(--polvere)] px-2 transition-colors">&larr; Precedente</button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={cn('w-8 h-8 rounded-[8px] flex items-center justify-center text-[13px] transition-colors', currentPage === page ? 'bg-[var(--nero)] text-white font-bold' : 'bg-[var(--fumo)] text-[var(--grafite)] hover:bg-[var(--ardesia-100)]')}>
                      {page}
                    </button>
                  ))}
                </div>
                <button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="text-[13px] font-medium text-[var(--grafite)] disabled:text-[var(--polvere)] hover:text-[var(--nero)] disabled:hover:text-[var(--polvere)] px-2 transition-colors">Successivo &rarr;</button>
              </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedEmployee && draftEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
          <button type="button" className="absolute inset-0 bg-[rgba(0,0,0,0.4)] backdrop-blur-[4px]" onClick={requestCloseEmployeeModal} aria-label="Chiudi dettaglio" />
          <div className="relative w-full md:w-[560px] bg-white rounded-t-[20px] md:rounded-[20px] shadow-2xl max-h-[85vh] overflow-hidden animate-modal-enter">
            <div className="sticky top-0 z-10 bg-white border-b border-[var(--ardesia-100)] px-6 py-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--rosa-200)] text-white flex items-center justify-center text-[16px] font-bold">{employeeInitials(draftEmployee)}</div>
                <div>
                  <h3 className="text-[20px] font-bold text-[var(--nero)] leading-tight">{fullEmployeeName(draftEmployee)}</h3>
                  <p className="text-[14px] text-[var(--grafite)]">{draftEmployee.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-[6px]', statusStyles[draftEmployee.status])}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', draftEmployee.status === 'Attivo' ? 'bg-[var(--acqua-500)]' : draftEmployee.status === 'Invitato' ? 'bg-[var(--rosa-500)]' : 'bg-[var(--grafite)]')} />
                  {draftEmployee.status}
                </span>
                <button type="button" onClick={requestCloseEmployeeModal} className="text-[var(--grafite)] hover:text-[var(--nero)]" aria-label="Chiudi modal"><X size={18} /></button>
              </div>
            </div>

            <div className="max-h-[calc(85vh-152px)] overflow-y-auto px-6 py-6 custom-scrollbar space-y-6">
              <section>
                <h4 className="text-[11px] uppercase tracking-[0.08em] text-[var(--grafite)] mb-3">Dati Anagrafici</h4>
                <div className="space-y-3">
                  <div><label className="block text-[12px] text-[var(--grafite)] mb-1">Nome *</label><input value={draftEmployee.firstName} onChange={(e) => updateDraft('firstName', e.target.value)} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-300)] rounded-[8px] px-3 py-2.5 text-[var(--nero)] focus:outline-none focus:border-[var(--rosa-300)] focus:ring-4 focus:ring-[rgba(244,191,197,0.2)]" /></div>
                  <div><label className="block text-[12px] text-[var(--grafite)] mb-1">Cognome *</label><input value={draftEmployee.lastName} onChange={(e) => updateDraft('lastName', e.target.value)} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-300)] rounded-[8px] px-3 py-2.5 text-[var(--nero)] focus:outline-none focus:border-[var(--rosa-300)] focus:ring-4 focus:ring-[rgba(244,191,197,0.2)]" /></div>
                  <div><label className="block text-[12px] text-[var(--grafite)] mb-1">Codice Fiscale</label><input value={draftEmployee.codiceFiscale} onChange={(e) => updateDraft('codiceFiscale', e.target.value.toUpperCase())} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-300)] rounded-[8px] px-3 py-2.5 text-[var(--nero)] focus:outline-none focus:border-[var(--rosa-300)] focus:ring-4 focus:ring-[rgba(244,191,197,0.2)]" /></div>
                  <div><label className="block text-[12px] text-[var(--grafite)] mb-1">Email</label><input value={draftEmployee.email} onChange={(e) => updateDraft('email', e.target.value)} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-300)] rounded-[8px] px-3 py-2.5 text-[var(--nero)] focus:outline-none focus:border-[var(--rosa-300)] focus:ring-4 focus:ring-[rgba(244,191,197,0.2)]" /></div>
                  <div><label className="block text-[12px] text-[var(--grafite)] mb-1">Anni in azienda</label><input type="number" min={0} value={draftEmployee.yearsAtCompany} onChange={(e) => updateDraft('yearsAtCompany', e.target.value)} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-300)] rounded-[8px] px-3 py-2.5 text-[var(--nero)] focus:outline-none focus:border-[var(--rosa-300)] focus:ring-4 focus:ring-[rgba(244,191,197,0.2)]" /></div>
                </div>
              </section>

              <section>
                <h4 className="text-[11px] uppercase tracking-[0.08em] text-[var(--grafite)] mb-3">Dati Contrattuali</h4>
                <div className="space-y-3">
                  <div><label className="block text-[12px] text-[var(--grafite)] mb-1">Tipo contratto</label><select value={draftEmployee.contractType} onChange={(e) => updateDraft('contractType', normalizeContractType(e.target.value))} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-300)] rounded-[8px] px-3 py-2.5 text-[var(--nero)] focus:outline-none focus:border-[var(--rosa-300)] focus:ring-4 focus:ring-[rgba(244,191,197,0.2)]"><option value="Tempo indeterminato">Tempo indeterminato</option><option value="Tempo determinato">Tempo determinato</option><option value="Part-time">Part-time</option></select></div>
                  <div><label className="block text-[12px] text-[var(--grafite)] mb-1">RAL (€/anno)</label><input type="number" value={draftEmployee.ral} onChange={(e) => updateDraft('ral', e.target.value)} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-300)] rounded-[8px] px-3 py-2.5 text-[var(--nero)] focus:outline-none focus:border-[var(--rosa-300)] focus:ring-4 focus:ring-[rgba(244,191,197,0.2)]" /></div>
                  <div>
                    <label className="block text-[12px] text-[var(--grafite)] mb-1">Netto mensile</label>
                    <div className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-300)] rounded-[8px] px-3 py-2.5 text-[var(--grafite)]">{formatEur(calculateNetMonthly(Number(draftEmployee.ral) || 0))}</div>
                    <p className="text-[11px] italic text-[var(--grafite)] mt-1">Calcolato automaticamente dalla RAL</p>
                  </div>
                  <div><label className="block text-[12px] text-[var(--grafite)] mb-1">Giorno busta paga</label><input type="number" min={1} max={31} value={draftEmployee.payDay} onChange={(e) => updateDraft('payDay', e.target.value)} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-300)] rounded-[8px] px-3 py-2.5 text-[var(--nero)] focus:outline-none focus:border-[var(--rosa-300)] focus:ring-4 focus:ring-[rgba(244,191,197,0.2)]" /></div>
                </div>
              </section>

              <section>
                <h4 className="text-[11px] uppercase tracking-[0.08em] text-[var(--grafite)] mb-3">Coordinate Bancarie</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] text-[var(--grafite)] mb-1">IBAN Vero</label>
                    <input value={draftEmployee.ibanVero} onChange={(e) => updateDraft('ibanVero', formatIbanInput(e.target.value))} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-300)] rounded-[8px] px-3 py-2.5 text-[var(--nero)] focus:outline-none focus:border-[var(--rosa-300)] focus:ring-4 focus:ring-[rgba(244,191,197,0.2)]" />
                    {isValidIban(draftEmployee.ibanVero) ? <p className="text-[12px] text-[var(--acqua-500)] mt-1">✓ Formato valido</p> : null}
                  </div>
                  <div>
                    <label className="block text-[12px] text-[var(--grafite)] mb-1">IBAN Virtuale</label>
                    <div className="w-full bg-[var(--ardesia-50)] rounded-[8px] px-3 py-2.5 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 text-[var(--polvere)]"><Lock size={14} /><span>{draftEmployee.ibanVirtuale}</span></div>
                      <span className="text-[var(--polvere)]" title="Gestito da QuandoVuoi"><Info size={14} /></span>
                    </div>
                    <p className="text-[11px] text-[var(--grafite)] mt-1">Assegnato da QuandoVuoi · Non modificabile</p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-[11px] uppercase tracking-[0.08em] text-[var(--grafite)] mb-3">Accesso Servizio</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] text-[var(--grafite)] mb-2">Stato accesso</label>
                    <button type="button" onClick={() => updateDraft('status', draftEmployee.status === 'Attivo' ? 'Non attivo' : 'Attivo')} className="inline-flex items-center gap-3">
                      <span className={cn('w-12 h-7 rounded-full relative transition-colors', draftEmployee.status === 'Attivo' ? 'bg-[var(--acqua-300)]' : 'bg-[var(--polvere)]')}><span className={cn('absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform', draftEmployee.status === 'Attivo' ? 'translate-x-5' : 'translate-x-0')} /></span>
                      <span className={cn('text-[13px] font-semibold', draftEmployee.status === 'Attivo' ? 'text-[var(--acqua-500)]' : 'text-[var(--grafite)]')}>{draftEmployee.status === 'Attivo' ? 'Attivo' : 'Non attivo'}</span>
                    </button>
                  </div>
                  <div><label className="block text-[12px] text-[var(--grafite)] mb-1">Data attivazione</label><div className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-300)] rounded-[8px] px-3 py-2.5 text-[var(--grafite)]">{draftEmployee.activationDate || '—'}</div></div>
                </div>
              </section>
            </div>

            <div className="shrink-0 p-4 px-6 pb-[max(16px,env(safe-area-inset-bottom))] bg-white border-t border-[#F0F0F0]">
              {showDiscardWarning ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-[var(--grafite)]">Hai modifiche non salvate.</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeEmployeeModal} className="px-4 py-2 rounded-[10px] bg-[var(--rosa-50)] text-[var(--rosa-500)] text-[13px] font-semibold">Esci senza salvare</button>
                    <button type="button" onClick={() => setShowDiscardWarning(false)} className="px-4 py-2 rounded-[10px] bg-[var(--nero)] text-white text-[13px] font-semibold">Continua a modificare</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button type="button" onClick={requestCloseEmployeeModal} className="flex-1 h-[52px] rounded-[12px] bg-[#F5F2F1] text-[#6B6360] font-semibold text-[16px]">Annulla</button>
                  <button type="button" onClick={saveEmployeeChanges} disabled={!hasUnsavedChanges} className="flex-1 h-[52px] rounded-[12px] bg-[var(--nero)] text-white font-bold text-[16px] disabled:opacity-40 disabled:cursor-not-allowed">Salva modifiche →</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-[var(--nero)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-[18px] border border-[var(--ardesia-100)] shadow-2xl overflow-hidden">
            <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[var(--nero)]">Importa dipendenti</h3>
              <button type="button" onClick={() => setShowImportModal(false)} className="text-[var(--grafite)] hover:text-[var(--nero)]" aria-label="Chiudi"><X size={18} /></button>
            </div>

            <div className="rounded-[12px] border border-dashed border-[var(--ardesia-300)] bg-[var(--ardesia-50)] p-6 text-center">
              <p className="text-[13px] text-[var(--grafite)] mb-3">Carica un file Excel o CSV con i campi richiesti.</p>
              <button type="button" onClick={handleOpenFilePicker} className="px-4 py-2 rounded-[10px] bg-[var(--nero)] text-white text-[13px] font-semibold">Seleziona file</button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
            </div>

            <div className="flex items-center justify-between gap-2 text-[12px] text-[var(--grafite)]">
              <span>Template CSV: Nome | Cognome | RAL | Netto | CF | Anni in azienda | Tipo contratto | IBAN Vero</span>
              <button type="button" onClick={downloadImportTemplate} className="text-[var(--nero)] hover:underline font-medium whitespace-nowrap">Scarica template</button>
            </div>

            <div>
              <p className="text-[12px] text-[var(--grafite)] mb-2">Campi supportati:</p>
              <div className="flex flex-wrap gap-2">
                {['Nome', 'Cognome', 'RAL', 'Netto', 'CF', 'Anni in azienda', 'Tipo contratto', 'IBAN Vero'].map((field) => (
                  <span key={field} className="bg-[var(--ardesia-100)] text-[var(--grafite)] text-[11px] rounded-[6px] px-2.5 py-1">{field}</span>
                ))}
              </div>
            </div>

            <p className="text-[13px] text-[var(--grafite)]">💡 Compatibile con export da Zucchetti, TeamSystem, Paghe GB</p>
            <p className="text-[13px] bg-[var(--pervinca-50)] text-[var(--pervinca-500)] rounded-[8px] px-3 py-2.5">
              L'IBAN Virtuale viene assegnato automaticamente da QuandoVuoi al momento dell'attivazione del dipendente.
            </p>
            </div>

            <div className="shrink-0 p-4 px-6 pb-[max(16px,env(safe-area-inset-bottom))] bg-white border-t border-[#F0F0F0]">
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowImportModal(false)} className="flex-1 h-[52px] rounded-[12px] bg-[#F5F2F1] text-[#6B6360] font-semibold text-[16px]">
                  Annulla
                </button>
                <button type="button" onClick={handleOpenFilePicker} className="flex-1 h-[52px] rounded-[12px] bg-[var(--nero)] text-white font-bold text-[16px]">
                  Carica e importa →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-[var(--nero)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[18px] border border-[var(--ardesia-100)] shadow-2xl overflow-hidden">
            <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[var(--nero)]">Aggiungi dipendente</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-[var(--grafite)] hover:text-[var(--nero)]" aria-label="Chiudi"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="Nome" value={formData.firstName} onChange={(e) => setFormData((current) => ({ ...current, firstName: e.target.value }))} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]" />
              <input type="text" placeholder="Cognome" value={formData.lastName} onChange={(e) => setFormData((current) => ({ ...current, lastName: e.target.value }))} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]" />
              <input type="text" placeholder="Ruolo" value={formData.role} onChange={(e) => setFormData((current) => ({ ...current, role: e.target.value }))} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]" />
              <input type="number" placeholder="RAL (€/anno)" value={formData.ral} onChange={(e) => setFormData((current) => ({ ...current, ral: e.target.value }))} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]" />
              <input type="text" placeholder="Codice Fiscale" value={formData.codiceFiscale} onChange={(e) => setFormData((current) => ({ ...current, codiceFiscale: e.target.value.toUpperCase() }))} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]" />
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData((current) => ({ ...current, email: e.target.value }))} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]" />
              <input type="number" min={0} placeholder="Anni in azienda" value={formData.yearsAtCompany} onChange={(e) => setFormData((current) => ({ ...current, yearsAtCompany: e.target.value }))} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]" />
              <select value={formData.contractType} onChange={(e) => setFormData((current) => ({ ...current, contractType: e.target.value }))} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]"><option value="Tempo indeterminato">Tempo indeterminato</option><option value="Tempo determinato">Tempo determinato</option><option value="Part-time">Part-time</option></select>
              <input type="text" placeholder="IBAN Vero" value={formData.ibanVero} onChange={(e) => setFormData((current) => ({ ...current, ibanVero: formatIbanInput(e.target.value) }))} className="sm:col-span-2 w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]" />
            </div>

            </div>

            <div className="shrink-0 p-4 px-6 pb-[max(16px,env(safe-area-inset-bottom))] bg-white border-t border-[#F0F0F0]">
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 h-[52px] rounded-[12px] bg-[#F5F2F1] text-[#6B6360] font-semibold text-[16px]">
                  Annulla
                </button>
                <button type="button" onClick={handleAddEmployee} className="flex-1 h-[52px] rounded-[12px] bg-[var(--nero)] text-white font-bold text-[16px]">
                  Invia invito →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer message={toastMessage} />
    </div>
  );
};


// --- APP SHELL (State Manager & Demo Wrapper) ---
export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [demoMode, setDemoMode] = useState('emp-mobile'); 
  const [empState, setEmpState] = useState(INITIAL_EMP_STATE);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogin = (role, skipOnboarding) => {
    if (role === 'emp') {
      setDemoMode('emp-mobile');
      setCurrentView(skipOnboarding ? 'emp-home' : 'emp-onboard');
    } else {
      setDemoMode('hr');
      setCurrentView(skipOnboarding ? 'hr-home' : 'hr-onboard');
    }
  };

  const handleLogout = () => {
    setCurrentView('login');
    setEmpState(INITIAL_EMP_STATE);
  };

  const handleEmployeeOnboardingComplete = () => {
    setCurrentView('emp-home');
  };

  const handleWithdrawal = (amount, dateStr, isScheduled) => {
    const newReqId = `REQ-${2619 + empState.totalWithdrawals - 6}`; 
    setEmpState(prev => ({
      ...prev,
      balance: prev.balance - amount,
      monthlyWithdrawn: prev.monthlyWithdrawn + amount,
      totalWithdrawals: prev.totalWithdrawals + 1,
      history: [ { id: newReqId, date: isScheduled ? `${dateStr} 2026` : '19 mar 2026', amount: amount, status: isScheduled ? 'Programmato' : 'Erogato' }, ...prev.history ]
    }));
  };

  const handleUpdateIban = (newIban) => {
    setEmpState(prev => ({ ...prev, iban: newIban }));
  };

  if (isMobileViewport) {
    const mobileEmployeeView = currentView === 'emp-onboard' ? 'emp-onboard' : 'emp-home';

    return (
      <div className="font-sans w-full h-[100dvh] bg-white overflow-hidden">
        <style>{globalStyles}</style>
        {mobileEmployeeView === 'emp-onboard' ? (
          <div className="w-full h-full bg-white">
            <EmployeeOnboarding state={empState} onComplete={handleEmployeeOnboardingComplete} />
          </div>
        ) : (
          <div className="w-full h-full bg-white">
            <EmployeeAppShell
              state={empState}
              onWithdraw={handleWithdrawal}
              onUpdateIban={handleUpdateIban}
              onLogout={handleLogout}
              isMobileViewport={true}
              usePhoneShell={false}
            />
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <div className="font-sans">
        <style>{globalStyles}</style>
        <LoginView onLogin={handleLogin} />
      </div>
    );
  }

  // --- DEMO PRESENTATION WRAPPER ---
  return (
    <div className="font-sans min-h-screen bg-white flex flex-col relative">
      <style>{globalStyles}</style>
      
      {/* Demo View Toggle (Visible only when simulating the employee app) */}
      {currentView.startsWith('emp') && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
          <span className="text-[11px] font-bold text-[var(--grafite)] uppercase tracking-widest">Visualizza come:</span>
          <div className="bg-white p-1 rounded-full flex border border-[var(--ardesia-100)] shadow-lg">
             <button onClick={() => setDemoMode('emp-mobile')} className={cn("px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors flex items-center gap-2", demoMode === 'emp-mobile' ? "bg-[var(--nero)] text-white shadow-sm" : "text-[var(--grafite)] hover:text-[var(--nero)]")}>
               📱 Mobile
             </button>
             <button onClick={() => setDemoMode('emp-desktop')} className={cn("px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors flex items-center gap-2", demoMode === 'emp-desktop' ? "bg-[var(--nero)] text-white shadow-sm" : "text-[var(--grafite)] hover:text-[var(--nero)]")}>
               💻 Desktop
             </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex-1 flex justify-center w-full overflow-hidden",
          currentView.startsWith('emp')
            ? "items-center pt-20 md:pt-24 pb-3 md:pb-8"
            : "items-start pt-0 pb-0"
        )}
      >
        {currentView.startsWith('emp') ? (
          <div className="w-full h-full flex items-center justify-center animate-pop-in">
             {currentView === 'emp-onboard' ? (
               <div className={cn(
                 "mx-auto bg-white overflow-hidden shadow-2xl relative flex flex-col font-sans transition-all duration-500",
                 demoMode === 'emp-mobile' 
                   ? "w-full max-w-[390px] h-[calc(100dvh-96px)] md:h-[844px] rounded-none md:rounded-[32px] border-0 md:border-[8px] border-[var(--nero)]" 
                   : "w-full max-w-4xl h-[100dvh] md:h-[844px] rounded-none md:rounded-[32px] border-0 md:border border-[var(--ardesia-100)]"
               )}>
                 <EmployeeOnboarding state={empState} onComplete={handleEmployeeOnboardingComplete} />
               </div>
             ) : (
               <EmployeeAppShell
                 state={empState}
                 onWithdraw={handleWithdrawal}
                 onUpdateIban={handleUpdateIban}
                 onLogout={handleLogout}
                 isMobileViewport={false}
                 usePhoneShell={demoMode === 'emp-mobile'}
               />
             )}
          </div>
        ) : (
          <div className="w-full h-full bg-[var(--fumo)] rounded-t-[32px] overflow-y-auto animate-fade-up shadow-[0_-20px_50px_rgba(244,191,197,0.1)]">
             {currentView === 'hr-onboard' ? (
               <div className="h-full md:h-auto flex items-stretch md:items-center justify-center p-0 md:p-6 overflow-y-auto">
                 <HROnboarding onComplete={() => setCurrentView('hr-home')} />
               </div>
             ) : (
               <HRDashboard onLogout={handleLogout} />
             )}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  UserCircle, Building2, Zap, Shield, RefreshCw, TrendingUp, List, 
  Calendar, Check, Search, Download, Plus, ShieldCheck, Copy,
  LogOut, Users, Lock, X,
  Receipt, Edit2, ChevronLeft, ChevronRight, Bell, User, BarChart2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import logoDark from './Favicon (Dark).png';

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
    background-color: var(--fumo);
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
  balance: 1219,
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
    { id: 2, type: 'info', title: 'Nuovo saldo disponibile', body: 'Da oggi puoi prelevare fino a €762', time: 'Ieri, 08:00', read: false },
    { id: 3, type: 'payday', title: 'Busta paga in arrivo', body: 'Il 10 aprile riceverai €620 su ••••3456', time: '2 giorni fa', read: true }
  ]
};

const HR_EMPLOYEES_SEED = [
  { id: 1, name: 'Mario Rossi', role: 'Sviluppatore Senior', salary: 3200, active: true, lastWithdrawal: '18 mar 2026' },
  { id: 2, name: 'Luigi Bianchi', role: 'Contabile', salary: 2600, active: true, lastWithdrawal: '15 mar 2026' },
  { id: 3, name: 'Anna Verdi', role: 'Designer', salary: 2900, active: true, lastWithdrawal: '17 mar 2026' },
  { id: 4, name: 'Marco Neri', role: 'Commerciale', salary: 2400, active: true, lastWithdrawal: '12 mar 2026' },
  { id: 5, name: 'Sara Russo', role: 'HR Specialist', salary: 2700, active: true, lastWithdrawal: '10 mar 2026' },
  { id: 6, name: 'Davide Conti', role: 'Magazziniere', salary: 2100, active: true, lastWithdrawal: '14 mar 2026' },
  { id: 7, name: 'Francesca Moro', role: 'Marketing Manager', salary: 3100, active: true, lastWithdrawal: '16 mar 2026' },
  { id: 8, name: 'Luca Ferrari', role: 'Tecnico IT', salary: 2800, active: false, lastWithdrawal: null },
  { id: 9, name: 'Elena Ricci', role: 'Receptionist', salary: 2200, active: false, lastWithdrawal: null },
  { id: 10, name: 'Giovanni Sala', role: 'Direttore Vendite', salary: 4100, active: false, lastWithdrawal: null },
  { id: 11, name: 'Chiara Esposito', role: 'UX Designer', salary: 2850, active: true, lastWithdrawal: '13 mar 2026' },
  { id: 12, name: 'Roberto Marini', role: 'Responsabile Logistica', salary: 3000, active: true, lastWithdrawal: '11 mar 2026' },
  { id: 13, name: 'Valentina Bruno', role: 'Assistente Contabile', salary: 2300, active: true, lastWithdrawal: '19 mar 2026' },
  { id: 14, name: 'Andrea Colombo', role: 'Sviluppatore Junior', salary: 2200, active: true, lastWithdrawal: '17 mar 2026' },
  { id: 15, name: 'Stefania Greco', role: 'Customer Success', salary: 2500, active: false, lastWithdrawal: null },
  { id: 16, name: 'Matteo Romano', role: 'Data Analyst', salary: 3200, active: false, lastWithdrawal: null },
  { id: 17, name: 'Alessia Fontana', role: 'Office Manager', salary: 2400, active: true, lastWithdrawal: '15 mar 2026' },
  { id: 18, name: 'Simone De Luca', role: 'Tecnico Assistenza', salary: 2150, active: false, lastWithdrawal: null },
  { id: 19, name: 'Paola Gallo', role: 'Social Media Manager', salary: 2350, active: false, lastWithdrawal: null },
  { id: 20, name: 'Claudio Serra', role: 'Responsabile Acquisti', salary: 2900, active: true, lastWithdrawal: '14 mar 2026' },
  { id: 21, name: 'Martina Rizzo', role: 'Graphic Designer', salary: 2600, active: true, lastWithdrawal: '16 mar 2026' },
  { id: 22, name: 'Filippo Caruso', role: 'Project Manager', salary: 3400, active: false, lastWithdrawal: null },
  { id: 23, name: 'Nadia Ferretti', role: 'Segreteria', salary: 2050, active: false, lastWithdrawal: null }
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

const CircularProgress = ({ value, max, size = 200, strokeWidth = 12 }) => {
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
        <circle stroke="rgba(255,255,255,0.15)" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
        <circle stroke="var(--rosa-200)" fill="transparent" strokeWidth={strokeWidth} strokeLinecap="round" r={radius} cx={size / 2} cy={size / 2}
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
const EmployeeOnboarding = ({ onComplete, state }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  const nextStep = () => step < totalSteps ? setStep(s => s + 1) : onComplete();
  const prevStep = () => step > 1 && setStep(s => s - 1);

  const AnimatedBalance = () => {
    const val = useAnimatedValue(1219, 1500);
    return <span>€{val.toLocaleString('it-IT')}</span>;
  };

  return (
    <div className="flex-1 bg-[var(--rosa-50)] flex flex-col relative overflow-hidden h-full">
      <div className="absolute top-0 w-full p-6 flex justify-end z-20">
        <button onClick={onComplete} className={cn("text-[13px] hover:underline", step === 1 || step === 3 ? "text-white/80" : "text-[var(--grafite)]")}>
          Salta introduzione &rarr;
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {step === 1 && (
          <div className="flex-1 gradient-rosa text-white p-8 flex flex-col justify-center animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-8">
              <Zap size={32} className="text-white" />
            </div>
            <h1 className="text-[38px] font-bold leading-tight mb-2">Ciao, Mario!</h1>
            <h2 className="text-[24px] font-medium opacity-90 mb-6">Anticipa lo stipendio netto, senza interessi.</h2>
            <p className="text-[16px] leading-relaxed opacity-80 mb-12">
              Anticipa parte della tua busta paga netta, i soldi arrivano subito sul tuo conto.<br/>
              Il rimborso avviene in automatico. Niente ansia, niente interessi.
            </p>
            <div className="mt-auto mb-12 relative z-30">
              <button onClick={nextStep} className="w-full bg-white text-[var(--rosa-500)] h-[52px] rounded-[12px] font-bold text-[16px] hover:bg-[var(--rosa-50)] transition-colors">
                Inizia &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 p-6 flex flex-col bg-white animate-fade-up pt-20">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-[24px] font-bold text-[var(--nero)]">Profilo verificato</h2>
              <div className="w-6 h-6 rounded-full bg-[var(--acqua-100)] text-[var(--acqua-500)] flex items-center justify-center">
                <Check size={14} strokeWidth={3} />
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {[
                { i: '👤', l: 'Nome', v: 'Mario Rossi' },
                { i: '🏢', l: 'Azienda', v: 'Acme SpA' },
                { i: '💼', l: 'Ruolo', v: 'Sviluppatore Senior' },
                { i: '💰', l: 'Stipendio netto', v: '€3.200/mese' },
                { i: '🏦', l: 'IBAN', v: `••••${state.iban.slice(-4)}` }
              ].map((row, idx) => (
                <div key={idx} className="flex items-center p-4 bg-[var(--rosa-50)] rounded-[12px]">
                  <span className="w-8 text-center mr-3">{row.i}</span>
                  <span className="text-[var(--grafite)] w-24 text-[14px]">{row.l}</span>
                  <span className="font-semibold text-[var(--nero)]">{row.v}</span>
                </div>
              ))}
            </div>

            <p className="text-[12px] text-[var(--grafite)] text-center my-6">
              I dati sono forniti dalla tua azienda. Tutto è crittografato end-to-end.
            </p>

            <div className="flex gap-3 mt-auto mb-12 relative z-30">
              <button onClick={prevStep} className="px-6 h-[52px] rounded-[12px] border border-[var(--ardesia-100)] text-[var(--carbone)] font-medium hover:bg-[var(--fumo)] transition-colors">
                &larr;
              </button>
              <button onClick={nextStep} className="flex-1 gradient-rosa text-white h-[52px] rounded-[12px] font-bold transition-transform hover:-translate-y-px shadow-sm">
                Conferma &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 bg-[var(--nero)] text-white p-6 flex flex-col pt-20 animate-fade-up">
            <div className="flex-1 flex flex-col items-center justify-center text-center -mt-8">
              <div className="relative mb-8">
                <CircularProgress value={76} max={100} size={220} strokeWidth={8} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[48px] font-bold leading-none mb-1">
                    <AnimatedBalance />
                  </div>
                  <div className="text-[14px] text-[var(--rosa-300)] font-medium uppercase tracking-wider">disponibili</div>
                </div>
              </div>

              <div className="w-full mb-8">
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-[var(--rosa-200)] transition-all duration-[1500ms] ease-out" style={{ width: '76%' }} />
                </div>
                <div className="text-[13px] text-[var(--grafite)]">
                  16 giorni lavorati su 21 · marzo 2026
                </div>
              </div>

              <div className="flex w-full bg-white/5 rounded-[16px] p-4 mb-6">
                <div className="flex-1 border-r border-white/10">
                  <div className="text-[12px] text-[var(--grafite)] mb-1">Stipendio netto maturato</div>
                  <div className="font-bold">€2.438</div>
                </div>
                <div className="flex-1">
                  <div className="text-[12px] text-[var(--grafite)] mb-1">Disponibile ora</div>
                  <div className="font-bold text-[var(--rosa-200)]">€1.219</div>
                </div>
              </div>
              
              <p className="text-[12px] text-[var(--grafite)]">
                Il 10 aprile riceverai il saldo completo con la busta paga.
              </p>
            </div>

            <div className="flex gap-3 mt-auto mb-12 relative z-30">
               <button onClick={prevStep} className="px-6 h-[52px] rounded-[12px] border border-white/20 text-white font-medium hover:bg-white/10 transition-colors">
                &larr;
              </button>
              <button onClick={nextStep} className="flex-1 gradient-rosa text-white h-[52px] rounded-[12px] font-bold transition-transform hover:-translate-y-px shadow-sm">
                Continua &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 bg-white p-6 flex flex-col pt-20 animate-fade-up">
            <h2 className="text-[28px] font-bold text-[var(--nero)] mb-8 text-center">Come funziona</h2>
            
            <div className="space-y-4 flex-1">
              <div className="bg-[var(--acqua-50)] p-5 rounded-[16px] flex gap-4">
                <div className="mt-1"><Zap className="text-[var(--acqua-500)]" size={24}/></div>
                <div>
                  <h3 className="font-bold text-[var(--nero)] mb-1">Preleva quando vuoi</h3>
                  <p className="text-[13px] text-[var(--carbone)] leading-relaxed">Accedi al tuo stipendio netto maturato in qualsiasi momento del mese, senza aspettare il 27.</p>
                </div>
              </div>
              
              <div className="bg-[var(--pervinca-50)] p-5 rounded-[16px] flex gap-4">
                <div className="mt-1"><Shield className="text-[var(--pervinca-500)]" size={24}/></div>
                <div>
                  <h3 className="font-bold text-[var(--nero)] mb-1">Nessun interesse</h3>
                  <p className="text-[13px] text-[var(--carbone)] leading-relaxed">Non ci sono interessi o costi nascosti. L'azienda ti offre questo servizio gratuitamente.</p>
                </div>
              </div>

              <div className="bg-[var(--malva-50)] p-5 rounded-[16px] flex gap-4">
                <div className="mt-1"><RefreshCw className="text-[var(--malva-500)]" size={24}/></div>
                <div>
                  <h3 className="font-bold text-[var(--nero)] mb-1">Automatico e sicuro</h3>
                  <p className="text-[13px] text-[var(--carbone)] leading-relaxed">Il prelievo viene recuperato automaticamente con la busta paga. Non devi fare nulla.</p>
                </div>
              </div>
            </div>

            <div className="mt-auto mb-12 relative z-30">
              <button onClick={onComplete} className="w-full gradient-rosa text-white h-[52px] rounded-[12px] font-bold transition-transform hover:-translate-y-px shadow-md">
                Inizia adesso &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-10 left-0 w-full flex justify-center gap-2 pb-safe pointer-events-none">
        {[1,2,3,4].map(i => (
          <div key={i} className={cn(
            "h-2 rounded-full transition-all duration-300",
            step === i ? "w-6 bg-[var(--rosa-500)]" : "w-2 bg-[var(--rosa-100)]"
          )} />
        ))}
      </div>
    </div>
  );
};


// --- IBAN MODAL (Shared) ---
const IbanModal = ({ isOpen, currentIban, onClose, onSave }) => {
  const [tempIban, setTempIban] = useState(currentIban || '');
  
  useEffect(() => {
    if (isOpen) setTempIban(currentIban);
  }, [isOpen, currentIban]);

  if (!isOpen) return null;

  const rawIban = tempIban.replace(/\s/g, '');
  const isValid = rawIban.length >= 15 && tempIban.startsWith('IT');
  const isNeutral = rawIban.length < 5;

  const handleIbanChange = (e) => {
    let val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    let formatted = val.match(/.{1,4}/g)?.join(' ') || '';
    setTempIban(formatted.slice(0, 34)); // Max Italian IBAN with spaces
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-[var(--nero)]/60 backdrop-blur-[2px] transition-opacity" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-[32px] p-6 pb-12 animate-slide-up shadow-2xl flex flex-col">
        <h3 className="text-[20px] font-bold text-[var(--nero)] mb-1">Modifica IBAN</h3>
        <p className="text-[12px] text-[var(--grafite)] mb-6 leading-relaxed">
          Il nuovo IBAN sarà usato per i prossimi prelievi.
        </p>
        
        <label className="block text-[12px] font-bold text-[var(--grafite)] mb-2 uppercase tracking-wider">IBAN</label>
        <input 
          value={tempIban}
          onChange={handleIbanChange}
          placeholder="IT00 X000 0000 0000 0000 0000 000"
          className={cn(
            "w-full bg-[var(--ardesia-50)] border rounded-[10px] px-4 py-3.5 text-[16px] font-mono focus:outline-none transition-colors mb-2",
            !isNeutral && !isValid ? "border-[var(--rosa-400)] text-[var(--rosa-500)]" : 
            !isNeutral && isValid ? "border-[var(--acqua-300)] text-[var(--nero)] focus:border-[var(--acqua-500)]" : 
            "border-[var(--ardesia-300)] focus:border-[var(--rosa-300)] text-[var(--nero)]"
          )}
        />
        <div className="h-6">
          {!isNeutral && isValid && (
             <p className="text-[12px] text-[var(--acqua-500)] font-medium flex items-center gap-1"><Check size={14}/> Formato valido</p>
          )}
          {!isNeutral && !isValid && (
             <p className="text-[12px] text-[var(--rosa-500)] font-medium">Formato non valido</p>
          )}
        </div>
        
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-[52px] bg-[var(--fumo)] text-[var(--carbone)] font-bold rounded-[12px] hover:bg-[var(--ardesia-100)] transition-colors">Annulla</button>
          <button 
            onClick={() => { if (isValid) onSave(tempIban); }} 
            disabled={!isValid}
            className="flex-[2] gradient-rosa text-white font-bold rounded-[12px] disabled:opacity-50 transition-all hover:shadow-md disabled:hover:shadow-none"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};


// --- EMPLOYEE APP SHELL & TABS ---
const EmployeeAppShell = ({ state, onWithdraw, onUpdateIban, onLogout, isMobile }) => {
  const [activeTab, setActiveTab] = useState('panoramica');
  const [ibanModalOpen, setIbanModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleSaveIban = (newIban) => {
    onUpdateIban(newIban);
    setIbanModalOpen(false);
    showToast(`✓ IBAN aggiornato · ••••${newIban.replace(/\s/g, '').slice(-4)}`);
  };

  const unreadNotifications = state.notifications.filter(n => !n.read).length;

  return (
    <div className={cn(
      "mx-auto bg-[var(--fumo)] overflow-hidden shadow-2xl relative flex flex-col font-sans transition-all duration-500",
      isMobile 
        ? "w-full max-w-[390px] h-[calc(100dvh-96px)] md:h-[844px] rounded-none md:rounded-[32px] border-0 md:border-[8px] border-[var(--nero)]" 
        : "w-full max-w-4xl h-[100dvh] md:h-[844px] rounded-none md:rounded-[32px] border-0 md:border border-[var(--ardesia-100)]"
    )}>
      
      {/* Dynamic Header */}
      {activeTab !== 'preleva' && (
        <header className="bg-white/80 backdrop-blur-md text-[var(--nero)] p-4 px-6 sticky top-0 z-30 border-b border-[var(--ardesia-100)] flex justify-between items-center">
          <button
            type="button"
            onClick={() => setActiveTab('panoramica')}
            className="h-12 w-12 md:h-14 md:w-14 rounded-[14px] bg-[var(--nero)] shadow-md flex items-center justify-center hover:scale-[1.03] transition-transform"
            aria-label="Apri panoramica"
          >
            <img src={logoDark} alt="QuandoVuoi" className="h-7 w-7 md:h-8 md:w-8 object-contain" />
          </button>
          <div className="w-8 h-8 rounded-full bg-[var(--rosa-300)] text-[var(--nero)] font-bold flex items-center justify-center text-sm shadow-sm cursor-pointer" onClick={() => setActiveTab('profilo')}>
            MR
          </div>
        </header>
      )}

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-[80px]">
        {activeTab === 'panoramica' && <TabPanoramica state={state} />}
        {activeTab === 'preleva' && (
           <TabPreleva 
             state={state} 
             onClose={() => setActiveTab('panoramica')} 
             onWithdraw={(a, d, s) => { onWithdraw(a, d, s); setActiveTab('panoramica'); }} 
             onEditIban={() => setIbanModalOpen(true)}
           />
        )}
        {activeTab === 'calendario' && <div className="p-4"><EmployeeCalendar history={state.history} /></div>}
        {activeTab === 'notifiche' && <TabNotifiche notifications={state.notifications} />}
        {activeTab === 'profilo' && <TabProfilo state={state} onEditIban={() => setIbanModalOpen(true)} onLogout={onLogout} />}
      </div>

      {/* Bottom Navigation */}
      {activeTab !== 'preleva' && (
        <div className="absolute bottom-0 w-full h-[64px] bg-white border-t border-[var(--ardesia-100)] flex items-center justify-between px-2 pb-safe z-40">
          <NavBtn icon={BarChart2} label="Panoramica" active={activeTab === 'panoramica'} onClick={() => setActiveTab('panoramica')} />
          <NavBtn icon={Calendar} label="Calendario" active={activeTab === 'calendario'} onClick={() => setActiveTab('calendario')} />
          
          {/* FAB Preleva */}
          <div className="relative -top-6 flex flex-col items-center justify-center group cursor-pointer" onClick={() => setActiveTab('preleva')}>
            <div className="w-[56px] h-[56px] bg-[var(--nero)] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(15,13,12,0.2)] group-hover:-translate-y-1 transition-transform">
              <Zap size={24} className="text-white fill-white" />
            </div>
            <span className="text-[10px] font-bold text-[var(--nero)] mt-1 tracking-wide">Preleva</span>
          </div>
          
          <NavBtn icon={Bell} label="Notifiche" active={activeTab === 'notifiche'} onClick={() => setActiveTab('notifiche')} badge={unreadNotifications} />
          <NavBtn icon={User} label="Profilo" active={activeTab === 'profilo'} onClick={() => setActiveTab('profilo')} />
        </div>
      )}

      {/* Shared Modals & Toasts */}
      <IbanModal isOpen={ibanModalOpen} currentIban={state.iban} onClose={() => setIbanModalOpen(false)} onSave={handleSaveIban} />
      <ToastContainer message={toastMsg} />
    </div>
  );
};

const NavBtn = ({ icon: Icon, label, active, onClick, badge }) => (
  <button onClick={onClick} className="flex-1 flex flex-col items-center justify-center gap-1 relative h-full">
    {active && <div className="absolute top-0 w-8 h-1 bg-[var(--rosa-500)] rounded-b-full" />}
    <div className="relative">
      <Icon size={22} className={active ? "text-[var(--rosa-500)]" : "text-[var(--grafite)]"} />
      {badge > 0 && (
        <span className="absolute -top-1 -right-1.5 bg-[var(--rosa-500)] w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center border border-white">
          {badge}
        </span>
      )}
    </div>
    <span className={cn("text-[10px] font-medium tracking-wide", active ? "text-[var(--rosa-500)] font-bold" : "text-[var(--grafite)]")}>{label}</span>
  </button>
);


// --- TAB: PANORAMICA ---
const TabPanoramica = ({ state }) => {
  const balanceRef = useRef(state.balance);
  const [displayBalance, setDisplayBalance] = useState(state.balance);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (state.balance !== balanceRef.current) {
      const oldVal = balanceRef.current;
      const newVal = state.balance;
      balanceRef.current = newVal;
      let start;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / 600, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setDisplayBalance(Math.floor(oldVal - (oldVal - newVal) * ease));
        if (progress < 1) window.requestAnimationFrame(step);
        else setDisplayBalance(newVal);
      };
      window.requestAnimationFrame(step);
    }
  }, [state.balance]);

  return (
    <div className="p-4 space-y-6 animate-fade-up">
      {/* HERO CARD COMPACT */}
      <div className="bg-[var(--nero)] rounded-[20px] p-6 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[var(--rosa-300)] text-[11px] font-bold tracking-[0.1em]">DISPONIBILE ORA</span>
          <span className="bg-[var(--rosa-500)] text-white text-[10px] font-bold px-2 py-1 rounded-[6px]">MAR 2026</span>
        </div>
        
        <div className={cn("text-[52px] font-bold text-white leading-none mb-6 tracking-tight", pulse && "animate-pulse-subtle")}>
          {formatEur(displayBalance)}
        </div>

        <div className="mb-2">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
             <div className="h-full bg-[var(--rosa-200)] rounded-full transition-all duration-1000" style={{ width: '76%' }} />
          </div>
          <div className="flex justify-between text-[11px] text-[var(--rosa-300)] mb-1">
            <span>Giorno 16</span>
            <span>10 apr</span>
          </div>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2 -mx-4 px-4">
        <div className="min-w-[140px] bg-[var(--rosa-50)] p-4 rounded-[16px] shadow-sm flex-1">
          <TrendingUp size={22} className="text-[var(--rosa-500)] mb-2" />
          <div className="text-[18px] font-bold text-[var(--nero)] mb-0.5">{formatEur(state.monthlyWithdrawn)}</div>
          <div className="text-[11px] font-medium text-[var(--carbone)] leading-tight">Prelevato<br/>questo mese</div>
        </div>
        <div className="min-w-[140px] bg-[var(--pervinca-50)] p-4 rounded-[16px] shadow-sm flex-1">
          <List size={22} className="text-[var(--pervinca-500)] mb-2" />
          <div className="text-[18px] font-bold text-[var(--nero)] mb-0.5">{state.totalWithdrawals}</div>
          <div className="text-[11px] font-medium text-[var(--carbone)] leading-tight">Prelievi<br/>totali</div>
        </div>
        <div className="min-w-[140px] bg-[var(--acqua-50)] p-4 rounded-[16px] shadow-sm flex-1">
          <Calendar size={22} className="text-[var(--acqua-500)] mb-2" />
          <div className="text-[18px] font-bold text-[var(--nero)] mb-0.5">10 apr</div>
          <div className="text-[11px] font-medium text-[var(--carbone)] leading-tight">Prossima<br/>busta paga</div>
        </div>
      </div>

      {/* SALARY SUMMARY */}
      <div className="bg-[var(--ardesia-50)] rounded-[16px] p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-[var(--nero)] mb-4 flex items-center gap-2">
          <Receipt size={16} /> Riepilogo busta paga
        </h3>
        <div className="flex justify-between mb-2">
          <span className="text-[13px] text-[var(--grafite)]">Stipendio netto</span>
          <span className="text-[13px] text-[var(--carbone)] font-medium">€2.000</span>
        </div>
        <div className="flex justify-between mb-4">
          <span className="text-[13px] text-[var(--grafite)]">Già prelevato</span>
          <span className="text-[13px] text-[var(--rosa-500)] font-medium">−{formatEur(state.monthlyWithdrawn)}</span>
        </div>
        <hr className="border-[var(--ardesia-100)] mb-4" />
        <div className="flex justify-between items-center">
          <span className="text-[15px] font-bold text-[var(--nero)]">Ricevi il 10 apr</span>
          <span className="text-[18px] font-bold text-[var(--acqua-500)]">{formatEur(Math.max(0, 2000 - state.monthlyWithdrawn))}</span>
        </div>
      </div>

      {/* HISTORY */}
      <div>
        <h3 className="text-[16px] font-bold text-[var(--nero)] mb-3">I tuoi prelievi</h3>
        <div className="space-y-2.5">
          {state.history.map((item, i) => (
            <div key={item.id} className="bg-white p-3.5 rounded-[12px] flex items-center shadow-sm">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-[var(--grafite)]">{item.id}</span>
                <span className="text-[12px] font-medium text-[var(--carbone)]">{item.date}</span>
              </div>
              <div className="flex-1" />
              <div className="text-right flex flex-col items-end gap-1">
                <span className="text-[16px] font-bold text-[var(--nero)]">{formatEur(item.amount)}</span>
                {item.status === 'Erogato' && <span className="bg-[var(--acqua-100)] text-[var(--acqua-500)] text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Check size={8} strokeWidth={3}/> Erogato</span>}
                {item.status === 'In elaborazione' && <span className="bg-[var(--rosa-100)] text-[var(--rosa-500)] text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><RefreshCw size={8} /> In elaborazione</span>}
                {item.status === 'Programmato' && <span className="bg-[var(--pervinca-100)] text-[var(--pervinca-500)] text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Calendar size={8} /> Programmato</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// --- TAB: PRELEVA (CIRCULAR DIAL) ---
const CircularDial = ({ maxAmount, amount, setAmount }) => {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const cx = 150, cy = 150, r = 125;
  const c = 2 * Math.PI * r;

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
  }, [maxAmount, setAmount]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointer);
      window.addEventListener('pointerup', () => setIsDragging(false));
      window.addEventListener('touchmove', handlePointer, { passive: false });
      window.addEventListener('touchend', () => setIsDragging(false));
    }
    return () => {
      window.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('pointerup', () => setIsDragging(false));
      window.removeEventListener('touchmove', handlePointer);
      window.removeEventListener('touchend', () => setIsDragging(false));
    };
  }, [isDragging, handlePointer]);

  const progress = maxAmount > 0 ? amount / maxAmount : 0;
  const angleRad = (135 + progress * 270) * Math.PI / 180;
  const thumbX = cx + r * Math.cos(angleRad);
  const thumbY = cy + r * Math.sin(angleRad);

  return (
    <div className="relative w-[300px] h-[300px] mx-auto select-none touch-none mt-4 mb-2 pointer-events-none">
      <svg ref={svgRef} width="300" height="300" className="absolute inset-0 z-10 pointer-events-auto">
        <defs>
          <linearGradient id="rosaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F4BFC5" />
            <stop offset="100%" stopColor="#B85A6E" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--ardesia-100)" strokeWidth="14" 
          strokeDasharray={`${c * 0.75} ${c * 0.25}`} strokeDashoffset="0" transform={`rotate(135 ${cx} ${cy})`} strokeLinecap="round" />
        {/* Fill */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#rosaGradient)" strokeWidth="14" 
          strokeDasharray={`${c * 0.75 * progress} ${c}`} strokeDashoffset="0" transform={`rotate(135 ${cx} ${cy})`} strokeLinecap="round" 
          style={{ transition: isDragging ? 'none' : 'stroke-dasharray 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        {/* Thumb */}
        <circle cx={thumbX} cy={thumbY} r="14" fill="white" stroke="var(--rosa-500)" strokeWidth="4" 
          className="cursor-grab active:cursor-grabbing hover:scale-110 origin-center drop-shadow-md pointer-events-auto"
          onPointerDown={(e) => { e.preventDefault(); setIsDragging(true); handlePointer(e); }}
          onTouchStart={(e) => { setIsDragging(true); handlePointer(e); }}
          style={{ transition: isDragging ? 'none' : 'cx 0.3s cubic-bezier(0.16, 1, 0.3, 1), cy 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2 z-0">
        <span className="text-[14px] text-[var(--grafite)] font-bold">{formatEur(maxAmount)}</span>
        <span className="text-[12px] text-[var(--grafite)] my-0.5 opacity-50">&darr;</span>
        <span className="text-[48px] font-bold text-[var(--nero)] leading-none tracking-tight -ml-1 py-1">{formatEur(amount)}</span>
        <span className="text-[12px] text-[var(--grafite)] mt-1 font-medium">da prelevare</span>
      </div>
    </div>
  );
};

const TabPreleva = ({ state, onClose, onWithdraw, onEditIban }) => {
  const [amount, setAmount] = useState(Math.min(250, state.balance));
  const [type, setType] = useState('now');
  const [scheduledDate, setScheduledDate] = useState('20 mar');
  const [isSuccess, setIsSuccess] = useState(false);

  const displayIban = `••••${state.iban.replace(/\s/g, '').slice(-4)}`;
  const scheduleDates = ['Ven 20', 'Lun 23', 'Mar 24', 'Mer 25', 'Gio 26', 'Ven 27', 'Lun 30', 'Mar 31'];

  const handleConfirm = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onWithdraw(amount, scheduledDate, type === 'schedule');
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="flex-1 bg-[var(--acqua-50)] flex flex-col items-center justify-center text-center px-6 h-full relative overflow-hidden animate-fade-up">
        <div className="confetti-container">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="confetti-particle" style={{ backgroundColor: ['#F4BFC5', '#9DD4C8', '#B8B0D4', '#C4A6C6'][Math.floor(Math.random() * 4)], left: `${50 + (Math.random() * 40 - 20)}%`, top: `50%`, '--tx': `${Math.random() * 100 - 50}px`, animationDelay: `${Math.random() * 0.5}s`}} />
          ))}
        </div>
        <div className="w-20 h-20 mb-6 relative">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 52 52">
            <circle className="text-[var(--acqua-100)]" cx="26" cy="26" r="25" fill="currentColor" />
            <path className="animate-check text-[var(--acqua-500)]" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <h2 className="text-[28px] font-bold text-[var(--nero)] mb-6 animate-pop-in">
          {type === 'now' ? 'Bonifico inviato!' : 'Prelievo programmato!'}
        </h2>
        <div className="bg-white rounded-[16px] shadow-sm p-5 w-full text-left mb-8 border border-[var(--acqua-100)] relative z-10">
           <div className="text-[11px] font-mono text-[var(--grafite)] mb-3">REQ-2619</div>
           <div className="text-[32px] font-bold text-[var(--nero)] leading-none mb-4">{formatEur(amount, true)}</div>
           <div className="space-y-2 text-[13px]">
             <div className="flex justify-between"><span className="text-[var(--grafite)]">Destinazione</span><span className="font-medium text-[var(--carbone)]">Conto {displayIban}</span></div>
             <div className="flex justify-between"><span className="text-[var(--grafite)]">Tempistiche</span>
               {type === 'now' ? <span className="font-medium text-[var(--acqua-500)] flex items-center gap-1"><Check size={14}/> Immediato</span>
                               : <span className="font-medium text-[var(--pervinca-500)] flex items-center gap-1"><Calendar size={14}/> {scheduledDate}</span>}
             </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col h-full animate-fade-up z-50 relative">
      <div className="pt-4 pb-2 px-4 flex items-center justify-between border-b border-[var(--ardesia-100)]">
        <button onClick={onClose} className="p-2 -ml-2 text-[var(--grafite)] hover:bg-[var(--fumo)] rounded-full transition-colors"><ChevronLeft size={24}/></button>
        <span className="text-[16px] font-bold text-[var(--nero)]">Preleva adesso</span>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-4 pb-6 overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-3 p-3 bg-[var(--fumo)] rounded-[12px] group">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0"><Building2 size={16} className="text-[var(--grafite)]" /></div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-[var(--carbone)] flex items-center justify-between">
              <span>Conto {displayIban}</span>
              <button onClick={onEditIban} className="p-1.5 rounded-full hover:bg-[var(--ardesia-100)] text-[var(--grafite)] transition-colors"><Edit2 size={14}/></button>
            </div>
          </div>
        </div>

        <CircularDial maxAmount={state.balance} amount={amount} setAmount={setAmount} />
        
        <div className="flex justify-center -mt-8 mb-6 relative z-20 pointer-events-auto">
          <button onClick={() => setAmount(0)} className="px-4 py-1.5 bg-[var(--fumo)] text-[var(--grafite)] text-[12px] font-bold rounded-full hover:bg-[var(--ardesia-100)] transition-colors shadow-sm">
            ↺ Reset
          </button>
        </div>

        <div className="flex justify-between gap-2 mb-6">
          {[100, 250, 500].filter(v => v <= state.balance).map(val => (
            <button key={val} onClick={() => setAmount(val)} className={cn("flex-1 py-2 rounded-full text-[12px] font-bold transition-colors", amount === val ? "bg-[var(--rosa-200)] text-[var(--rosa-500)]" : "bg-[var(--fumo)] text-[var(--grafite)]")}>
              €{val}
            </button>
          ))}
          <button onClick={() => setAmount(state.balance)} className={cn("flex-1 py-2 rounded-full text-[12px] font-bold transition-colors border", amount === state.balance ? "bg-[var(--rosa-200)] text-[var(--rosa-500)] border-[var(--rosa-300)]" : "bg-[var(--fumo)] text-[var(--grafite)] border-transparent")}>
            Max
          </button>
        </div>

        <div className="bg-[var(--fumo)] p-1 rounded-full flex mb-6">
          <button onClick={() => setType('now')} className={cn("flex-1 py-2 rounded-full text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5", type === 'now' ? "bg-[var(--nero)] text-white shadow-sm" : "text-[var(--grafite)]")}>
            <Zap size={14} /> Adesso
          </button>
          <button onClick={() => setType('schedule')} className={cn("flex-1 py-2 rounded-full text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5", type === 'schedule' ? "bg-[var(--nero)] text-white shadow-sm" : "text-[var(--grafite)]")}>
            <Calendar size={14} /> Scegli data
          </button>
        </div>

        {type === 'schedule' && (
          <div className="mb-6 animate-fade-up overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex gap-2 w-max">
              {scheduleDates.map(d => (
                <button key={d} onClick={() => setScheduledDate(d)} className={cn("px-4 py-2 rounded-[10px] text-[13px] font-bold transition-colors", scheduledDate === d ? "bg-[var(--rosa-200)] text-[var(--rosa-500)]" : "bg-[var(--ardesia-50)] text-[var(--grafite)]")}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4">
          <button 
            disabled={amount === 0}
            onClick={handleConfirm}
            className="w-full h-[52px] gradient-rosa text-white font-bold rounded-[14px] shadow-sm disabled:opacity-50 disabled:grayscale transition-all text-[16px]"
          >
            {amount === 0 ? "Seleziona importo" : `Preleva ${formatEur(amount)}`}
          </button>
        </div>
      </div>
    </div>
  );
};


// --- TAB: NOTIFICHE ---
const TabNotifiche = ({ notifications }) => (
  <div className="bg-white min-h-full animate-fade-up">
    <div className="p-6 pb-2 border-b border-[var(--ardesia-100)]">
      <h2 className="text-[20px] font-bold text-[var(--nero)]">Notifiche</h2>
    </div>
    <div>
      {notifications.map(n => (
        <div key={n.id} className="p-4 border-b border-[var(--ardesia-100)] hover:bg-[var(--rosa-50)] transition-colors flex gap-4 relative cursor-pointer">
          {!n.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--rosa-500)]" />}
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", 
            n.type === 'success' ? "bg-[var(--acqua-100)] text-[var(--acqua-500)]" :
            n.type === 'info' ? "bg-[var(--pervinca-100)] text-[var(--pervinca-500)]" :
            "bg-[var(--malva-100)] text-[var(--malva-500)]"
          )}>
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
const TabProfilo = ({ state, onEditIban, onLogout }) => (
  <div className="p-6 bg-[var(--fumo)] min-h-full animate-fade-up flex flex-col items-center">
    <div className="w-20 h-20 rounded-full bg-[var(--rosa-300)] text-white text-[24px] font-bold flex items-center justify-center shadow-md mb-4 mt-4">
      MR
    </div>
    <h2 className="text-[24px] font-bold text-[var(--nero)] mb-1">Mario Rossi</h2>
    <p className="text-[13px] text-[var(--grafite)] font-medium mb-8">Sviluppatore Senior · Acme SpA</p>

    <div className="w-full bg-white rounded-[20px] p-2 shadow-sm mb-6">
      <div className="flex items-center p-3 rounded-[12px] mb-1">
        <Building2 size={20} className="text-[var(--rosa-400)] shrink-0 mr-3" />
        <span className="text-[13px] text-[var(--grafite)] w-20">Azienda</span>
        <span className="text-[14px] font-bold text-[var(--nero)] flex-1 text-right">Acme SpA</span>
      </div>
      <div className="flex items-center p-3 rounded-[12px] mb-1">
        <Receipt size={20} className="text-[var(--rosa-400)] shrink-0 mr-3" />
        <span className="text-[13px] text-[var(--grafite)] w-20">Stipendio netto</span>
        <span className="text-[14px] font-bold text-[var(--nero)] flex-1 text-right">€3.200/mese</span>
      </div>
      <div className="flex items-center p-3 rounded-[12px] mb-1 group cursor-pointer" onClick={onEditIban}>
        <Building2 size={20} className="text-[var(--rosa-400)] shrink-0 mr-3" />
        <span className="text-[13px] text-[var(--grafite)] w-14">IBAN</span>
        <div className="flex-1 flex justify-end items-center gap-2">
           <span className="text-[14px] font-bold text-[var(--nero)]">••••{state.iban.replace(/\s/g, '').slice(-4)}</span>
           <Edit2 size={14} className="text-[var(--grafite)] group-hover:text-[var(--rosa-500)]" />
        </div>
      </div>
      <div className="flex items-center p-3 rounded-[12px]">
        <User size={20} className="text-[var(--rosa-400)] shrink-0 mr-3" />
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
  const [toggles, setToggles] = useState(HR_EMPLOYEES_SEED.map((employee) => employee.active));

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
    <div className="w-full max-w-[560px] h-full md:h-[844px] bg-white rounded-none md:rounded-[24px] border-0 md:border border-[var(--ardesia-100)] shadow-none md:shadow-xl overflow-hidden">
      <div className="h-full flex flex-col relative">
        <div className="absolute top-0 w-full p-6 flex justify-end z-20">
          <button onClick={onComplete} className={cn('text-[13px] hover:underline', step === 1 ? 'text-white/80' : 'text-[var(--grafite)]')}>
            Salta introduzione &rarr;
          </button>
        </div>

        {step === 1 && (
          <div className="flex-1 bg-[var(--nero)] text-white p-8 flex flex-col justify-center animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8">
              <Building2 size={32} className="text-white" />
            </div>
            <h1 className="text-[36px] font-bold leading-tight mb-2">Benvenuta, Maria.</h1>
            <h2 className="text-[20px] font-medium text-[var(--rosa-300)] mb-6">Zero approvazioni. Zero burocrazia.</h2>
            <p className="text-[16px] leading-relaxed opacity-80 mb-10">
              Attivi il servizio per i tuoi dipendenti. Noi gestiamo tutto il resto automaticamente.
            </p>

            <div className="flex gap-3 mb-12">
              <div className="flex-1 bg-[var(--antracite)] p-4 rounded-[12px]">
                <div className="text-[24px] font-bold mb-1">15 min</div>
                <div className="text-[12px] text-[var(--grafite)]">tempo medio di setup</div>
              </div>
              <div className="flex-1 bg-[var(--antracite)] p-4 rounded-[12px]">
                <div className="text-[24px] font-bold mb-1">0</div>
                <div className="text-[12px] text-[var(--grafite)]">approvazioni manuali</div>
              </div>
            </div>

            <button onClick={nextStep} className="mt-auto w-full bg-white text-[var(--nero)] h-[52px] rounded-[12px] font-bold text-[16px] hover:bg-[var(--fumo)] transition-colors">
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

            <div className="flex gap-3 mt-auto">
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
          <div className="flex-1 bg-white p-6 flex flex-col pt-16 animate-fade-up">
            <h2 className="text-[24px] font-bold text-[var(--nero)] mb-1">Chi puo usare QuandoVuoi?</h2>
            <p className="text-[13px] text-[var(--grafite)] mb-6">Puoi modificarlo in qualsiasi momento dalla dashboard.</p>

            <div className="flex justify-between items-center bg-[var(--ardesia-50)] p-3 rounded-[12px] mb-4">
              <span className="text-[13px] font-medium text-[var(--carbone)]">{activeCount} su {HR_EMPLOYEES_SEED.length} selezionati</span>
              <button onClick={() => setToggles(Array(HR_EMPLOYEES_SEED.length).fill(true))} className="text-[13px] font-bold text-[var(--rosa-500)]">
                Attiva tutti
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-4">
              {HR_EMPLOYEES_SEED.map((employee, index) => (
                <div key={employee.id} className="flex items-center justify-between p-3 hover:bg-[var(--rosa-50)] rounded-[12px]" onClick={() => handleToggle(index)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--ardesia-100)] text-[var(--ardesia-500)] flex items-center justify-center text-[12px] font-bold">
                      {employee.name.split(' ').map((name) => name[0]).join('')}
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[var(--nero)]">{employee.name}</div>
                      <div className="text-[12px] text-[var(--grafite)]">{employee.role}</div>
                    </div>
                  </div>
                  <div className={cn('w-11 h-6 rounded-full relative transition-colors', toggles[index] ? 'bg-[var(--acqua-300)]' : 'bg-[var(--polvere)]')}>
                    <div className={cn('absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm', toggles[index] ? 'translate-x-5' : 'translate-x-0')} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--ardesia-100)]">
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
  const [importFeedback, setImportFeedback] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    salary: ''
  });
  const fileInputRef = useRef(null);
  const rowsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const activeCount = employees.filter(e => e.active).length;
  const toggleStatus = (id) => setEmployees(emps => emps.map(e => e.id === id ? { ...e, active: !e.active } : e));

  const handleOpenFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const parseEmployeeRow = (row) => {
    const firstName = String(row.nome || row.name || row.first_name || '').trim();
    const lastName = String(row.cognome || row.surname || row.last_name || '').trim();
    const fullName = String(row.full_name || row.employee || '').trim();
    const role = String(row.ruolo || row.role || row.department || 'Dipendente').trim() || 'Dipendente';
    const salaryRaw = row.stipendio || row.salary || row.net_salary;
    const salary = Number(salaryRaw) || 0;
    const name = fullName || `${firstName} ${lastName}`.trim();
    if (!name) return null;

    return {
      id: Date.now() + Math.floor(Math.random() * 10000),
      name,
      role,
      salary,
      active: false,
      invited: true,
      lastWithdrawal: null
    };
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
        .filter((employee) => !employees.some((existing) => existing.name.toLowerCase() === employee.name.toLowerCase()));

      if (parsedEmployees.length === 0) {
        setImportFeedback('Nessun dipendente valido trovato nel file.');
      } else {
        setEmployees((current) => [...parsedEmployees, ...current]);
        setImportFeedback(`${parsedEmployees.length} dipendenti importati con successo.`);
      }
    } catch {
      setImportFeedback('Import non riuscito. Usa un file Excel o CSV valido.');
    } finally {
      event.target.value = '';
    }
  };

  const handleAddEmployee = () => {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    if (!fullName || !formData.role) return;

    const salary = Number(formData.salary) || 0;
    setEmployees((current) => [
      {
        id: Date.now(),
        name: fullName,
        role: formData.role,
        salary,
        active: false,
        invited: true,
        lastWithdrawal: null
      },
      ...current
    ]);
    setFormData({ firstName: '', lastName: '', role: '', salary: '' });
    setShowAddModal(false);
  };

  const filteredEmployees = employees.filter(e => {
    const searchLower = search.toLowerCase();
    const m = e.name.toLowerCase().includes(searchLower) || e.role.toLowerCase().includes(searchLower);
    if (filter === 'active') return m && e.active;
    if (filter === 'inactive') return m && !e.active;
    return m;
  });

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = search 
    ? filteredEmployees 
    : filteredEmployees.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const startIdx = (currentPage - 1) * rowsPerPage + 1;
  const endIdx = Math.min(currentPage * rowsPerPage, filteredEmployees.length);

  const getAvatarColors = (index) => {
    const colors = [
      { bg: 'var(--rosa-300)', text: 'white' },
      { bg: 'var(--pervinca-300)', text: 'white' },
      { bg: 'var(--acqua-300)', text: 'white' },
      { bg: 'var(--malva-300)', text: 'white' },
    ];
    return colors[index % 4];
  };

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
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 bg-[var(--rosa-50)] rounded-[16px] p-6 shadow-sm flex flex-col justify-between border border-[var(--rosa-100)]">
             <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] text-[var(--carbone)] font-bold uppercase tracking-wider">Dipendenti attivi</span>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"><Users className="text-[var(--rosa-400)]" size={16} /></div>
             </div>
             <div>
                <div className="text-[32px] font-bold text-[var(--nero)] leading-none mb-1">{activeCount} <span className="text-[20px] text-[var(--grafite)]">/ {employees.length}</span></div>
                <div className="text-[13px] text-[var(--grafite)]">{Math.round((activeCount/employees.length)*100)}% del personale</div>
             </div>
          </div>
          
          <div className="lg:col-span-1 bg-[var(--pervinca-50)] rounded-[16px] p-6 shadow-sm flex flex-col justify-between border border-[var(--pervinca-100)]">
             <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] text-[var(--carbone)] font-bold uppercase tracking-wider">Prelievi questo periodo</span>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"><ShieldCheck className="text-[var(--pervinca-500)]" size={16} /></div>
             </div>
             <div>
                <div className="text-[32px] font-bold text-[var(--nero)] leading-none mb-1">12</div>
                <div className="text-[13px] text-[var(--grafite)]">10 mar &rarr; 10 apr · tutti i dipendenti</div>
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
                  {[0, 1, 2, 3, 4].map(i => (
                    <g key={`grid-y-${i}`}>
                      <line x1="20" y1={20 + i*24} x2="380" y2={20 + i*24} stroke="var(--ardesia-100)" strokeWidth="1" />
                      <text x="15" y={24 + i*24} textAnchor="end" fontSize="10" fill="var(--grafite)">{16 - i*4}</text>
                    </g>
                  ))}
                  <path d="M 40,116 L 100,108 L 160,84 L 220,92 L 280,52 L 340,36 L 340,128 L 40,128 Z" fill="url(#chartGradient)" />
                  <path d="M 40,116 L 100,108 L 160,84 L 220,92 L 280,52 L 340,36" fill="none" stroke="var(--acqua-500)" strokeWidth="2.5" />
                  
                  {[
                    {x: 40, y: 116, label: 'Ott'}, {x: 100, y: 108, label: 'Nov'},
                    {x: 160, y: 84, label: 'Dic'}, {x: 220, y: 92, label: 'Gen'},
                    {x: 280, y: 52, label: 'Feb'}, {x: 340, y: 36, label: 'Mar'}
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
                <input type="text" placeholder="Cerca dipendente..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] pl-10 pr-4 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]" />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleOpenFilePicker}
                  className="px-4 py-2 border-2 border-[var(--rosa-200)] text-[var(--rosa-500)] bg-white rounded-[10px] font-bold text-[14px] flex items-center gap-2 hover:bg-[var(--rosa-50)] transition-colors"
                >
                  <Download size={16} /> <span className="hidden sm:inline">Importa Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 gradient-rosa text-white rounded-[10px] font-bold text-[14px] flex items-center gap-2 hover:shadow-md transition-shadow"
                >
                  <Plus size={16} /> Aggiungi
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </div>
            </div>
            {importFeedback ? (
              <p className="text-[13px] text-[var(--grafite)] mb-4">{importFeedback}</p>
            ) : null}
            <div className="flex bg-[var(--fumo)] p-1 rounded-[10px] inline-flex">
              <button onClick={()=>setFilter('all')} className={cn("px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors", filter==='all' ? "bg-[var(--nero)] text-white shadow-sm" : "text-[var(--grafite)]")}>Tutti · {employees.length}</button>
              <button onClick={()=>setFilter('active')} className={cn("px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors", filter==='active' ? "bg-[var(--nero)] text-white shadow-sm" : "text-[var(--grafite)]")}>Attivi · {activeCount}</button>
              <button onClick={()=>setFilter('inactive')} className={cn("px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors", filter==='inactive' ? "bg-[var(--nero)] text-white shadow-sm" : "text-[var(--grafite)]")}>Non attivi · {employees.length - activeCount}</button>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[var(--ardesia-50)]">
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase">Dipendente</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase">Stipendio netto</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase">Stato</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.length === 0 ? (
                   <tr>
                     <td colSpan={4} className="py-8 text-center text-[var(--grafite)]">Nessun dipendente trovato</td>
                   </tr>
                ) : (
                  paginatedEmployees.map((emp) => {
                    const avatar = getAvatarColors(emp.id - 1);
                    return (
                      <tr key={emp.id} className="border-b border-[var(--ardesia-100)] hover:bg-[var(--rosa-50)] transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm" style={{ backgroundColor: avatar.bg, color: avatar.text }}>
                              {emp.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <div><div className="text-[14px] font-bold text-[var(--nero)]">{emp.name}</div><div className="text-[12px] text-[var(--grafite)]">{emp.role}</div></div>
                          </div>
                        </td>
                        <td className="py-4 px-6"><div className="flex items-center gap-2 text-[13px] text-[var(--grafite)] font-medium">{formatEur(emp.salary)}<Lock size={12} className="opacity-50" /></div></td>
                        <td className="py-4 px-6">
                          {emp.active ? <span className="inline-flex items-center gap-1.5 bg-[var(--acqua-100)] text-[var(--acqua-500)] text-[11px] font-bold px-2 py-1 rounded-[6px]"><span className="w-1.5 h-1.5 rounded-full bg-[var(--acqua-500)]" /> Attivo</span>
                                      : <span className="inline-flex items-center gap-1.5 bg-[var(--ardesia-100)] text-[var(--grafite)] text-[11px] font-bold px-2 py-1 rounded-[6px]"><span className="w-1.5 h-1.5 rounded-full bg-[var(--grafite)] opacity-50" /> Non attivo</span>}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {emp.active ? <button onClick={() => toggleStatus(emp.id)} className="text-[12px] font-bold px-3 py-1.5 rounded-[8px] bg-[var(--malva-50)] text-[var(--malva-500)] hover:bg-[var(--malva-100)] transition-colors">Disattiva</button>
                                      : <button onClick={() => toggleStatus(emp.id)} className="text-[12px] font-bold px-3 py-1.5 rounded-[8px] bg-[var(--acqua-50)] text-[var(--acqua-500)] hover:bg-[var(--acqua-100)] transition-colors">Attiva</button>}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginazione */}
          {!search && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[var(--ardesia-100)] bg-[var(--fumo)]/30">
              <div className="text-[12px] text-[var(--grafite)]">
                Mostrando {startIdx}–{endIdx} di {filteredEmployees.length} dipendenti
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="text-[13px] font-medium text-[var(--grafite)] disabled:text-[var(--polvere)] hover:text-[var(--nero)] disabled:hover:text-[var(--polvere)] px-2 transition-colors"
                >
                  &larr; Precedente
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button 
                      key={p} 
                      onClick={() => setCurrentPage(p)}
                      className={cn(
                        "w-8 h-8 rounded-[8px] flex items-center justify-center text-[13px] transition-colors", 
                        currentPage === p ? "bg-[var(--nero)] text-white font-bold" : "bg-[var(--fumo)] text-[var(--grafite)] hover:bg-[var(--ardesia-100)]"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="text-[13px] font-medium text-[var(--grafite)] disabled:text-[var(--polvere)] hover:text-[var(--nero)] disabled:hover:text-[var(--polvere)] px-2 transition-colors"
                >
                  Successivo &rarr;
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-[var(--nero)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[18px] border border-[var(--ardesia-100)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[var(--nero)]">Aggiungi dipendente</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[var(--grafite)] hover:text-[var(--nero)]"
                aria-label="Chiudi"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nome"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]"
              />
              <input
                type="text"
                placeholder="Cognome"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]"
              />
              <input
                type="text"
                placeholder="Ruolo"
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]"
              />
              <input
                type="number"
                placeholder="Stipendio netto"
                value={formData.salary}
                onChange={(e) => setFormData((prev) => ({ ...prev, salary: e.target.value }))}
                className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-[var(--ardesia-100)] text-[var(--grafite)] rounded-[10px] text-[14px] font-semibold hover:bg-[var(--fumo)]"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleAddEmployee}
                className="px-4 py-2 gradient-rosa text-white rounded-[10px] text-[14px] font-bold hover:shadow-md transition-shadow"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- APP SHELL (State Manager & Demo Wrapper) ---
export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [demoMode, setDemoMode] = useState('emp-mobile'); 
  const [empState, setEmpState] = useState(INITIAL_EMP_STATE);

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
    <div className="font-sans min-h-screen bg-[var(--fumo)] flex flex-col relative">
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
                 "mx-auto bg-[var(--fumo)] overflow-hidden shadow-2xl relative flex flex-col font-sans transition-all duration-500",
                 demoMode === 'emp-mobile' 
                   ? "w-full max-w-[390px] h-[calc(100dvh-96px)] md:h-[844px] rounded-none md:rounded-[32px] border-0 md:border-[8px] border-[var(--nero)]" 
                   : "w-full max-w-4xl h-[100dvh] md:h-[844px] rounded-none md:rounded-[32px] border-0 md:border border-[var(--ardesia-100)]"
               )}>
                 <EmployeeOnboarding state={empState} onComplete={() => setCurrentView('emp-home')} />
               </div>
             ) : (
               <EmployeeAppShell state={empState} onWithdraw={handleWithdrawal} onUpdateIban={handleUpdateIban} onLogout={handleLogout} isMobile={demoMode === 'emp-mobile'} />
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
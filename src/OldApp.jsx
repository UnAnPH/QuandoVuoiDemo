import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  UserCircle, Building2, Zap, Shield, RefreshCw, TrendingUp, List, 
  Calendar, Check, X, Search, Download, Plus, ArrowRight, ArrowLeft, 
  LogOut, ShieldCheck, Users, Copy, Lock, CreditCard
} from 'lucide-react';

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

  /* Range Slider */
  input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    background: transparent;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 24px; width: 24px;
    border-radius: 50%;
    background: var(--rosa-500);
    cursor: pointer;
    margin-top: -10px;
    box-shadow: 0 2px 8px rgba(15,13,12,0.15);
    border: 2px solid white;
  }
  input[type=range]::-webkit-slider-runnable-track {
    width: 100%; height: 6px;
    cursor: pointer;
    border-radius: 3px;
  }

  /* Animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-up { animation: fadeUp 0.4s ease-out forwards; }

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

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return dateStr; // Usually keeping mock strings as provided
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
      const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
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
  monthlyWithdrawn: 2670,
  totalWithdrawals: 6,
  history: [
    { id: 'REQ-2618', date: '18 mar 2026', amount: 620, status: 'In elaborazione' },
    { id: 'REQ-2614', date: '6 mar 2026', amount: 800, status: 'Erogato' },
    { id: 'REQ-2610', date: '19 feb 2026', amount: 400, status: 'Erogato' },
    { id: 'REQ-2607', date: '5 feb 2026', amount: 750, status: 'Erogato' },
    { id: 'REQ-2604', date: '22 gen 2026', amount: 500, status: 'Erogato' },
    { id: 'REQ-2601', date: '8 gen 2026', amount: 900, status: 'Erogato' },
  ]
};

const INITIAL_HR_EMPLOYEES = [
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
];

// --- SHARED COMPONENTS ---
const ToastContainer = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-up">
      <div className="bg-[var(--nero)] text-white px-4 py-3 rounded-[12px] shadow-lg flex items-center gap-2 text-sm font-medium min-w-[200px] justify-center">
        {message.includes('✓') ? <Check size={16} className="text-[var(--acqua-300)]" /> : null}
        {message.replace('✓ ', '')}
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
    // Small delay to trigger animation after mount
    const t = setTimeout(() => setOffset(targetOffset), 100);
    return () => clearTimeout(t);
  }, [targetOffset]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          stroke="rgba(255,255,255,0.15)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke="var(--rosa-200)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        />
      </svg>
    </div>
  );
};

// --- VIEWS ---

const LoginView = ({ onLogin }) => {
  const [selected, setSelected] = useState(null); // 'emp' or 'hr'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--rosa-50)]">
      <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(15,13,12,0.07)] p-8 max-w-[480px] w-full animate-fade-up">
        
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-[var(--nero)] mb-2">QuandoVuoi</h1>
          <p className="text-[var(--grafite)]">Il tuo stipendio, quando vuoi.</p>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--grafite)] mb-4 text-center">
          Scegli la demo
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Emp Card */}
          <button 
            onClick={() => setSelected('emp')}
            className={cn(
              "flex-1 p-5 rounded-[16px] border text-left transition-all duration-200 relative group",
              selected === 'emp' 
                ? "bg-[var(--rosa-50)] border-[var(--rosa-400)] shadow-md" 
                : "bg-white border-[var(--rosa-100)] hover:-translate-y-1 hover:border-[var(--rosa-200)] hover:shadow-md"
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

          {/* HR Card */}
          <button 
            onClick={() => setSelected('hr')}
            className={cn(
              "flex-1 p-5 rounded-[16px] border text-left transition-all duration-200 relative group",
              selected === 'hr' 
                ? "bg-[var(--ardesia-50)] border-[var(--ardesia-400)] shadow-md" 
                : "bg-white border-[var(--ardesia-100)] hover:-translate-y-1 hover:border-[var(--ardesia-300)] hover:shadow-md"
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

        <div className="space-y-3 mb-8 opacity-60 pointer-events-none transition-opacity duration-300" style={{ opacity: selected ? 1 : 0.4 }}>
          <div>
            <label className="block text-[12px] text-[var(--grafite)] mb-1 font-medium">Nome azienda</label>
            <input type="text" readOnly value="Acme SpA" className="w-full bg-[var(--fumo)] border-none rounded-[10px] px-3 py-2 text-[var(--carbone)] focus:outline-none" />
          </div>
          <div>
            <label className="block text-[12px] text-[var(--grafite)] mb-1 font-medium">Email</label>
            <input type="email" readOnly value={selected === 'hr' ? 'hr@acme.it' : 'mario@acme.it'} className="w-full bg-[var(--fumo)] border-none rounded-[10px] px-3 py-2 text-[var(--carbone)] focus:outline-none" />
          </div>
          <div>
            <label className="block text-[12px] text-[var(--grafite)] mb-1 font-medium">Password</label>
            <input type="password" readOnly value="password123" className="w-full bg-[var(--fumo)] border-none rounded-[10px] px-3 py-2 text-[var(--carbone)] focus:outline-none tracking-widest" />
          </div>
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
  const totalSteps = 4;
  
  const nextStep = () => step < totalSteps ? setStep(s => s + 1) : onComplete();
  const prevStep = () => step > 1 && setStep(s => s - 1);

  const AnimatedBalance = () => {
    const val = useAnimatedValue(1219, 1500);
    return <span>€{val.toLocaleString('it-IT')}</span>;
  };

  return (
    <div className="min-h-screen bg-[var(--rosa-50)] flex flex-col md:items-center md:justify-center p-0 md:p-6">
      
      <div className="w-full max-w-[480px] min-h-screen md:min-h-[640px] bg-white md:rounded-[24px] shadow-[0_2px_16px_rgba(15,13,12,0.07)] flex flex-col relative overflow-hidden">
        
        {/* Skip Header */}
        <div className="absolute top-0 w-full p-6 flex justify-end z-20">
          <button onClick={onComplete} className={cn("text-[13px] hover:underline", step === 1 || step === 3 ? "text-white/80" : "text-[var(--grafite)]")}>
            Salta introduzione &rarr;
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex-1 gradient-rosa text-white p-8 flex flex-col justify-center animate-fade-up">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-8">
                <Zap size={32} className="text-white" />
              </div>
              <h1 className="text-[38px] font-bold leading-tight mb-2">Ciao, Mario!</h1>
              <h2 className="text-[24px] font-medium opacity-90 mb-6">Il tuo stipendio è qui.</h2>
              <p className="text-[16px] leading-relaxed opacity-80 mb-12">
                Hai già guadagnato parte del tuo stipendio questo mese.<br/>
                QuandoVuoi ti dà accesso immediato, quando ne hai bisogno.
              </p>
              <button onClick={nextStep} className="mt-auto w-full bg-white text-[var(--rosa-500)] h-[52px] rounded-[12px] font-bold text-[16px] hover:bg-[var(--rosa-50)] transition-colors">
                Inizia &rarr;
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex-1 p-8 flex flex-col bg-white animate-fade-up pt-20">
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
                  { i: '💰', l: 'Stipendio', v: '€3.200/mese' },
                  { i: '🏦', l: 'IBAN', v: '••••••••••••3456' }
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

              <div className="flex gap-3 mt-auto">
                <button onClick={prevStep} className="px-6 h-[52px] rounded-[12px] border border-[var(--ardesia-100)] text-[var(--carbone)] font-medium hover:bg-[var(--fumo)] transition-colors">
                  &larr; Indietro
                </button>
                <button onClick={nextStep} className="flex-1 gradient-rosa text-white h-[52px] rounded-[12px] font-bold transition-transform hover:-translate-y-px shadow-sm">
                  Conferma &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex-1 bg-[var(--nero)] text-white p-8 flex flex-col pt-20 animate-fade-up">
              
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
                    <div className="text-[12px] text-[var(--grafite)] mb-1">Stipendio maturato</div>
                    <div className="font-bold">€2.438</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] text-[var(--grafite)] mb-1">Disponibile ora</div>
                    <div className="font-bold text-[var(--rosa-200)]">€1.219</div>
                  </div>
                </div>
                
                <p className="text-[12px] text-[var(--grafite)]">
                  Il 31 marzo riceverai il saldo completo con la busta paga.
                </p>
              </div>

              <div className="flex gap-3 mt-auto">
                 <button onClick={prevStep} className="px-6 h-[52px] rounded-[12px] border border-white/20 text-white font-medium hover:bg-white/10 transition-colors">
                  &larr; Indietro
                </button>
                <button onClick={nextStep} className="flex-1 gradient-rosa text-white h-[52px] rounded-[12px] font-bold transition-transform hover:-translate-y-px shadow-sm">
                  Continua &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="flex-1 bg-white p-8 flex flex-col pt-20 animate-fade-up">
              <h2 className="text-[28px] font-bold text-[var(--nero)] mb-8 text-center">Come funziona</h2>
              
              <div className="space-y-4 flex-1">
                <div className="bg-[var(--acqua-50)] p-5 rounded-[16px] flex gap-4">
                  <div className="mt-1"><Zap className="text-[var(--acqua-500)]" size={24}/></div>
                  <div>
                    <h3 className="font-bold text-[var(--nero)] mb-1">Preleva quando vuoi</h3>
                    <p className="text-[13px] text-[var(--carbone)] leading-relaxed">Accedi al tuo stipendio maturato in qualsiasi momento del mese, senza aspettare il 27.</p>
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
                    <p className="text-[13px] text-[var(--carbone)] leading-relaxed">Il prelievo viene recuperato automaticamente con la tua busta paga. Non devi fare nulla.</p>
                  </div>
                </div>
              </div>

              <button onClick={onComplete} className="w-full gradient-rosa text-white h-[52px] rounded-[12px] font-bold transition-transform hover:-translate-y-px shadow-md mt-8">
                Inizia adesso &rarr;
              </button>
            </div>
          )}

        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 pb-safe pointer-events-none">
          {[1,2,3,4].map(i => (
            <div key={i} className={cn(
              "h-2 rounded-full transition-all duration-300",
              step === i ? "w-6 bg-[var(--rosa-500)]" : "w-2 bg-[var(--rosa-100)]"
            )} />
          ))}
        </div>

      </div>
    </div>
  );
};


// --- EMPLOYEE HOME ---
const EmployeeHome = ({ state, onWithdraw, onLogout }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('now'); // 'now' or 'schedule'
  
  const balanceRef = useRef(state.balance);
  const [displayBalance, setDisplayBalance] = useState(state.balance);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // Pulse on load
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Animate balance change when state updates
    if (state.balance !== balanceRef.current) {
      const oldVal = balanceRef.current;
      const newVal = state.balance;
      balanceRef.current = newVal;
      
      let start;
      const duration = 600;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setDisplayBalance(Math.floor(oldVal - (oldVal - newVal) * ease));
        if (progress < 1) window.requestAnimationFrame(step);
        else setDisplayBalance(newVal);
      };
      window.requestAnimationFrame(step);
    }
  }, [state.balance]);

  return (
    <div className="min-h-screen bg-[var(--fumo)] pb-20">
      
      {/* Header */}
      <header className="bg-[var(--nero)] text-white p-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-[20px] font-bold tracking-tight">QuandoVuoi</div>
          <div className="flex items-center gap-3">
             <button onClick={onLogout} className="text-[var(--grafite)] hover:text-white transition-colors">
               <LogOut size={20} />
             </button>
             <div className="w-8 h-8 rounded-full bg-[var(--rosa-300)] text-[var(--nero)] font-bold flex items-center justify-center text-sm">
              MR
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* HERO CARD */}
        <div className="bg-[var(--nero)] rounded-[20px] p-6 shadow-xl relative overflow-hidden animate-fade-up">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[var(--rosa-300)] text-[11px] font-bold tracking-[0.1em]">DISPONIBILE ORA</span>
            <span className="bg-[var(--rosa-500)] text-white text-[10px] font-bold px-2 py-1 rounded-[6px]">MAR 2026</span>
          </div>
          
          <div className={cn("text-[56px] font-bold text-white leading-none mb-6 tracking-tight", pulse && "animate-pulse-subtle")}>
            {formatEur(displayBalance)}
          </div>

          <div className="mb-8">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
               <div className="h-full bg-[var(--rosa-200)] rounded-full transition-all duration-1000" style={{ width: '76%' }} />
            </div>
            <div className="flex justify-between text-[11px] text-[var(--rosa-300)] mb-1">
              <span>Giorno 16</span>
              <span>31 mar</span>
            </div>
            <div className="text-center text-[12px] text-[var(--grafite)]">
              76% del mese lavorato · Acme SpA
            </div>
          </div>

          {state.balance > 0 ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => { setModalType('now'); setModalOpen(true); }}
                className="flex-1 bg-white text-[var(--nero)] h-[52px] rounded-[12px] font-bold flex items-center justify-center gap-2 hover:-translate-y-px transition-transform"
              >
                <Zap size={18} className="text-[var(--rosa-500)]" /> Preleva adesso
              </button>
              <button 
                onClick={() => { setModalType('schedule'); setModalOpen(true); }}
                className="flex-1 bg-[var(--rosa-100)] text-[var(--nero)] h-[52px] rounded-[12px] font-bold flex items-center justify-center gap-2 hover:bg-[var(--rosa-200)] transition-colors"
              >
                <Calendar size={18} /> Programma
              </button>
            </div>
          ) : (
             <div className="bg-white/5 border border-white/10 rounded-[12px] p-4 text-center">
               <p className="text-white/60 text-[13px]">Hai prelevato tutto il disponibile · Nuovi fondi dal 1 apr</p>
             </div>
          )}
        </div>

        {/* QUICK STATS */}
        <div className="flex overflow-x-auto custom-scrollbar gap-4 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3">
          <div className="min-w-[160px] bg-[var(--rosa-50)] p-4 rounded-[16px] shadow-sm flex-1">
            <TrendingUp size={24} className="text-[var(--rosa-500)] mb-3" />
            <div className="text-[20px] font-bold text-[var(--nero)] mb-1">{formatEur(state.monthlyWithdrawn)}</div>
            <div className="text-[12px] text-[var(--carbone)]">Prelevato questo mese</div>
          </div>
          <div className="min-w-[160px] bg-[var(--pervinca-50)] p-4 rounded-[16px] shadow-sm flex-1">
            <List size={24} className="text-[var(--pervinca-500)] mb-3" />
            <div className="text-[20px] font-bold text-[var(--nero)] mb-1">{state.totalWithdrawals}</div>
            <div className="text-[12px] text-[var(--carbone)]">Prelievi totali</div>
          </div>
          <div className="min-w-[160px] bg-[var(--acqua-50)] p-4 rounded-[16px] shadow-sm flex-1">
            <Calendar size={24} className="text-[var(--acqua-500)] mb-3" />
            <div className="text-[20px] font-bold text-[var(--nero)] mb-1">31 mar</div>
            <div className="text-[12px] text-[var(--carbone)]">Prossima busta paga</div>
          </div>
        </div>

        {/* HISTORY */}
        <div>
          <h3 className="text-[18px] font-bold text-[var(--nero)] mb-4">I tuoi prelievi</h3>
          <div className="space-y-3">
            {state.history.map((item, i) => (
              <div key={item.id} className="bg-white p-4 rounded-[12px] flex items-center shadow-sm hover:bg-[var(--rosa-50)] transition-colors animate-fade-up" style={{ animationDelay: `${i * 50}ms`}}>
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] text-[var(--grafite)]">{item.id}</span>
                  <span className="text-[13px] text-[var(--carbone)]">{item.date}</span>
                </div>
                <div className="flex-1" />
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className="text-[18px] font-bold text-[var(--nero)]">{formatEur(item.amount)}</span>
                  {item.status === 'Erogato' && (
                    <span className="bg-[var(--acqua-100)] text-[var(--acqua-500)] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={10} strokeWidth={3}/> Erogato
                    </span>
                  )}
                  {item.status === 'In elaborazione' && (
                    <span className="bg-[var(--rosa-100)] text-[var(--rosa-500)] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin" /> In elaborazione
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* WITHDRAWAL MODAL */}
      {modalOpen && (
        <WithdrawalModal 
          maxAmount={state.balance} 
          initialType={modalType}
          onClose={() => setModalOpen(false)}
          onConfirm={(amount) => {
            onWithdraw(amount);
          }}
        />
      )}
    </div>
  );
};

const WithdrawalModal = ({ maxAmount, initialType, onClose, onConfirm }) => {
  const [amount, setAmount] = useState(Math.min(500, maxAmount));
  const [type, setType] = useState(initialType); // 'now' or 'schedule'
  const [scheduledDate, setScheduledDate] = useState('20 mar');
  const [isSuccess, setIsSuccess] = useState(false);

  const fee = 1.50;
  const receive = amount - fee;

  const handleConfirm = () => {
    setIsSuccess(true);
    // Let animation play before actually notifying parent to update state/close
    setTimeout(() => {
      onConfirm(amount);
    }, 2000); 
  };

  const scheduleDates = ['Lun 20', 'Mar 21', 'Mer 22', 'Gio 23', 'Ven 24'];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[var(--nero)]/60 backdrop-blur-sm transition-opacity" onClick={!isSuccess ? onClose : undefined} />
      
      {/* Sheet / Modal */}
      <div className={cn(
        "relative w-full max-w-[480px] bg-white rounded-t-[24px] md:rounded-[24px] p-6 pb-safe transition-all duration-300 transform",
        isSuccess ? "bg-[var(--acqua-50)]" : "bg-white"
      )} style={{ animation: 'fadeUp 0.3s ease-out forwards' }}>
        
        {!isSuccess ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-bold text-[var(--nero)]">
                {type === 'now' ? 'Preleva adesso' : 'Programma prelievo'}
              </h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--fumo)] text-[var(--grafite)] hover:bg-[var(--ardesia-100)]">
                <X size={18} />
              </button>
            </div>

            <div className="text-center mb-8">
              <div className="text-[52px] font-bold text-[var(--nero)] leading-none mb-2 tracking-tight transition-all">
                {formatEur(amount)}
              </div>
              <div className="text-[13px] text-[var(--grafite)]">
                Commissione fissa: €1,50 · Ricevi sul conto: <span className="font-semibold text-[var(--carbone)]">{formatEur(receive, true)}</span>
              </div>
            </div>

            {/* Slider */}
            <div className="mb-6 relative">
               <div className="absolute w-full h-1.5 bg-[var(--polvere)] rounded-full top-1/2 -translate-y-1/2 pointer-events-none" />
               <div className="absolute h-1.5 bg-[var(--rosa-200)] rounded-full top-1/2 -translate-y-1/2 pointer-events-none" 
                    style={{ width: `${((amount - 50) / (maxAmount - 50)) * 100}%`}} />
               <input 
                 type="range" 
                 min={50} 
                 max={maxAmount} 
                 step={10} 
                 value={amount}
                 onChange={(e) => setAmount(Number(e.target.value))}
                 className="w-full relative z-10"
               />
            </div>

            {/* Chips */}
            <div className="flex justify-between gap-2 mb-8">
              {[100, 250, 500].filter(v => v <= maxAmount).map(val => (
                <button key={val} onClick={() => setAmount(val)} className={cn(
                  "flex-1 py-2 rounded-full text-[13px] font-medium transition-colors",
                  amount === val ? "bg-[var(--rosa-200)] text-[var(--rosa-500)]" : "bg-[var(--fumo)] text-[var(--grafite)] hover:bg-[var(--ardesia-100)]"
                )}>
                  €{val}
                </button>
              ))}
              <button onClick={() => setAmount(maxAmount)} className={cn(
                "flex-1 py-2 rounded-full text-[13px] font-medium transition-colors border",
                amount === maxAmount ? "bg-[var(--rosa-200)] text-[var(--rosa-500)] border-[var(--rosa-300)]" : "bg-[var(--fumo)] text-[var(--grafite)] border-transparent hover:bg-[var(--ardesia-100)]"
              )}>
                Max {formatEur(maxAmount)}
              </button>
            </div>

            <div className="h-px w-full bg-[var(--ardesia-100)] mb-6" />

            <div className="flex items-center gap-3 mb-6 p-4 bg-[var(--fumo)] rounded-[12px]">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Building2 size={20} className="text-[var(--grafite)]" />
              </div>
              <div>
                <div className="text-[12px] text-[var(--grafite)] font-medium">Destinazione</div>
                <div className="text-[14px] font-semibold text-[var(--carbone)]">Conto ••••3456</div>
              </div>
            </div>

            <div className="h-px w-full bg-[var(--ardesia-100)] mb-6" />

            {/* Tabs */}
            <div className="bg-[var(--fumo)] p-1 rounded-full flex mb-6">
              <button 
                onClick={() => setType('now')}
                className={cn("flex-1 py-2 rounded-full text-[13px] font-semibold transition-colors flex items-center justify-center gap-2", type === 'now' ? "bg-[var(--nero)] text-white shadow-sm" : "text-[var(--grafite)] hover:text-[var(--carbone)]")}
              >
                <Zap size={16} /> Adesso
              </button>
              <button 
                onClick={() => setType('schedule')}
                className={cn("flex-1 py-2 rounded-full text-[13px] font-semibold transition-colors flex items-center justify-center gap-2", type === 'schedule' ? "bg-[var(--nero)] text-white shadow-sm" : "text-[var(--grafite)] hover:text-[var(--carbone)]")}
              >
                <Calendar size={16} /> Scegli data
              </button>
            </div>

            {type === 'now' ? (
              <div className="text-center text-[13px] text-[var(--acqua-500)] font-medium mb-6 flex items-center justify-center gap-1">
                <Check size={16} /> Bonifico immediato
              </div>
            ) : (
              <div className="mb-6 animate-fade-up">
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar -mx-2 px-2">
                  {scheduleDates.map(d => (
                    <button key={d} onClick={() => setScheduledDate(d)} className={cn(
                      "whitespace-nowrap px-4 py-2 rounded-[10px] text-[13px] font-medium transition-colors",
                      scheduledDate === d ? "bg-[var(--rosa-200)] text-[var(--rosa-500)]" : "bg-[var(--ardesia-50)] text-[var(--grafite)]"
                    )}>
                      {d}
                    </button>
                  ))}
                </div>
                <div className="text-center text-[12px] text-[var(--grafite)] mt-2">
                  Accreditato il {scheduledDate} · Conto ••••3456
                </div>
              </div>
            )}

            <button 
              onClick={handleConfirm}
              className="w-full h-[52px] gradient-rosa text-white font-bold rounded-[14px] shadow-sm hover:-translate-y-px transition-transform text-[16px]"
            >
              {type === 'now' ? `Preleva ${formatEur(amount)}` : `Programma ${formatEur(amount)} il ${scheduledDate.split(' ')[1]} mar`}
            </button>
          </>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center animate-fade-up relative min-h-[400px]">
            
            <div className="confetti-container">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="confetti-particle" style={{
                  backgroundColor: ['#F4BFC5', '#9DD4C8', '#B8B0D4', '#C4A6C6'][Math.floor(Math.random() * 4)],
                  left: `${50 + (Math.random() * 40 - 20)}%`,
                  top: `50%`,
                  '--tx': `${Math.random() * 100 - 50}px`,
                  animationDelay: `${Math.random() * 0.5}s`
                }} />
              ))}
            </div>

            <div className="w-20 h-20 mb-6 relative">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 52 52">
                <circle className="text-[var(--acqua-100)]" cx="26" cy="26" r="25" fill="currentColor" />
                <path className="animate-check text-[var(--acqua-500)]" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>

            <h2 className="text-[28px] font-bold text-[var(--nero)] mb-6 animate-pop-in">Bonifico inviato!</h2>

            <div className="bg-white rounded-[16px] shadow-sm p-5 w-full max-w-[320px] text-left mb-8 border border-[var(--acqua-100)] relative z-10">
               <div className="text-[11px] font-mono text-[var(--grafite)] mb-3">REQ-2619</div>
               <div className="text-[32px] font-bold text-[var(--nero)] leading-none mb-4">{formatEur(receive, true)}</div>
               
               <div className="space-y-2 text-[13px]">
                 <div className="flex justify-between">
                   <span className="text-[var(--grafite)]">Destinazione</span>
                   <span className="font-medium text-[var(--carbone)]">Conto ••••3456</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-[var(--grafite)]">Tempistiche</span>
                   <span className="font-medium text-[var(--acqua-500)] flex items-center gap-1"><Check size={14}/> Immediato</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-[var(--grafite)]">Data</span>
                   <span className="font-medium text-[var(--carbone)]">19 marzo 2026</span>
                 </div>
               </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full h-[52px] bg-[var(--nero)] text-white font-bold rounded-[14px] hover:bg-[var(--antracite)] transition-colors relative z-10"
            >
              Torna alla home
            </button>
          </div>
        )}

      </div>
    </div>
  );
};


// --- HR ONBOARDING ---
const HROnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  const nextStep = () => step < totalSteps ? setStep(s => s + 1) : onComplete();
  const prevStep = () => step > 1 && setStep(s => s - 1);

  const [toggles, setToggles] = useState([true, true, true, true, true, true, true, false, false, false]);
  const handleToggle = (i) => {
    const newToggles = [...toggles];
    newToggles[i] = !newToggles[i];
    setToggles(newToggles);
  };
  const activeCount = toggles.filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[var(--ardesia-50)] flex flex-col md:items-center md:justify-center p-0 md:p-6">
      
      <div className="w-full max-w-[480px] min-h-screen md:min-h-[640px] bg-white md:rounded-[24px] shadow-[0_2px_16px_rgba(15,13,12,0.07)] flex flex-col relative overflow-hidden">
        
        {/* Skip Header */}
        <div className="absolute top-0 w-full p-6 flex justify-end z-20">
          <button onClick={onComplete} className={cn("text-[13px] hover:underline", step === 1 ? "text-white/80" : "text-[var(--grafite)]")}>
            Salta introduzione &rarr;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex-1 bg-[var(--nero)] text-white p-8 flex flex-col justify-center animate-fade-up">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8">
                <Building2 size={32} className="text-white" />
              </div>
              <h1 className="text-[36px] font-bold leading-tight mb-2">Benvenuto, Maria.</h1>
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

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex-1 bg-[var(--ardesia-50)] p-8 flex flex-col pt-20 animate-fade-up">
              <h2 className="text-[24px] font-bold text-[var(--nero)] mb-6">Dati aziendali</h2>
              
              <div className="bg-white p-6 rounded-[16px] shadow-sm space-y-4 mb-6">
                 <div>
                  <label className="block text-[12px] font-medium text-[var(--grafite)] mb-1">Ragione Sociale</label>
                  <input type="text" defaultValue="Acme SpA" className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2.5 text-[var(--nero)] font-medium focus:outline-none focus:border-[var(--rosa-300)] transition-colors" />
                 </div>
                 <div>
                  <label className="block text-[12px] font-medium text-[var(--grafite)] mb-1">Partita IVA</label>
                  <input type="text" defaultValue="IT12345678901" className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2.5 text-[var(--nero)] font-medium focus:outline-none focus:border-[var(--rosa-300)] transition-colors" />
                 </div>
                 <div className="flex gap-4">
                   <div className="flex-1">
                    <label className="block text-[12px] font-medium text-[var(--grafite)] mb-1">Dipendenti totali</label>
                    <input type="text" defaultValue="10" className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2.5 text-[var(--nero)] font-medium focus:outline-none" />
                   </div>
                 </div>
                 <hr className="border-[var(--ardesia-100)] my-2" />
                 <div>
                  <label className="block text-[12px] font-medium text-[var(--grafite)] mb-1">Referente HR</label>
                  <input type="text" defaultValue="Maria Bianchi" className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2.5 text-[var(--nero)] font-medium focus:outline-none" />
                 </div>
                 <div>
                  <label className="block text-[12px] font-medium text-[var(--grafite)] mb-1">Email referente</label>
                  <input type="text" defaultValue="hr@acme.it" className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2.5 text-[var(--nero)] font-medium focus:outline-none" />
                 </div>
              </div>

              <div className="flex gap-3 mt-auto">
                <button onClick={prevStep} className="px-6 h-[52px] rounded-[12px] border border-[var(--ardesia-300)] text-[var(--carbone)] font-medium hover:bg-[var(--ardesia-100)] transition-colors bg-white">
                  &larr; Indietro
                </button>
                <button onClick={nextStep} className="flex-1 gradient-rosa text-white h-[52px] rounded-[12px] font-bold transition-transform hover:-translate-y-px shadow-sm">
                  Continua &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex-1 bg-white p-6 flex flex-col pt-16 animate-fade-up">
              <h2 className="text-[24px] font-bold text-[var(--nero)] mb-1">Chi può usare QuandoVuoi?</h2>
              <p className="text-[13px] text-[var(--grafite)] mb-6">Puoi modificarlo in qualsiasi momento dalla dashboard.</p>
              
              <div className="flex justify-between items-center bg-[var(--ardesia-50)] p-3 rounded-[12px] mb-4">
                <span className="text-[13px] font-medium text-[var(--carbone)]">{activeCount} su 10 selezionati</span>
                <button onClick={() => setToggles(Array(10).fill(true))} className="text-[13px] font-bold text-[var(--rosa-500)]">Attiva tutti</button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-4">
                {INITIAL_HR_EMPLOYEES.map((emp, i) => (
                  <div key={emp.id} className="flex items-center justify-between p-3 hover:bg-[var(--rosa-50)] rounded-[12px] transition-colors group cursor-pointer" onClick={() => handleToggle(i)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--ardesia-100)] text-[var(--ardesia-500)] flex items-center justify-center text-[12px] font-bold">
                        {emp.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-[var(--nero)]">{emp.name}</div>
                        <div className="text-[12px] text-[var(--grafite)]">{emp.role}</div>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <div className={cn(
                      "w-11 h-6 rounded-full transition-colors relative",
                      toggles[i] ? "bg-[var(--acqua-300)]" : "bg-[var(--polvere)]"
                    )}>
                      <div className={cn(
                        "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm",
                        toggles[i] ? "translate-x-5" : "translate-x-0"
                      )} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--ardesia-100)] bg-white">
                <button onClick={prevStep} className="px-6 h-[52px] rounded-[12px] border border-[var(--ardesia-100)] text-[var(--carbone)] font-medium hover:bg-[var(--fumo)] transition-colors">
                  &larr; Indietro
                </button>
                <button onClick={nextStep} className="flex-1 gradient-rosa text-white h-[52px] rounded-[12px] font-bold transition-transform hover:-translate-y-px shadow-sm">
                  Attiva servizio &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="flex-1 bg-[var(--acqua-50)] p-8 flex flex-col justify-center animate-fade-up text-center relative z-10">
              
              <div className="w-24 h-24 mx-auto mb-8 relative">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 52 52">
                  <circle className="text-[var(--acqua-100)]" cx="26" cy="26" r="25" fill="currentColor" />
                  <path className="animate-check text-[var(--acqua-500)]" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>

              <h2 className="text-[28px] font-bold text-[var(--nero)] mb-3 leading-tight">Servizio attivo per {activeCount} dipendenti su 10.</h2>
              <p className="text-[15px] text-[var(--carbone)] mb-10">I tuoi dipendenti riceveranno un'email per iniziare.</p>

              <div className="bg-white p-4 rounded-[16px] shadow-sm mb-10 text-left">
                <label className="block text-[12px] font-bold text-[var(--grafite)] mb-2 uppercase tracking-wider">Condividi link d'invito</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[var(--fumo)] text-[13px] text-[var(--carbone)] p-3 rounded-[10px] overflow-hidden text-ellipsis whitespace-nowrap font-mono">
                    https://app.quandovuoi.it/join/acme-k7x2
                  </div>
                  <button className="bg-[var(--rosa-100)] text-[var(--rosa-500)] px-4 rounded-[10px] font-bold text-[13px] hover:bg-[var(--rosa-200)] transition-colors flex items-center gap-1">
                    <Copy size={16}/> Copia
                  </button>
                </div>
              </div>

              <button onClick={onComplete} className="w-full bg-[var(--nero)] text-white h-[52px] rounded-[12px] font-bold transition-transform hover:-translate-y-px shadow-md mt-auto">
                Vai alla dashboard &rarr;
              </button>
            </div>
          )}

        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 pb-safe pointer-events-none z-0">
          {[1,2,3,4].map(i => (
            <div key={i} className={cn(
              "h-2 rounded-full transition-all duration-300",
              step === i ? "w-6 bg-[var(--rosa-500)]" : "w-2 bg-[var(--ardesia-300)]"
            )} />
          ))}
        </div>

      </div>
    </div>
  );
};


// --- HR DASHBOARD ---
const HRDashboard = ({ onLogout }) => {
  const [employees, setEmployees] = useState(INITIAL_HR_EMPLOYEES);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [toastMsg, setToastMsg] = useState('');
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const activeCount = employees.filter(e => e.active).length;

  const toggleStatus = (id) => {
    setEmployees(emps => emps.map(e => e.id === id ? { ...e, active: !e.active } : e));
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase());
    if (filter === 'active') return matchesSearch && e.active;
    if (filter === 'inactive') return matchesSearch && !e.active;
    return matchesSearch;
  });

  const getAvatarColors = (i) => {
    const colors = [
      { bg: 'var(--rosa-100)', text: 'var(--rosa-500)' },
      { bg: 'var(--pervinca-100)', text: 'var(--pervinca-500)' },
      { bg: 'var(--acqua-100)', text: 'var(--acqua-500)' },
      { bg: 'var(--malva-100)', text: 'var(--malva-500)' },
    ];
    return colors[i % colors.length];
  };

  return (
    <div className="min-h-screen bg-[var(--fumo)] pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-[var(--ardesia-100)] sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-[20px] font-bold tracking-tight text-[var(--nero)]">QuandoVuoi</div>
          <div className="w-px h-6 bg-[var(--ardesia-100)] hidden sm:block" />
          <div className="text-[13px] text-[var(--grafite)] hidden sm:block font-medium">Portale HR · Acme SpA</div>
        </div>
        <button onClick={onLogout} className="text-[var(--grafite)] hover:text-[var(--nero)] transition-colors p-2 bg-[var(--fumo)] rounded-full">
          <LogOut size={18} />
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-up">
        
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--rosa-50)] rounded-[16px] p-6 shadow-sm flex items-start justify-between border border-[var(--rosa-100)]">
            <div>
              <div className="text-[13px] text-[var(--carbone)] font-semibold uppercase tracking-wider mb-2">Dipendenti attivi</div>
              <div className="text-[32px] font-bold text-[var(--nero)] leading-none mb-1">{activeCount} <span className="text-[20px] text-[var(--grafite)]">/ {employees.length}</span></div>
              <div className="text-[13px] text-[var(--grafite)]">{Math.round((activeCount/employees.length)*100)}% del personale</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Users className="text-[var(--rosa-400)]" size={24} />
            </div>
          </div>
          
          <div className="bg-[var(--pervinca-50)] rounded-[16px] p-6 shadow-sm flex items-start justify-between border border-[var(--pervinca-100)]">
            <div>
              <div className="text-[13px] text-[var(--carbone)] font-semibold uppercase tracking-wider mb-2">Costo per l'azienda</div>
              <div className="text-[32px] font-bold text-[var(--nero)] leading-none mb-1">€0</div>
              <div className="text-[13px] text-[var(--grafite)]">Il servizio è sostenuto dai dipendenti</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="text-[var(--pervinca-500)]" size={24} />
            </div>
          </div>
        </div>

        {/* Gestione Dipendenti */}
        <div className="bg-white rounded-[20px] shadow-sm border border-[var(--ardesia-100)] overflow-hidden">
          
          <div className="p-6 border-b border-[var(--ardesia-100)]">
            <h2 className="text-[20px] font-bold text-[var(--nero)] mb-6">Gestione Dipendenti</h2>
            
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--grafite)]" size={18} />
                <input 
                  type="text" 
                  placeholder="Cerca dipendente..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] pl-10 pr-4 py-2 text-[14px] focus:outline-none focus:border-[var(--rosa-300)] transition-colors"
                />
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 border-2 border-[var(--rosa-200)] text-[var(--rosa-500)] bg-white rounded-[10px] font-bold text-[14px] flex items-center gap-2 hover:bg-[var(--rosa-50)] transition-colors"
                >
                  <Download size={16} /> <span className="hidden sm:inline">Importa da CSV</span>
                </button>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 gradient-rosa text-white rounded-[10px] font-bold text-[14px] flex items-center gap-2 hover:shadow-md transition-shadow"
                >
                  <Plus size={16} /> Aggiungi
                </button>
              </div>
            </div>

            <div className="flex bg-[var(--fumo)] p-1 rounded-[10px] inline-flex">
              <button onClick={()=>setFilter('all')} className={cn("px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors", filter==='all' ? "bg-[var(--nero)] text-white shadow-sm" : "text-[var(--grafite)] hover:text-[var(--carbone)]")}>
                Tutti · {employees.length}
              </button>
              <button onClick={()=>setFilter('active')} className={cn("px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors", filter==='active' ? "bg-[var(--nero)] text-white shadow-sm" : "text-[var(--grafite)] hover:text-[var(--carbone)]")}>
                Attivi · {activeCount}
              </button>
              <button onClick={()=>setFilter('inactive')} className={cn("px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors", filter==='inactive' ? "bg-[var(--nero)] text-white shadow-sm" : "text-[var(--grafite)] hover:text-[var(--carbone)]")}>
                Non attivi · {employees.length - activeCount}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[var(--ardesia-50)]">
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase tracking-wider">Dipendente</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase tracking-wider">Stipendio</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase tracking-wider">Stato</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase tracking-wider">Ultimo prelievo</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-[var(--grafite)] uppercase tracking-wider text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-[var(--polvere)]">
                        <Users size={48} className="mb-4 opacity-50" />
                        <div className="text-[16px] font-bold text-[var(--carbone)] mb-1">Nessun dipendente trovato</div>
                        <div className="text-[13px] text-[var(--grafite)] mb-4">Modifica i filtri o aggiungi un nuovo dipendente.</div>
                        <button onClick={() => setShowAddModal(true)} className="text-[var(--rosa-500)] font-bold text-[14px] hover:underline">+ Aggiungi dipendente</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp, i) => {
                    const avatar = getAvatarColors(i);
                    return (
                      <tr key={emp.id} className="border-b border-[var(--ardesia-100)] hover:bg-[var(--rosa-50)] transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ backgroundColor: avatar.bg, color: avatar.text }}>
                              {emp.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <div>
                              <div className="text-[14px] font-bold text-[var(--nero)]">{emp.name}</div>
                              <div className="text-[12px] text-[var(--grafite)]">{emp.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-[13px] text-[var(--grafite)] font-medium">
                            {formatEur(emp.salary)}
                            <Lock size={12} className="opacity-50" title="Visibile solo all'HR" />
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {emp.invited ? (
                            <span className="inline-flex items-center bg-[var(--pervinca-100)] text-[var(--pervinca-500)] text-[11px] font-bold px-2 py-1 rounded-[6px]">
                              Invito inviato
                            </span>
                          ) : emp.active ? (
                            <span className="inline-flex items-center gap-1.5 bg-[var(--acqua-100)] text-[var(--acqua-500)] text-[11px] font-bold px-2 py-1 rounded-[6px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--acqua-500)]" /> Attivo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-[var(--ardesia-100)] text-[var(--grafite)] text-[11px] font-bold px-2 py-1 rounded-[6px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--grafite)] opacity-50" /> Non attivo
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                           <span className={cn("text-[13px]", emp.lastWithdrawal ? "text-[var(--grafite)]" : "text-[var(--polvere)]")}>
                             {emp.lastWithdrawal || "—"}
                           </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {emp.invited ? (
                             <button className="text-[12px] font-bold px-3 py-1.5 rounded-[8px] bg-[var(--ardesia-50)] text-[var(--grafite)] hover:bg-[var(--ardesia-100)] transition-colors">
                              Annulla invito
                            </button>
                          ) : emp.active ? (
                            <button onClick={() => toggleStatus(emp.id)} className="text-[12px] font-bold px-3 py-1.5 rounded-[8px] bg-[var(--malva-50)] text-[var(--malva-500)] hover:bg-[var(--malva-100)] transition-colors">
                              Disattiva
                            </button>
                          ) : (
                            <button onClick={() => toggleStatus(emp.id)} className="text-[12px] font-bold px-3 py-1.5 rounded-[8px] bg-[var(--acqua-50)] text-[var(--acqua-500)] hover:bg-[var(--acqua-100)] transition-colors">
                              Attiva
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {filteredEmployees.length > 5 && (
            <div className="p-4 text-center border-t border-[var(--ardesia-100)] bg-[var(--fumo)]/50">
              <button className="text-[13px] font-bold text-[var(--grafite)] hover:text-[var(--nero)] transition-colors">Mostra tutti i dipendenti &darr;</button>
            </div>
          )}
        </div>

        {/* Wellness Insight Banner */}
        <div className="bg-[var(--pervinca-50)] rounded-[20px] p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 justify-between border border-[var(--pervinca-100)] mt-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--pervinca-100)] rounded-full blur-[80px] -mr-32 -mt-32 opacity-50 pointer-events-none" />
          
          <div className="flex-1 relative z-10">
            <h3 className="text-[20px] font-bold text-[var(--nero)] mb-1">Benessere finanziario del team</h3>
            <p className="text-[13px] text-[var(--grafite)] mb-6 md:mb-0">Dati aggregati e anonimizzati · Acme SpA</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 relative z-10 w-full md:w-auto">
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-[32px] font-bold text-[var(--rosa-500)]">€42/mese</span>
              <span className="text-[12px] text-[var(--grafite)] font-medium">risparmio medio vs. prestiti</span>
            </div>
            <div className="hidden sm:block w-px bg-[var(--pervinca-100)]" />
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-[32px] font-bold text-[var(--acqua-500)]">−18%</span>
              <span className="text-[12px] text-[var(--grafite)] font-medium">richieste di anticipo HR</span>
            </div>
            <div className="hidden sm:block w-px bg-[var(--pervinca-100)]" />
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-[32px] font-bold text-[var(--pervinca-500)]">4,8/5</span>
              <span className="text-[12px] text-[var(--grafite)] font-medium">soddisfazione dipendenti</span>
            </div>
          </div>
        </div>

      </main>

      {/* Modals */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--nero)]/60 backdrop-blur-sm p-4 animate-fade-up">
          <div className="bg-white rounded-[24px] p-8 max-w-[400px] w-full text-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-[var(--rosa-50)] text-[var(--rosa-500)] flex items-center justify-center mx-auto mb-6">
              <Download size={32} />
            </div>
            <h3 className="text-[20px] font-bold text-[var(--nero)] mb-3">Funzionalità in arrivo 🚀</h3>
            <p className="text-[14px] text-[var(--carbone)] leading-relaxed mb-8">
              Stiamo lavorando all'integrazione con i principali software HR italiani. Sarai avvisato quando sarà disponibile.
            </p>
            <button onClick={() => setShowImportModal(false)} className="w-full h-[52px] bg-[var(--fumo)] text-[var(--nero)] font-bold rounded-[12px] hover:bg-[var(--ardesia-100)] transition-colors">
              Chiudi
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--nero)]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 max-w-[440px] w-full shadow-xl animate-fade-up">
            <h3 className="text-[20px] font-bold text-[var(--nero)] mb-6">Aggiungi dipendente</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[12px] font-medium text-[var(--grafite)] mb-1">Nome</label>
                  <input type="text" className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2.5 focus:outline-none focus:border-[var(--rosa-300)]" />
                </div>
                <div className="flex-1">
                  <label className="block text-[12px] font-medium text-[var(--grafite)] mb-1">Cognome</label>
                  <input type="text" className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2.5 focus:outline-none focus:border-[var(--rosa-300)]" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--grafite)] mb-1">Email aziendale</label>
                <input type="email" className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2.5 focus:outline-none focus:border-[var(--rosa-300)]" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--grafite)] mb-1">Stipendio netto mensile (€)</label>
                <input type="number" placeholder="es. 1800" className="w-full bg-[var(--ardesia-50)] border border-[var(--ardesia-100)] rounded-[10px] px-3 py-2.5 focus:outline-none focus:border-[var(--rosa-300)]" />
              </div>
            </div>

            <div className="flex gap-3">
               <button onClick={() => setShowAddModal(false)} className="flex-1 h-[52px] bg-[var(--fumo)] text-[var(--carbone)] font-bold rounded-[12px] hover:bg-[var(--ardesia-100)] transition-colors">
                Annulla
              </button>
              <button 
                onClick={() => {
                  setEmployees([{ id: Date.now(), name: 'Nuovo Dipendente', role: 'Ruolo', salary: 0, active: false, invited: true, lastWithdrawal: null }, ...employees]);
                  setShowAddModal(false);
                  showToast("✓ Invito inviato a nuovo.dipendente@acme.it");
                }} 
                className="flex-[2] gradient-rosa text-white font-bold rounded-[12px] hover:-translate-y-px transition-transform shadow-sm flex justify-center items-center gap-2"
              >
                Invia invito &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer message={toastMsg} onClose={() => setToastMsg('')} />
    </div>
  );
};


// --- APP SHELL (State Manager) ---
export default function App() {
  const [currentView, setCurrentView] = useState('login'); // login, emp-onboard, emp-home, hr-onboard, hr-home
  const [currentUser, setCurrentUser] = useState(null); // 'emp', 'hr'
  const [empState, setEmpState] = useState(INITIAL_EMP_STATE);

  const handleLogin = (role, skipOnboarding) => {
    setCurrentUser(role);
    if (role === 'emp') {
      setCurrentView(skipOnboarding ? 'emp-home' : 'emp-onboard');
    } else {
      setCurrentView(skipOnboarding ? 'hr-home' : 'hr-onboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    // reset state for demo purposes
    setEmpState(INITIAL_EMP_STATE);
  };

  const handleWithdrawal = (amount) => {
    const newReqId = `REQ-${2619 + empState.totalWithdrawals - 6}`; // fake incrementing ID
    const today = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
    
    setEmpState(prev => ({
      balance: prev.balance - amount,
      monthlyWithdrawn: prev.monthlyWithdrawn + amount,
      totalWithdrawals: prev.totalWithdrawals + 1,
      history: [
        { id: newReqId, date: today, amount: amount, status: 'Erogato' },
        ...prev.history
      ]
    }));
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div className="min-h-screen text-[var(--carbone)] selection:bg-[var(--rosa-200)] selection:text-[var(--nero)]">
        
        {currentView === 'login' && (
          <LoginView onLogin={handleLogin} />
        )}

        {currentView === 'emp-onboard' && (
          <EmployeeOnboarding onComplete={() => setCurrentView('emp-home')} />
        )}

        {currentView === 'emp-home' && (
          <EmployeeHome 
            state={empState} 
            onWithdraw={handleWithdrawal} 
            onLogout={handleLogout} 
          />
        )}

        {currentView === 'hr-onboard' && (
          <HROnboarding onComplete={() => setCurrentView('hr-home')} />
        )}

        {currentView === 'hr-home' && (
          <HRDashboard onLogout={handleLogout} />
        )}

      </div>
    </>
  );
}
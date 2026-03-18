import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, ChevronLeft, ChevronRight } from 'lucide-react';

export default function EmployeeOnboarding() {
  const [step, setStep] = useState(1);
  const [balance, setBalance] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const { completeOnboarding } = useAuth();

  const cards = [
    {
      title: 'Accesso immediato',
      description: 'Richiedi un anticipo dello stipendio quando ne hai bisogno, senza aspettare la fine del mese.'
    },
    {
      title: 'Nessun interesse',
      description: 'Non ci sono interessi o costi nascosti. Paghi solo una piccola commissione di servizio.'
    },
    {
      title: 'Veloce e sicuro',
      description: 'Ricevi il tuo anticipo entro 24 ore direttamente sul tuo conto bancario.'
    }
  ];

  useEffect(() => {
    if (step === 3) {
      let current = 0;
      const interval = setInterval(() => {
        if (current < 1240) {
          current += 50;
          setBalance(Math.min(current, 1240));
        } else {
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleComplete = async () => {
    await completeOnboarding();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-6">
              <Wallet className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Benvenuto in QuandoVuoi
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              QuandoVuoi ti permette di accedere al tuo stipendio quando ne hai bisogno,
              senza aspettare la fine del mese. Il servizio è completamente integrato con
              la tua azienda e garantisce massima trasparenza e sicurezza.
            </p>
            <button
              onClick={() => setStep(2)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
            >
              Continua
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">I tuoi dati</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  defaultValue="Demo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cognome
                </label>
                <input
                  type="text"
                  defaultValue="User"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="user@gmail.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  readOnly
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
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Il tuo saldo disponibile
            </h2>
            <p className="text-gray-600 mb-8">
              In base alle tue ore lavorate, puoi richiedere fino a:
            </p>
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-12 mb-8">
              <div className="text-6xl font-bold text-white mb-2">
                €{balance.toLocaleString('it-IT')}
              </div>
              <div className="text-purple-100 text-lg">
                Disponibile ora
              </div>
            </div>
            <button
              onClick={() => setStep(4)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
            >
              Continua
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Come funziona
            </h2>

            <div className="relative mb-8">
              <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-8 min-h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-purple-800 mb-3">
                    {cards[cardIndex].title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {cards[cardIndex].description}
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setCardIndex(Math.max(0, cardIndex - 1))}
                  disabled={cardIndex === 0}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div className="flex gap-2 items-center">
                  {cards.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition ${
                        i === cardIndex ? 'bg-purple-600 w-8' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCardIndex(Math.min(cards.length - 1, cardIndex + 1))}
                  disabled={cardIndex === cards.length - 1}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
            >
              Inizia adesso
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

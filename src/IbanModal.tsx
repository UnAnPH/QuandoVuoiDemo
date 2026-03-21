import { useEffect, useState } from 'react';

interface IbanModalProps {
  isOpen: boolean;
  currentIban: string;
  onClose: () => void;
  onSave: (iban: string) => void;
}

const formatIbanInput = (value: string) => {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return normalized.match(/.{1,4}/g)?.join(' ') || '';
};

export default function IbanModal({ isOpen, currentIban, onClose, onSave }: IbanModalProps) {
  const [tempIban, setTempIban] = useState(currentIban || '');

  useEffect(() => {
    if (isOpen) {
      setTempIban(currentIban || '');
    }
  }, [isOpen, currentIban]);

  if (!isOpen) return null;

  const stripped = tempIban.replace(/\s/g, '');
  const shouldValidate = stripped.length >= 5;
  const isValid = stripped.startsWith('IT') && stripped.length >= 15;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button type="button" className="absolute inset-0 bg-[var(--nero)]/50" onClick={onClose} aria-label="Chiudi" />
      <div className="relative bg-white rounded-t-[24px] p-6 pb-8 animate-slide-up shadow-2xl">
        <h3 className="text-[17px] font-bold text-[var(--nero)] mb-1">Modifica IBAN</h3>
        <p className="text-[13px] text-[var(--grafite)] mb-5">Usato per ricevere i tuoi prelievi.</p>

        <input
          type="text"
          value={tempIban}
          onChange={(e) => {
            const formatted = formatIbanInput(e.target.value);
            setTempIban(formatted.slice(0, 34));
          }}
          placeholder="IT00 X000 0000 0000 0000 0000 000"
          className={[
            'w-full rounded-[12px] px-4 py-3.5 text-[15px] font-mono bg-[var(--ardesia-50)] border focus:outline-none transition-colors',
            shouldValidate
              ? isValid
                ? 'border-[var(--acqua-300)] text-[var(--nero)]'
                : 'border-[var(--rosa-400)] text-[var(--nero)]'
              : 'border-[var(--ardesia-300)] text-[var(--nero)]'
          ].join(' ')}
        />

        <div className="h-5 mt-1 mb-4">
          {shouldValidate ? (
            isValid ? (
              <p className="text-[12px] text-[var(--acqua-500)]">✓ Formato valido</p>
            ) : (
              <p className="text-[12px] text-[var(--rosa-500)]">Formato non valido</p>
            )
          ) : null}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 h-[48px] rounded-[12px] bg-[var(--fumo)] text-[var(--grafite)] font-semibold">
            Annulla
          </button>
          <button
            type="button"
            disabled={!isValid}
            onClick={() => onSave(tempIban)}
            className="flex-1 h-[48px] rounded-[12px] bg-[var(--nero)] text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}

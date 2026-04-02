'use client';

import { useEffect, useRef, useState } from 'react';

type CreateSiteModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { address: string; city: string; unit: string }) => void;
};

export default function CreateSiteModal({ open, onClose, onCreate }: CreateSiteModalProps) {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Millbrook, NJ');
  const [unit, setUnit] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setAddress('');
    setCity('Millbrook, NJ');
    setUnit('');
    window.setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  if (!open) return null;

  const handleCreate = () => {
    if (!address.trim()) return;
    onCreate({ address: address.trim(), city: city.trim() || 'Millbrook, NJ', unit: unit.trim() });
  };

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/35 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,19,28,0.86),rgba(10,13,20,0.84))] text-white shadow-panel backdrop-blur-[30px] animate-fadeUp">
        <div className="border-b border-white/[0.08] px-5 py-4">
          <div className="text-[18px] font-semibold tracking-tight">Create site from map drop</div>
          <div className="mt-1 text-[12px] text-white/48">Name the site you just dropped onto the map and keep tracking it going forward.</div>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">Address</label>
            <input ref={inputRef} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.08] px-4 py-3 text-[14px] text-white outline-none" placeholder="145 Oak Street" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.08] px-4 py-3 text-[14px] text-white outline-none" placeholder="Millbrook, NJ" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">Unit / label (optional)</label>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.08] px-4 py-3 text-[14px] text-white outline-none" placeholder="Unit 3B" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/[0.08] bg-white/[0.08] px-4 py-2.5 text-[13px] font-medium text-white/72 transition hover:bg-white/[0.12]">Cancel</button>
          <button type="button" onClick={handleCreate} className="rounded-xl bg-sky-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-float transition hover:bg-sky-400">Create site</button>
        </div>
      </div>
    </div>
  );
}

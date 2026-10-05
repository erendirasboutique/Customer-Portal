'use client';

// components/studio/GiveawayAdmin.js
// /admin/giveaway inside AdminShell, with the EN/ES switch driving
// both the shell and the wheel.

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import GiveawayWheel from '@/components/studio/GiveawayWheel';

const HERO = {
  en: {
    title: 'Giveaway Wheel',
    sub: 'Add your customers’ names, spin, and let the wheel pick a winner.',
    stat: 'Winners',
    cap: 'picked in the last 30 days',
    tipLabel: 'Quick tip',
    tip: 'Press Full screen and share your screen on the live so everyone sees the wheel spin.',
    notSaved: 'The wheel still works, but winners won’t be saved until you run the SQL from the zip in Supabase.',
  },
  es: {
    title: 'Ruleta de Regalos',
    sub: 'Agrega los nombres de tus clientas, gira, y deja que la ruleta elija a la ganadora.',
    stat: 'Ganadoras',
    cap: 'en los últimos 30 días',
    tipLabel: 'Tip rápido',
    tip: 'Presiona Pantalla completa y comparte tu pantalla en el live para que todas vean girar la ruleta.',
    notSaved: 'La ruleta funciona, pero las ganadoras no se guardan hasta que corras el SQL del zip en Supabase.',
  },
};

export default function GiveawayAdmin(props) {
  const [lang, setLang] = useState('en');
  const h = HERO[lang];

  useEffect(function () {
    try {
      const saved = localStorage.getItem('eb-lang');
      if (saved === 'en' || saved === 'es') setLang(saved);
    } catch (e) {}
  }, []);

  return (
    <AdminShell
      admin={props.admin}
      active="giveaway"
      lang={lang}
      onLang={setLang}
      eyebrow="ADMIN STUDIO"
      title={h.title}
      subtitle={h.sub}
      heroStat={{ label: h.stat, value: props.thisMonth, caption: h.cap }}
      tip={{ label: h.tipLabel, body: h.tip }}
    >
      {props.loadError && (
        <div className="eba-panel">
          <div className="eba-err">{props.loadError} {h.notSaved}</div>
        </div>
      )}
      <GiveawayWheel history={props.history} lang={lang} />
    </AdminShell>
  );
}

'use client';

import { useState } from 'react';
import { S1 } from '@/data/strings';
import { canStart } from '@/lib/flow/screenFlow';
import { actions } from '@/lib/store/actions';
import { useStore } from '@/lib/store/StoreContext';
import { GLOVE_ART } from '@/media/assets';
import { Button } from '../ui';

/** S1. 모둠 입장과 안전 약속 */
export default function S1Entry() {
  const { dispatch } = useStore();
  const [name, setName] = useState('');
  const [checks, setChecks] = useState([false, false, false]);
  const ready = canStart(name, checks);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-4xl font-black">{S1.title}</h1>

      <label className="flex flex-col gap-2">
        <span className="text-lg font-bold">{S1.nameGuide}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={S1.namePlaceholder}
          maxLength={20}
          className="min-h-11 rounded-xl border-2 border-slate-200 bg-white px-4 text-xl focus:border-amber-400 focus:outline-none"
        />
      </label>

      <fieldset className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow">
        <legend className="flex items-center gap-2 px-1 font-bold">
          <span className="text-3xl" aria-hidden>{GLOVE_ART}</span>
          {S1.safetyTitle}
        </legend>
        {S1.safetyPromises.map((text, i) => (
          <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="size-7 accent-amber-500"
              checked={checks[i]}
              onChange={(e) => setChecks((c) => c.map((v, j) => (j === i ? e.target.checked : v)))}
            />
            <span>{text}</span>
          </label>
        ))}
      </fieldset>

      <Button
        disabled={!ready}
        className="self-center px-10 text-2xl"
        onClick={() => dispatch(actions.startExpedition(name, ready))}
      >
        {S1.start}
      </Button>
    </main>
  );
}

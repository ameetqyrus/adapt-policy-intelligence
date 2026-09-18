"use client";
import React from 'react';
import { OPENROUTER_PRESETS, normalizeRouterModel } from '@/lib/openrouter-presets';
export default function OpenRouterModelPicker({value, onChange}: {value: string; onChange: (value: string) => void}) {
  return <label>GPT model
    <select aria-label="OpenRouter model" value={normalizeRouterModel(value)} onChange={event => onChange(event.target.value)}>
      {OPENROUTER_PRESETS.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
    </select>
  </label>;
}

// Bundled choices do not depend on credentials or a catalog request.
export const OPENROUTER_PRESETS = [
  { id: '~openai/gpt-luna-latest', name: 'GPT Luna (default)' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1' },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 mini' },
] as const;
export const DEFAULT_OPENROUTER_MODEL = OPENROUTER_PRESETS[0].id;
export function isOpenRouterPreset(value: unknown): value is typeof OPENROUTER_PRESETS[number]['id'] {
  return OPENROUTER_PRESETS.some(model => model.id === value);
}
export function normalizeRouterModel(value: unknown): string {
  return isOpenRouterPreset(value) ? value : DEFAULT_OPENROUTER_MODEL;
}

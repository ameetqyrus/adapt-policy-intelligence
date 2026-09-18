import {it,expect,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Picker from '../app/components/OpenRouterModelPicker';
import {OPENROUTER_PRESETS,DEFAULT_OPENROUTER_MODEL,normalizeRouterModel} from '../lib/openrouter-presets';
it('renders three immediate options with Luna selected and no catalog request',()=>{
 const fetcher=vi.spyOn(globalThis,'fetch');
 try {
  const html=renderToStaticMarkup(createElement(Picker,{value:DEFAULT_OPENROUTER_MODEL,onChange:()=>{}}));
  expect(OPENROUTER_PRESETS).toHaveLength(3);
  expect(html.match(/<option /g)).toHaveLength(3);
  expect(html).toContain('value="~openai/gpt-luna-latest" selected=""');
  expect(html).toContain('GPT-4.1 mini');expect(fetcher).not.toHaveBeenCalled();
 } finally {fetcher.mockRestore();}
});
it('migrates stale selections to Luna and retains supported choices',()=>{
 expect(normalizeRouterModel(undefined)).toBe(DEFAULT_OPENROUTER_MODEL);
 expect(normalizeRouterModel('vendor/retired')).toBe(DEFAULT_OPENROUTER_MODEL);
 expect(normalizeRouterModel('openai/gpt-4.1')).toBe('openai/gpt-4.1');
});

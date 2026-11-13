// Each site served from here uses one template: its pages, its default content
// and the rules for what may be saved.
import { CLUB } from './club.js';
import { CLEAN, DEFAULTS, KEYS, PAGES, SLOTS } from './defaults.js';

const FOUNDATION = {
  name: 'foundation',
  title: 'Dnamo Football Foundation',
  path: '/',
  onePage: false,
  DEFAULTS, SLOTS, PAGES, KEYS, CLEAN,
};

const TEMPLATES = { foundation: FOUNDATION, club: CLUB };

export const templateFor = (name) => TEMPLATES[name] || FOUNDATION;

export function clean(tpl, key, value) {
  if (!tpl.CLEAN[key]) throw new Error('Unknown setting.');
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid value.');
  return tpl.CLEAN[key](value);
}

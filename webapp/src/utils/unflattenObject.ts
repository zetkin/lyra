import { TextState, TranslateIdTextState } from '@/utils/adapters';

export interface UnflattenObject {
  [key: string]: string | UnflattenObject;
}

export interface UnflattenTranslateIdTextState {
  [key: string]: TextState | UnflattenTranslateIdTextState;
}

/**
 * Unflatten a flat object with string values.
 * ex: { 'a.b.c': 'value' } => { a: { b: { c: 'value' } } }
 */
export function unflattenObject(obj: Record<string, string>): UnflattenObject {
  const result: UnflattenObject = {};
  for (const key in obj) {
    const keys = key.split('.');
    let current: UnflattenObject = result;
    for (let i = 0; i < keys.length; i++) {
      if (i === keys.length - 1) {
        current[keys[i]] = obj[key];
      } else {
        current[keys[i]] = current[keys[i]] || {};
        current = current[keys[i]] as UnflattenObject;
      }
    }
  }
  return result;
}

/**
 * Unflatten TranslateIdTextState, a flat object with TextState values.
 * ex: { 'a.b.c': TextState } => { a: { b: { c: TextState } } }
 */
export function unflattenTranslateIdTextState(
  obj: TranslateIdTextState,
): UnflattenTranslateIdTextState {
  const result: UnflattenTranslateIdTextState = {};
  for (const key in obj) {
    const keys = key.split('.');
    let current: UnflattenTranslateIdTextState = result;
    for (let i = 0; i < keys.length; i++) {
      if (i === keys.length - 1) {
        current[keys[i]] = obj[key];
      } else {
        current[keys[i]] = current[keys[i]] || {};
        current = current[keys[i]] as UnflattenTranslateIdTextState;
      }
    }
  }
  return result;
}

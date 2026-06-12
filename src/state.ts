// Estado compartido entre paginas (se conserva al navegar entre vistas).

import type { IntegrityReport, ParsedMessage } from './hl7/types';

export interface AppState {
  /** Texto del mensaje en el editor; se conserva al cambiar de pagina. */
  currentMessage: string;
  lastParsed: ParsedMessage | null;
  lastReport: IntegrityReport | null;
}

export const state: AppState = {
  currentMessage: '',
  lastParsed: null,
  lastReport: null,
};

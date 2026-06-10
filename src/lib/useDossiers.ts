import { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot } from './dossiers';

export function useDossiers() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

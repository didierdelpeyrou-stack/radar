import { useMemo } from 'react';
import { useWizard } from './store';
import { construireProfil } from '@/engine/profil';
import { detecter } from '@/engine/engine';
import { DISPOSITIFS } from '@/domain/catalogue';

export function useDetection() {
  const { state } = useWizard();
  return useMemo(() => {
    const profil = construireProfil(state.diagnostic, {
      asOf: '2026-06-10',
      ageDemandeur: state.ageDemandeur || undefined,
    });
    return detecter(DISPOSITIFS, profil);
  }, [state.diagnostic, state.ageDemandeur]);
}

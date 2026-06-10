import { useMemo } from 'react';
import { useWizard } from './store';
import { construireProfil } from '@/engine/profil';
import { detecter } from '@/engine/engine';
import { DISPOSITIFS } from '@/domain/catalogue';
import { aujourdHui } from '@/lib/dates';

export function useDetection() {
  const { state } = useWizard();
  return useMemo(() => {
    const profil = construireProfil(state.diagnostic, {
      asOf: aujourdHui(),
      ageDemandeur: state.ageDemandeur || undefined,
    });
    return detecter(DISPOSITIFS, profil);
  }, [state.diagnostic, state.ageDemandeur]);
}

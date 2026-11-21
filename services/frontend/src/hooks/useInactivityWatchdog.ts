import { useEffect, useRef, useCallback } from 'react';
import { useGalaxyStore } from '../stores/useGalaxyStore';

const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

/**
 * 
 * @description : Hook qui surveille l'inactivité de l'utilisateur en mode GUIDED.
 * 				  Si aucune activité (souris, clavier, toucher) n'est détectée
 * 				  pendant INACTIVITY_TIMEOUT_MS, repasse automatiquement en mode FREE
 * 				  pour économiser les quotas API et libérer la session Gemini.
 * 
 */
export function useInactivityWatchdog()
{
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const resetTimer = useCallback(() =>
	{
		const { explorationMode, toggleExplorationMode } = useGalaxyStore.getState();

		if (timerRef.current)
			clearTimeout(timerRef.current);

		if (explorationMode !== 'GUIDED')
			return;

		timerRef.current = setTimeout(() =>
		{
			const currentMode = useGalaxyStore.getState().explorationMode;
			if (currentMode === 'GUIDED')
			{
				console.log('[WATCHDOG] Inactivity threshold reached (3min), switching to FREE mode...');
				toggleExplorationMode();
			}
		}, INACTIVITY_TIMEOUT_MS);
	}, []);

	useEffect(() =>
	{
		const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

		const handleActivity = () => resetTimer();

		events.forEach((event) =>
			window.addEventListener(event, handleActivity, { passive: true })
		);

		resetTimer();

		return () =>
		{
			events.forEach((event) =>
				window.removeEventListener(event, handleActivity)
			);
			if (timerRef.current)
				clearTimeout(timerRef.current);
		};
	}, [resetTimer]);

	const explorationMode = useGalaxyStore((s) => s.explorationMode);
	useEffect(() =>
	{
		if (explorationMode === 'GUIDED')
			resetTimer();
		else if (timerRef.current)
		{
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, [explorationMode, resetTimer]);
}

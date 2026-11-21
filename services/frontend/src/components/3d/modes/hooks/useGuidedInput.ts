import { useEffect } from 'react';
import { socket } from '../../../../services/galaxySocket';
import { useGalaxyStore } from '../../../../stores/useGalaxyStore';

/**
 * 
 * @description Hook pour gérer les entrées clavier (flèches) en mode guidé.
 * 
 */
export function useGuidedInput()
{
	useEffect(() =>
	{
		const handleKeyDown = (e: KeyboardEvent) =>
		{
			if (e.key === 'ArrowRight')
			{
				console.log('[GuidedMode] Triggering cycleGuidedTarget via socket...');
				socket.emit('cycleGuidedTarget');
			}
			else if (e.key === 'ArrowLeft')
			{
				console.log('[GuidedMode] Returning to Dice (index = -1)');
				useGalaxyStore.getState().setGuidedTargetIndex(-1);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);
}

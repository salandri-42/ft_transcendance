import { useEffect, useRef } from 'react';
import { useGalaxyStore } from '../../../../stores/useGalaxyStore';
import { StarData } from '../../../../types/socket.types';

/**
 * 
 * @description Hook pour synchroniser l'index cible guidee lorsqu'une nouvelle etoile apparait.
 * 
 */
export function useStarGuidedSync(stars: StarData[])
{
	const lastStarCount = useRef(stars.length);

	useEffect(() =>
	{
		if (stars.length > lastStarCount.current)
		{
			const store = useGalaxyStore.getState();
			const lastStar = stars[stars.length - 1];

			if (store.pendingLocalStarId && lastStar.id === store.pendingLocalStarId)
			{
				console.log(`[GuidedSync] Local star detected (${lastStar.id}), redirecting camera.`);
				store.setGuidedTargetIndex(stars.length - 1);
				store.setPendingLocalStarId(null);
			}
			else
				console.log(`[GuidedSync] Remote star added (${lastStar.id}), ignoring camera jump.`);
		}
		lastStarCount.current = stars.length;
	}, [stars.length]);
}

import { useEffect, useRef } from 'react';
import { useGalaxyStore } from '../../../../stores/useGalaxyStore';
import { StarData } from '../../../../types/socket.types';

/**
 * 
 * @description Hook pour gerer les signaux de visite et de depart des etoiles.
 * 
 */
export function useStarSelectionSync(selectedStar: number | null, stars: StarData[])
{
	const prevFocusedStarId = useRef<string | null>(null);
	const guidedTargetIndex = useGalaxyStore((state: any) => state.guidedTargetIndex);
	const explorationMode = useGalaxyStore((state: any) => state.explorationMode);

	useEffect(() =>
	{
		const store = useGalaxyStore.getState();
		let currentFocusedStarId: string | null = null;

		if (explorationMode === 'GUIDED' && guidedTargetIndex !== null && guidedTargetIndex >= 0)
		{
			const star = stars[guidedTargetIndex];
			if (star && star.id)
				currentFocusedStarId = star.id;
		}
		else if (explorationMode !== 'GUIDED' && selectedStar !== null)
		{
			const star = stars[selectedStar];
			if (star && star.id)
				currentFocusedStarId = star.id;
		}

		if (currentFocusedStarId !== prevFocusedStarId.current)
		{
			if (prevFocusedStarId.current)
				store.leaveStar(prevFocusedStarId.current);

			if (currentFocusedStarId)
				store.visitStar(currentFocusedStarId);

			prevFocusedStarId.current = currentFocusedStarId;
		}
	}, [selectedStar, guidedTargetIndex, explorationMode, stars]);
}

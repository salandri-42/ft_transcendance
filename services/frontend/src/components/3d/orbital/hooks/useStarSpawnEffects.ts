import { useEffect } from 'react';
import { useGalaxyStore } from "../../../../stores/useGalaxyStore";
import { getSafeAngleForRing } from '../OrbitalUtils';

/**
 * 
 * @description Hook pour gerer l'apparition des nouvelles etoiles (spawn) via les touches ou les signaux custom.
 * 
 */
export function useStarSpawnEffects()
{
	useEffect(() =>
	{
		const handleSpawnStar = (textureUrl?: string, starId?: string, name?: string, creatorName?: string) =>
		{
			const currentData = useGalaxyStore.getState().orbitalData;

			if (!currentData || currentData.rings.length === 0)
				return;

			const randomRing = currentData.rings[Math.floor(Math.random() * currentData.rings.length)];

			const { angle: safeAngle, phase: safePhase, maxCapacityReached } = getSafeAngleForRing(
				randomRing.radius,
				currentData.stars
			);

			if (maxCapacityReached)
				return;

			useGalaxyStore.getState().setPendingLocalStarId(starId || null);
			useGalaxyStore.getState().spawnStar(
			{
				id: starId,
				name: name,
				creatorName: creatorName,
				orbitRadius: randomRing.radius,
				rotation: randomRing.rotation,
				tilt: randomRing.tilt,
				angle: safeAngle,
				phase: safePhase,
				size: [80, 80],
				color: textureUrl ? 'white' : '#ffffff',
				opacity: 1,
				speed: 5,
				createdAt: Date.now(),
				textureUrl: textureUrl,
			});
		};

		const handleArtworkSpawn = (e: CustomEvent) =>
		{
			if (e.detail && e.detail.textureUrl)
				handleSpawnStar(e.detail.textureUrl, e.detail.starId, e.detail.name, e.detail.creatorName);
		};

		window.addEventListener('spawn_artwork' as any, handleArtworkSpawn as any);

		return () =>
		{
			window.removeEventListener('spawn_artwork' as any, handleArtworkSpawn as any);
		};
	}, []);
}

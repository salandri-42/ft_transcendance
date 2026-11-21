import { useState } from 'react';
import { OrbitalData } from '../../../types/socket.types';
import { Ring } from './Ring';
import { Star } from '../stars/Star';
import { CameraController } from './CameraController';
import { useStarGuidedSync } from './hooks/useStarGuidedSync';
import { useStarSelectionSync } from './hooks/useStarSelectionSync';
import { useStarSpawnEffects } from './hooks/useStarSpawnEffects';

/**
 * 
 * @description Composant principal pour afficher le système orbital.
 * 
 * @param data : Données du système orbital
 * 
 */
export function OrbitalSystem({ data }: { data: OrbitalData })
{
	const [selectedStar, setSelectedStar] = useState<number | null>(null);

	useStarGuidedSync(data.stars);
	useStarSelectionSync(selectedStar, data.stars);
	useStarSpawnEffects();

	return (
		<group>
			<CameraController hasSelection={selectedStar !== null} />

			{data.rings.map((ring, i) => (
				<Ring key={i} data={ring} />
			))}

			{data.stars.map((star, i) => (
				<Star
					key={i}
					data={star}
					index={i}
					selectedIndex={selectedStar}
					onSelect={setSelectedStar}
				/>
			))}
		</group>
	);
}

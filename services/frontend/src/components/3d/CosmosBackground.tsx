import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Dice } from './Dice';
import { OrbitalSystem } from './orbital/OrbitalSystem';
import { OrbitalData } from '../../types/socket.types';
import { FreeExplorationMode } from './modes/FreeExplorationMode';
import { GuidedExplorationMode } from './modes/GuidedExplorationMode';

interface CosmosBackgroundProps
{
	token: string | null;
	orbitalData: OrbitalData | null;
	isSocketConnected: boolean;
	showCanvas: boolean;
	explorationMode: 'GUIDED' | 'FREE' | 'CREATIVE';
}

/**
 * 
 * @description : Composant orchestrateur principal pour afficher le background dynamique.
 *                Délègue la logique de la caméra aux sous-composants selon le mode sélectionné.
 * 
 */
export function CosmosBackground({ token, orbitalData, isSocketConnected, explorationMode }: CosmosBackgroundProps)
{
	return (
		<div style={{
			position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
			pointerEvents: token ? 'auto' : 'none',
			zIndex: 1
		}}>
			<Canvas camera={{ position: [0, 0, 3500], fov: 50, far: 200000 }}>
				<ambientLight intensity={0.5}/>
				<spotLight position={[100, 100, 100]} angle={0.5} penumbra={100}/>
				<pointLight position={[-100, -100, -100]}/>
				
				<Dice />
				{orbitalData && <OrbitalSystem data={orbitalData} />}

				{/** MODE FREE && GUIDED **/}
				{
					token && (
						explorationMode === 'FREE' 
							? <FreeExplorationMode isSocketConnected={isSocketConnected} />
							: <GuidedExplorationMode />
					)
				}
			</Canvas>
		</div>
	);
}

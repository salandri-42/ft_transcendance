import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalaxyStore } from '../../stores/useGalaxyStore';
import { audioPlaybackService } from '../../services/audioPlayback';
import { DiceBase } from './dice/DiceBase';
import { DiceParticles } from './dice/DiceParticles';
import { DiceAura } from './dice/DiceAura';
import { DiceTransitionParticles } from './dice/DiceTransitionParticles';

import { audioCaptureService } from '../../services/audioCapture';

/**
 * @description : Composant pour orchestrer l'affichage du dE (Matière, Particules, Aura)
 * @methods : 
 * 	- meshRef : rotation globale de l'élément
 * 	- pointsRef : liaison dynamique du temps pour les shaders
 */
export function Dice()
{
	const meshRef = useRef<THREE.Group>(null);
	const pointsRef = useRef<THREE.Points>(null);
	const strokeRef = useRef<THREE.LineSegments>(null);

	const transitionRef = useRef(0.0);

	const handleClick = (e: any) =>
	{
		e.stopPropagation();
		const store = useGalaxyStore.getState();
		store.setGuidedTargetIndex(-1);

		if (store.explorationMode === 'FREE')
		{
			console.log('[Dice] Switching to GUIDED...');
			store.toggleExplorationMode();
		}
	};

	const handleDoubleClick = (e: any) =>
	{
		e.stopPropagation();
		const store = useGalaxyStore.getState();

		if (store.explorationMode === 'GUIDED')
			store.enterCreativeMode();
	};

	const pointUniforms = useMemo(() => ({
		uTime: { value: 0 },
		uColor: { value: new THREE.Color('#ffffff') },
		uVolume: { value: 0 },
		uTransition: { value: 0 }
	}), []);

	useFrame((state, delta) =>
	{
		if (meshRef.current)
		{
			meshRef.current.rotation.y += delta * 0.1;
			meshRef.current.rotation.x += delta * 0.05;
		}

		const store = useGalaxyStore.getState();
		const targetTransition = store.explorationMode === 'CREATIVE' ? 1.0 : 0.0;
		if (transitionRef.current !== targetTransition)
		{
			const speed = targetTransition === 1.0 ? 1.1 : 3.0;
			transitionRef.current = THREE.MathUtils.lerp(transitionRef.current, targetTransition, delta * speed);
			
			if (Math.abs(transitionRef.current - targetTransition) < 0.005)
				transitionRef.current = targetTransition;
		}

		if (pointsRef.current)
		{
			const mat = pointsRef.current.material as THREE.ShaderMaterial;
			if (mat && mat.uniforms) 
			{
				mat.uniforms.uTime.value = state.clock.elapsedTime;
				mat.uniforms.uTransition.value = transitionRef.current;
				
				const vol = audioPlaybackService.getVolume() / 255.0;

				mat.uniforms.uVolume.value = vol; 
			}
		}
	});

	return (
		<group ref={meshRef} position={[0, 0, 0]} onClick={handleClick} onDoubleClick={handleDoubleClick}>

			{/* Étape 1 : Corps et arêtes (Fondu à la disparition) */}
			<DiceBase strokeRef={strokeRef} transitionRef={transitionRef} />

			{/* Particules de Transition (Apparaissent pendant le mode Créatif) */}
			<DiceTransitionParticles transitionRef={transitionRef} />

			{/* Étape 2 : Vague de particules */}
			<DiceParticles pointsRef={pointsRef} pointUniforms={pointUniforms} />

			{/* Étape 3 : Halo volumétrique */}
			<DiceAura />

		</group>
	);
}

import { useRef } from 'react';
import { useThree, useFrame, RootState } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalaxyStore } from '../../../../stores/useGalaxyStore';
import { getStarWorldPosition, getIdealCameraPosition } from '../utils/CameraCalculations';

/**
 * 
 * @description Hook pour gérer l'animation de la caméra en mode guidé (transitions, parallaxe, suivi).
 * 
 */
export function useGuidedCamera()
{
	const { camera } = useThree();
	const guidedTargetIndex = useGalaxyStore((state: any) => state.guidedTargetIndex);
	const orbitalData = useGalaxyStore((state: any) => state.orbitalData);

	const targetWorldPos = useRef(new THREE.Vector3());
	const idealCameraPos = useRef(new THREE.Vector3());
	const prevTargetIndex = useRef<number|null>(null);
	const transitionOffset = useRef(new THREE.Vector3());
	const lookAtOffset = useRef(new THREE.Vector3());
	const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
	const mouseOffset = useRef(new THREE.Vector3());

	useFrame((state: RootState) =>
	{
		const targetId = guidedTargetIndex === null || guidedTargetIndex === -1 ? null : guidedTargetIndex;
		
		if (targetId === null)
		{
			targetWorldPos.current.set(0, 0, 0);
			idealCameraPos.current.set(200, 300, 1500);
		}
		else
		{
			const star = orbitalData?.stars?.[targetId];
			if (!star) return;

			targetWorldPos.current.copy(getStarWorldPosition(star, state.clock.elapsedTime));
			idealCameraPos.current.copy(getIdealCameraPosition(targetWorldPos.current, star.idealCameraDistance || 300, state.clock.elapsedTime));
		}

		if (guidedTargetIndex !== prevTargetIndex.current)
		{
			prevTargetIndex.current = guidedTargetIndex;
			transitionOffset.current.copy(camera.position).sub(idealCameraPos.current);
			lookAtOffset.current.copy(currentLookAt.current).sub(targetWorldPos.current);
		}
		transitionOffset.current.multiplyScalar(0.9);
		lookAtOffset.current.multiplyScalar(0.9);

		const distToTarget = camera.position.distanceTo(currentLookAt.current);
		const parallaxScale = distToTarget * 0.12; 
		const targetMouseOffset = new THREE.Vector3(-state.pointer.x * parallaxScale, -state.pointer.y * parallaxScale, 0);
		
		mouseOffset.current.lerp(targetMouseOffset, 0.05);
		camera.position.copy(idealCameraPos.current).add(transitionOffset.current).add(mouseOffset.current);
		currentLookAt.current.copy(targetWorldPos.current).add(lookAtOffset.current);
		camera.lookAt(currentLookAt.current);
	});
}

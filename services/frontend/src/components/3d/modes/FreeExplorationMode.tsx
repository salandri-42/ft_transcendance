import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface FreeExplorationModeProps
{
	isSocketConnected: boolean;
}

/**
 * 
 * @description Mode d'exploration libre.
 * 
 */
export function FreeExplorationMode({ isSocketConnected }: FreeExplorationModeProps)
{
	const controlsRef = useRef<OrbitControlsImpl>(null);
	const mouseOffset = useRef(new THREE.Vector2());
	const impulse = useRef(1.0);

	useEffect(() =>
	{
		if (controlsRef.current)
			controlsRef.current.target.set(0, 0, 0);

		return () =>
		{
			if (controlsRef.current?.object instanceof THREE.PerspectiveCamera)
				controlsRef.current.object.clearViewOffset();
		};
	}, []);

	useFrame((state, delta) =>
	{
		const { camera, pointer, size } = state;

		if (camera instanceof THREE.PerspectiveCamera)
		{
			if (impulse.current > 0.001)
			{
				impulse.current = THREE.MathUtils.lerp(impulse.current, 0, delta * 3.5);

				const fovStretch = impulse.current * 35;
				const recoilStrength = impulse.current * 500; 
				const direction = new THREE.Vector3();
				
				camera.fov = 50 + fovStretch;
				camera.getWorldDirection(direction);
				camera.position.addScaledVector(direction, -recoilStrength * delta * 10);
				camera.updateProjectionMatrix();
				
				if (controlsRef.current)
					controlsRef.current.update();
			}

			// ─── Effet de parallaxe souris ───
			mouseOffset.current.x = THREE.MathUtils.lerp(mouseOffset.current.x, pointer.x, 0.05);
			mouseOffset.current.y = THREE.MathUtils.lerp(mouseOffset.current.y, pointer.y, 0.05);

			const sensitivity = 80;

			camera.setViewOffset(
				size.width,
				size.height,
				mouseOffset.current.x * sensitivity,
				-mouseOffset.current.y * sensitivity,
				size.width,
				size.height
			);
		}
	});

	return (
		<OrbitControls
			ref={controlsRef}
			makeDefault
			autoRotate={!isSocketConnected}
			autoRotateSpeed={0.5}
			enablePan={true}
			enableZoom={true}
			enableRotate={true}
			minDistance={1300}
			maxDistance={17000}
		/>
	);
}

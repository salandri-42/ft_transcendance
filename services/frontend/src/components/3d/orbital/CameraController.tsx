import { useRef } from 'react';
import { useFrame, RootState } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps
{
	hasSelection: boolean;
}

/**
 * 
 * @description Composant pour gérer le comportement de la caméra.
 * 
 */
export function CameraController({ hasSelection }: CameraControllerProps)
{
	const savedPos = useRef<THREE.Vector3 | null>(null);
	const zoomTarget = useRef(new THREE.Vector3());

	useFrame((state: RootState) =>
	{
		const { camera, controls } = state;
		const ctrl = controls as any;

		if (hasSelection)
		{
			if (!savedPos.current)
			{
				savedPos.current = camera.position.clone();
				zoomTarget.current.copy(camera.position).normalize().multiplyScalar(400);
			}

			if (ctrl)
			{
				ctrl.enabled = false;
				ctrl.autoRotate = false;
			}

			camera.position.lerp(zoomTarget.current, 0.04);
			camera.lookAt(0, 0, 0);
		}
		else if (savedPos.current)
		{
			if (ctrl) ctrl.enabled = false;

			camera.position.lerp(savedPos.current, 0.04);
			camera.lookAt(0, 0, 0);

			if (camera.position.distanceTo(savedPos.current) < 10)
			{
				savedPos.current = null;
				if (ctrl)
				{
					ctrl.enabled = true;
					ctrl.autoRotate = true;
					ctrl.update();
				}
			}
		}
	});

	return null;
}

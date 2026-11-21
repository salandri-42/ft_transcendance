import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioPlaybackService } from '../../../services/audioPlayback';

const DICE_AURA_VERTEX = `
	varying vec3 vNormal;
	varying vec3 vViewPosition;
	void main()
	{
		vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
		vNormal = normalize(normalMatrix * normal);
		vViewPosition = normalize(-mvPosition.xyz);
		gl_Position = projectionMatrix * mvPosition;
	}
`;

const DICE_AURA_FRAGMENT = `
	uniform vec3 uColor;
	varying vec3 vNormal;
	varying vec3 vViewPosition;
	void main()
	{
		float angle = abs(dot(vNormal, vViewPosition));
		float intensity = smoothstep(0.0, 0.85, angle);
		intensity *= 0.8;
		gl_FragColor = vec4(uColor, intensity);
	}
`;

export function DiceAura()
{
	const auraRef = useRef<THREE.Mesh>(null);

	useFrame(() =>
	{
		if (auraRef.current)
		{
			const vol = audioPlaybackService.getVolume() / 255.0;
			const scale = 1.09 + vol * 0.12;
			
			auraRef.current.scale.setScalar(scale);
		}
	});
	return (
		<mesh ref={auraRef} scale={1.09}>
			<icosahedronGeometry args={[500, 2]} />
			<shaderMaterial 
				transparent={true}
				depthWrite={false}
				blending={THREE.NormalBlending}
				side={THREE.BackSide}
				uniforms={{
					uColor: { value: new THREE.Color('#ffffff') }
				}}
				vertexShader={DICE_AURA_VERTEX}
				fragmentShader={DICE_AURA_FRAGMENT}
			/>
		</mesh>
	);
}

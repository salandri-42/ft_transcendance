import { useMemo } from 'react';
import * as THREE from 'three';
import { BORDER_EXPANSION } from '../orbital/OrbitalConstants';

const STAR_AURA_VERTEX = `
	varying vec2 vUv;
	void main()
	{
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const STAR_AURA_FRAGMENT = `
	varying vec2 vUv;
	uniform vec3 uColor;
	uniform vec2 uSize;
	uniform float uBorderSize;

	void main()
	{
		vec2 pixelPos = vUv * uSize; 
		
		float minDist = min(
			min(pixelPos.x, uSize.x - pixelPos.x), 
			min(pixelPos.y, uSize.y - pixelPos.y)
		);

		if (minDist > uBorderSize)
			discard;

		float glow = smoothstep(0.0, uBorderSize, minDist) * 0.5;
		float line = smoothstep(uBorderSize - 4.0, uBorderSize, minDist);
		float alpha = line + glow;

		alpha = clamp(alpha, 0.0, 0.95);
		gl_FragColor = vec4(uColor, alpha);
	}
`;

interface StarAuraProps
{
	size: [number, number];
	color: string;
}

/**
 * 
 * @description Composant de lueur externe (Aura) pour les tableaux 2D.
 * 
 * @param size : Taille de l'aura
 * @param color : Couleur de l'aura
 * 
 */
export function StarAura({ size, color }: StarAuraProps)
{
	const auraSize: [number, number] = [size[0] + BORDER_EXPANSION * 2, size[1] + BORDER_EXPANSION * 2];

	const material = useMemo(() =>
	{
		return new THREE.ShaderMaterial(
		{
			uniforms:
			{
				uColor: { value: new THREE.Color(color) },
				uSize: { value: new THREE.Vector2(auraSize[0], auraSize[1]) },
				uBorderSize: { value: BORDER_EXPANSION }
			},
			vertexShader: STAR_AURA_VERTEX,
			fragmentShader: STAR_AURA_FRAGMENT,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			side: THREE.DoubleSide
		});
	}, [color, auraSize[0], auraSize[1]]);

	return (
		<mesh position={[0, 0, -1.0]}>
			<planeGeometry args={auraSize} />
			<primitive object={material} attach="material" />
		</mesh>
	);
}

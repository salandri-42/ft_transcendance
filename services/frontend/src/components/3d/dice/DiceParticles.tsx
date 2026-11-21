import React, { useMemo } from 'react';
import * as THREE from 'three';

const DICE_PARTICLE_VERTEX = `
	uniform float uTime;
	uniform float uVolume;
	attribute vec3 aNormal;
	attribute float aLayer;
	varying float vOpacity;
	varying float vVolume;

	float random(vec3 pos)
	{
		return fract(sin(dot(pos.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453123);
	}

	void main()
	{
		vVolume = uVolume;
		
		// Hauteur selon l'intensite de la voix
		float layerIndex = aLayer;
		float dynamicHeight = 1.5 + (layerIndex + 1.0) * 45.0 * uVolume; 
		
		vec3 animatedPos = position + aNormal * dynamicHeight;

		vec4 mvPosition = modelViewMatrix * vec4(animatedPos, 1.0);
		gl_Position = projectionMatrix * mvPosition;

		// Vague de fond
		float wave = sin(animatedPos.y * 0.006 + uTime * 0.5) * 0.5 + 0.5; 

		// Scintillement individuel
		float rnd = random(position); 
		float flicker = sin(uTime * (8.0 + rnd * 6.0) + rnd * 6.28) * 0.5 + 0.5;

		vOpacity = 0.4 + (0.2 * flicker) + (0.4 * wave * flicker);

		float perspectiveSize = 6.0 * (500.0 / -mvPosition.z);
		gl_PointSize = perspectiveSize * (0.7 + 0.5 * wave) + 1.0;
	}
`;

const DICE_PARTICLE_FRAGMENT = `
	varying float vOpacity;
	varying float vVolume;
	uniform vec3 uColor;
	uniform float uTime;
	uniform float uTransition;
	
	void main()
	{
		vec2 pc = gl_PointCoord - vec2(0.5);
		float dist = length(pc);
		if (dist > 0.5) discard;

		// Intensité electrique
		float energyPulse = pow(vVolume, 1.5);
		
		// Color Pulse
		vec3 finalColor = mix(uColor, vec3(1.0, 1.0, 1.0), energyPulse * 0.9);

		// Halo
		float softness = 0.2 + energyPulse * 0.2;
		
		// Réactivation rapide
		float fadeOut = 1.0 - smoothstep(0.8, 1.0, uTransition);
		
		float alpha = smoothstep(0.5, softness, dist) * (vOpacity + energyPulse * 0.8) * fadeOut;

		gl_FragColor = vec4(finalColor, alpha);
	}
`;

const DICE_TRAIL_VERTEX = `
	uniform float uTime;
	uniform float uVolume;
	attribute vec3 aNormal;
	attribute float aLayer;
	attribute float aTrailTip;
	
	varying float vTrailTip;
	varying float vVolume;

	void main()
	{
		vVolume = uVolume;
		vTrailTip = aTrailTip;

		float layerIndex = aLayer;
		
		float height = 1.5; 
		
		// pointe traînée
		if (aTrailTip > 0.5) 
		{
			height += (layerIndex + 1.0) * 45.0 * uVolume; 
		}
		
		vec3 animatedPos = position + aNormal * height;

		vec4 mvPosition = modelViewMatrix * vec4(animatedPos, 1.0);
		gl_Position = projectionMatrix * mvPosition;
	}
`;

const DICE_TRAIL_FRAGMENT = `
	varying float vTrailTip;
	varying float vVolume;
	uniform vec3 uColor;
	uniform float uTransition;

	void main()
	{
		if (vVolume < 0.05)
			discard;

		float energyPulse = pow(vVolume, 1.5);
		
		// Dégradé
		float lineFade = smoothstep(0.0, 1.0, vTrailTip);
		
		// Mélange de couleur
		vec3 finalColor = mix(uColor, vec3(1.0, 1.0, 1.0), lineFade * energyPulse * 0.9);

		// Fondu disparition / réapparition rapide
		float fadeOut = 1.0 - smoothstep(0.8, 1.0, uTransition);

		// Opacité
		float alpha = lineFade * energyPulse * 0.8 * fadeOut; 

		gl_FragColor = vec4(finalColor, alpha);
	}
`;

interface DiceParticlesProps
{
	pointsRef: React.RefObject<THREE.Points>;
	pointUniforms: { [uniform: string]: THREE.IValue<any> };
}

export function DiceParticles({ pointsRef, pointUniforms }: DiceParticlesProps)
{
	const particleData = useMemo(() =>
	{
		const countPerLayer = 1000;
		const totalCount = countPerLayer * 4;
		
		const positions = new Float32Array(totalCount * 3);
		const normals = new Float32Array(totalCount * 3);
		const layerIndices = new Float32Array(totalCount);
		
		const trailPositions = new Float32Array(totalCount * 6);
		const trailNormals = new Float32Array(totalCount * 6);
		const trailLayers = new Float32Array(totalCount * 2);
		const trailTips = new Float32Array(totalCount * 2);

		const geo = new THREE.IcosahedronGeometry(500, 2);
		const posAttr = geo.attributes.position;
		
		let idx = 0;
		let idxLayer = 0;
		let lIdx = 0;
		let lIdxLayer = 0;
		
		for (let l = 0; l < 4; l++)
		{
			for (let i = 0; i < countPerLayer; i++)
			{
				const faceIndex = Math.floor(Math.random() * (posAttr.count / 3));
				const vA = new THREE.Vector3().fromBufferAttribute(posAttr, faceIndex * 3);
				const vB = new THREE.Vector3().fromBufferAttribute(posAttr, faceIndex * 3 + 1);
				const vC = new THREE.Vector3().fromBufferAttribute(posAttr, faceIndex * 3 + 2);

				const r1 = Math.random();
				const r2 = Math.random();
				const sqrtR1 = Math.sqrt(r1);
				
				const x = (1 - sqrtR1) * vA.x + (sqrtR1 * (1 - r2)) * vB.x + (sqrtR1 * r2) * vC.x;
				const y = (1 - sqrtR1) * vA.y + (sqrtR1 * (1 - r2)) * vB.y + (sqrtR1 * r2) * vC.y;
				const z = (1 - sqrtR1) * vA.z + (sqrtR1 * (1 - r2)) * vB.z + (sqrtR1 * r2) * vC.z;

				const normal = new THREE.Vector3().crossVectors(
					new THREE.Vector3().subVectors(vB, vA),
					new THREE.Vector3().subVectors(vC, vA)
				).normalize();

				positions[idx] = x;
				positions[idx + 1] = y;
				positions[idx + 2] = z;
				
				normals[idx] = normal.x;
				normals[idx + 1] = normal.y;
				normals[idx + 2] = normal.z;

				layerIndices[idxLayer++] = l;

				trailPositions[lIdx]     = x;
				trailPositions[lIdx + 1] = y;
				trailPositions[lIdx + 2] = z;
				trailNormals[lIdx]       = normal.x;
				trailNormals[lIdx + 1]   = normal.y;
				trailNormals[lIdx + 2]   = normal.z;
				trailLayers[lIdxLayer]   = l;
				trailTips[lIdxLayer++]   = 0.0;

				trailPositions[lIdx + 3] = x;
				trailPositions[lIdx + 4] = y;
				trailPositions[lIdx + 5] = z;
				trailNormals[lIdx + 3]   = normal.x;
				trailNormals[lIdx + 4]   = normal.y;
				trailNormals[lIdx + 5]   = normal.z;
				trailLayers[lIdxLayer]   = l;
				trailTips[lIdxLayer++]   = 1.0;

				idx += 3;
				lIdx += 6;
			}
		}
		return { 
			positions, normals, layerIndices,
			trailPositions, trailNormals, trailLayers, trailTips
		};
	}, []);

	return (
		<group>
			{/* Particules Lumineuses */}
			<points ref={pointsRef}>
				<bufferGeometry>
					<bufferAttribute
						attach="attributes-position"
						count={particleData.positions.length / 3}
						array={particleData.positions}
						itemSize={3}
					/>
					<bufferAttribute
						attach="attributes-aNormal"
						count={particleData.normals.length / 3}
						array={particleData.normals}
						itemSize={3}
					/>
					<bufferAttribute
						attach="attributes-aLayer"
						count={particleData.layerIndices.length}
						array={particleData.layerIndices}
						itemSize={1}
					/>
				</bufferGeometry>
				<shaderMaterial
					transparent={true}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
					uniforms={pointUniforms}
					vertexShader={DICE_PARTICLE_VERTEX}
					fragmentShader={DICE_PARTICLE_FRAGMENT}
				/>
			</points>

			{/* Traînées Lumineuses */}
			<lineSegments>
				<bufferGeometry>
					<bufferAttribute
						attach="attributes-position"
						count={particleData.trailPositions.length / 3}
						array={particleData.trailPositions}
						itemSize={3}
					/>
					<bufferAttribute
						attach="attributes-aNormal"
						count={particleData.trailNormals.length / 3}
						array={particleData.trailNormals}
						itemSize={3}
					/>
					<bufferAttribute
						attach="attributes-aLayer"
						count={particleData.trailLayers.length}
						array={particleData.trailLayers}
						itemSize={1}
					/>
					<bufferAttribute
						attach="attributes-aTrailTip"
						count={particleData.trailTips.length}
						array={particleData.trailTips}
						itemSize={1}
					/>
				</bufferGeometry>
				<shaderMaterial
					transparent={true}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
					uniforms={pointUniforms}
					vertexShader={DICE_TRAIL_VERTEX}
					fragmentShader={DICE_TRAIL_FRAGMENT}
				/>
			</lineSegments>
		</group>
	);
}

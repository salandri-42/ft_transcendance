import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioPlaybackService } from '../../../services/audioPlayback';
interface DiceTransitionParticlesProps
{
	transitionRef: React.MutableRefObject<number>;
}

const DICE_TRANSITION_VERTEX_SHADER = `
	attribute vec3 aRandom;
	varying vec3 vRandom;
	varying vec2 vScreenPos;
	varying float vVolume;
	uniform float uTime;
	uniform float uTransition;
	uniform float uVolume;
	uniform vec3 uLocalCameraPosition;

	void main()
	{
		vRandom = aRandom;
		vVolume = uVolume;
		vec3 forward = normalize(uLocalCameraPosition); 
		
		vec3 up = abs(forward.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
		vec3 right = normalize(cross(up, forward));
		up = cross(forward, right);

		float targetDepth = mix(-1000.0, 4000.0, aRandom.x);
		vec3 radialDir = normalize(position - dot(position, forward) * forward);
		float targetRadius = mix(400.0, 2500.0, aRandom.y);
		vec3 targetPos = uLocalCameraPosition - forward * targetDepth + radialDir * targetRadius;
		
		// Bruit de dérive - Accélération
		targetPos += right * sin(uTime * 0.6 + aRandom.x * 10.0) * 5.0;
		targetPos += up * cos(uTime * 0.6 + aRandom.y * 10.0) * 5.0;
		targetPos += forward * sin(uTime * 0.3 + aRandom.z * 10.0) * 2.0;

		// Vibration - voix IA
		targetPos += (radialDir * uVolume * 150.0);

		float t = uTransition;
		vec3 finalPos = mix(position, targetPos, t);
		vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);

		gl_Position = projectionMatrix * mvPosition;
		vScreenPos = gl_Position.xy / gl_Position.w;

		float flash = smoothstep(0.0, 0.15, uTransition) * (1.0 - smoothstep(0.15, 0.4, uTransition));
		float voiceBump = uVolume * 50.0 * uTransition;
		float sizeFactor = (8.0 + uTransition * 120.0) + (flash * 40.0) + voiceBump; 

		gl_PointSize = sizeFactor * (500.0 / max(-mvPosition.z, 20.0));
		gl_PointSize = clamp(gl_PointSize, 1.0, 40.0);
	}
`;

const DICE_TRANSITION_FRAGMENT_SHADER = `
	varying vec3 vRandom;
	varying vec2 vScreenPos;
	varying float vVolume;
	uniform float uTime;
	uniform float uTransition;

	void main()
	{
		float angle = vRandom.x * 6.28 + uTime * 1.5 * (vRandom.y - 0.5);
		float s = sin(angle);
		float c = cos(angle);
		vec2 coords = gl_PointCoord - 0.5;
		coords = vec2(coords.x * c - coords.y * s, coords.x * s + coords.y * c);

		float dist = abs(coords.x) + abs(coords.y);
		float shape = smoothstep(0.45, 0.4, dist);
		
		if (shape < 0.01)
			discard;

		float brillance = 1.0 - length(coords + vec2(0.1, 0.1));
		brillance = pow(brillance, 3.0) * 0.5;

		// Effet Flash
		float flash = smoothstep(0.0, 0.15, uTransition) * (1.0 - smoothstep(0.15, 0.4, uTransition));

		// Couleurs
		vec3 colorStart = vec3(0.02, 0.02, 0.02);
		vec3 colorEnd = mix(vec3(0.03, 0.03, 0.05), vec3(0.06, 0.02, 0.08), vRandom.z);
		
		vec3 finalColor = mix(colorStart, colorEnd, uTransition);
		finalColor *= (0.5 + brillance);
		finalColor += vec3(0.8, 0.9, 1.0) * (flash * 3.0);

		// Scintillement
		float shimmer = sin(uTime * 1.5 + vRandom.x * 20.0) * 0.5 + 0.5;
		shimmer = pow(shimmer, 12.0) * uTransition; 
		finalColor += vec3(0.6, 0.6, 0.7) * shimmer * 0.8;

		// Réaction voix IA
		float energyPulse = pow(vVolume, 1.5) * uTransition;
		finalColor = mix(finalColor, vec3(0.8, 1.0, 1.0), energyPulse * 0.85);

		// Vignettage spatial
		float distFromCenter = length(vScreenPos);
		float vignette = smoothstep(0.1, 0.8, distFromCenter);
		float vignetteAlpha = mix(0.1, 1.0, vignette);

		float voiceAlpha = energyPulse * 0.5;
		float alpha = smoothstep(0.0, 0.05, uTransition) * shape * (vignetteAlpha + flash * 0.5 + voiceAlpha);
		alpha = clamp(alpha, 0.0, 1.0);
		
		gl_FragColor = vec4(finalColor, alpha); 
	}
`;

const _vCam = new THREE.Vector3();

export function DiceTransitionParticles({ transitionRef }: DiceTransitionParticlesProps)
{
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const pointsRef = useRef<THREE.Points>(null);

	const uniforms = useMemo(() => ({
		uTime: { value: 0 },
		uTransition: { value: 0 },
		uVolume: { value: 0 },
		uLocalCameraPosition: { value: new THREE.Vector3(0, 0, 3500) }
	}), []);

	const geometry = useMemo(() =>
	{
		const count = 100000;
		const positions = new Float32Array(count * 3);
		const randoms = new Float32Array(count * 3);
		
		const tempGeo = new THREE.IcosahedronGeometry(500, 2);
		const posAttr = tempGeo.attributes.position;
		const vertexCount = posAttr.count;

		const vA = new THREE.Vector3();
		const vB = new THREE.Vector3();
		const vC = new THREE.Vector3();

		for (let i = 0; i < count; i++)
		{
			const faceIdx = Math.floor(Math.random() * (vertexCount / 3)) * 3;

			vA.fromBufferAttribute(posAttr, faceIdx);
			vB.fromBufferAttribute(posAttr, faceIdx + 1);
			vC.fromBufferAttribute(posAttr, faceIdx + 2);

			const r1 = Math.sqrt(Math.random());
			const r2 = Math.random();

			positions[i * 3] = (1 - r1) * vA.x + (r1 * (1 - r2)) * vB.x + (r1 * r2) * vC.x;
			positions[i * 3 + 1] = (1 - r1) * vA.y + (r1 * (1 - r2)) * vB.y + (r1 * r2) * vC.y;
			positions[i * 3 + 2] = (1 - r1) * vA.z + (r1 * (1 - r2)) * vB.z + (r1 * r2) * vC.z;

			randoms[i * 3] = Math.random();
			randoms[i * 3 + 1] = Math.random();
			randoms[i * 3 + 2] = Math.random();
		}
		tempGeo.dispose();

		const geo = new THREE.BufferGeometry();
		geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));
		return geo;
	}, []);

	useFrame((state) =>
	{
		uniforms.uTime.value = state.clock.elapsedTime;
		uniforms.uTransition.value = transitionRef.current;
		uniforms.uVolume.value = audioPlaybackService.getVolume() / 255.0;
			
		if (pointsRef.current)
		{
			_vCam.copy(state.camera.position);
			pointsRef.current.worldToLocal(_vCam);
			uniforms.uLocalCameraPosition.value.copy(_vCam);
		}
	});

	return (
		<points ref={pointsRef} geometry={geometry} frustumCulled={false} renderOrder={999}>
			<shaderMaterial
				ref={materialRef}
				transparent={true}
				depthWrite={false}
				depthTest={false}
				blending={THREE.NormalBlending}
				uniforms={uniforms}
				vertexShader={DICE_TRANSITION_VERTEX_SHADER}
				fragmentShader={DICE_TRANSITION_FRAGMENT_SHADER}
			/>
		</points>
	);
}

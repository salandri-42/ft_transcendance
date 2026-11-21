import { useRef, useMemo } from 'react';
import { useFrame, RootState } from '@react-three/fiber';
import * as THREE from 'three';
import { RingData } from '../../../types/socket.types';
import { getOrbitColor } from './OrbitalUtils';
import { RING_PARTICLES_COUNT, DISK_WIDTH, DISK_THICKNESS } from './OrbitalConstants';

const RING_VERTEX_SHADER = `
	attribute vec3 aSeed;
	attribute vec3 aColor;
	varying float vSeed;
	varying vec3 vColor;
	uniform float uTime;
	uniform float uLOD;

	void main()
	{
		vSeed = aSeed.z;
		vColor = aColor;
		
		float rotationSpeed = uTime * 0.1 * (vSeed + 0.5);
		float cosA = cos(rotationSpeed);
		float sinA = sin(rotationSpeed);
		mat2 rotMat = mat2(cosA, -sinA, sinA, cosA);
		vec2 rotatedPos = rotMat * position.xy;
		float breathing = 1.0 + sin(uTime * 0.3 + vSeed * 10.0) * 0.05;
		vec3 pos = vec3(rotatedPos * breathing, position.z + sin(uTime * 0.5 + vSeed * 15.0) * 12.0);
		vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

		gl_PointSize = (15.0 + vSeed * 50.0) * (600.0 / -mvPosition.z) * uLOD;
		gl_Position = projectionMatrix * mvPosition;
	}
`;

const RING_FRAGMENT_SHADER = `
	varying float vSeed;
	varying vec3 vColor;
	uniform float uTime;
	uniform float uOpacity;
	uniform float uLOD;

	void main()
	{
		vec2 uv = gl_PointCoord - 0.5;
		float dist = length(uv);

		if (dist > 0.5)
			discard;

		float edge = mix(0.05, 0.45, uLOD); 
		float alpha = smoothstep(0.5, 0.5 - edge, dist);
		alpha = pow(alpha, 1.5);

		float twinkle = 0.8 + 0.2 * sin(uTime * 1.5 + vSeed * 80.0);
		float lodOpacity = mix(0.1, 1.2, uLOD);
		
		gl_FragColor = vec4(vColor, alpha * uOpacity * 1.1 * twinkle * lodOpacity);
	}
`;

interface RingProps
{
	data: RingData;
}

/**
 * 
 * @description Hook pour générer les données des particules de l'anneau.
 * 
 */
const useRingParticles = (radius: number) =>
{
	return useMemo(() =>
	{
		const pos = new Float32Array(RING_PARTICLES_COUNT * 3);
		const sd = new Float32Array(RING_PARTICLES_COUNT * 3);
		const col = new Float32Array(RING_PARTICLES_COUNT * 3);

		const baseColor = getOrbitColor(radius);
		const altColor = new THREE.Color(baseColor).offsetHSL(0.05, 0, -0.1);
		const tempCol = new THREE.Color();

		for (let i = 0; i < RING_PARTICLES_COUNT; i++)
		{
			const angle = Math.random() * Math.PI * 2;
			const r = radius + (Math.random() - 0.5) * DISK_WIDTH;

			pos[i * 3] = Math.cos(angle) * r;
			pos[i * 3 + 1] = Math.sin(angle) * r;
			pos[i * 3 + 2] = (Math.random() - 0.5) * DISK_THICKNESS;

			tempCol.lerpColors(baseColor, altColor, Math.random());
			col[i * 3] = tempCol.r;
			col[i * 3 + 1] = tempCol.g;
			col[i * 3 + 2] = tempCol.b;

			sd[i * 3] = Math.random();
			sd[i * 3 + 1] = Math.random();
			sd[i * 3 + 2] = Math.random();
		}
		return { positions: pos, seeds: sd, colors: col };
	}, [radius]);
};

/**
 * 
 * @description Composant pour afficher un anneau avec effet nébuleuse.
 * 
 * @param data : Données de l'anneau
 * 
 */
export function Ring({ data }: RingProps)
{
	const pointsRef = useRef<THREE.Points>(null);
	const color = data.color ?? "#00ffff";
	const { positions, seeds, colors } = useRingParticles(data.radius);

	const uniforms = useMemo(() => (
	{
		uColor: { value: new THREE.Color(color) },
		uTime: { value: 0 },
		uLOD: { value: 1.0 },
		uOpacity: { value: data.opacity ?? 0.3 }
	}), [color, data.opacity]);

	const material = useMemo(() => new THREE.ShaderMaterial(
	{
		uniforms,
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		vertexShader: RING_VERTEX_SHADER,
		fragmentShader: RING_FRAGMENT_SHADER
	}), [uniforms]);

	useFrame((state: RootState) =>
	{
		if (pointsRef.current)
		{
			uniforms.uTime.value = state.clock.elapsedTime;
			const camDist = state.camera.position.length();
			const minLOD = 0.3;
			const rawLOD = THREE.MathUtils.smoothstep(camDist, 100, 15000);
			uniforms.uLOD.value = minLOD + (1.0 - minLOD) * Math.pow(rawLOD, 1.5);
		}
	});

	return (
		<group rotation={data.rotation}>
			<group rotation={data.tilt}>
				<mesh>
					<torusGeometry args={[data.radius, 0.4, 8, 200]} />
					<meshBasicMaterial color={color} transparent opacity={(data.opacity ?? 0.3) * 0.25} depthWrite={false} />
				</mesh>
				<points ref={pointsRef}>
					<bufferGeometry>
						<bufferAttribute attach="attributes-position" count={RING_PARTICLES_COUNT} array={positions} itemSize={3} />
						<bufferAttribute attach="attributes-aSeed" count={RING_PARTICLES_COUNT} array={seeds} itemSize={3} />
						<bufferAttribute attach="attributes-aColor" count={RING_PARTICLES_COUNT} array={colors} itemSize={3} />
					</bufferGeometry>
					<primitive object={material} attach="material" />
				</points>
			</group>
		</group>
	);
}

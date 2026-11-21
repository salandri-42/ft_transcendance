import { useRef, useMemo, RefObject } from 'react';
import { useFrame, RootState } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * @description : Interface pour le composant de traînée d'étoile
 * @param radius : Rayon de l'orbite
 * @param speed : Vitesse orbitale (rad/s)
 * @param starAngle : Angle local de l'étoile dans le groupe [0...2PI]
 * @param color : Couleur de la poussière
 * @param active : Activité du système
 * @param size : Dimensions du tableau [width, height]
 */
interface StarTrailProps
{
	radius: number;
	speed: number;
	starAngle: number;
	color?: string;
	active: boolean;
	size: [number, number];
}

interface ParticleData
{
	life: number;
	birthAngleInGroup: number;
	radiusOffset: number;
	yOffset: number;
	sizeBase: number;
}

interface StarTrailBuffers
{
	positions: Float32Array;
	sizes: Float32Array;
	lives: Float32Array;
	particleData: ParticleData[];
}

interface StarTrailShaderData
{
	uniforms: {
		uColor: { value: THREE.Color };
		uTime: { value: number };
		uOpacity: { value: number };
	};
	shader: THREE.ShaderMaterial;
}


const PARTICLE_COUNT = 1000;

const STAR_TRAIL_VERTEX_SHADER = `
	attribute float aSize;
	attribute float aLife;
	varying float vId;
	varying float vLife;
	void main()
	{
		vId = float(gl_VertexID);
		vLife = aLife;
		vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
		gl_PointSize = aSize * (500.0 / -mvPosition.z);
		gl_Position = projectionMatrix * mvPosition;
	}
`;

const STAR_TRAIL_FRAGMENT_SHADER = `
	uniform vec3 uColor;
	uniform float uTime;
	uniform float uOpacity;
	varying float vId;
	varying float vLife;
	void main()
	{
		vec2 uv = gl_PointCoord - 0.5;
		float dist = length(uv);

		if (dist > 0.5)
			discard;

		float twinkle = 0.8 + 0.2 * sin(uTime * 12.0 + vId);
		float glow = smoothstep(0.5, 0.0, dist);

		// Dégradé lié à la durée de vie de la particule
		float alphaFade = 1.0 - vLife;
		gl_FragColor = vec4(uColor, glow * 1.5 * twinkle * uOpacity * alphaFade);
	}
`;


/**
 *
 * @description : Composant de traînée stellaire naissant par les bords arrières.
 *                Positionné au centre du groupe orbital pour une synchro sans dérive.
 *
 */
const useStarTrailParticles = (size: [number, number]): StarTrailBuffers =>
{

	const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
	const sizes = useMemo(() => new Float32Array(PARTICLE_COUNT), []);
	const lives = useMemo(() => new Float32Array(PARTICLE_COUNT), []);

	const particleData = useMemo(() =>
	{
		return Array.from({ length: PARTICLE_COUNT }, () => (
		{
			life: Math.random(),
			birthAngleInGroup: 0,
			radiusOffset: (Math.random() - 0.5) * 8,
			yOffset: (Math.random() - 0.5) * size[1],
			sizeBase: Math.random() * 12 + 4
		}));
	}, [size]);

	return { positions, sizes, lives, particleData };
};

const useStarTrailShader = (color?: string): StarTrailShaderData =>
{

	const uniforms = useMemo(() => (
	{
		uColor: { value: new THREE.Color(color || "#FFFFFF") },
		uTime: { value: 0 },
		uOpacity: { value: 1.5 }
	}), [color]);

	const shader = useMemo(() => new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: STAR_TRAIL_VERTEX_SHADER,
		fragmentShader: STAR_TRAIL_FRAGMENT_SHADER,
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
	}), [uniforms]);

	return { uniforms, shader };
};

/**
 * @description Calcule la position d'une particule individuelle.
 */
const updateParticlePosition = (
	i: number, 
	p: ParticleData, 
	props: { radius: number, starAngle: number, speed: number }, 
	groupRotationZ: number,
	buffers: StarTrailBuffers
) =>
{
	const currentOrbitAngle = p.birthAngleInGroup - groupRotationZ;
	const deltaAngle = currentOrbitAngle - props.starAngle;
	const finalRadius = props.radius + p.radiusOffset;

	const particleAngle = props.starAngle + deltaAngle;
	buffers.positions[i * 3] = Math.cos(particleAngle) * finalRadius; 
	buffers.positions[i * 3 + 1] = Math.sin(particleAngle) * finalRadius; 
	buffers.positions[i * 3 + 2] = p.yOffset; 

	buffers.sizes[i] = p.sizeBase * (1.0 - p.life);
	buffers.lives[i] = p.life;
};

const useStarTrailAnimation = (
	pointsRef: RefObject<THREE.Points>,
	buffers: StarTrailBuffers,
	shaderData: StarTrailShaderData,
	props: StarTrailProps
) =>
{
	const starPos = useMemo(() => new THREE.Vector3(), []);

	useFrame((state: RootState, delta: number) =>
	{

		if (!pointsRef.current || !props.active)
			return;

		const time = state.clock.elapsedTime;

		shaderData.uniforms.uTime.value = time;

		starPos.set(Math.cos(props.starAngle) * props.radius, Math.sin(props.starAngle) * props.radius, 0);

		const starWorldPos = starPos.clone().applyMatrix4(pointsRef.current.matrixWorld);
		const distToCam = state.camera.position.distanceTo(starWorldPos);

		shaderData.uniforms.uOpacity.value = (1.0 - THREE.MathUtils.smoothstep(distToCam, 5000, 12000)) * 0.5;

		const groupRotationZ = props.speed * time * 0.5;
		const angularWidth = (props.size[0] * 0.5) / props.radius;
		const localTrailingEdgeAngle = props.starAngle - (props.speed < 0 ? -1 : 1) * angularWidth;

		for (let i = 0; i < PARTICLE_COUNT; i++)
		{
			const p = buffers.particleData[i];
			p.life += 0.005;
			if (p.life >= 1)
			{
				p.life = 0;
				p.birthAngleInGroup = (localTrailingEdgeAngle - Math.random() * props.speed * delta * 0.7) + groupRotationZ;
			}
			updateParticlePosition(i, p, props, groupRotationZ, buffers);
		}

		pointsRef.current.geometry.attributes.position.needsUpdate = true;
		pointsRef.current.geometry.attributes.aSize.needsUpdate = true;
		pointsRef.current.geometry.attributes.aLife.needsUpdate = true;
	});
};

export const StarTrail = (props: StarTrailProps) =>
{
	const pointsRef = useRef<THREE.Points>(null);
	const buffers = useStarTrailParticles(props.size);
	const shaderData = useStarTrailShader(props.color);

	useStarTrailAnimation(pointsRef, buffers, shaderData, props);

	if (!props.active)
		return null;

	return (
		<points ref={pointsRef}>
			<bufferGeometry>
				<bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={buffers.positions} itemSize={3} />
				<bufferAttribute attach="attributes-aSize" count={PARTICLE_COUNT} array={buffers.sizes} itemSize={1} />
				<bufferAttribute attach="attributes-aLife" count={PARTICLE_COUNT} array={buffers.lives} itemSize={1} />
			</bufferGeometry>
			<primitive object={shaderData.shader} attach="material" />
		</points>
	);
};
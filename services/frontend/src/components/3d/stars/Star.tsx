import { useRef, useMemo, useEffect, useState, RefObject } from 'react';
import { useFrame, RootState } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useGalaxyStore } from '../../../stores/useGalaxyStore';
import { useUserStore } from '../../../stores/useUserStore';
import { StarData } from '../../../types/socket.types';
import { StarTrail } from './StarTrail';
import { StarAura } from './StarAura';
import { getOrbitColor } from '../orbital/OrbitalUtils';
import { VEC3_ZERO, SCALE_NORMAL, SCALE_SELECTED } from '../orbital/OrbitalConstants';

interface StarProps
{
	data: StarData;
	index: number;
	selectedIndex: number | null;
	onSelect: (i: number | null) => void;
}

const creatorNameCache = new Map<string, string>();

const useStarTexture = (url?: string) =>
{
	return useMemo(() =>
	{
		if (!url) return null;
		return new THREE.TextureLoader().load(url);
	}, [url]);
};

const useStarAnimation = (
	groupRef: RefObject<THREE.Group>,
	meshRef: RefObject<THREE.Mesh>,
	props: StarProps,
	state: { speed: number; phase: number; originalPos: THREE.Vector3; _worldOrigin: THREE.Vector3; isSelected: boolean }
) =>
{
	const frozenRotZ = useRef<number | null>(null);

	useFrame((rootState: RootState) =>
	{
		if (!groupRef.current || !meshRef.current)
			return;

		if (state.isSelected)
		{
			if (frozenRotZ.current === null)
				frozenRotZ.current = groupRef.current.rotation.z;
			groupRef.current.rotation.z = frozenRotZ.current;
			meshRef.current.position.lerp(VEC3_ZERO, 0.06);
			meshRef.current.scale.lerp(SCALE_SELECTED, 0.06);
			meshRef.current.up.set(0, 1, 0);
			meshRef.current.lookAt(rootState.camera.position);
		}
		else
		{
			groupRef.current.rotation.z = state.phase + state.speed * rootState.clock.elapsedTime * 0.5;
			frozenRotZ.current = null;
			meshRef.current.position.lerp(state.originalPos, 0.06);
			
			if (props.data.createdAt && (Date.now() - props.data.createdAt) < 2000)
			{
				const s = Math.min(1, (Date.now() - props.data.createdAt) / 1000);
				const flash = s + Math.sin(s * Math.PI) * 3;
				meshRef.current.scale.set(flash, flash, flash);
			}
			else
				meshRef.current.scale.lerp(SCALE_NORMAL, 0.06);

			state._worldOrigin.set(0, 0, 1).transformDirection(groupRef.current.parent!.matrixWorld);
			meshRef.current.up.copy(state._worldOrigin);
			meshRef.current.lookAt(0, 0, 0);
		}
	});
};

export function Star(props: StarProps)
{
	const groupRef = useRef<THREE.Group>(null);
	const meshRef = useRef<THREE.Mesh>(null);
	const { explorationMode, guidedTargetIndex, clickStar, setGuidedTargetIndex } = useGalaxyStore();
	const friends = useUserStore((state) => state.friends);
	const [creatorName, setCreatorName] = useState(props.data.creatorName || '');
	const [creatorUsername, setCreatorUsername] = useState('');

	const authToken = localStorage.getItem('auth_token');
	const currentUser = useMemo(() =>
	{
		if (!authToken) return { id: '', username: '' };
		try
		{
			const base64Url = authToken.split('.')[1];
			const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => '%'+('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
			const payload = JSON.parse(jsonPayload);
			return { id: payload?.sub || '', username: payload?.username || '' };
		}
		catch
		{
			return { id: '', username: '' };
		}
	}, [authToken]);
	const friendUsernames = useMemo(() => new Set(friends.map((f) => f.username.toLowerCase())), [friends]);
	
	const speed = (160 / props.data.orbitRadius) * (props.data.speed ?? 1);
	const phase = props.data.phase ?? 0;
	const orbitColor = useMemo(() => getOrbitColor(props.data.orbitRadius).getStyle(), [props.data.orbitRadius]);
	const texture = useStarTexture(props.data.textureUrl);
	
	const isSelected = explorationMode !== 'GUIDED' && props.selectedIndex === props.index;
	const isCurrentTarget = explorationMode === 'GUIDED' && guidedTargetIndex === props.index;
	const canSeeCreator = useMemo(() =>
	{
		const ownerId = props.data.ownerId || '';
		const username = creatorUsername.toLowerCase();
		if (ownerId && ownerId === currentUser.id)
			return true;
		if (username && currentUser.username && username === currentUser.username.toLowerCase())
			return true;
		if (username && friendUsernames.has(username))
			return true;
		return false;
	}, [props.data.ownerId, creatorUsername, currentUser.id, currentUser.username, friendUsernames]);
	const showLabel = Boolean(props.data.textureUrl) && (isSelected || isCurrentTarget) && canSeeCreator;

	useEffect(() =>
	{
		if (props.data.creatorName)
		{
			setCreatorName(props.data.creatorName);
			setCreatorUsername(props.data.creatorName);
			return;
		}

		const ownerId = props.data.ownerId;
		if (!ownerId || !authToken)
			return;

		const cached = creatorNameCache.get(ownerId);
		if (cached)
		{
			setCreatorName(cached);
			return;
		}

		let cancelled = false;
		fetch(`/api/auth/profile/${ownerId}`,
		{
			headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}` },
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((data) =>
			{
				if (!data || cancelled)
					return;
				setCreatorUsername(data.username || '');
				const resolvedName = data.displayName || data.username || ownerId;
				creatorNameCache.set(ownerId, resolvedName);
				setCreatorName(resolvedName);
			})
			.catch(() =>
			{
				if (!cancelled)
					setCreatorName(ownerId);
			});

		return () => { cancelled = true; };
	}, [props.data.creatorName, props.data.ownerId]);
	
	const originalPos = useMemo(() => new THREE.Vector3(Math.cos(props.data.angle) * props.data.orbitRadius, Math.sin(props.data.angle) * props.data.orbitRadius, 0), [props.data.angle, props.data.orbitRadius]);
	const _worldOrigin = useMemo(() => new THREE.Vector3(0, 0, 0), []);

	useStarAnimation(groupRef, meshRef, props, { speed, phase, originalPos, _worldOrigin, isSelected });

	const handleClick = (e: any) =>
	{
		e.stopPropagation();
		if (props.data.id)
			clickStar(props.data.id);
		if (explorationMode === 'GUIDED')
			setGuidedTargetIndex(guidedTargetIndex === props.index ? -1 : props.index);
		else
			props.onSelect(isSelected ? null : props.index);
	};

	return (
		<group rotation={props.data.rotation}>
			<group rotation={props.data.tilt}>
				<group ref={groupRef}>
					<mesh position={[originalPos.x, originalPos.y, 0]} onClick={handleClick} name={'star_hitbox_' + props.index} {...(isCurrentTarget ? { raycast: () => { } } : {})}>
						<sphereGeometry args={[150, 16, 16]} />
						<meshBasicMaterial transparent opacity={0} depthWrite={false} />
					</mesh>
					<mesh ref={meshRef} position={[originalPos.x, originalPos.y, 0]} onClick={handleClick} name={'star_mesh_' + props.index}>
						<planeGeometry args={props.data.size ?? [80, 80]} />
						<meshBasicMaterial map={texture || undefined} color={texture ? 'white' : (props.data.color ?? 'white')} opacity={props.data.opacity ?? 0.8} transparent side={THREE.DoubleSide} />
						{props.data.textureUrl && <StarAura size={props.data.size ?? [80, 80]} color="#ffffff" />}
						{showLabel && (
							<Html
								position={[
									-(props.data.size?.[0] ?? 80) * 0.5 + 5,
									-(props.data.size?.[1] ?? 80) * 0.5 + 5,
									0.01,
								]}
								style={{ pointerEvents: 'none', userSelect: 'none' }}
							>
								<div style={{
									padding: '4px 7px',
									borderRadius: '6px',
									background: 'rgba(10, 10, 18, 0.62)',
									border: '1px solid rgba(255,255,255,0.12)',
									whiteSpace: 'nowrap',
									textAlign: 'left',
								}}>
									<div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{props.data.name || 'Untitled'}</div>
									<div style={{ fontSize: '10px', opacity: 0.75, lineHeight: 1.1 }}>by {creatorName || props.data.ownerId || 'unknown'}</div>
								</div>
							</Html>
						)}
					</mesh>
					<StarTrail radius={props.data.orbitRadius} speed={speed} starAngle={props.data.angle} size={props.data.size ?? [80, 80]} color={orbitColor} active={!isSelected} />
				</group>
			</group>
		</group>
	);
}

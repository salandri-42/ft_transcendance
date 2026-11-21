import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DiceBaseProps {
	strokeRef: React.RefObject<THREE.LineSegments>;
	transitionRef: React.MutableRefObject<number>;
}

export function DiceBase({ strokeRef, transitionRef }: DiceBaseProps)
{
	const baseMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
	const strokeMaterialRef = useRef<THREE.LineDashedMaterial>(null);

	useFrame(() =>
	{
		const opacity = Math.max(0.0, 1.0 - transitionRef.current * 4.0);
		
		if (baseMaterialRef.current)
		{
			baseMaterialRef.current.opacity = opacity;
			baseMaterialRef.current.transparent = opacity < 1.0;
		}
		
		if (strokeMaterialRef.current)
			strokeMaterialRef.current.opacity = opacity * 0.3;
	});

	return (
		<>
			{/* Faces Noires Mates */}
			<mesh renderOrder={1}>
				<icosahedronGeometry args={[500, 2]} />
				<meshStandardMaterial
					ref={baseMaterialRef}
					color="#000000"
					roughness={0.85}
					metalness={0.15}
					side={2}
				/>
			</mesh>

			{/* Arêtes Lumineuses */}
			<lineSegments 
				ref={strokeRef} 
				onUpdate={(self: THREE.LineSegments) => self.computeLineDistances()}
			>
				<edgesGeometry args={[new THREE.IcosahedronGeometry(501, 2)]} />
				<lineDashedMaterial
					color="#ffffff"
					opacity={0.3}
					transparent={true}
					depthWrite={false}

				/>
			</lineSegments>
		</>
	);
}

import * as THREE from 'three';
import { StarData } from '../../../../types/socket.types';

/**
 * 
 * @description Calcule la position 3D exacte d'une étoile en tenant compte de son orbite, rotation et inclinaison.
 * 
 */
export function getStarWorldPosition(data: StarData, time: number): THREE.Vector3
{
	const speed = (160 / data.orbitRadius) * (data.speed ?? 1);
	const phase = data.phase ?? 0;
	const rotZ = phase + speed * time * 0.5;

	const pos = new THREE.Vector3(
		Math.cos(data.angle) * data.orbitRadius + 5,
		Math.sin(data.angle) * data.orbitRadius + 5,
		0
	);

	const groupMatrix = new THREE.Matrix4().makeRotationZ(rotZ);
	
	pos.applyMatrix4(groupMatrix);

	const tiltEuler = new THREE.Euler(...data.tilt);
	const tiltMatrix = new THREE.Matrix4().makeRotationFromEuler(tiltEuler);
	
	pos.applyMatrix4(tiltMatrix);

	const rotEuler = new THREE.Euler(...data.rotation);
	const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(rotEuler);
	
	pos.applyMatrix4(rotMatrix);
	return pos;
}

/**
 * 
 * @description Calcule la position idéale de la caméra autour d'une étoile cible.
 * 
 */
export function getIdealCameraPosition(targetPos: THREE.Vector3, distance: number, time: number): THREE.Vector3
{
	const orbitSpeed = 0.05;
	const orbitTime = time * orbitSpeed;
	const orbitRadius = distance * 1.8;

	const offsetX = Math.cos(orbitTime) * orbitRadius;
	const offsetZ = Math.sin(orbitTime) * orbitRadius;
	const offsetY = distance * 0.3;

	return new THREE.Vector3(
		targetPos.x + offsetX * 0.5,
		targetPos.y + offsetY * 0.35,
		targetPos.z + offsetZ * 0.5
	);
}

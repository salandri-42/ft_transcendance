import * as THREE from 'three';

/**
 * 
 * @description Calcule la couleur de l'orbite (anneau + traînées) en fonction du rayon.
 * 
 */
export function getOrbitColor(radius: number): THREE.Color
{
	const t = Math.max(0, Math.min(1, (radius - 1000) / 10500));

	const c0 = new THREE.Color("#FFD700");
	const c1 = new THREE.Color("#FFD700");
	const c2 = new THREE.Color("#E63946");
	const c3 = new THREE.Color("#ffffff");

	const baseColor = new THREE.Color();

	if (t < 0.33)
		baseColor.lerpColors(c0, c1, t / 0.33);
	else if (t < 0.66)
		baseColor.lerpColors(c1, c2, (t - 0.33) / 0.33);
	else
		baseColor.lerpColors(c2, c3, (t - 0.66) / 0.34);

	return baseColor;
}

/**
 * 
 * @description Calcule un angle de placement sécurisé pour éviter les superpositions sur le même anneau.
 * 
 */
export function getSafeAngleForRing(
	radius: number,
	existingStars: any[]
): { angle: number; phase: number; maxCapacityReached: boolean }
{
	const starDiameter = 80;
	const safetyMargin = 4.0;
	const minDistance = starDiameter * safetyMargin;
	const minAngularDistance = minDistance / radius;

	const ringStars = existingStars.filter(s => s.orbitRadius === radius);
	const maxCapacity = Math.floor((Math.PI * radius) / (2 * minDistance));

	if (ringStars.length >= maxCapacity)
	{
		console.warn(`[getSafeAngle] ALL PLACE IS FULL (${maxCapacity}) for the radius ${radius}`);
		return { angle: 0, phase: 0, maxCapacityReached: true };
	}

	if (ringStars.length === 0)
		return { angle: Math.random() * Math.PI * 2, phase: Math.random() * Math.PI * 2, maxCapacityReached: false };

	let attempts = 0;
	let angle = Math.random() * Math.PI * 2;
	let phase = Math.random() * Math.PI * 2;

	while (attempts < 50)
	{
		let isColliding = false;
		const totalAngle = angle + phase;

		for (const other of ringStars)
		{
			const otherTotalAngle = other.angle + (other.phase ?? 0);
			let diff = Math.abs(totalAngle - otherTotalAngle) % (Math.PI * 2);
			if (diff > Math.PI)
				diff = Math.PI * 2 - diff;

			if (diff < minAngularDistance)
			{
				isColliding = true;
				break;
			}
		}

		if (!isColliding)
			return { angle, phase, maxCapacityReached: false };

		angle = Math.random() * Math.PI * 2;
		phase = Math.random() * Math.PI * 2;
		attempts++;
	}
	console.warn(`[getSafeAngle] ALL PLACE IS FULL ${radius}`);
	return { angle, phase, maxCapacityReached: false };
}

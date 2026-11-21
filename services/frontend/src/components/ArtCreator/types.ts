import type { Polyline, Vec3 } from 'ogl';

export interface ArtCreatorProps
{
	colors: string[];
	onShare: (dataUrl: string, arrayBuffer: ArrayBuffer, artName: string) => void;
	onClose: () => void;
}

export interface Stroke {
	points: Vec3[];
	polyline: Polyline;
	spring: number;
	friction: number;
	mouseVelocity: Vec3;
	frozen: boolean;
}

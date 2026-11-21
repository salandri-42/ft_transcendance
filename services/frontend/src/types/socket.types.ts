/**
 * 
 * @description : Types pour la gestion de la galaxie : 
 * 					- RingData : data pour les anneaux
					- StarData : data pour les etoiles
					- OrbitalData : data pour la galaxie
					- ServerToClientEvents : events envoyes par le serveur
					- ClientToServerEvents : events envoyes par le client
					- InterServerEvents : events envoyes entre serveurs
					- SocketData : data pour les sockets
 * 
 */

export interface RingData
{
	radius: number;
	rotation: [number, number, number];
	tilt: [number, number, number];
	thickness?: number;
	color?: string;
	opacity?: number;
}

export interface StarData
{
	id?: string;
	name?: string;
	ownerId?: string | null;
	creatorName?: string;
	orbitRadius: number;
	rotation: [number, number, number];
	tilt: [number, number, number];
	angle: number;
	phase?: number;
	size?: [number, number];
	color?: string;
	opacity?: number;
	speed?: number;
	createdAt?: number;
	idealCameraDistance?: number;
	textureUrl?: string;
}

export interface OrbitalData
{
	serverStartTime: number;
	rings: RingData[];
	stars: StarData[];
}

export interface ServerToClientEvents
{
	init: (data: OrbitalData) => void;
	newStar: (star: StarData) => void;
	galaxyPong: () => void;
	error: (err: { message: string }) => void;
	guided_target_update: (targetIndex: number) => void;
	'audio-response': (audioData: ArrayBuffer) => void;
}

export interface ClientToServerEvents
{
	spawnStar: (star: StarData) => void;
	starClicked: (starId: string) => void;
	galaxyPing: () => void;
	simulateGuidedTour: () => void;
	stopGuidedTour: () => void;
	exitCreativeMode: () => void;
	visitStar: (starId: string) => void;
	leaveStar: (starId: string) => void;
	'stream-audio': (audioData: ArrayBuffer) => void;
	saveArtwork: (payload: { starId: string, imageBuffer: ArrayBuffer, name?: string }) => void;
}

export interface InterServerEvents
{
	ping: () => void;
}

export interface SocketData
{
	userId?: string;
}

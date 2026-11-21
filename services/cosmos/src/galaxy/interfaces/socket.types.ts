/**
 * 
 * @description : Interface pour les donnees des anneaux
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

/**
 * 
 * @description : Interface pour les donnees des etoiles
 * 
 */
export interface StarData
{
	id?: string;
	name?: string;
	ownerId?: string | null;
	emotion?: string;
	contextEmotion?: any;
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

/**
 * 
 * @description : Interface pour les donnees de la galaxie
 * 
 */
export interface OrbitalData
{
	serverStartTime: number;
	rings: RingData[];
	stars: StarData[];
}

export interface CameraState
{
	position:
	{ x: number, y: number, z: number };
	lookAt:
	{ x: number, y: number, z: number };
}

/**
 * 
 * @description : Interface pour les events du serveur vers le client
 * 
 */
export interface ServerToClientEvents
{
	init: (data: OrbitalData) => void;
	newStar: (star: StarData) => void;
	galaxyPong: () => void;
	error: (err: { message: string }) => void;
	guided_target_update: (targetIndex: number) => void;
	'audio-response': (audioData: ArrayBuffer) => void;
	'paint-signal': (signalData: { emotion?: string, suggested_colors?: string[], certainty?: string }) => void;
	'mint-result': (resultData: any) => void;
}

/**
 * 
 * @description : Interface pour les events du client vers le serveur
 * 
 */
export interface ClientToServerEvents
{
	spawnStar: (star: StarData) => void;
	starClicked: (starId: string) => void;
	galaxyPing: () => void;
	simulateGuidedTour: () => void;
	stopGuidedTour: () => void;
	cycleGuidedTarget: () => void;
	exitCreativeMode: () => void;
	enterCreativeMode: () => void;
	visitStar: (starId: string) => void;
	leaveStar: (starId: string) => void;
	'stream-audio': (audioData: ArrayBuffer) => void;
	clickedStar: (starId: string) => void;
	saveArtwork: (payload: { starId: string, imageBuffer: ArrayBuffer, name?: string }) => void;
}

/**
 * 
 * @description : Interface pour les events entre serveurs
 * 
 */
export interface InterServerEvents
{
	ping: () => void;
}

/**
 * 
 * @description : Interface pour les donnees du socket
 * 
 */
export interface SocketData
{
	userId?: string;
}

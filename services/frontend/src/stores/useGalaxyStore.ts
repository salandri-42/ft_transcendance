import { create } from 'zustand';
import { socket } from '../services/galaxySocket';
import { OrbitalData, StarData } from '../types/socket.types';

interface GalaxyState
{
	orbitalData: OrbitalData | null;
	isConnected: boolean;
	latency: number | null;
	lastPing: number | null;
	explorationMode: 'GUIDED' | 'FREE' | 'CREATIVE';
	guidedTargetIndex: number | null;
	timeOffset: number;
	serverStartTime: number | null;
	suggestedColors: string[];
	lastLocalCreatedStarId: string | null;
	isMicActive: boolean;
	pendingLocalStarId: string | null;

	connect: () => void;
	disconnect: () => void;
	spawnStar: (star: StarData) => void;
	sendPing: () => void;

	setConnected: (status: boolean) => void;
	setOrbitalData: (data: OrbitalData) => void;
	addStar: (star: StarData) => void;
	updateLatency: () => void;
	toggleExplorationMode: () => void;
	enterCreativeMode: () => void;
	exitCreativeMode: () => void;
	setGuidedTargetIndex: (index: number | null) => void;
	clickStar: (starId: string) => void;
	visitStar: (starId: string) => void;
	leaveStar: (starId: string) => void;
	saveArtwork: (payload: { imageBuffer: ArrayBuffer, starId: string }) => void;
	setIsMicActive: (active: boolean) => void;
	setPendingLocalStarId: (id: string | null) => void;
	reset: () => void;
}

/**
 * 
 * @description : Store pour la gestion de l'etat de la galaxie
 * 
 * @method connect : Connecte au serveur WebSocket
 * @method disconnect : Deconnecte du serveur WebSocket
 * @method spawnStar : Envoie une nouvelle etoile au serveur
 * @method sendPing : Envoie un ping au serveur
 * @method setConnected : Met à jour le statut de connexion
 * @method setOrbitalData : Met à jour les donnees de la galaxie
 * @method setArtworkToSpawn : Met à jour l'URL de l'œuvre d'art	
 * @method addStar : Ajoute une nouvelle etoile
 * @method updateLatency : Met à jour la latence
 * @method toggleExplorationMode : Active/desactive le mode exploration (FREE/GUIDED)
 * @method enterCreativeMode : Active le mode creatif
 * @method exitCreativeMode : Desactive le mode creatif (retourne en GUIDED)
 * @method setGuidedTargetIndex : Met à jour l'index de la cible ciblee
 * 
 */

export const useGalaxyStore = create<GalaxyState>((set: any, get: any) => (
{
	orbitalData: { rings: [], stars: [], serverStartTime: 0 },
	isConnected: false,
	lastPing: null,
	latency: null,
	explorationMode: 'FREE',
	guidedTargetIndex: null,
	timeOffset: 0,
	serverStartTime: null,
	suggestedColors: ['#e74c3c', '#f39c12', '#8a846e', '#fdcbdb', '#2d6a4f'],
	visitedStarId: null,
	isMicActive: false,
	pendingLocalStarId: null,

	connect: () =>
	{
		if (socket.connected || (socket as any).active)
			return;
		
		const token = localStorage.getItem('auth_token');
		if (token)
		{
			console.log('[GalaxyStore] Found auth_token, injecting in handshake...');
			socket.auth = { token };
		}
			
		socket.connect();
	},

	disconnect: () =>
	{
		socket.disconnect();
	},

	spawnStar: (star: StarData) =>
	{
		if (socket.connected)
			socket.emit('spawnStar', star);
	},

	sendPing: () =>
	{
		if (socket.connected)
		{
			set({ lastPing: Date.now() });
			socket.emit('galaxyPing');
		}
	},

	setConnected: (status: boolean) => set({ isConnected: status }),

	setOrbitalData: (data: OrbitalData) => set({
		orbitalData: data,
		serverStartTime: data.serverStartTime,
		timeOffset: Date.now() - data.serverStartTime
	}),

	addStar: (star: StarData) =>
		set((state: GalaxyState) =>
		{
			if (!state.orbitalData) return state;
			return {
				orbitalData:
				{
					...state.orbitalData,
					stars: [...state.orbitalData.stars, star],
				},
			};
		}),

	updateLatency: () =>
	{
		const latency = Date.now() - (get().lastPing || Date.now());
		set({ latency });
		console.debug(`Pong received. Latency: ${latency}ms`);
	},
	
	setGuidedTargetIndex: (index: number | null) => set({ guidedTargetIndex: index }),

	clickStar: (starId: string) =>
	{
		if (socket.connected)
		{
			console.log(`[GalaxyStore] Emitting starClicked for ID: ${starId}`);
			socket.emit('starClicked', starId);
		}
	},

	visitStar: (starId: string) =>
	{
		set({ visitedStarId: starId });
		if (socket.connected)
		{
			console.log(`[GalaxyStore] Emitting visitStar for ID: ${starId}`);
			socket.emit('visitStar', starId);
		}
	},

	leaveStar: (starId: string) =>
	{
		if (socket.connected)
		{
			console.log(`[GalaxyStore] Emitting leaveStar for ID: ${starId}`);
			socket.emit('leaveStar', starId);
		}
	},

	saveArtwork: (payload: { imageBuffer: ArrayBuffer, starId: string, name?: string }) =>
	{
		if (socket.connected)
		{
			console.log(`[GalaxyStore] Emitting saveArtwork for starId: ${payload.starId}, name: "${payload.name}" (${payload.imageBuffer.byteLength} bytes)`);
			socket.emit('saveArtwork', payload);
		}
	},

	toggleExplorationMode: () =>
		set((state: GalaxyState) =>
		{
			const newMode = state.explorationMode === 'GUIDED' ? 'FREE' : 'GUIDED';

			if (socket.connected)
			{
				if (newMode === 'FREE')
				{
					console.log('[GalaxyStore] Stopping guided tour via socket...');
					socket.emit('stopGuidedTour');
				}
				else if (newMode === 'GUIDED')
				{
					console.log('[GalaxyStore] Starting guided tour via socket...');
					socket.emit('simulateGuidedTour');
				}
			}
			return { explorationMode: newMode };
		}),

	enterCreativeMode: () => set((state: GalaxyState) =>
	{
		if (state.explorationMode !== 'GUIDED')
			return state;
		console.log('[GalaxyStore] Entering CREATIVE mode...');

		if (socket.connected)
			socket.emit('enterCreativeMode');

		return { explorationMode: 'CREATIVE' };
	}),

	exitCreativeMode: () => set((state: GalaxyState) =>
	{
		if (state.explorationMode !== 'CREATIVE')
			return state;
		console.log('[GalaxyStore] Exiting CREATIVE mode, returning to GUIDED...');
		
		if (socket.connected)
			socket.emit('exitCreativeMode');

		return { explorationMode: 'GUIDED' };
	}),

	setIsMicActive: (active: boolean) => set({ isMicActive: active }),

	setPendingLocalStarId: (id: string | null) => set({ pendingLocalStarId: id }),
	
	reset: () =>
	{
		socket.disconnect();
		set({
			explorationMode: 'FREE',
			guidedTargetIndex: null,
			isConnected: false,
			isMicActive: false
		});
	}
}));

/**
 * 
 * @description : Listeners pour les evenements du serveur
 * 
 */
let pingInterval: ReturnType<typeof setInterval>;

socket.on('connect', () =>
{
	console.log('Galaxy WebSocket Connected:', socket.id);
	useGalaxyStore.getState().setConnected(true);

	pingInterval = setInterval(() =>
	{
		useGalaxyStore.getState().sendPing();
	}, 5000);
});

socket.on('disconnect', () =>
{
	console.log('Galaxy WebSocket Disconnected');
	useGalaxyStore.getState().setConnected(false);
	clearInterval(pingInterval);
});

socket.on('connect_error', (err: any) =>
{
	if (err.message?.includes('401') || err.message?.includes('Unauthorized'))
		console.warn('[GalaxyStore] Connection rejected due to auth. Token might be invalid.');
});

socket.on('error', (err: any) =>
{
	console.error('Galaxy WebSocket Application Error:', err.message);
});

socket.on('init', (data: OrbitalData) =>
{
	console.log('Received Galaxy Data:', data);
	useGalaxyStore.getState().setOrbitalData(data);
});

socket.on('newStar', (star: StarData) =>
{
	console.log('Received new star:', star);
	useGalaxyStore.getState().addStar(star);
});

socket.on('galaxyPong', () =>
{
	useGalaxyStore.getState().updateLatency();
});

socket.on('guided_target_update', (targetIndex: number) =>
{
	console.log('Received new guided target index:', targetIndex);
	useGalaxyStore.getState().setGuidedTargetIndex(targetIndex);
	
});

/**
 * 
 * @description : for all pythia requests and endpoints
 * 
 */
socket.on('paint-signal', (data: { emotion?: string, contextEmotion?: any, suggested_colors?: string[], certainty?: string }) =>
{
	if (data && data.suggested_colors && data.suggested_colors.length > 0)
	{
		console.log('Received paint signal with colors:', data.suggested_colors);
		console.log(`[EMOTION_SYNC] Paint signal emotion: "${data.emotion}", contextEmotion:`, data.contextEmotion);
		useGalaxyStore.setState({ suggestedColors: data.suggested_colors });
		useGalaxyStore.getState().enterCreativeMode();
	}
});

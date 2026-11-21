import { useState, useEffect } from 'react';
import { useGalaxyStore } from './stores/useGalaxyStore';
import { useUserStore } from './stores/useUserStore';

import { LoginOverlay } from './components/users/LoginOverlay';
import { ConnectionOverlay } from './components/ui/ConnectionOverlay';
import { StartTout } from './components/ui/StartTout';
import { UserDashboard } from './components/ui/UserDashboard';
import { ArtCreator } from './components/ArtCreator';
import { CosmosBackground } from './components/3d/CosmosBackground';
import { LanguageSelector } from './components/ui/LanguageSelector';

import { audioCaptureService } from './services/audioCapture';
import { audioPlaybackService } from './services/audioPlayback';
import { useInactivityWatchdog } from './hooks/useInactivityWatchdog';
import { useTranslation } from './hooks/useTranslation';

/**
 * 
 * @description : Composant principal de l'application, on definit et gere ici le comportement de l'application :
 * 
 * @methods : 
 * 	- App : composant principal
 * 	- useEffect : hook pour gerer les effets de bord
 * 	- handleLogin : callback qui est appele lors de la connexion
 * 	- handleLogout : callback qui est appele lors de la deconnexion
 * 
 */
function decodeToken(token: string | null)
{
	if (!token)
		return null;
	try
	{
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c)
		{
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));

		return JSON.parse(jsonPayload);
	}
	catch (e)
	{
		return null;
	}
}

export default function App()
{
	const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
	const tokenPayload = decodeToken(token);
	const username = tokenPayload?.username || 'User';
	const userId = tokenPayload?.sub || '';

	const { connect, disconnect, orbitalData, isConnected, latency, explorationMode, toggleExplorationMode, exitCreativeMode, suggestedColors, visitedStarId, saveArtwork } = useGalaxyStore();
	const [showCanvas, setShowCanvas] = useState(false);
	const [hasStartedTour, setHasStartedTour] = useState(false);
	const [isInitialized, setIsInitialized] = useState(false);

	const { t } = useTranslation();
	useInactivityWatchdog();

	useEffect(() =>
	{
		const validateToken = async () =>
		{
			const storedToken = localStorage.getItem('auth_token');
			if (!storedToken)
			{
				setIsInitialized(true);
				return;
			}

			try
			{
				const res = await fetch('/api/auth/profile', {
					headers: { 'Authorization': `Bearer ${storedToken}` }
				});

				if (res.ok)
					setIsInitialized(true);
				else if (res.status === 401 || res.status === 403)
				{
					// Token invalid
					console.warn('[AUTH] Stale token detected on startup. Clearing...');
					localStorage.removeItem('auth_token');
					localStorage.removeItem('refresh_token');
					setToken(null);
					setIsInitialized(true);
				}
				else
				{
					// Server error
					console.warn(`[AUTH] Server returned ${res.status}. Keeping token for retry.`);
					setIsInitialized(true);
				}
			}
			catch (err)
			{
				console.error('[AUTH] Failed to validate token:', err);
				setIsInitialized(true);
			}
		};

		validateToken();
	}, []);

	useEffect(() =>
	{
		if (!isInitialized) return;

		let isCancelled = false;
		
		const initConnect = async () => {
			if (!isCancelled) connect();
		};

		initConnect();

		return () => {
			isCancelled = true;
			disconnect();
		};
	}, [connect, disconnect, isInitialized]);

	/* ─── Handle 42 OAuth callback ─── */
	useEffect(() =>
	{
		const params = new URLSearchParams(window.location.search);
		const accessToken = params.get('access_token');
		const refreshToken = params.get('refresh_token');
		const error = params.get('error');

		if (accessToken)
		{
			localStorage.setItem('auth_token', accessToken);
			if (refreshToken)
				localStorage.setItem('refresh_token', refreshToken);
			setToken(accessToken);
			window.history.replaceState({}, '', window.location.pathname);
		}
		else if (error)
		{
			alert(decodeURIComponent(error));
			window.history.replaceState({}, '', window.location.pathname);
		}
	}, []);

	/* ─── Handle Direct Invite Links ─── */
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const inviteToken = params.get('invite');
		
		if (inviteToken && token) {
			const { addFriend } = useUserStore.getState();
			addFriend(inviteToken)
				.then(() => alert(t('friends.friendAdded')))
				.catch((err) => console.error('Invite error:', err));
			
			// Clean URL
			window.history.replaceState({}, '', window.location.pathname);
		}
	}, [token]);

	useEffect(() =>
	{
		const handleKeyDown = (e: KeyboardEvent) =>
		{
			if (e.key === 'Escape' && explorationMode === 'GUIDED')
			{
				console.log('[App] Escape pressed in GUIDED mode, switching to FREE...');
				toggleExplorationMode();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [explorationMode, toggleExplorationMode]);

	useEffect(() =>
	{
		if (explorationMode === 'GUIDED')
		{
			console.log('[App] Mode GUIDED detected, starting micro...');
			audioCaptureService.startCapture();
			audioPlaybackService.startListening();
			useGalaxyStore.getState().setIsMicActive(true);
		}
		else if (explorationMode === 'FREE')
		{
			console.log('[App] Mode FREE detected, stopping micro...');
			audioCaptureService.stopCapture();
			audioPlaybackService.stopListening();
			useGalaxyStore.getState().setIsMicActive(false);
		}
	}, [explorationMode]);

	useEffect(() =>
	{
		const handleStorageChange = (e: StorageEvent) =>
		{
			if (e.key === 'auth_token')
				setToken(e.newValue);
		};
		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	useEffect(() =>
	{
		if (isConnected && orbitalData)
		{
			const timer = setTimeout(() => setShowCanvas(true), 500);
			return () => clearTimeout(timer);
		}
		else
			setShowCanvas(false);
	}, [isConnected, orbitalData]);

	const handleLogin = (newToken: string) =>
	{
		localStorage.setItem('auth_token', newToken);
		setToken(newToken);
	};

	const handleLogout = async () =>
	{
		if (token)
		{
			try
			{
				await fetch('/api/auth/logout-all', {
					method: 'POST',
					headers: { 'Authorization': `Bearer ${token}` }
				});
			}
			catch (err)
			{
				console.error('Logout error:', err);
			}
		}
		
		// Stop AI and Audio services
		useGalaxyStore.getState().reset();
		audioCaptureService.stopCapture();
		audioPlaybackService.stopListening();

		localStorage.removeItem('auth_token');
		localStorage.removeItem('refresh_token');
		setToken(null);
	}

	const isStartTourVisible = !hasStartedTour && !token;

	return (
		<>
			<LanguageSelector />
			{isStartTourVisible ? (
				<StartTout onStart={() => setHasStartedTour(true)} />
			) : (
			<div id="canvas-container" style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative' }}>
				{(!isConnected) && token && <ConnectionOverlay />}

			<CosmosBackground
				token={token}
				orbitalData={orbitalData}
				isSocketConnected={isConnected}
				showCanvas={showCanvas}
				explorationMode={explorationMode}
			/>

			{explorationMode === 'CREATIVE' && (
				<ArtCreator
				colors={suggestedColors}
				onClose={exitCreativeMode}
				onShare={(dataUrl, arrayBuffer, artName) =>
				{
					const newStarId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
					console.log(`[App] Sharing artwork "${artName}" with starId: ${newStarId}`);
					window.dispatchEvent(new CustomEvent('spawn_artwork', { detail: { textureUrl: dataUrl, starId: newStarId, name: artName, creatorName: username } }));
					saveArtwork({ imageBuffer: arrayBuffer, starId: newStarId, name: artName });
					exitCreativeMode();
				}}
			/>
			)}

				{!isInitialized ? (
					<div className="flex items-center justify-center h-screen bg-black">
						<div className="text-white text-xl animate-pulse">Initializing Galaxy...</div>
					</div>
				) : !token ? (
					<LoginOverlay onLogin={handleLogin} onClose={() => setHasStartedTour(false)} />
				) : (
					<UserDashboard
						isConnected={isConnected}
						latency={latency}
						explorationMode={explorationMode}
						username={username}
						userId={userId}
						onToggleMode={toggleExplorationMode}
						onLogout={handleLogout}
					/>
				)}
			</div>
			)}
		</>
	);
}

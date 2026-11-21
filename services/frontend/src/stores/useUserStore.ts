import { create } from 'zustand';
import { useGalaxyStore } from './useGalaxyStore';
import { audioCaptureService } from '../services/audioCapture';
import { audioPlaybackService } from '../services/audioPlayback';

interface Friend {
	username: string;
	displayName: string | null;
	status: string;
}

interface UserState {
	friends: Friend[];
	isLoading: boolean;
	error: string | null;
	fetchFriends: () => Promise<void>;
	addFriend: (username: string) => Promise<void>;
	removeFriend: (username: string) => Promise<void>;
	updateStatus: (status: string) => Promise<void>;
	createInvite: () => Promise<string>;
}

export const handleAuthError = (status?: number) =>
{
    console.warn(`[AUTH] ${status || 'Session'} error detected. Clearing state and tokens...`);
	
	// Stop AI and Audio services
	try {
		useGalaxyStore.getState().reset();
		audioCaptureService.stopCapture();
		audioPlaybackService.stopListening();
	} catch (e) {
		console.warn('[AUTH] Error during AI cleanup:', e);
	}

	localStorage.removeItem('auth_token');
	localStorage.removeItem('refresh_token');
	window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: null }));
};

export const useUserStore = create<UserState>((set, get) => (
{
	friends: [],
	isLoading: false,
	error: null,

	fetchFriends: async () =>
	{
		const token = localStorage.getItem('auth_token');
		if (!token)
			return;

		set({ isLoading: true });
		try
		{
			const res = await fetch('/api/friends', {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.status === 401 || res.status === 404)
			{
				handleAuthError(res.status);
				return;
			}
			if (!res.ok)
				throw new Error('Failed to fetch friends');
			const data = await res.json();
			set({ friends: data, isLoading: false, error: null });
		}
		catch (err: any)
		{
			set({ error: err.message, isLoading: false });
		}
	},

	addFriend: async (tokenOrUsername: string) =>
	{
		const token = localStorage.getItem('auth_token');
		if (!token)
			return;

		try
		{
			const res = await fetch('/api/friends/invite/accept',
			{
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ token: tokenOrUsername })
			});
			if (res.status === 401)
			{
				handleAuthError(res.status);
				return;
			}
			const data = await res.json();
			if (!res.ok || data?.success === false)
				throw new Error(data?.message || 'Failed to add friend');
			await get().fetchFriends();
		}
		catch (err: any)
		{
			set({ error: err.message });
			throw err;
		}
	},

	removeFriend: async (username: string) =>
	{
		const token = localStorage.getItem('auth_token');
		if (!token)
			return;

		try
		{
			const res = await fetch(`/api/friends/${username}`,
			{
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.status === 401 || res.status === 404)
			{
				handleAuthError(res.status);
				return;
			}
			if (!res.ok)
				throw new Error('Failed to remove friend');
			await get().fetchFriends();
		}
		catch (err: any)
		{
			set({ error: err.message });
		}
	},

	updateStatus: async (status: string) =>
	{
		const token = localStorage.getItem('auth_token');
		if (!token)
			return;

		try
		{
			const res = await fetch('/api/identity/users/status',
			{
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status })
			});
			if (res.status === 401)
			{
				handleAuthError();
				return;
			}
		}
		catch (err)
		{
			console.error('Failed to update status:', err);
		}
	},

	createInvite: async () =>
	{
		const token = localStorage.getItem('auth_token');
		if (!token)
			throw new Error('Not authenticated');

		const res = await fetch('/api/friends/invite',
		{
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}` }
		});
		if (res.status === 401)
		{
			handleAuthError();
			throw new Error('Unauthorized');
		}
		if (!res.ok)
			throw new Error('Failed to create invite');
		const data = await res.json();
		return data.token;
	}
}));

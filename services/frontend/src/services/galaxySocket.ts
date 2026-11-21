import { io, Socket } from 'socket.io-client';
import {
	ServerToClientEvents,
	ClientToServerEvents,
} from '../types/socket.types';

/**
 * 
 * @description : Socket pour la gestion de la galaxie, l'objectif de ce service est de permettre la communication entre le client et le serveur
 * 							- connexion et deconnexion du serveur
 * 							- envoi de requetes au serveur
 * 							- recuperation de l'etat actuel de la galaxie
 * 
 */

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('/galaxy',
{
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,
	autoConnect: false,
	transports: ['websocket'],
});

socket.on('connect_error', (err: any) =>
{
	if (err.message.includes('Unauthorized') || err.message.includes('auth') || err.message.includes('token') || err.message.includes('401'))
	{
		console.warn('[Socket] Critical Auth Error. Forcing clean reload...');
		localStorage.removeItem('auth_token');
		localStorage.removeItem('refresh_token');
		window.location.reload();
	}
});

socket.on('disconnect', (reason: string) =>
{
	console.log('[Socket] Disconnected:', reason);
	if (reason === 'io server disconnect')
		socket.connect();
});

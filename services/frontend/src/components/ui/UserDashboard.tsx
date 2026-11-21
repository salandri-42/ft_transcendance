import { useState, useEffect, useMemo, useRef } from 'react';
import { useGalaxyStore } from '../../stores/useGalaxyStore';
import { useUserStore } from '../../stores/useUserStore';
import { useTranslation } from '../../hooks/useTranslation';
import { FriendsList } from './FriendsList';

function FriendsSection() {
	const { friends } = useUserStore();
	const { t } = useTranslation();
	const [isExpanded, setIsExpanded] = useState(false);
	const onlineCount = friends.filter(f => f.status === 'online').length;

	return (
		<div style={{ marginTop: '15px' }}>
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="glass-panel"
				style={{
					width: '100%',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '12px 16px',
					cursor: 'pointer',
					border: '1px solid rgba(255,255,255,0.1)',
					background: 'rgba(255,255,255,0.05)',
					marginBottom: '10px',
					transition: 'all 0.2s ease',
					textAlign: 'start'
				}}
			>
				<span style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
					{t('dashboard.friends')}
					<span style={{
						background: 'rgba(255,255,255,0.1)',
						padding: '2px 8px',
						borderRadius: '10px',
						fontSize: '0.75rem',
						opacity: 0.8
					}}>
						{friends.length}
					</span>
				</span>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					{onlineCount > 0 && !isExpanded && (
						<span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 'bold' }}>
							● {onlineCount} {t('dashboard.online')}
						</span>
					)}
					<span style={{
						transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
						transition: 'transform 0.3s ease',
						fontSize: '0.8rem',
						opacity: 0.5
					}}>
						▼
					</span>
				</div>
			</button>

			{isExpanded && <FriendsList />}
		</div>
	);
}


/**
 * 
 * @description : Composant pour afficher le tableau de bord de l'utilisateur.
 * 
 */

interface UserDashboardProps {
	isConnected: boolean;
	latency: number | null;
	username: string;
	userId: string;
	onLogout: () => void;
}

export function UserDashboard({ isConnected, latency, username, userId, onLogout }: UserDashboardProps) {
	const { t, err } = useTranslation();
	const { isGlobalConnected, orbitalData } = useGalaxyStore();
	const [isOpen, setIsOpen] = useState(false);
	const [activeDays, setActiveDays] = useState<Set<string>>(new Set());
	const [currentDate] = useState(new Date());
	const { friends, fetchFriends } = useUserStore();
	const [view, setView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');
	const [profile, setProfile] = useState<any>(null);
	const [artworkCount, setArtworkCount] = useState(0);
	const [showFriends, setShowFriends] = useState(false);

	// Settings form state
	const [editUsername, setEditUsername] = useState('');
	const [editDisplayName, setEditDisplayName] = useState('');
	const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmNewPassword, setConfirmNewPassword] = useState('');
	const [settingsMsg, setSettingsMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [showPasswordSection, setShowPasswordSection] = useState(false);
	const dashboardRef = useRef<HTMLDivElement>(null);

	const compressAvatarFile = (file: File, maxSize = 256, quality = 0.72): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onerror = () => reject(new Error('Failed to read image'));
			reader.onload = () => {
				const img = new Image();
				img.onerror = () => reject(new Error('Failed to load image'));
				img.onload = () => {
					const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
					const width = Math.max(1, Math.round(img.width * scale));
					const height = Math.max(1, Math.round(img.height * scale));

					const canvas = document.createElement('canvas');
					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext('2d');
					if (!ctx) {
						reject(new Error('Failed to process image'));
						return;
					}

					ctx.drawImage(img, 0, 0, width, height);
					resolve(canvas.toDataURL('image/jpeg', quality));
				};
				img.src = reader.result as string;
			};
			reader.readAsDataURL(file);
		});
	};

	// Fetch profile on mount and when view changes to profile
	/* ─── Validation checks (similar to Register) ─── */
	const passwordChecks = useMemo(() => ({
		minLength: newPassword.length >= 8,
		hasUppercase: /[A-Z]/.test(newPassword),
		hasLowercase: /[a-z]/.test(newPassword),
		hasDigit: /[0-9]/.test(newPassword),
		hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
	}), [newPassword]);

	const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
	const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;
	const isUsernameValid = editUsername.length >= 6;

	// --- Poll for friends status ---
	useEffect(() => {
		if (userId) {
			fetchFriends();
			const interval = setInterval(fetchFriends, 30000);
			return () => clearInterval(interval);
		}
	}, [userId, fetchFriends]);

	// Use profile data when available (after update), fallback to JWT prop
	const displayUsername = profile?.username || username;
	const displayName = profile?.displayName || displayUsername;
	const initial = displayUsername.charAt(0).toUpperCase();

	useEffect(() => {
		if (!userId) return;

		const fetchActivity = async () => {
			try {
				const res = await fetch(`/api/cosmos/artworks/owner/${userId}`);
				if (!res.ok) throw new Error('Failed to fetch activity');
				const artworks = await res.json();

				setArtworkCount(artworks.length);

				const days = new Set<string>();
				artworks.forEach((art: any) => {
					const d = new Date(art.createdAt);
					const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
					days.add(date);
				});
				setActiveDays(days);
			} catch (err) {
				console.error('[Dashboard] Error fetching activity:', err);
			}
		};

		// Petit délai pour laisser le temps au backend de finir le traitement du dessin
		const timeout = setTimeout(fetchActivity, 1000);
		return () => clearTimeout(timeout);
	}, [userId, orbitalData?.stars.length]);

	useEffect(() => {
		if (!profile) {
			const token = localStorage.getItem('auth_token');
			if (!token) return;
			fetch('/api/auth/profile', {
				headers: { 'Authorization': `Bearer ${token}` }
			})
				.then(res => {
					if (res.status === 401 || res.status === 404)
					{
						import('../../stores/useUserStore').then(m => m.handleAuthError(res.status));
						return null;
					}
					return res.ok ? res.json() : null;
				})
				.then(data => { if (data) setProfile(data); })
				.catch(err => console.error('[Dashboard] Error fetching profile:', err));
		}
	}, [profile]);

	const calendarData = useMemo(() => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();

		const emptySlots = (firstDay + 6) % 7; // Start Monday
		const days = [];
		for (let i = 0; i < emptySlots; i++) days.push(null);
		for (let i = 1; i <= daysInMonth; i++) days.push(i);

		const day = String(currentDate.getDate()).padStart(2, '0');
		const monthNum = String(currentDate.getMonth() + 1).padStart(2, '0');
		const formattedDate = `${day}/${monthNum}/${year}`;

		return { days, monthName: currentDate.toLocaleString('default', { month: 'long' }), year, formattedDate };
	}, [currentDate]);

	// Handle clicking outside to close
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dashboardRef.current && !dashboardRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div ref={dashboardRef} style={{ position: 'absolute', top: 20, insetInlineEnd: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
			{/* --- Avatar Circle --- */}
			<div
				role="button"
				onClick={() => setIsOpen(!isOpen)}
				style={{
					width: '50px',
					height: '50px',
					borderRadius: '50%',
					background: profile?.avatarUrl
						? `url(${profile.avatarUrl}) center/cover no-repeat`
						: 'rgba(255, 255, 255, 0.1)',
					backdropFilter: profile?.avatarUrl ? 'none' : 'blur(10px)',
					border: '2px solid rgba(255, 255, 255, 0.8)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'white',
					fontSize: (profile?.avatarUrl || isOpen) ? '0' : '1.4rem',
					fontWeight: 'bold',
					cursor: 'pointer',
					transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
					userSelect: 'none',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{!profile?.avatarUrl && !isOpen && initial}
				{isOpen && (
					<div style={{
						position: 'absolute',
						inset: 0,
						background: 'rgba(0, 0, 0, 0.55)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '1.2rem',
						fontWeight: 300,
						color: 'white',
					}}>
						✕
					</div>
				)}
			</div>

			{/* --- Dropdown Menu --- */}
			{isOpen && (
				<div
					className="glass-panel"
					style={{
						padding: '1.5rem',
						width: '320px',
						maxHeight: '80vh',
						overflowY: 'auto',
						animation: 'slideDown 0.3s ease-out forwards',
						transformOrigin: 'top right',
					}}
				>
					{/* --- Header with username (clickable) --- */}
					<div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
						<div>
							<p 
								onClick={() => setView(view === 'dashboard' ? 'profile' : 'dashboard')}
								style={{ 
									margin: '0 0 4px 0', 
									fontWeight: 600, 
									fontSize: '1.1rem', 
									color: 'white',
									cursor: 'pointer',
									transition: 'color 0.2s ease',
								}}
								onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
								onMouseLeave={(e) => (e.currentTarget.style.color = 'white')}
							>
								{displayUsername}
							</p>
							<div className="glass-status">
								<span className={`glass-status-dot ${isConnected ? 'online' : 'offline'}`} />
								<span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
									{isConnected ? `${t('dashboard.connected')} (${latency ?? '-'}ms)` : t('dashboard.disconnected')}
								</span>
							</div>
						</div>
						<span
							onClick={onLogout}
							style={{
								fontSize: '0.8rem',
								opacity: 0.6,
								textDecoration: 'underline',
								cursor: 'pointer',
								color: 'white',
								marginTop: '4px'
							}}
							onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
							onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
						>
							{t('auth.logout')}
						</span>
					</div>

					{view === 'dashboard' ? (
						<>
							{/* --- Activity Calendar --- */}
							<div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px' }}>
								<p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 500, textAlign: 'center', opacity: 0.9 }}>
									{calendarData.formattedDate}
								</p>

								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
									{t('calendar.weekdays').map((d, i) => (
										<span key={i} style={{ fontSize: '0.65rem', opacity: 0.4, fontWeight: 'bold' }}>{d}</span>
									))}

									{calendarData.days.map((day, i) => {
										if (day === null) return <div key={`empty-${i}`} />;

										// Check if active
										const dateStr = `${calendarData.year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
										const isActive = activeDays.has(dateStr);

										return (
											<div
												key={day}
												style={{
													aspectRatio: '1/1',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontSize: '0.75rem',
													borderRadius: '6px',
													background: isActive ? 'rgba(74, 222, 128, 0.8)' : 'rgba(255,255,255,0.05)',
													color: isActive ? '#064e3b' : 'rgba(255,255,255,0.6)',
													fontWeight: isActive ? 'bold' : 'normal',
													border: isActive ? '1px solid #4ade80' : 'none',
													boxShadow: isActive ? '0 0 10px rgba(74, 222, 128, 0.3)' : 'none',
												}}
											>
												{day}
											</div>
										);
									})}
								</div>
							</div>

							{/* --- Friends Section --- */}
							<FriendsSection />
						</>
					) : view === 'profile' ? (
						<>
							{/* --- Profile Info --- */}
							<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
								{/* Avatar large with gear */}
								<div style={{ position: 'relative', width: '80px', height: '80px' }}>
									<div style={{
										width: '80px',
										height: '80px',
										borderRadius: '50%',
										background: profile?.avatarUrl 
											? `url(${profile.avatarUrl}) center/cover`
											: 'linear-gradient(135deg, rgba(0, 255, 204, 0.3), rgba(120, 100, 255, 0.3))',
										border: '2px solid rgba(255,255,255,0.15)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: profile?.avatarUrl ? '0' : '2.2rem',
										fontWeight: 700,
										color: 'white',
										boxShadow: '0 0 30px rgba(0, 255, 204, 0.1)',
									}}>
										{!profile?.avatarUrl && initial}
									</div>
									{/* Gear icon */}
									<div 
										onClick={(e) => {
											e.stopPropagation();
											setEditUsername(profile?.username || username);
											setEditDisplayName(profile?.displayName || '');
											setEditAvatarPreview(profile?.avatarUrl || null);
											setCurrentPassword('');
											setNewPassword('');
											setSettingsMsg(null);
											setView('settings');
										}}
										style={{
											position: 'absolute',
											bottom: '-2px',
											insetInlineEnd: '-2px',
											width: '26px',
											height: '26px',
											borderRadius: '50%',
											background: 'rgba(255,255,255,0.15)',
											backdropFilter: 'blur(10px)',
											border: '2px solid rgba(255,255,255,0.3)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											cursor: 'pointer',
											fontSize: '0.85rem',
											transition: 'all 0.2s ease',
										}}
										onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
										onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
									>
										⚙
									</div>
								</div>

								{/* Display name */}
								<div style={{ textAlign: 'center' }}>
									<p style={{ margin: '0 0 2px 0', fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>
										{displayName}
									</p>
									<p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>
										@{displayUsername}
									</p>
								</div>
							</div>

							{/* Info rows */}
							<div style={{ 
								marginTop: '20px', 
								display: 'flex', 
								flexDirection: 'column', 
								gap: '10px' 
							}}>
								{/* Artworks */}
								<div style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: '10px 14px',
									background: 'rgba(255,255,255,0.03)',
									borderRadius: '10px',
									border: '1px solid rgba(255,255,255,0.06)',
								}}>
									<span style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dashboard.artworks')}</span>
									<span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
										{artworkCount}
									</span>
								</div>

								{/* Member since */}
								<div style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: '10px 14px',
									background: 'rgba(255,255,255,0.03)',
									borderRadius: '10px',
									border: '1px solid rgba(255,255,255,0.06)',
								}}>
									<span style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dashboard.memberSince')}</span>
									<span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
										{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '...'}
									</span>
								</div>
							</div>


							{/* --- Friends List (collapsible, sorted: online first) --- */}
							<div style={{ marginTop: '20px' }}>
								<button 
									onClick={() => setShowFriends(!showFriends)}
									className="glass-panel"
									style={{ 
										width: '100%', 
										display: 'flex', 
										justifyContent: 'space-between', 
										alignItems: 'center', 
										padding: '12px 16px',
										cursor: 'pointer',
										border: '1px solid rgba(255,255,255,0.1)',
										background: 'rgba(255,255,255,0.05)',
										marginBottom: showFriends ? '10px' : '0',
										transition: 'all 0.2s ease',
										textAlign: 'start'
									}}
								>
									<span style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
										{t('dashboard.friends')} 
										<span style={{ 
											background: 'rgba(255,255,255,0.1)', 
											padding: '2px 8px', 
											borderRadius: '10px', 
											fontSize: '0.75rem',
											opacity: 0.8
										}}>
											{friends.length}
										</span>
									</span>
									
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
										{friends.filter(f => f.status === 'online').length > 0 && !showFriends && (
											<span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 'bold' }}>
												● {friends.filter(f => f.status === 'online').length} {t('dashboard.online')}
											</span>
										)}
										<span style={{ 
											transform: showFriends ? 'rotate(180deg)' : 'rotate(0deg)', 
											transition: 'transform 0.3s ease',
											fontSize: '0.8rem',
											opacity: 0.5
										}}>
											▼
										</span>
									</div>
								</button>

								{showFriends && (
									<div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
										{friends.length === 0 ? (
											<p style={{ textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', padding: '10px' }}>
												{t('dashboard.noFriends')}
											</p>
										) : (
											[...friends]
												.sort((a, b) => {
													if (a.status === 'online' && b.status !== 'online') return -1;
													if (a.status !== 'online' && b.status === 'online') return 1;
													return 0;
												})
												.map((friend) => (
													<div key={friend.username} style={{
														display: 'flex',
														alignItems: 'center',
														gap: '10px',
														padding: '8px 12px',
														background: 'rgba(255,255,255,0.03)',
														borderRadius: '10px',
														border: '1px solid rgba(255,255,255,0.06)',
													}}>
														<div className={`glass-status-dot ${friend.status === 'online' ? 'online' : 'offline'}`} />
														<div style={{ flex: 1 }}>
															<span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white' }}>
																{friend.displayName || friend.username}
															</span>
															<span style={{ fontSize: '0.7rem', opacity: 0.4, marginInlineStart: '6px' }}>
																@{friend.username}
															</span>
														</div>
														<span style={{ fontSize: '0.65rem', opacity: 0.5 }}>
															{friend.status === 'online' ? t('dashboard.online') : t('dashboard.offline')}
														</span>
													</div>
												))
										)}
									</div>
								)}
							</div>


						</>
					) : (
						<>
							{/* --- Settings View --- */}
							<div 
								onClick={() => setView('profile')}
								style={{ 
									display: 'flex', 
									alignItems: 'center', 
									gap: '10px', 
									marginBottom: '20px',
									cursor: 'pointer',
									opacity: 0.7,
									transition: 'opacity 0.2s ease',
								}}
								onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
								onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
							>
								<span style={{ fontSize: '1.2rem', lineHeight: 1 }}>‹</span>
								<span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('auth.editProfile')}</span>
							</div>

							{/* Avatar upload */}
							<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
								<div 
									onClick={() => document.getElementById('avatar-upload')?.click()}
									style={{
										width: '80px',
										height: '80px',
										borderRadius: '50%',
										background: editAvatarPreview 
											? `url(${editAvatarPreview}) center/cover` 
											: 'linear-gradient(135deg, rgba(0, 255, 204, 0.3), rgba(120, 100, 255, 0.3))',
										border: '2px dashed rgba(255,255,255,0.25)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: editAvatarPreview ? '0' : '2.2rem',
										fontWeight: 700,
										color: 'white',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
									}}
									onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
									onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
								>
									{!editAvatarPreview && initial}
								</div>
								<input 
									id="avatar-upload" 
									type="file" 
									accept="image/*" 
									style={{ display: 'none' }}
									onChange={async (e) => {
										const file = e.target.files?.[0];
										if (!file) return;
										try {
											const compressed = await compressAvatarFile(file);
											if (compressed.length > 900000) {
												setSettingsMsg({ text: t('auth.errors.imageTooLarge') as string, type: 'error' });
												return;
											}
											setEditAvatarPreview(compressed);
										} catch (error) {
											console.error('[Dashboard] Avatar compression failed:', error);
											setSettingsMsg({ text: t('auth.errors.imageTooLarge') as string, type: 'error' });
										}
									}}
								/>
								<p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '8px' }}>{t('auth.clickToChangeAvatar')}</p>
							</div>

							{/* Username */}
							<div style={{ marginBottom: '12px' }}>
								<label style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>{t('auth.username')}</label>
								<input className="glass-input" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} style={{ padding: '10px 14px' }} />
								{editUsername.length > 0 && (
									<div style={{
										fontSize: '0.75rem',
										textAlign: 'start',
										paddingInlineStart: '0.75rem',
										marginTop: '4px',
										color: isUsernameValid ? '#4ade80' : '#f87171',
										transition: 'color 0.2s ease',
									}}>
										{isUsernameValid ? '✓' : '✗'} {t('auth.validation.username6Chars')}
									</div>
								)}
							</div>

							{/* Display Name */}
							<div style={{ marginBottom: '12px' }}>
								<label style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>{t('auth.displayName')}</label>
								<input className="glass-input" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} placeholder={t('auth.optional') as string} style={{ padding: '10px 14px' }} />
							</div>

							{/* Save Profile */}
							<button
								className="glass-btn-primary"
								disabled={isSaving || !isUsernameValid}
								onClick={async () => {
									const token = localStorage.getItem('auth_token');
									if (!token) return;
									setIsSaving(true);
									try {
										const res = await fetch('/api/auth/profile', {
											method: 'PATCH',
											headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
											body: JSON.stringify({ 
												username: editUsername, 
												displayName: editDisplayName,
												avatarUrl: editAvatarPreview || undefined 
											})
										});
										const data = await res.json().catch(() => ({}));
										if (!res.ok || data.error) {
											setSettingsMsg({ text: err(data?.error || data?.message || (t('auth.errors.failedToSave') as string)), type: 'error' });
											setIsSaving(false);
											return;
										}
										const updated = data;
										setProfile(updated);
										setSettingsMsg({ text: t('auth.messages.profileSaved') as string, type: 'success' });
									} catch (errObj: any) {
										setSettingsMsg({ text: err(errObj.message), type: 'error' });
									}
									setIsSaving(false);
								}}
								style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
							>
								{isSaving ? t('auth.saving') : t('auth.saveProfile')}
							</button>

							{/* --- Change Password (collapsible) --- */}
							<div style={{ marginTop: '5px' }}>
								<button 
									onClick={() => setShowPasswordSection(!showPasswordSection)}
									className="glass-panel"
									style={{ 
										width: '100%', 
										display: 'flex', 
										justifyContent: 'space-between', 
										alignItems: 'center', 
										padding: '12px 16px',
										cursor: 'pointer',
										border: '1px solid rgba(255,255,255,0.1)',
										background: 'rgba(255,255,255,0.05)',
										marginBottom: showPasswordSection ? '10px' : '0',
										transition: 'all 0.2s ease',
										textAlign: 'start'
									}}
								>
									<span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t('auth.changePassword')}</span>
									<span style={{ 
										transform: showPasswordSection ? 'rotate(180deg)' : 'rotate(0deg)', 
										transition: 'transform 0.3s ease',
										fontSize: '0.8rem',
										opacity: 0.5
									}}>
										▼
									</span>
								</button>

								{showPasswordSection && (
									<div style={{ padding: '5px 0' }}>
										{/* Current Password */}
										<div style={{ marginBottom: '12px' }}>
											<label style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>{t('auth.currentPassword')}</label>
											<input className="glass-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ padding: '10px 14px' }} />
										</div>

										{/* New Password */}
										<div style={{ marginBottom: '12px' }}>
											<label style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>{t('auth.newPassword')}</label>
											<input className="glass-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ padding: '10px 14px' }} />
											{newPassword.length > 0 && (
												<div style={{
													display: 'grid',
													gridTemplateColumns: '1fr 1fr',
													gap: '0.25rem 1rem',
													padding: '0.5rem 0.75rem',
													borderRadius: '8px',
													background: 'rgba(255,255,255,0.03)',
													border: '1px solid rgba(255,255,255,0.08)',
													fontSize: '0.75rem',
													textAlign: 'start',
													marginTop: '8px'
												}}>
													{([
														['minLength', t('auth.validation.password8Chars')],
														['hasUppercase', t('auth.validation.passwordUppercase')],
														['hasLowercase', t('auth.validation.passwordLowercase')],
														['hasDigit', t('auth.validation.passwordDigit')],
														['hasSpecial', t('auth.validation.passwordSpecial')],
													] as const).map(([key, label]) => (
														<span key={key} style={{
															color: passwordChecks[key] ? '#4ade80' : '#f87171',
															transition: 'color 0.2s ease',
														}}>
															{passwordChecks[key] ? '✓' : '✗'} {label}
														</span>
													))}
												</div>
											)}
										</div>

										{/* Confirm New Password */}
										<div style={{ marginBottom: '12px' }}>
											<label style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>{t('auth.confirmPassword')}</label>
											<input className="glass-input" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} style={{ padding: '10px 14px' }} />
											{confirmNewPassword.length > 0 && (
												<div style={{
													fontSize: '0.75rem',
													textAlign: 'start',
													paddingInlineStart: '0.75rem',
													marginTop: '4px',
													color: passwordsMatch ? '#4ade80' : '#f87171',
													transition: 'color 0.2s ease',
												}}>
													{passwordsMatch ? '✓' : '✗'} {t('auth.validation.passwordsMatch')}
												</div>
											)}
										</div>

										{/* Change Password button */}
										<button
											className="glass-btn"
											disabled={!currentPassword || !isPasswordStrong || !passwordsMatch}
											onClick={async () => {
												const token = localStorage.getItem('auth_token');
												if (!token) return;
												try {
													const res = await fetch('/api/auth/change-password', {
														method: 'POST',
														headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
														body: JSON.stringify({ currentPassword, newPassword })
													});
													const data = await res.json().catch(() => ({}));
													if (!res.ok) {
														setSettingsMsg({ text: err(data.error || data.message || t('common.failed') as string), type: 'error' });
														return;
													}
													if (data.error) {
														setSettingsMsg({ text: err(data.error), type: 'error' });
														return;
													}
													setCurrentPassword('');
													setNewPassword('');
													setConfirmNewPassword('');
													setSettingsMsg({ text: t('auth.messages.passwordUpdated') as string, type: 'success' });
												} catch (errObj: any) {
													setSettingsMsg({ text: err(errObj.message), type: 'error' });
												}
											}}
											style={{ width: '100%', padding: '10px' }}
										>
											{t('auth.changePassword')}
										</button>
									</div>
								)}
							</div>

							{/* Message */}
							{settingsMsg && (
								<div className="glass-error" style={{
									marginTop: '15px',
									color: settingsMsg.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
									background: settingsMsg.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 68, 68, 0.1)',
									borderColor: settingsMsg.type === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 68, 68, 0.3)',
								}}>
									{settingsMsg.text}
								</div>
							)}
						</>
					)}
				</div>
			)}

			<style>{`
				@keyframes slideDown {
					from { opacity: 0; transform: translateY(-10px) scale(0.95); }
					to { opacity: 1; transform: translateY(0) scale(1); }
				}

				/* Custom scrollbar */
				.glass-panel::-webkit-scrollbar,
				.glass-panel *::-webkit-scrollbar {
					width: 5px;
				}
				.glass-panel::-webkit-scrollbar-track,
				.glass-panel *::-webkit-scrollbar-track {
					background: transparent;
				}
				.glass-panel::-webkit-scrollbar-thumb,
				.glass-panel *::-webkit-scrollbar-thumb {
					background: rgba(255, 255, 255, 0.15);
					border-radius: 10px;
					border: 1px solid rgba(255, 255, 255, 0.05);
				}
				.glass-panel::-webkit-scrollbar-thumb:hover,
				.glass-panel *::-webkit-scrollbar-thumb:hover {
					background: rgba(255, 255, 255, 0.25);
				}
				
				/* Firefox support */
				.glass-panel,
				.glass-panel * {
					scrollbar-width: thin;
					scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
				}
			`}</style>
		</div>
	);
}

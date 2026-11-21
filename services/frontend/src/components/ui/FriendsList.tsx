import { useState, useEffect } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import { useTranslation } from '../../hooks/useTranslation';

export function FriendsList() {
	const { friends, fetchFriends, addFriend, removeFriend, createInvite, isLoading } = useUserStore();
	const { t, err } = useTranslation();
	const [tokenInput, setTokenInput] = useState('');
	const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
	const [inviteLink, setInviteLink] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState('list');

	useEffect(() => {
		fetchFriends();
	}, [fetchFriends]);

	const handleAddFriend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!tokenInput) return;
		try {
			await addFriend(tokenInput);
			setTokenInput('');
			setMessage({ text: t('friends.friendshipAccepted') as string, type: 'success' });
			setActiveTab('list');
		} catch (errObj: any) {
			setMessage({ text: err(errObj.message), type: 'error' });
		}
		setTimeout(() => setMessage(null), 3000);
	};

	const handleCreateInvite = async () => {
		try {
			const code = await createInvite();
			setInviteLink(code);
			navigator.clipboard.writeText(code);
			setMessage({ text: t('friends.codeGenerated') as string, type: 'success' });
		} catch (errObj: any) {
			setMessage({ text: err(errObj.message), type: 'error' });
		}
		setTimeout(() => setMessage(null), 3000);
	};

	return (
		<div className="friends-container" style={{ marginTop: '5px' }}>
			<div className="glass-panel" style={{ padding: '1.2rem', animation: 'none', background: 'rgba(255,255,255,0.02)' }}>
				<p style={{ fontSize: '0.8rem', marginBottom: '12px', opacity: 0.6, textAlign: 'center' }}>
					{t('friends.inviteWithCode')}
				</p>

				<button
					className="glass-btn-primary"
					onClick={handleCreateInvite}
					style={{ width: '100%', marginBottom: '15px', padding: '10px', fontSize: '0.85rem' }}
				>
					{t('friends.generateInviteCode')}
				</button>

				{inviteLink && (
					<div
						onClick={() => {
							navigator.clipboard.writeText(inviteLink);
							setMessage({ text: t('friends.codeCopied') as string, type: 'success' });
							setTimeout(() => setMessage(null), 2000);
						}}
						style={{
							textAlign: 'center',
							padding: '12px',
							background: 'rgba(0, 255, 204, 0.04)',
							border: '1px solid rgba(0, 255, 204, 0.15)',
							borderRadius: '10px',
							marginBottom: '15px',
							cursor: 'pointer'
						}}
					>
						<p style={{ margin: '0 0 4px 0', fontSize: '0.6rem', opacity: 0.5, textTransform: 'uppercase' }}>
							{t('friends.yourCode')}
						</p>
						<p style={{
							margin: 0,
							fontSize: '1.6rem',
							fontWeight: 700,
							color: 'var(--accent-primary)'
						}}>
							{inviteLink}
						</p>
					</div>
				)}

				<div style={{ position: 'relative', marginBottom: '10px' }}>
					<div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', width: '100%' }} />
					<span style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						background: '#1a1a1a',
						padding: '0 8px',
						fontSize: '0.6rem',
						opacity: 0.4
					}}>{t('friends.orAddFriend')}</span>
				</div>

				<form onSubmit={handleAddFriend} style={{ marginTop: '15px' }}>
					<input
						className="glass-input"
						placeholder={t('friends.enterCode') as string}
						value={tokenInput}
						onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
						style={{ marginBottom: '10px', textAlign: 'center', fontSize: '1rem', fontWeight: 600, padding: '10px' }}
						maxLength={6}
					/>
					<button type="submit" className="glass-btn" style={{ width: '100%', padding: '10px' }}>
						{t('friends.addFriend')}
					</button>
				</form>
			</div>

			{message && (
				<div className={`glass-error`} style={{
					marginTop: '15px',
					color: message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
					background: message.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 68, 68, 0.1)',
					borderColor: message.type === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 68, 68, 0.3)',
				}}>
					{message.text}
				</div>
			)}
		</div>
	);
}

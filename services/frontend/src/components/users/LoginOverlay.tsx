import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * 
 * @description : Composant pour afficher le formulaire de connexion, on definit et gere ici le comportement du formulaire de connexion :
 * 
 * @methods : 
 * 	- LoginOverlay : composant principal
 * 	- isRegistering : instance de reference vers l'etat d'inscription
 * 	- email : instance de reference vers l'email
 * 	- username : instance de reference vers le nom d'utilisateur
 * 	- password : instance de reference vers le mot de passe
 * 	- confirmPassword : instance de reference vers la confirmation du mot de passe
 * 	- error : instance de reference vers l'erreur
 * 	- loading : instance de reference vers le chargement
 * 	- requires2fa : indique si le 2FA est requis apres le login
 * 	- twoFaCode : le code 2FA saisi par l'utilisateur
 * 	- handleSubmit : callback qui est appele lors de la soumission du formulaire
 * 	- handleRegister : callback qui est appele lors de l'inscription
 * 	- handleLogin : callback qui est appele lors de la connexion
 * 	- handle2faSubmit : callback qui est appele lors de la soumission du code 2FA
 * 
 */

export function LoginOverlay({ onLogin, onClose }: { onLogin: (token: string) => void, onClose?: () => void }) {
	const { t, err } = useTranslation();
	const [isRegistering, setIsRegistering] = useState(false);
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [requires2fa, setRequires2fa] = useState(false);
	const [twoFaCode, setTwoFaCode] = useState('');

	const ENDPOINT_REGISTER = '/api/auth/register';
	const ENDPOINT_LOGIN = '/api/auth/login';
	const ENDPOINT_2FA_VERIFY = '/api/auth/2fa/verify';

	/* ─── Password strength checks ─── */
	const passwordChecks = useMemo(() => ({
		minLength: password.length >= 8,
		hasUppercase: /[A-Z]/.test(password),
		hasLowercase: /[a-z]/.test(password),
		hasDigit: /[0-9]/.test(password),
		hasSpecial: /[^A-Za-z0-9]/.test(password),
	}), [password]);

	const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
	const isUsernameValid = username.length >= 6;

	const handle2faSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const res = await fetch(ENDPOINT_2FA_VERIFY, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, code: twoFaCode }),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message || t('auth.errors.twoFaFailed') as string);
			}
			const data = await res.json();
			if (data.access_token)
				onLogin(data.access_token);
			else
				throw new Error(t('auth.errors.noTokenReceived') as string);
		}
		catch (errObj: any) {
			setError(err(errObj.message));
		}
		finally {
			setLoading(false);
		}
	};
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (isRegistering && !isUsernameValid) {
			setError(t('auth.validation.usernameTooShort'));
			return;
		}

		if (isRegistering && !isPasswordStrong) {
			setError(t('auth.validation.passwordWeak'));
			return;
		}

		if (isRegistering && password !== confirmPassword) {
			setError(t('auth.validation.passwordsMismatch'));
			return;
		}

		setLoading(true);

		try {
			if (isRegistering) {
				const res = await fetch(ENDPOINT_REGISTER,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ email, username, password }),
					});
				const data = await res.json().catch(() => ({}));
				if (!res.ok || data.error) {
					setError(err(data?.error || data?.message || t('auth.errors.registrationFailed')));
					setLoading(false);
					return;
				}
				setIsRegistering(false);
				setError('');
				alert(t('auth.messages.registerSuccess'));
			}
			else {
				const res = await fetch(ENDPOINT_LOGIN,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ email, password }),
					});
				const data = await res.json().catch(() => ({}));
				if (!res.ok) {
					setError(err(data?.error || data?.message || t('common.error')));
					setLoading(false);
					return;
				}
				if (data.error) {
					setError(err(data.error));
					setLoading(false);
					return;
				}
				if (data.message) {
					setError(err(data.message));
					setLoading(false);
					return;
				}
				if (data.requires2fa) {
					setRequires2fa(true);
					setTwoFaCode('');
					setLoading(false);
					return;
				}
				if (data.access_token)
					onLogin(data.access_token);
				else
					setError(t('common.error'));
			}
		}
		catch (errObj: any) {
			setError(err(errObj.message));
		}
		finally {
			setLoading(false);
		}
	};

	const handleBack = () => {
		setRequires2fa(false);
		setTwoFaCode('');
		setError('');
	};

	/* ─── 2FA verification view ─── */
	if (requires2fa) {
		return (
			<>
				{/* Full-screen transparent overlay to prevent background interaction */}
				<div style={{
					position: 'fixed',
					inset: 0,
					backgroundColor: 'rgba(0, 0, 0, 0)',
					zIndex: 9,
					pointerEvents: 'auto',
				}} />
				<div className="glass-backdrop" style={{ zIndex: 10 }}>
				<div className="glass-card"
					style={{
						padding: '2.5rem 2rem',
						width: '512px',
						textAlign: 'center',
					}}
				>
					<h2 className="glass-title" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
						{t('auth.2fa.title')}
					</h2>

					<p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
						{t('auth.2fa.description')}
					</p>

					{error && <div className="glass-error" style={{ marginBottom: '1rem' }}>{error}</div>}

					<form onSubmit={handle2faSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
						<input
							className="glass-input"
							type="text"
							placeholder={t('auth.2fa.codePlaceholder')}
							required
							maxLength={6}
							value={twoFaCode}
							onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
							autoFocus
							style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }}
						/>
						<button
							className="glass-btn-primary"
							type="submit"
							disabled={loading || twoFaCode.length !== 6}
							style={{ marginTop: '0.5rem' }}
						>
							{loading ? t('auth.processing') : t('auth.2fa.verifyCode')}
						</button>
					</form>

					<p
						className="glass-link"
						style={{ marginTop: '1.2rem' }}
						onClick={handleBack}
					>
						{t('auth.2fa.backToLogin')}
					</p>
					</div>
				</div>
			</>
		);
	}

	/* ─── Login / Register view ─── */
	return (
		<>
			{/* Full-screen transparent overlay to prevent background interaction */}
			<div style={{
				position: 'fixed',
				inset: 0,
				backgroundColor: 'rgba(0, 0, 0, 0)',
				zIndex: 9,
				pointerEvents: 'auto',
			}} />
			<div className="glass-backdrop" style={{ zIndex: 10 }}>
			<div
				className="glass-card"
				style={{
					padding: '2.5rem 2rem',
					width: '512px',
					textAlign: 'center',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '1.5rem' }}>
					{onClose && !isRegistering && (
						<button 
							onClick={onClose}
							className="glass-btn"
							style={{ position: 'absolute', left: 0, padding: '0.4rem 0.8rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}
							title={t('common.back') as string}
						>
							&lt;
						</button>
					)}
					<h2 className="glass-title" style={{ margin: 0 }}>
						{isRegistering ? t('auth.register') : t('auth.login')}
					</h2>
				</div>

				{error && <div className="glass-error" style={{ marginBottom: '1rem' }}>{error}</div>}

				<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
					<input
						className="glass-input"
						type="email"
						placeholder={t('auth.email')}
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					{isRegistering && (
						<>
							<input
								className="glass-input"
								type="text"
								placeholder={t('auth.username')}
								required
								value={username}
								onChange={(e) => setUsername(e.target.value)}
							/>
							{username.length > 0 && (
								<div style={{
									fontSize: '0.75rem',
									textAlign: 'start',
									paddingInlineStart: '0.75rem',
									marginTop: '-0.5rem',
									color: isUsernameValid ? '#4ade80' : '#f87171',
									transition: 'color 0.2s ease',
								}}>
									{isUsernameValid ? '✓' : '✗'} {t('auth.validation.username6Chars')}
								</div>
							)}
						</>
					)}
					<input
						className="glass-input"
						type="password"
						placeholder={t('auth.password')}
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					{isRegistering && password.length > 0 && (
						<div style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '0.25rem 1rem',
							padding: '0.5rem 0.75rem',
							borderRadius: '8px',
							background: 'rgba(255,255,255,0.03)',
							border: '1px solid var(--glass-border)',
							fontSize: '0.75rem',
							textAlign: 'start',
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
					{isRegistering && (
						<input
							className="glass-input"
							type="password"
							placeholder={t('auth.confirmPassword')}
							required
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					)}
					<button
						className="glass-btn-primary"
						type="submit"
						disabled={loading}
						style={{ marginTop: '0.5rem' }}
					>
						{loading ? t('auth.processing') : (isRegistering ? t('auth.register') : t('auth.login'))}
					</button>
				</form>

				{!isRegistering && (
					<>
						<div style={{
							display: 'flex',
							alignItems: 'center',
							gap: '1rem',
							margin: '1.2rem 0',
						}}>
							<div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
							<span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', letterSpacing: '1px' }}>{t('common.or')}</span>
							<div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
						</div>
						<button
							className="glass-btn-primary"
							onClick={() => window.location.href = '/api/auth/42'}
							style={{
								width: '100%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '0.5rem',
							}}
						>
							<span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>42</span>
							{t('auth.loginWith42')}
						</button>
					</>
				)}

				<p
					className="glass-link"
					style={{ marginTop: '1.2rem' }}
					onClick={() => setIsRegistering(!isRegistering)}
				>
					{isRegistering ? t('auth.alreadyHaveAccount') : t('auth.needAccount')}
				</p>
				</div>
			</div>
		</>
	);
}

import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

/**
 *
 * @description : Composant pour afficher l'overlay de chargement.
 *
 */

export function ConnectionOverlay() {
	const { t } = useTranslation();

	return (
		<div className="glass-overlay-full">
			<div className="glass-spinner" />
			<h2 className="glass-title" style={{ fontSize: '1.2rem' }}>
				{t('connection.loading')}
			</h2>
			<p style={{
				color: 'var(--text-secondary)',
				margin: 0,
				letterSpacing: '0.5px',
				fontSize: '0.9rem',
			}}>
				{t('connection.synchronizing')}
			</p>
		</div>
	);
}

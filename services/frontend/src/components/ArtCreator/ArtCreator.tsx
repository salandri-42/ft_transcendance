import React, { useCallback, useRef, useState } from 'react';

import { DEFAULT_THICKNESS, MIN_COLORED_PERCENT } from './constants';
import { useArtCanvas } from './hooks/useArtCanvas';
import { useEscapeToClose } from './hooks/useEscapeToClose';
import { useVisibility } from './hooks/useVisibility';
import { useTranslation } from '../../hooks/useTranslation';
import { styles } from './styles';
import type { ArtCreatorProps } from './types';
import { getColoredCoveragePercent } from './utils';

export function ArtCreator({ colors, onShare, onClose }: ArtCreatorProps) {
	const { t } = useTranslation();
	const defaultColor = colors[0] ?? '#e74c3c';
	const isVisible = useVisibility();

	const colorRef = useRef(defaultColor);
	const thicknessRef = useRef(DEFAULT_THICKNESS);

	const [selectedColor, setSelectedColor] = useState(defaultColor);
	const [thickness, setThicknessState] = useState(DEFAULT_THICKNESS);
	const [shareError, setShareError] = useState('');
	const [showNameDialog, setShowNameDialog] = useState(false);
	const [artName, setArtName] = useState('');

	useEscapeToClose(onClose);

	const selectColor = useCallback((color: string) => {
		colorRef.current = color;
		setSelectedColor(color);
	}, []);

	const setThickness = useCallback((value: number) => {
		thicknessRef.current = value;
		setThicknessState(value);
	}, []);

	const { wrapperRef, rendererRef, resetCanvas } = useArtCanvas({
		colorRef,
		thicknessRef,
		onThicknessChange: setThickness,
		onStrokeStart: () => setShareError(''),
	});

	const handleReset = useCallback(() => {
		resetCanvas();
		setShareError('');
	}, [resetCanvas]);

	const handleShare = useCallback(() => {
		const gl = rendererRef.current?.gl;
		if (!gl) return;

		const canvas = gl.canvas as HTMLCanvasElement;
		const coloredCoveragePercent = getColoredCoveragePercent(canvas);

		if (coloredCoveragePercent < MIN_COLORED_PERCENT) {
			setShareError(t('art.notEnoughContent'));
			return;
		}

		setShareError('');
		setShowNameDialog(true);
		setArtName('');
	}, [t]);

	const handleFinalShare = useCallback(async () => {
		if (!artName.trim()) {
			setShareError(t('art.nameRequired'));
			return;
		}

		const gl = rendererRef.current?.gl;
		if (!gl) return;

		const canvas = gl.canvas as HTMLCanvasElement;
		const dataUrl = canvas.toDataURL('image/png');

		console.log(`Art name: ${artName}`);

		canvas.toBlob(async (blob) => {
			if (blob) {
				const arrayBuffer = await blob.arrayBuffer();
				onShare(dataUrl, arrayBuffer, artName);
			} else {
				setShareError(t('art.captureFailed'));
			}
		}, 'image/jpeg', 0.9);

		setShowNameDialog(false);
		setArtName('');
	}, [artName, onShare, rendererRef, t]);

	const brushIndicatorStyle: React.CSSProperties = {
		width: 28,
		height: 28,
		borderRadius: '50%',
		background: selectedColor,
		opacity: 0.6,
		transition: 'width 0.1s, height 0.1s',
	};

	const getSwatchStyle = (color: string): React.CSSProperties => ({
		...styles.swatch,
		backgroundColor: color,
		border: color === selectedColor ? '2px solid #ffffff' : '2px solid transparent',
	});

	return (
		<div
			style={{
				...styles.backdrop,
				transition: 'opacity 1.2s ease-out, transform 2.1s cubic-bezier(0.16, 1, 0.3, 1)',
				opacity: isVisible ? 1 : 0,
				transform: `scale(${isVisible ? 1 : 0.05}) translateY(${isVisible ? '0px' : '40px'})`,
				pointerEvents: isVisible ? 'auto' : 'none',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexDirection: 'column',
			}}
		>
			<div style={styles.card}>
				<div style={styles.topCard}>
					<div style={styles.topCardRow}>
						<div style={styles.brushIndicator}>
							<div style={brushIndicatorStyle} />
							<span style={styles.brushLabel}>{Math.round(thickness)}px</span>
						</div>
						<div style={styles.errorContainer}>
							{showNameDialog ? (
								<input
									type="text"
									value={artName}
									onChange={(e) => setArtName(e.target.value.slice(0, 64))}
									maxLength={64}
									placeholder={t('art.namePlaceholder')}
									autoFocus
									style={{
										width: '100%',
										border: 'none',
										background: 'transparent',
										color: 'rgba(255, 255, 255, 0.95)',
										fontSize: '20px',
										boxSizing: 'border-box',
										fontFamily: 'inherit',
										outline: 'none',
										opacity: 1,
										transition: 'opacity 0.3s ease-in-out',
										textAlign: 'center',
										cursor: 'cell',
									}}
									onKeyPress={(e) => {
										if (e.key === 'Enter') {
											handleFinalShare();
										}
									}}
								/>
							) : shareError ? (
								<span style={styles.shareError}>
									{shareError}
								</span>
							) : null}
						</div>
						<button onClick={handleReset} style={styles.resetBtn} title={t('art.resetTitle')}>
							{t('art.reset')}
						</button>
					</div>
				</div>
				<div ref={wrapperRef} style={styles.canvasWrapper}>
				</div>
				<div style={styles.controls}>
					<div style={styles.palette}>
						{colors.map((color) => (
							<button
								key={color}
								onClick={() => selectColor(color)}
								style={getSwatchStyle(color)}
								aria-label={`Select color ${color}`}
							/>
						))}
					</div>
					<div style={styles.shareActions}>
						<button onClick={showNameDialog ? handleFinalShare : handleShare} style={styles.shareBtn}>
							{showNameDialog ? t('art.confirm') : t('art.share')}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTranslation } from '../../hooks/useTranslation';

function useIsMobile() {
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
	useEffect(() => {
		const handler = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener('resize', handler);
		return () => window.removeEventListener('resize', handler);
	}, []);
	return isMobile;
}

type StartToutProps = {
	onStart: () => void;
};

function CyanDice() {
	const meshRef = useRef<THREE.Mesh>(null);
	const strokeRef = useRef<THREE.LineSegments>(null);

	useFrame((_, delta) => {
		if (meshRef.current) {
			meshRef.current.rotation.x += delta * 0.3;
			meshRef.current.rotation.y += delta * 0.4;
		}
		if (strokeRef.current) {
			strokeRef.current.rotation.x += delta * 0.3;
			strokeRef.current.rotation.y += delta * 0.4;
		}
	});

	return (
		<group position={[0, 0, 0]}>
			{/* Dark matte faces */}
			<mesh ref={meshRef}>
				<icosahedronGeometry args={[1.5, 2]} />
				<meshStandardMaterial
					color="#000000"
					roughness={0.85}
					metalness={0.15}
					side={THREE.DoubleSide}
				/>
			</mesh>

			{/* Cyan glowing edges */}
			<lineSegments
				ref={strokeRef}
				onUpdate={(self: THREE.LineSegments) => self.computeLineDistances()}
			>
				<edgesGeometry args={[new THREE.IcosahedronGeometry(1.52, 2)]} />
				<lineDashedMaterial
					color="cyan"
					opacity={0.3}
					transparent={true}
					depthWrite={false}
				/>
			</lineSegments>
		</group>
	);
}

function SlidePanel({
	label,
	position,
	children,
}: {
	label: string;
	position: 'left' | 'right';
	children: React.ReactNode;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const isMobile = useIsMobile();

	return (
		<>
			<span
				style={{
					color: 'rgba(255, 255, 255, 0.7)',
					fontSize: '18px',
					letterSpacing: '2px',
					cursor: 'pointer',
					transition: 'color 0.3s',
					fontWeight: 500,
					zIndex: 100,
				}}
				onClick={() => setIsOpen(true)}
				onMouseEnter={(e) => {
					e.currentTarget.style.color = 'cyan';
					if (!isMobile) setIsOpen(true);
				}}
			>
				{label}
			</span>

			{/* Overlay */}
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100vw',
					height: '100vh',
					background: 'rgba(0, 0, 0, 0.5)',
					opacity: isOpen ? 1 : 0,
					pointerEvents: isOpen ? 'auto' : 'none',
					transition: 'opacity 0.3s ease',
					zIndex: 998,
				}}
				onClick={() => setIsOpen(false)}
			/>

			{/* Slide Panel */}
			<div
				onMouseLeave={() => { if (!isMobile) setIsOpen(false); }}
				style={{
					position: 'fixed',
					top: 0,
					left: isMobile ? 0 : (position === 'left' ? 0 : 'auto'),
					right: isMobile ? 0 : (position === 'right' ? 0 : 'auto'),
					width: isMobile ? '100vw' : '50vw',
					height: '100vh',
					background: 'rgba(5, 5, 5, 0.98)',
					borderRight: !isMobile && position === 'left' ? '1px solid rgba(0, 255, 255, 0.2)' : 'none',
					borderLeft: !isMobile && position === 'right' ? '1px solid rgba(0, 255, 255, 0.2)' : 'none',
					transform: isOpen
						? 'translateX(0)'
						: isMobile
							? 'translateY(100%)'
							: position === 'left'
								? 'translateX(-100%)'
								: 'translateX(100%)',
					transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
					zIndex: 999,
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{/* Close button */}
				<button
					onClick={() => setIsOpen(false)}
					style={{
						position: 'absolute',
						top: '24px',
						right: isMobile ? '24px' : (position === 'left' ? '24px' : 'auto'),
						left: !isMobile && position === 'right' ? '24px' : 'auto',
						background: 'none',
						border: 'none',
						color: 'rgba(255, 255, 255, 0.5)',
						fontSize: '24px',
						cursor: 'pointer',
						transition: 'color 0.2s',
						zIndex: 10,
					}}
					onMouseEnter={(e) => (e.currentTarget.style.color = 'cyan')}
					onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
				>
					✕
				</button>

				{/* Scrollable Content */}
				<div
					style={{
						flex: 1,
						overflowY: 'auto',
						padding: isMobile ? '70px 24px 40px 24px' : '80px 60px 60px 60px',
						fontSize: '14px',
						letterSpacing: 'normal',
						color: 'rgba(255, 255, 255, 0.9)',
						fontWeight: 400,
					}}
				>
					{children}
				</div>
			</div>
		</>
	);
}

function AboutContent() {
	const { t } = useTranslation();
	return (
		<>
			<h2
				style={{
					color: 'cyan',
					fontSize: '14px',
					letterSpacing: '3px',
					marginBottom: '40px',
					fontWeight: 500,
				}}
			>
				{t('sanctuary.title')}
			</h2>

			{/* Quote */}
			<blockquote
				style={{
					borderLeft: '2px solid cyan',
					paddingLeft: '24px',
					marginBottom: '50px',
					fontStyle: 'italic',
				}}
			>
				<p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '18px', lineHeight: 1.8, margin: 0 }}>
					{t('sanctuary.quote')}
				</p>
			</blockquote>

			<section style={{ marginBottom: '50px' }}>
				<h3 style={{ color: 'white', fontSize: '20px', marginBottom: '20px', fontWeight: 400 }}>
					{t('sanctuary.essence.title')}
				</h3>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.9, marginBottom: '16px' }}>
					{t('sanctuary.essence.description1')}
				</p>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.9 }}>
					{t('sanctuary.essence.description2')}
				</p>
			</section>

			<section style={{ marginBottom: '50px' }}>
				<h3 style={{ color: 'white', fontSize: '20px', marginBottom: '20px', fontWeight: 400 }}>
					{t('sanctuary.die.title')}
				</h3>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.9, marginBottom: '16px' }}>
					{t('sanctuary.die.description')}
				</p>
				<p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', lineHeight: 1.8, fontStyle: 'italic' }}>
					{t('sanctuary.die.philosophy')}
				</p>
			</section>

			<section style={{ marginBottom: '50px' }}>
				<h3 style={{ color: 'white', fontSize: '20px', marginBottom: '20px', fontWeight: 400 }}>
					{t('sanctuary.states.title')}
				</h3>
				<div style={{ marginBottom: '20px' }}>
					<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>
						{t('sanctuary.states.dormant.title')}
					</h4>
					<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8 }}>
						{t('sanctuary.states.dormant.description')}
					</p>
				</div>
				<div style={{ marginBottom: '20px' }}>
					<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>
						{t('sanctuary.states.active.title')}
					</h4>
					<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8 }}>
						{t('sanctuary.states.active.description')}
					</p>
				</div>
				<div>
					<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>
						{t('sanctuary.states.creative.title')}
					</h4>
					<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8 }}>
						{t('sanctuary.states.creative.description')}
					</p>
				</div>
			</section>

			<section style={{ marginBottom: '50px' }}>
				<h3 style={{ color: 'white', fontSize: '20px', marginBottom: '20px', fontWeight: 400 }}>
					{t('sanctuary.stars.title')}
				</h3>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.9, marginBottom: '16px' }}>
					{t('sanctuary.stars.description1')}
				</p>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.9, marginBottom: '16px' }}>
					{t('sanctuary.stars.description2')}
				</p>
				<p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', lineHeight: 1.8, fontStyle: 'italic' }}>
					{t('sanctuary.stars.description3')}
				</p>
			</section>

			<section style={{ marginBottom: '50px' }}>
				<h3 style={{ color: 'white', fontSize: '20px', marginBottom: '20px', fontWeight: 400 }}>
					{t('sanctuary.blockchain.title')}
				</h3>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.9, marginBottom: '16px' }}>
					{t('sanctuary.blockchain.description')}
				</p>
				<p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', lineHeight: 1.8, fontStyle: 'italic' }}>
					{t('sanctuary.blockchain.philosophy')}
				</p>
			</section>

			<section>
				<h3 style={{ color: 'white', fontSize: '20px', marginBottom: '20px', fontWeight: 400 }}>
					{t('sanctuary.whatNotIs.title')}
				</h3>
				<ul
					style={{
						color: 'rgba(255, 255, 255, 0.7)',
						fontSize: '14px',
						lineHeight: 2.2,
						paddingLeft: '20px',
						listStyle: 'none',
					}}
				>
					<li>{t('sanctuary.whatNotIs.notGame')}</li>
					<li>{t('sanctuary.whatNotIs.notSocialNetwork')}</li>
					<li>{t('sanctuary.whatNotIs.notGallery')}</li>
					<li>{t('sanctuary.whatNotIs.notDemo')}</li>
				</ul>
				<p style={{ color: 'cyan', fontSize: '15px', marginTop: '24px', fontWeight: 400 }}>
					{t('sanctuary.whatNotIs.place')}
				</p>
			</section>
		</>
	);
}

function LegalContent() {
	const { t } = useTranslation();
	return (
		<>
			<h2
				style={{
					color: 'cyan',
					fontSize: '14px',
					letterSpacing: '3px',
					marginBottom: '40px',
					fontWeight: 500,
				}}
			>
				{t('legal.title')}
			</h2>

			{/* Terms of Service */}
			<section style={{ marginBottom: '50px' }}>
				<h3 style={{ color: 'white', fontSize: '20px', marginBottom: '24px', fontWeight: 400 }}>
					{t('legal.terms.title')}
				</h3>

				<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
					{t('legal.terms.acceptance.title')}
				</h4>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '24px' }}>
					{t('legal.terms.acceptance.description')}
				</p>

				<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
					{t('legal.terms.nature.title')}
				</h4>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '24px' }}>
					{t('legal.terms.nature.description')}
				</p>

				<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
					{t('legal.terms.creation.title')}
				</h4>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '24px' }}>
					{t('legal.terms.creation.description')}
				</p>

				<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
					{t('legal.terms.blockchain.title')}
				</h4>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '24px' }}>
					{t('legal.terms.blockchain.description')}
				</p>

				<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
					{t('legal.terms.irreversibility.title')}
				</h4>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '24px' }}>
					{t('legal.terms.irreversibility.description')}
				</p>

				<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
					{t('legal.terms.account.title')}
				</h4>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '24px' }}>
					{t('legal.terms.account.description')}
				</p>

				<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
					{t('legal.terms.behavior.title')}
				</h4>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '24px' }}>
					{t('legal.terms.behavior.description')}
				</p>
			</section>

			{/* Privacy Policy */}
			<section style={{ marginBottom: '50px' }}>
				<h3 style={{ color: 'white', fontSize: '20px', marginBottom: '24px', fontWeight: 400 }}>
					{t('legal.privacy.title')}
				</h3>

				<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
					{t('legal.privacy.dataCollected.title')}
				</h4>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '24px' }}>
					{t('legal.privacy.dataCollected.description')}
				</p>

				<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
					{t('legal.privacy.dataUse.title')}
				</h4>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '24px' }}>
					{t('legal.privacy.dataUse.description')}
				</p>

				<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
					{t('legal.privacy.ai.title')}
				</h4>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '24px' }}>
					{t('legal.privacy.ai.description')}
				</p>

				<h4 style={{ color: 'cyan', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
					{t('legal.privacy.security.title')}
				</h4>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '24px' }}>
					{t('legal.privacy.security.description')}
				</p>
			</section>

			{/* Cookie Policy */}
			<section style={{ marginBottom: '50px' }}>
				<h3 style={{ color: 'white', fontSize: '20px', marginBottom: '24px', fontWeight: 400 }}>
					{t('legal.cookies.title')}
				</h3>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '20px' }}>
					{t('legal.cookies.description1')}
				</p>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8 }}>
					{t('legal.cookies.description2')}
				</p>
			</section>

			{/* Intellectual Property */}
			<section style={{ marginBottom: '50px' }}>
				<h3 style={{ color: 'white', fontSize: '20px', marginBottom: '24px', fontWeight: 400 }}>
					{t('legal.ip.title')}
				</h3>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8, marginBottom: '20px' }}>
					{t('legal.ip.description')}
				</p>
			</section>

			{/* Contact */}
			<section>
				<h3 style={{ color: 'white', fontSize: '20px', marginBottom: '24px', fontWeight: 400 }}>
					{t('legal.contact.title')}
				</h3>
				<p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.8 }}>
					{t('legal.contact.description')} <span style={{ color: 'cyan' }}>{t('legal.contact.email')}</span>
				</p>
				<p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginTop: '40px' }}>
					{t('legal.lastUpdated')}
				</p>
			</section>
		</>
	);
}

export function StartTout({ onStart }: StartToutProps) {
	const { t } = useTranslation();
	return (
		<>
			<style>
				{`
					@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

					/* Custom scrollbar */
					::-webkit-scrollbar {
						width: 6px;
					}
					::-webkit-scrollbar-track {
						background: rgba(255, 255, 255, 0.05);
					}
					::-webkit-scrollbar-thumb {
						background: rgba(0, 255, 255, 0.3);
						border-radius: 3px;
					}
					::-webkit-scrollbar-thumb:hover {
						background: rgba(0, 255, 255, 0.5);
					}

					/* Responsive */
					.st-header {
						padding: 32px 24px 0;
					}
					.st-title {
						font-size: 32px;
						letter-spacing: 12px;
					}
					.st-nav {
						font-size: 11px;
						letter-spacing: 4px;
					}
					.st-canvas {
						width: 400px;
						height: 400px;
					}
					.st-btn-wrap {
						width: auto;
					}
					.st-btn-wrap .glass-btn-primary {
						width: auto;
					}

					@media (max-width: 768px) {
						.st-header {
							padding: 20px 16px 0;
						}
						.st-title {
							font-size: 20px;
							letter-spacing: 6px;
						}
						.st-nav {
							font-size: 10px;
						}
						.st-canvas {
							width: 240px;
							height: 240px;
						}
						.st-btn-wrap {
							width: calc(100% - 48px);
						}
						.st-btn-wrap .glass-btn-primary {
							width: 100%;
						}
					}
				`}
			</style>
			<div
				style={{
					width: '100vw',
					height: '100vh',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					background: '#000000',
					position: 'relative',
					gap: '24px',
					fontFamily: "'Space Grotesk', sans-serif",
					overflow: 'hidden',
				}}
			>
				{/* Header — centré vertical */}
				<header
					className="st-header"
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '10px',
						zIndex: 100,
					}}
				>
					{/* TRANSCENDENCE Logo */}
					<h1
						className="st-title"
						style={{
							color: 'white',
							fontWeight: 300,
							margin: 0,
						}}
					>
						TRANSCENDENCE
					</h1>

					{/* ABOUT | LEGAL row */}
					<nav
						className="st-nav"
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '16px',
							color: 'rgba(255,255,255,0.35)',
							fontWeight: 500,
						}}
					>
						<SlidePanel label={t('sanctuary.aboutNav')} position="left">
							<AboutContent />
						</SlidePanel>
						<span style={{ color: 'rgba(255,255,255,0.2)', userSelect: 'none' }}>|</span>
						<SlidePanel label={t('sanctuary.legalNav')} position="right">
							<LegalContent />
						</SlidePanel>
					</nav>
				</header>

				{/* 3D Canvas with Dice */}
				<div className="st-canvas">
					<Canvas
						camera={{ position: [0, 0, 5], fov: 50 }}
						gl={{ antialias: true, alpha: true }}
						style={{ width: '100%', height: '100%' }}
					>
						<ambientLight intensity={0.3} />
						<pointLight position={[5, 5, 5]} intensity={0.5} />
						<pointLight position={[-5, -5, 5]} intensity={0.3} color="#00d2d2" />
						<CyanDice />
					</Canvas>
				</div>

				{/* Start Tour button */}
				<div className="st-btn-wrap">
					<button
						onClick={onStart}
						className="glass-btn-primary"
					>
						{t('dashboard.startTour')}
					</button>
				</div>
			</div>
		</>
	);
}

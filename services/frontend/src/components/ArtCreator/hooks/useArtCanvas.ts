import { useCallback, useEffect, useRef } from 'react';
import { Renderer, Vec3 } from 'ogl';

import {
	MAX_THICKNESS,
	MIN_THICKNESS,
	THICKNESS_STEP,
} from '../constants';
import type { Stroke } from '../types';
import {
	clamp,
	createInitialPoints,
	createStroke,
	initRenderer,
	screenToClip,
	updateActiveStroke,
} from '../utils';

interface UseArtCanvasParams {
	colorRef: React.MutableRefObject<string>;
	thicknessRef: React.MutableRefObject<number>;
	onThicknessChange: (value: number) => void;
	onStrokeStart: () => void;
}

interface UseArtCanvasResult {
	wrapperRef: React.RefObject<HTMLDivElement | null>;
	rendererRef: React.RefObject<Renderer | null>;
	strokesRef: React.RefObject<Stroke[]>;
	resetCanvas: () => void;
}

export function useArtCanvas({
	colorRef,
	thicknessRef,
	onThicknessChange,
	onStrokeStart,
}: UseArtCanvasParams): UseArtCanvasResult {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const rendererRef = useRef<Renderer | null>(null);
	const strokesRef = useRef<Stroke[]>([]);
	const rafRef = useRef(0);

	const mouseRef = useRef<Vec3>(new Vec3());
	const prevMouseRef = useRef<Vec3>(new Vec3());
	const velocityRef = useRef(0);
	const isDrawingRef = useRef(false);
	const onThicknessChangeRef = useRef(onThicknessChange);
	const onStrokeStartRef = useRef(onStrokeStart);

	useEffect(() => {
		onThicknessChangeRef.current = onThicknessChange;
	}, [onThicknessChange]);

	useEffect(() => {
		onStrokeStartRef.current = onStrokeStart;
	}, [onStrokeStart]);

	useEffect(() => {
		if (!wrapperRef.current) return;

		const { renderer, gl, canvas, scene } = initRenderer(wrapperRef.current);
		rendererRef.current = renderer;
		mouseRef.current = new Vec3();

		const updateMousePosition = (e: MouseEvent) => {
			const clip = screenToClip(e, canvas);
			prevMouseRef.current.copy(mouseRef.current);
			mouseRef.current.set(clip.x, clip.y, 0);
			const dx = mouseRef.current[0] - prevMouseRef.current[0];
			const dy = mouseRef.current[1] - prevMouseRef.current[1];
			const speed = Math.sqrt(dx * dx + dy * dy);
			velocityRef.current += (speed - velocityRef.current) * 0.4;
		};

		const handleMouseDown = (e: MouseEvent) => {
			if (e.button !== 0) return;
			onStrokeStartRef.current();
			updateMousePosition(e);
			isDrawingRef.current = true;

			const points = createInitialPoints(mouseRef.current[0], mouseRef.current[1]);
			const stroke = createStroke(gl, scene, points, colorRef.current, thicknessRef.current);
			strokesRef.current.push(stroke);
		};

		const handleMouseMove = (e: MouseEvent) => {
			updateMousePosition(e);
			canvas.style.cursor = isDrawingRef.current ? 'none' : 'crosshair';
		};

		const handleStrokeEnd = () => {
			isDrawingRef.current = false;
			canvas.style.cursor = 'crosshair';
			velocityRef.current = 0;

			for (const stroke of strokesRef.current) {
				stroke.frozen = true;
			}
		};

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			const delta = e.deltaY > 0 ? -THICKNESS_STEP : THICKNESS_STEP;
			const newThickness = clamp(thicknessRef.current + delta, MIN_THICKNESS, MAX_THICKNESS);
			onThicknessChangeRef.current(newThickness);
		};

		canvas.addEventListener('mousedown', handleMouseDown);
		canvas.addEventListener('mousemove', handleMouseMove);
		canvas.addEventListener('mouseup', handleStrokeEnd);
		canvas.addEventListener('mouseleave', handleStrokeEnd);
		canvas.addEventListener('wheel', handleWheel, { passive: false });

		const tmp = new Vec3();

		const animate = () => {
			rafRef.current = requestAnimationFrame(animate);

			for (const stroke of strokesRef.current) {
				if (!stroke.frozen) {
					updateActiveStroke(stroke, mouseRef.current, velocityRef.current, tmp);
				}
			}

			renderer.render({ scene });
		};
		animate();

		return () => {
			cancelAnimationFrame(rafRef.current);
			canvas.removeEventListener('mousedown', handleMouseDown);
			canvas.removeEventListener('mousemove', handleMouseMove);
			canvas.removeEventListener('mouseup', handleStrokeEnd);
			canvas.removeEventListener('mouseleave', handleStrokeEnd);
			canvas.removeEventListener('wheel', handleWheel);
			canvas.remove();
		};
	}, [colorRef, thicknessRef]);

	const resetCanvas = useCallback(() => {
		for (const stroke of strokesRef.current) {
			stroke.polyline.mesh.setParent(null);
		}
		strokesRef.current = [];
	}, []);

	return { wrapperRef, rendererRef, strokesRef, resetCanvas };
}

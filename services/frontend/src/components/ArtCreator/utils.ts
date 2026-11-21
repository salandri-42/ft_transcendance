import { Color, Polyline, Renderer, Transform, Vec3 } from 'ogl';

import {
	BACKGROUND_RGB,
	CANVAS_SIZE,
	COLOR_DELTA_THRESHOLD,
	STROKE_ALPHA,
	STROKE_FRICTION,
	STROKE_SPRING,
	TRAIL_COUNT,
} from './constants';
import { POLYLINE_FRAGMENT, POLYLINE_VERTEX } from './shaders';
import type { Stroke } from './types';

export function screenToClip(e: MouseEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
	const rect = canvas.getBoundingClientRect();
	return {
		x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
		y: ((e.clientY - rect.top) / rect.height) * -2 + 1,
	};
}

export function createInitialPoints(x: number, y: number): Vec3[] {
	return Array.from({ length: TRAIL_COUNT }, () => new Vec3(x, y, 0));
}

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function createStroke(
	gl: Renderer['gl'],
	scene: Transform,
	points: Vec3[],
	color: string,
	thickness: number,
): Stroke {
	const polyline = new Polyline(gl, {
		points,
		vertex: POLYLINE_VERTEX,
		fragment: POLYLINE_FRAGMENT,
		uniforms: {
			uColor: { value: new Color(color) },
			uThickness: { value: thickness },
			uAlpha: { value: STROKE_ALPHA },
			uVelocity: { value: 0 },
		},
	});

	polyline.mesh.setParent(scene);
	polyline.mesh.program.depthTest = false;
	polyline.mesh.program.transparent = true;

	return {
		points,
		polyline,
		spring: STROKE_SPRING,
		friction: STROKE_FRICTION,
		mouseVelocity: new Vec3(),
		frozen: false,
	};
}

export function updateActiveStroke(stroke: Stroke, mouse: Vec3, velocity: number, tmp: Vec3): void {
	(stroke.polyline as any).mesh.program.uniforms.uVelocity.value = velocity;

	for (let i = stroke.points.length - 1; i >= 0; i -= 1) {
		if (i === 0) {
			tmp.copy(mouse).sub(stroke.points[i]).multiply(stroke.spring);
			stroke.mouseVelocity.add(tmp).multiply(stroke.friction);
			stroke.points[i].add(stroke.mouseVelocity);
		} else {
			const t = 0.45 + 0.45 * (1 - i / stroke.points.length);
			stroke.points[i].lerp(stroke.points[i - 1], t);
		}
	}

	stroke.polyline.updateGeometry();
}

export function initRenderer(container: HTMLDivElement) {
	const renderer = new Renderer({
		dpr: 2,
		width: CANVAS_SIZE,
		height: CANVAS_SIZE,
		preserveDrawingBuffer: true,
	});

	const gl = renderer.gl;
	gl.clearColor(0.96, 0.96, 0.96, 1);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	const canvas = gl.canvas as HTMLCanvasElement;
	canvas.style.display = 'block';
	canvas.style.cursor = 'crosshair';
	container.prepend(canvas);

	const scene = new Transform();

	return { renderer, gl, canvas, scene };
}

export function getColoredCoveragePercent(canvas: HTMLCanvasElement): number {
	const probeCanvas = document.createElement('canvas');
	probeCanvas.width = canvas.width;
	probeCanvas.height = canvas.height;

	const probeCtx = probeCanvas.getContext('2d');
	if (!probeCtx) return 0;

	probeCtx.drawImage(canvas, 0, 0);
	const { data } = probeCtx.getImageData(0, 0, probeCanvas.width, probeCanvas.height);
	const totalPixels = probeCanvas.width * probeCanvas.height;
	let coloredPixels = 0;

	for (let i = 0; i < data.length; i += 4) {
		const alpha = data[i + 3] / 255;
		if (alpha <= 0) continue;

		const delta =
			Math.abs(data[i] - BACKGROUND_RGB) +
			Math.abs(data[i + 1] - BACKGROUND_RGB) +
			Math.abs(data[i + 2] - BACKGROUND_RGB);

		if (delta > COLOR_DELTA_THRESHOLD) {
			coloredPixels += 1;
		}
	}

	if (totalPixels === 0) return 0;
	return (coloredPixels / totalPixels) * 100;
}

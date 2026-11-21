declare module 'ogl' {
	export class Renderer {
		constructor(options?: {
			canvas?: HTMLCanvasElement;
			width?: number;
			height?: number;
			dpr?: number;
			alpha?: boolean;
			depth?: boolean;
			stencil?: boolean;
			antialias?: boolean;
			premultipliedAlpha?: boolean;
			preserveDrawingBuffer?: boolean;
			powerPreference?: string;
			autoClear?: boolean;
			webgl?: number;
		});
		gl: OGLRenderingContext;
		setSize(width: number, height: number): void;
		render(options: { scene: Transform }): void;
		width: number;
		height: number;
	}

	export interface OGLRenderingContext extends WebGLRenderingContext {
		canvas: HTMLCanvasElement;
		renderer: Renderer;
	}

	export class Transform {
		children: Transform[];
		parent: Transform | null;
		addChild(child: Transform): void;
		removeChild(child: Transform): void;
		setParent(parent: Transform | null): void;
	}

	export class Vec3 extends Array<number> {
		constructor(x?: number, y?: number, z?: number);
		set(x: number, y?: number, z?: number): this;
		copy(v: Vec3): this;
		add(v: Vec3 | number): this;
		sub(v: Vec3 | number): this;
		multiply(v: Vec3 | number): this;
		lerp(v: Vec3, t: number): this;
		clone(): Vec3;
	}

	export class Vec2 extends Array<number> {
		constructor(x?: number, y?: number);
	}

	export class Color extends Array<number> {
		constructor(color?: string | number | number[]);
	}

	export class Program {
		depthTest: boolean;
		depthWrite: boolean;
		transparent: boolean;
		constructor(gl: OGLRenderingContext, options?: Record<string, unknown>);
	}

	export class Mesh extends Transform {
		program: Program;
		setParent(parent: Transform | null): void;
	}

	export class Geometry {
		constructor(gl: OGLRenderingContext, attributes?: Record<string, unknown>);
	}

	export class Polyline {
		mesh: Mesh;
		points: Vec3[];
		constructor(gl: OGLRenderingContext, options?: {
			points?: Vec3[];
			vertex?: string;
			fragment?: string;
			uniforms?: Record<string, { value: unknown }>;
		});
		updateGeometry(): void;
		resize(): void;
	}
}

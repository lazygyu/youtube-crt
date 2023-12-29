import webglUtils from './webgl-utils';
import {vertexShaderContent} from './vertexShader';
import {fragShaderContent} from './fragmentShader';

function setRectangle(gl: WebGL2RenderingContext, x: number, y: number, width: number, height: number) {
    const x1 = x, x2 = x + width;
    const y1 = y, y2 = y + height;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
}

type GlParams = {
    positionBuffer: WebGLBuffer;
    texCoordBuffer: WebGLBuffer;
    resolutionUniformLocation: WebGLUniformLocation;
    vao: WebGLVertexArrayObject;
    texture: WebGLTexture;
    positionAttributeLocation: number;
    texCoordAttributeLocation: number;
    program: any;
    brightBlurUniformLocation: WebGLUniformLocation;
    imageLocation: WebGLUniformLocation
    pixelSizeUniformLocation: WebGLUniformLocation;
};

export class CRTSimulator {
    private readonly ctx!: WebGL2RenderingContext;

    private glParams: GlParams | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('webgl2')!;
        this.initGl();
    }

    initGl() {
        const gl = this.ctx;
        const program = webglUtils.createProgramFromSources(gl, [vertexShaderContent, fragShaderContent]);
        if (!program) {
            console.error('failed to create the program');
            return;
        }
        console.log('program has been created!');

        const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')!;
        const texCoordAttributeLocation = gl.getAttribLocation(program, 'a_texCoord')!;

        const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution')!;
        const brightBlurUniformLocation = gl.getUniformLocation(program, 'u_brightBlur')!;
        const pixelSizeUniformLocation = gl.getUniformLocation(program, 'u_pixelSize')!;
        const imageLocation = gl.getUniformLocation(program, 'u_image')!;

        const vao = gl.createVertexArray()!;
        gl.bindVertexArray(vao);

        const positionBuffer = gl.createBuffer()!;
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        const texCoordBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        const sizeMultiplier = 3;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0, 0.0,
            sizeMultiplier, 0.0,
            0.0, sizeMultiplier,
            0.0, sizeMultiplier,
            sizeMultiplier, 0.0,
            sizeMultiplier, sizeMultiplier
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(texCoordAttributeLocation);
        gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        const texture = gl.createTexture()!;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        this.glParams = {
            program,
            positionAttributeLocation,
            texCoordAttributeLocation,
            imageLocation,
            texCoordBuffer,
            positionBuffer,
            texture,
            resolutionUniformLocation,
            brightBlurUniformLocation,
            pixelSizeUniformLocation,
            vao,
        };
    }

    render(img: TexImageSource & {width: number, height: number}, options?: {brightBlur?: number, pixelSize?: number}) {
        if (!this.glParams) return;

        this.clearViewport();

        const gl = this.ctx;
        gl.useProgram(this.glParams.program);
        gl.bindVertexArray(this.glParams.vao);

        const brightBlur = (options && options.brightBlur) ? options.brightBlur : 0;

        gl.uniform1f(this.glParams.brightBlurUniformLocation, brightBlur);
        gl.uniform2f(this.glParams.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1ui(this.glParams.pixelSizeUniformLocation, options?.pixelSize ?? 1);

        gl.uniform1i(this.glParams.imageLocation, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.glParams.positionBuffer);
        setRectangle(gl, 0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    private clearViewport() {
        const gl = this.ctx;
        webglUtils.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
}

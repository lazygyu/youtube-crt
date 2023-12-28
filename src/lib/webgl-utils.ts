// webgl-utils.ts

type WebGLShaderType = WebGLRenderingContextBase['VERTEX_SHADER'] | WebGLRenderingContextBase['FRAGMENT_SHADER'];
type ErrorMsgCallback = (msg: string) => void;

interface WebGLUtils {
    createProgram(gl: WebGLRenderingContext, shaders: WebGLShader[], opt_attribs?: string[], opt_locations?: number[], opt_errorCallback?: ErrorMsgCallback): WebGLProgram | null;
    createProgramFromScripts(gl: WebGLRenderingContext, shaderScriptIds: string[], opt_attribs?: string[], opt_locations?: number[], opt_errorCallback?: ErrorMsgCallback): WebGLProgram | null;
    createProgramFromSources(gl: WebGLRenderingContext, shaderSources: string[], opt_attribs?: string[], opt_locations?: number[], opt_errorCallback?: ErrorMsgCallback): WebGLProgram | null;
    resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, multiplier?: number): boolean;
}


const topWindow = window;

function isInIFrame(w?: Window): boolean {
    w = w || topWindow ;
    return w !== w.top;
}

if (!isInIFrame()) {
    console.log("%c%s", 'color:blue;font-weight:bold;', 'for more about webgl-utils.js see:');
    console.log("%c%s", 'color:blue;font-weight:bold;', 'http://webgl2fundamentals.org/webgl/lessons/webgl-boilerplate.html');
}

function error(msg: string): void {
    if (topWindow.console) {
        if (topWindow.console.error) {
            topWindow.console.error(msg);
        } else if (topWindow.console.log) {
            topWindow.console.log(msg);
        }
    }
}

const errorRE = /ERROR:\s*\d+:(\d+)/gi;

function addLineNumbersWithError(src: string, log = ''): string {
    const matches = [...log.matchAll(errorRE)];
    const lineNoToErrorMap = new Map(matches.map((m, ndx) => {
        const lineNo = parseInt(m[1]);
        const next = matches[ndx + 1];
        const end = next ? next.index : log.length;
        const msg = log.substring(m.index || 0, end);
        return [lineNo - 1, msg];
    }));
    return src.split('\n').map((line, lineNo) => {
        const err = lineNoToErrorMap.get(lineNo);
        return `${lineNo + 1}: ${line}${err ? `\n\n^^^ ${err}` : ''}`;
    }).join('\n');
}

function loadShader(gl: WebGLRenderingContext, shaderSource: string, shaderType: WebGLShaderType, opt_errorCallback?: ErrorMsgCallback): WebGLShader | null {
    const errFn = opt_errorCallback || error;
    const shader = gl.createShader(shaderType)!;
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
        const lastError = gl.getShaderInfoLog(shader);
        errFn(`Error compiling shader: ${lastError}\n${addLineNumbersWithError(shaderSource, lastError || undefined)}`);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl: WebGLRenderingContext, shaders: WebGLShader[], opt_attribs?: string[], opt_locations?: number[], opt_errorCallback?: ErrorMsgCallback): WebGLProgram | null {
    const errFn = opt_errorCallback || error;
    const program = gl.createProgram()!;
    shaders.forEach((shader, index) => {
        gl.attachShader(program, shader);
        if (opt_attribs && opt_locations) {
            gl.bindAttribLocation(program, opt_locations[index], opt_attribs[index]);
        }
    });
    gl.linkProgram(program);
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        const lastError = gl.getProgramInfoLog(program);
        errFn(`Error in program linking: ${lastError}\n${
            shaders.map((shader, index) => {
                const src = addLineNumbersWithError(gl.getShaderSource(shader)!);
                const type = gl.getShaderParameter(shader, gl.SHADER_TYPE);
                return `type: ${type}:\n${src}`;
            }).join('\n')
        }`);
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

function createShaderFromScript(gl: WebGLRenderingContext, scriptId: string, opt_shaderType?: WebGLShaderType, opt_errorCallback?: ErrorMsgCallback): WebGLShader | null {
    let shaderSource = "";
    let shaderType: WebGLShaderType | undefined;
    const shaderScript = document.getElementById(scriptId) as HTMLScriptElement;
    if (!shaderScript) {
        throw new Error(`*** Error: unknown script element ${scriptId}`);
    }
    shaderSource = shaderScript.text;

    if (!opt_shaderType) {
        if (shaderScript.type === "x-shader/x-vertex") {
            shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript.type === "x-shader/x-fragment") {
            shaderType = gl.FRAGMENT_SHADER;
        } else {
            throw new Error("*** Error: unknown shader type");
        }
    }

    return loadShader(gl, shaderSource, opt_shaderType || shaderType!, opt_errorCallback);
}

const defaultShaderType: WebGLShaderType[] = [
    WebGL2RenderingContext.prototype.VERTEX_SHADER,
    WebGL2RenderingContext.prototype.FRAGMENT_SHADER,
];

function createProgramFromScripts(gl: WebGLRenderingContext, shaderScriptIds: string[], opt_attribs?: string[], opt_locations?: number[], opt_errorCallback?: ErrorMsgCallback): WebGLProgram | null {
    const shaders: WebGLShader[] = [];
    for (let i = 0; i < shaderScriptIds.length; ++i) {
        const shader = createShaderFromScript(gl, shaderScriptIds[i], defaultShaderType[i], opt_errorCallback);
        if (shader) {
            shaders.push(shader);
        }
    }
    return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
}

function createProgramFromSources(gl: WebGLRenderingContext, shaderSources: string[], opt_attribs?: string[], opt_locations?: number[], opt_errorCallback?: ErrorMsgCallback): WebGLProgram | null {
    const shaders: WebGLShader[] = [];
    for (let i = 0; i < shaderSources.length; ++i) {
        const shader = loadShader(gl, shaderSources[i], defaultShaderType[i], opt_errorCallback);
        if (shader) {
            shaders.push(shader);
        }
    }
    return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, multiplier = 1): boolean {
    const width = (canvas.clientWidth * multiplier) | 0;
    const height = (canvas.clientHeight * multiplier) | 0;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}

export default {
    createProgram,
    createProgramFromScripts,
    createProgramFromSources,
    resizeCanvasToDisplaySize,
};

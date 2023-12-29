export const fragShaderContent = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_brightBlur;
uniform uint u_pixelSize;

in vec2 v_texCoord;
out vec4 outColor;

float modI(float a, float b) {
	float m = a - floor((a+0.5)/b)*b;
	return floor(m+0.5);
}

void main() {
    float pixelSize = float(u_pixelSize) * 3.0;
	vec2 fragCoord = gl_FragCoord.xy;
	float ix = mod(fragCoord.x, pixelSize);
	float iy = mod(fragCoord.y, pixelSize);

	if (iy < 1.0) {
		outColor = vec4(0, 0, 0, 0);
		return;
	} 

	vec2 tcoord = v_texCoord / 3.0;
	vec4 cl = texture(u_image, tcoord);

	vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));
	vec4 brightAvg = 
		texture(u_image, tcoord + onePixel * vec2(-1,  0)) +
		texture(u_image, tcoord + onePixel * vec2( 1,  0)) +
		texture(u_image, tcoord + onePixel * vec2( 0, -1)) +
		texture(u_image, tcoord + onePixel * vec2( 0,  1)) ;
	float brightness = (0.299 * brightAvg.r + 0.587 * brightAvg.g + 0.114 * brightAvg.b) * u_brightBlur;
	brightness = (brightness * brightness);

	if (ix < pixelSize / 3.0) {
		outColor = vec4(cl.r + brightness, 0, 0, 1);
	} else if (ix < pixelSize / 3.0 + 1.0) {
		outColor = vec4(0, cl.g + brightness, 0, 1);
	} else {
		outColor = vec4(0, 0, cl.b + brightness, 1);
	}
}
`;

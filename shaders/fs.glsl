#version 300 es

precision mediump float;

in vec3 fsNormal;
in vec3 fsPosition; 
in vec2 uvFS;

out vec4 outColor;

uniform sampler2D u_texture;

uniform vec3 mEmissColor; //material emission color 
uniform vec3 mSpecColor; //material specular color
uniform float mSpecPower; //power of specular ref

uniform vec3 lightDirection; //directional light direction vec
uniform vec3 lightColor; //directional light color 

uniform vec3 eyePosition; //Observer's position

uniform vec3 spotLightPos1;
uniform vec3 spotLightPos2;
uniform vec3 spotLightDir;
uniform vec3 spotLightColor;
uniform float spotLightTarget;
uniform float spotLightDecay;
uniform float outerCone;
uniform float innerCone;

uniform float ambCoeff;
uniform float ambAlpha;

vec3 f_diff(vec3 lx, vec3 n) {

	vec3 txt_col = texture(u_texture, uvFS).xyz;
	return txt_col * clamp(dot(normalize(lx), n), 0.0, 1.0);
}

vec3 f_spec(vec3 lx, vec3 eye_dir, vec3 n) {
	
	lx = normalize(lx);
	vec3 r = 2.0 * dot(lx, n) * n - lx;
	return mSpecColor * pow(clamp(dot(eye_dir, r), 0.0, 1.0), mSpecPower);
}

vec3 f_BRDF(vec3 lx, vec3 eye_dir, vec3 n) {
	
	return clamp(f_diff(lx, n) + f_spec(lx, eye_dir, n), 0.0, 1.0);
}

vec3 spot_light(vec3 l_spot, vec3 lx, vec3 spot_dir) {
	
	return l_spot *
			pow(spotLightTarget / length(lx), spotLightDecay) *
			clamp((dot(normalize(lx), spot_dir) - cos(radians(outerCone/2.0))) / (cos(radians(innerCone/2.0)) - cos(radians(outerCone/2.0))), 0.0, 1.0);
}

void main() {

	vec3 nEyeDirection = normalize(eyePosition - fsPosition);
	vec3 nLightDirection = - normalize(lightDirection);
	vec3 nNormal = normalize(fsNormal);
	
	vec3 nSpotLightDir = - normalize(spotLightDir);
	vec3 lx1 = spotLightPos1 - fsPosition;
	vec3 lx2 = spotLightPos2 - fsPosition;
	
	// f_x = f_diff + f_spec

	// outColor = L_dir*f_dir + L_spec*f_spec + L_spot*f_spot

	vec3 dirLight = lightColor * f_BRDF(nLightDirection, nEyeDirection, nNormal);
	
	vec3 spotLight1 = spot_light(spotLightColor, lx1, nSpotLightDir) * f_BRDF(lx1, nEyeDirection, nNormal);
	vec3 spotLight2 = spot_light(spotLightColor, lx2, nSpotLightDir) * f_BRDF(lx2, nEyeDirection, nNormal);
	
	vec3 ambientLight = texture(u_texture, uvFS).xyz * ambCoeff * ambAlpha;

	outColor = vec4(clamp(dirLight + spotLight1 + spotLight2 + ambientLight + mEmissColor, 0.0, 1.0), texture(u_texture, uvFS).a);
}
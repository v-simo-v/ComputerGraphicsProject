#version 300 es

in vec3 inPosition;
in vec3 inNormal;
in vec2 a_uv;

out vec2 uvFS;
out vec3 fsNormal;
out vec3 fsPosition;  

uniform mat4 matrix; 
uniform mat4 nMatrix;     //matrix do transform normals
uniform mat4 pMatrix;     //matrix do transform positions

void main() {
	fsNormal = mat3(nMatrix) * inNormal; 
	fsPosition = (pMatrix * vec4(inPosition, 1.0)).xyz;
	uvFS = a_uv;
	gl_Position = matrix * vec4(inPosition,1.0);
}
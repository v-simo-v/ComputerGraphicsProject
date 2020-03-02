function main() {

	var canvas = document.getElementById("c");
	
	canvas.addEventListener("mousedown", doMouseDown, false);
	canvas.addEventListener("mouseup", doMouseUp, false);
	canvas.addEventListener("mousemove", doMouseMove, false);
	window.addEventListener("keyup", keyFunctionUp, false);
	window.addEventListener("keydown", keyFunctionDown, false);
	
	var gl = canvas.getContext("webgl2");
	if(!gl) {
		document.write("GL context not opened");
		return;
	}
	
	aspectRatio = canvas.clientWidth/canvas.clientHeight;
	
	window.onresize = doResize;
	
	utils.resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clearColor(0.85, 0.85, 0.85, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	
	// load and compile shaders
	utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
		var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
		var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
		program = utils.createProgram(gl, vertexShader, fragmentShader);
	});
	gl.useProgram(program);
	
	// set memory locations defined in the shaders
	var positionAttributeLocation = gl.getAttribLocation(program, "inPosition");  
	var uvAttributeLocation = gl.getAttribLocation(program, "a_uv");   
	var normalAttributeLocation = gl.getAttribLocation(program, "inNormal");   
	var textLocation = gl.getUniformLocation(program, "u_texture");
	
	var matrixLocation = gl.getUniformLocation(program, "matrix"); 
	var normalMatrixPositionHandle = gl.getUniformLocation(program, 'nMatrix');
	var vertexMatrixPositionHandle = gl.getUniformLocation(program, 'pMatrix');
	
	var eyePositionHandle = gl.getUniformLocation(program, 'eyePosition');
	var lightDirectionHandle = gl.getUniformLocation(program, 'lightDirection');
	var spotLightPos1Handle = gl.getUniformLocation(program, 'spotLightPos1');
	var spotLightPos2Handle = gl.getUniformLocation(program, 'spotLightPos2');
	var spotLightDirHandle = gl.getUniformLocation(program, 'spotLightDir');
	
	var materialSpecPowerHandle = gl.getUniformLocation(program, 'mSpecPower');
	var ambientCoeffHandle = gl.getUniformLocation(program, 'ambCoeff');
	var ambientAlphaHandle = gl.getUniformLocation(program, 'ambAlpha');
	var spotLightTargetHandle = gl.getUniformLocation(program, 'spotLightTarget');
	var spotLightDecayHandle = gl.getUniformLocation(program, 'spotLightDecay');
	var outerConeHandle = gl.getUniformLocation(program, 'outerCone');
	var innerConeHandle = gl.getUniformLocation(program, 'innerCone');
	
	var materialEmissColorHandle = gl.getUniformLocation(program, 'mEmissColor');
	var lightColorHandle = gl.getUniformLocation(program, 'lightColor');
	var materialSpecColorHandle = gl.getUniformLocation(program, 'mSpecColor');
	var spotLightColorHandle = gl.getUniformLocation(program, 'spotLightColor');
	
	var spotLight;
	var slLights;
	
	var loadingTextures = true;
	var textureImages = [];
	var textureImageNames = [];
	var textureLoaded = [];
	
	// load assets
	for(var i = 0; i < roadAssetsJSONs.length; i++) {
		roadAssets[i] = loadAsset(JSONRoadsDir, roadAssetsJSONs[i], true);
	}
	
	for(var i = 0; i < roadOrnamentAssetsJSONs.length; i++) {
		roadOrnamentAssets[i] = loadAsset(JSONRoadOrnamentsDir, roadOrnamentAssetsJSONs[i], false);
	}
	
	cloudAsset = loadAsset(JSONRoadsDir, cloudAssetsJSON, true);
	
	for(var i = 0; i < vehicleAssetsJSONs.length; i++) {
		vehicleAssets[i] = loadAsset(JSONVehiclesDir, vehicleAssetsJSONs[i], true);
		setCarDimensions(i);
	}
	
	initRoadMap();
	
	var W = utils.MakeWorld(carX, carY, carZ, 0.0, carAngle, 0.0, 1.0);
	
	var nC = utils.multiplyMatrixVector(W, [lookRadius*driverPosX, lookRadius*driverPosY, lookRadius*driverPosZ, 1.0]);
	
	camX = nC[0];
	camY = nC[1];
	camZ = nC[2];
	
	drawScene();
	
	function setImageCallback(img, txt, minFilter) {
		img.onload = function() {
			gl.bindTexture(gl.TEXTURE_2D, txt);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			if(minFilter) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.generateMipmap(gl.TEXTURE_2D);
		};
	}

	function doResize() {
		// set canvas dimensions
		if((window.innerWidth > 40) && (window.innerHeight > 240)) {
			canvas.width  = window.innerWidth - 16;
			canvas.height = window.innerHeight - 200;
			var w = canvas.clientWidth;
			var h = canvas.clientHeight;
			
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.viewport(0.0, 0.0, w, h);
			
			aspectRatio = w/h;
		}
	}

	function animate() {
		currentTime = (new Date).getTime();
		if(lastUpdateTime) {
			
			var deltaC = (30 * (currentTime - lastUpdateTime)) / 1000.0;
			
			sunRise = ((sunRise + deltaC/500 + Math.PI) % (2*Math.PI)) - Math.PI;
			
			directionalLightDir = [-Math.sin(sunRise), -Math.cos(sunRise), 0.0];
			
			var oldNx = Nx;
			var oldNy = Ny;
			
			Nx = Math.round(-carX/roadDistance);
			Ny = Math.round(carZ/roadDistance);
			
			if(Nx - oldNx != 0) {
				shiftMapX(oldNx - Nx);
			}
			if(Ny - oldNy != 0) {
				shiftMapY(oldNy - Ny);
			}
			
			// car headlights and street lamp lights
			if(Math.abs(sunRise) < utils.degToRad(60.0)) {
				spotLight = [0.0, 0.0, 0.0];
				slLights = [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]];
			}
			else {
				spotLight = spotLightColor;
				slLights = [[0.0, 0.0, 0.0], streetLampEmiss];
			}
			
			var WVP = computeCarWVP(vz, steeringDir);
			
			worldMatrix = WVP[0];
			viewMatrix = WVP[1];
			perspectiveMatrix = WVP[2];
			
			generateMap();
		}
		
		lastUpdateTime = currentTime;               
	}
	
	// define transformation matrices, positions and directions for camera space
	var lightDirMatrix;
	
	var lDir;
	
	var spotLightMatrix;
	var spotLightMatrix_inv_t;
	var spotPos1;
	var spotPos2;
	var spotDir;
	
	var dirLightColor;
	
	function drawScene() {
		
		if(loadedTextures()) {
			
			animate();

			utils.resizeCanvasToDisplaySize(gl.canvas);
			
			// sky color
			skyAlpha = Math.min(Math.max((Math.cos(sunRise)/Math.cos(utils.degToRad(60.0)) + 1) / 2, 0.0), 1.0);
			
			var th = 0.5;
			if(skyAlpha < th) {
				skyColor[0] = (skyAlpha*sunsetLightColor[0] + (th-skyAlpha)*darkLightColor[0])/th;
				skyColor[1] = (skyAlpha*sunsetLightColor[1] + (th-skyAlpha)*darkLightColor[1])/th;
				skyColor[2] = (skyAlpha*sunsetLightColor[2] + (th-skyAlpha)*darkLightColor[2])/th;
			}
			else {
				skyColor[0] = ((1-skyAlpha)*sunsetLightColor[0] + (skyAlpha-th)*dayLightColor[0])/(1-th);
				skyColor[1] = ((1-skyAlpha)*sunsetLightColor[1] + (skyAlpha-th)*dayLightColor[1])/(1-th);
				skyColor[2] = ((1-skyAlpha)*sunsetLightColor[2] + (skyAlpha-th)*dayLightColor[2])/(1-th);
			}
			ambientLightAlpha = 1.0;
			
			gl.clearColor(skyColor[0], skyColor[1], skyColor[2], 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			
			/*gl.frontFace(gl.CW);
			gl.enable(gl.CULL_FACE);
			gl.cullFace(gl.FRONT);*/
			
			lightDirMatrix = utils.invertMatrix(utils.transposeMatrix(viewMatrix));
			
			lDir = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(lightDirMatrix), directionalLightDir);
			
			// car headlights positions in object space
			spotLightPos1 = [carWidth[carIndex]/2*0.7, carHeight[carIndex]*0.25, carLength[carIndex]/2];
			spotLightPos2 = [-carWidth[carIndex]/2*0.7, carHeight[carIndex]*0.25, carLength[carIndex]/2];
			
			spotLightMatrix = utils.multiplyMatrices(viewMatrix, utils.MakeWorld(carX, carY, carZ, 0.0, carAngle, 0.0, 1.0));
			spotLightMatrix_inv_t = utils.invertMatrix(utils.transposeMatrix(spotLightMatrix));
			
			spotPos1 = utils.multiplyMatrixVector(spotLightMatrix, [spotLightPos1[0], spotLightPos1[1], spotLightPos1[2], 1.0]);
			spotPos2 = utils.multiplyMatrixVector(spotLightMatrix, [spotLightPos2[0], spotLightPos2[1], spotLightPos2[2], 1.0]);
			spotDir = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(spotLightMatrix_inv_t), spotLightDir);
			
			lightAlpha = Math.min(Math.max((Math.cos(sunRise) - Math.sin(utils.degToRad(-10.0)))/(Math.sin(utils.degToRad(30.0)) - Math.sin(utils.degToRad(-10.0))), 0.0), 1.0);		
			dirLightColor = [lightAlpha*directionalLightColor[0], lightAlpha*directionalLightColor[1], lightAlpha*directionalLightColor[2]];
			
			// set uniforms
			gl.uniform3fv(lightDirectionHandle, lDir);
			gl.uniform3fv(lightColorHandle, dirLightColor);
			gl.uniform3fv(materialSpecColorHandle, specularColor);
			gl.uniform1f(materialSpecPowerHandle, specularPower);    
			gl.uniform3fv(eyePositionHandle, [0.0, 0.0, 0.0]);
			gl.uniform3fv(spotLightColorHandle, spotLight);
			gl.uniform3fv(spotLightPos1Handle, [spotPos1[0], spotPos1[1], spotPos1[2]]);
			gl.uniform3fv(spotLightPos2Handle, [spotPos2[0], spotPos2[1], spotPos2[2]]);
			gl.uniform3fv(spotLightDirHandle, spotDir);
			gl.uniform1f(spotLightTargetHandle, spotLightTarget);
			gl.uniform1f(spotLightDecayHandle, spotLightDecay);
			gl.uniform1f(outerConeHandle, outerCone);
			gl.uniform1f(innerConeHandle, innerCone);
			gl.uniform1f(ambientCoeffHandle, ambientLightCoeff);
			gl.uniform1f(ambientAlphaHandle, ambientLightAlpha);
			
			var worldMatrix;
			var ornamentLocalMatrix;
			
			// world matrix for clouds
			worldMatrix = utils.MakeWorld(carX + Math.cos(sunRise)*roadScale*10, roadScale*10, carZ + Math.cos(sunRise)*roadScale*10, 0.0, 0.0, 0.0, roadScale*0.25);
			drawAsset(cloudAsset, worldMatrix, viewMatrix, perspectiveMatrix);
			
			// draw map elements
			for(var x = 0; x < 2*mapDim+1; x++) {
				for(var y = 0; y < 2*mapDim+1; y++) {
					
					var currRoad = roadMap[x][y];
					
					if(currRoad && isVisible(x - mapDim, y - mapDim)) {
						ii = currRoad.roadNum;
						worldMatrix = utils.MakeWorld(-roadDistance*(x - mapDim + Nx), 0.0, roadDistance*(y - mapDim + Ny), 0.0, currRoad.rotation*90, 0.0, roadScale);
						drawAsset(roadAssets[ii], worldMatrix, viewMatrix, perspectiveMatrix);
						switch(ii) {
							case 0:
								// draw traffic lights
								for(j = 0; j < tlPoses.length; j++) {
									ornamentLocalMatrix = utils.MakeWorld(tlPoses[j][0], 0.034, tlPoses[j][1], 0.0, tlPoses[j][2], 0.0, 0.4);
									ornamentWorldMatrix = utils.multiplyMatrices(worldMatrix, ornamentLocalMatrix);
									
									// traffic light logic
									tlLights = [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]];
									
									if((((currentTime/(1000*tlRedDuration) % 2) < 1.0 - tlYellowDuration/tlRedDuration) && (tlPoses[j][2] % 180 == 0))
										|| ((((currentTime/(1000*tlRedDuration) + 1) % 2) < 1.0 - tlYellowDuration/tlRedDuration) && ((tlPoses[j][2] + 90) % 180 == 0))) {
										tlLights[3] = tlGreen;
									}
									else if((((currentTime/(1000*tlRedDuration) % 2) < 1.0) && (tlPoses[j][2] % 180 == 0))
										|| ((((currentTime/(1000*tlRedDuration) + 1) % 2) < 1.0) && ((tlPoses[j][2] + 90) % 180 == 0))){
										tlLights[2] = tlYellow;
									}
									else {
										tlLights[1] = tlRed;
									}
									drawAsset(roadOrnamentAssets[0], ornamentWorldMatrix, viewMatrix, perspectiveMatrix, tlLights);
								}
								break;
							case 1:
							case 3:
								// draw street lamps
								ornamentLocalMatrix = utils.MakeWorld(0.6, 0.034, 0.0, 0.0, 0.0, 0.0, 0.2);
								ornamentWorldMatrix = utils.multiplyMatrices(worldMatrix, ornamentLocalMatrix);
								drawAsset(roadOrnamentAssets[2], ornamentWorldMatrix, viewMatrix, perspectiveMatrix, slLights);
								
								ornamentLocalMatrix = utils.MakeWorld(-0.6, 0.034, 0.0, 0.0, 180, 0.0, 0.2);
								ornamentWorldMatrix = utils.multiplyMatrices(worldMatrix, ornamentLocalMatrix);
								drawAsset(roadOrnamentAssets[2], ornamentWorldMatrix, viewMatrix, perspectiveMatrix, slLights);
								break;
							case 2:
								// draw street lamps
								ornamentLocalMatrix = utils.MakeWorld(0.0, 0.034, 0.6, 0.0, -90, 0.0, 0.2);
								ornamentWorldMatrix = utils.multiplyMatrices(worldMatrix, ornamentLocalMatrix);
								drawAsset(roadOrnamentAssets[2], ornamentWorldMatrix, viewMatrix, perspectiveMatrix, slLights);
								break;
							case 6:
								// draw end road barrier
								ornamentLocalMatrix = utils.MakeWorld(0.0, 0.034, -0.65, 0.0, 0.0, 0.0, 0.6);
								ornamentWorldMatrix = utils.multiplyMatrices(worldMatrix, ornamentLocalMatrix);
								drawAsset(roadOrnamentAssets[1], ornamentWorldMatrix, viewMatrix, perspectiveMatrix);
								break;
						}
					}
				}
			}
			
			// draw car
			if(!firstPersonView) {
				worldMatrix = utils.MakeWorld(carX, carY, carZ, 0.0, carAngle - 90, 0.0, carScale[carIndex]);
				drawAsset(vehicleAssets[carIndex], worldMatrix, viewMatrix, perspectiveMatrix);
			}
		}
		else {
			// TEXTURE IMAGES STILL LOADING
		}
		window.requestAnimationFrame(drawScene);
	}
	
	// determine whether textures are loaded
	function loadedTextures() {
		if(!loadingTextures) return true;
		for(var i = 0; i < textureImages.length; i++) {
			if(!textureImages[i].complete) {
				return false;
			}
		}
		loadingTextures = false;
		return true;
	}
	
	function loadAsset(assetDir, assetFilename, align) {
		
		var assetModel;
		
		utils.get_json(assetDir + assetFilename, function(loadedModel){assetModel = loadedModel;});
		
		var assetIndicesSizes = [];
		var texture = [];
		var vao = [];
		var image;
		
		if(align) {
			assetModel.meshes = alignObj(assetModel.meshes);
		}
		
		for(var i = 0; i < assetModel.meshes.length; i++) {
			
			var assetVertices = assetModel.meshes[i].vertices;
			var assetIndices = [].concat.apply([], assetModel.meshes[i].faces);
			var assetNormals = assetModel.meshes[i].normals;
			assetIndicesSizes[i] = assetIndices.length;
			
			var meshMatIndex = assetModel.meshes[i].materialindex;
					  
			var UVFileNamePropertyIndex = -1;
			var diffuseColorPropertyIndex = -1;
			var specularColorPropertyIndex = -1;
			for (n = 0; n < assetModel.materials[meshMatIndex].properties.length; n++){
				if(assetModel.materials[meshMatIndex].properties[n].key == "$tex.file") UVFileNamePropertyIndex = n;
				if(assetModel.materials[meshMatIndex].properties[n].key == "$clr.diffuse") diffuseColorPropertyIndex = n;
				if(assetModel.materials[meshMatIndex].properties[n].key == "$clr.specular") specularColorPropertyIndex = n;
			}
			
			if(UVFileNamePropertyIndex >= 0) {
				
				var assetTexCoords = assetModel.meshes[i].texturecoords[0];
				var imageName = assetModel.materials[meshMatIndex].properties[UVFileNamePropertyIndex].value;
				
				vao[i] = gl.createVertexArray();
				gl.bindVertexArray(vao[i]);
				
				var positionBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(assetVertices), gl.STATIC_DRAW);
				gl.enableVertexAttribArray(positionAttributeLocation);
				gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
				
				var uvBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(assetTexCoords), gl.STATIC_DRAW);
				gl.enableVertexAttribArray(uvAttributeLocation);
				gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);
				
				var normalBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(assetNormals), gl.STATIC_DRAW);
				gl.enableVertexAttribArray(normalAttributeLocation);
				gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
				
				var indexBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(assetIndices), gl.STATIC_DRAW); 
				
				if(textureImageNames.indexOf(imageName) == -1) {
					
					texture[i] = textureLoaded.length;
					
					image = new Image();
					image.crossOrigin = "anonymous";
					image.src = assetDir + imageName;
					
					var txt = gl.createTexture();
					gl.bindTexture(gl.TEXTURE_2D, txt);
					setImageCallback(image, txt, !minFilterBlacklist.includes(imageName));
					
					textureImages[textureImages.length] = image;
					textureImageNames[textureImageNames.length] = imageName;
					textureLoaded[textureLoaded.length] = txt;
				}
				else {
					texture[i] = textureImageNames.indexOf(imageName);
				}
				
			}
		}
		return {"vaos" : vao, "textures" : texture, "bufferLength" : assetIndicesSizes};
	}
	
	function drawAsset(asset, worldMatrix, viewMatrix, perspectiveMatrix, materialEmissColors = false) {
		
		for(var i = 0; i < asset.vaos.length; i++) {
			
			var vwmatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
			var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, vwmatrix);
			var normalMatrix = utils.invertMatrix(utils.transposeMatrix(vwmatrix));
			
			if(asset.textures[i] >= 0) {	
				gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
				gl.uniformMatrix4fv(vertexMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(vwmatrix));
				gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(normalMatrix));
				
				if(materialEmissColors) {
					gl.uniform3fv(materialEmissColorHandle, materialEmissColors[i]);
				}
				else {
					// no material emission color is defined for this asset
					gl.uniform3fv(materialEmissColorHandle, [0.0, 0.0, 0.0]);
				}
				
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, textureLoaded[asset.textures[i]]);
				
				gl.bindVertexArray(asset.vaos[i]);
				gl.drawElements(gl.TRIANGLES, asset.bufferLength[i], gl.UNSIGNED_SHORT, 0);
			}
		}
	}
}

main();

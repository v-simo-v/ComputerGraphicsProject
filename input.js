var keyFunctionDown = function(e) {
	if(!keys[e.keyCode]) {
		keys[e.keyCode] = true;
		switch(e.keyCode) {
			case 65:
				steeringDir = 1;
				break;
			case 68:
				steeringDir = -1;
				break;
			case 87:
				vz = vz + 1.0;
				break;
			case 83:
				vz = vz - 1.0;
				break;
			case 37:
				if(firstPersonView) {
					deltaCamAngle_1 += 1.0;
				}
				else {
					deltaCamAngle_2 -= 1.0;
				}
				break;
			case 39:
				if(firstPersonView) {
					deltaCamAngle_1 -= 1.0;
				}
				else {
					deltaCamAngle_2 += 1.0;
				}
				break;
			case 38:
				if(firstPersonView) {
					deltaCamElevation_1 += 1.0;
				}
				else {
					deltaCamElevation_2 -= 1.0;
				}
				break;
			case 40:
				if(firstPersonView) {
					deltaCamElevation_1 -= 1.0;
				}
				else {
					deltaCamElevation_2 += 1.0;
				}
				break;
			case 82:
				if(firstPersonView) {
					camAngle = carAngle % 360 - 180;
					camElevation = 0.0;
					deltaCamAngle_1 = 0.0;
					deltaCamElevation_1 = 0.0;
					deltaCamAngle_2 = 0.0;
					deltaCamElevation_2 = 0.0;
					lookRadius = 1.0;
					deltaLookRadius = 0.0;
				}
				else {
					driverPosX = 0;
					driverPosY = 5;
					driverPosZ = -10;
					camAngle = Math.atan2(driverPosX, driverPosZ) / Math.PI * 180 + carAngle;
					planarDist = Math.sqrt(Math.pow(driverPosX, 2) + Math.pow(driverPosZ, 2));
					camElevation = -Math.atan2(driverPosY-lookAtPosY, planarDist) / Math.PI * 180;
					deltaCamAngle_2 = 0.0;
					deltaCamElevation_2 = 0.0;
					lookRadius = 1.0;
					deltaLookRadius = 0.0;
				}
				break;
			case 86:
				if(firstPersonView) {
					firstPersonView = false;
					driverPosX = 0;
					driverPosY = 5;
					driverPosZ = -10;
					camAngle = Math.atan2(driverPosX, driverPosZ) / Math.PI * 180 + carAngle;
					planarDist = Math.sqrt(Math.pow(driverPosX, 2) + Math.pow(driverPosZ, 2));
					camElevation = -Math.atan2(driverPosY-lookAtPosY, planarDist) / Math.PI * 180;
					deltaCamAngle_1 = 0.0;
					deltaCamElevation_1 = 0.0;
					deltaCamAngle_2 = 0.0;
					deltaCamElevation_2 = 0.0;
					lookRadius = 1.0;
					deltaLookRadius = 0.0;
				}
				else {
					firstPersonView = true;
					driverPosX = 0;
					driverPosY = 3;
					driverPosZ = 0;
					camAngle = carAngle % 360 - 180;
					camElevation = 0.0;
					deltaCamAngle_1 = 0.0;
					deltaCamElevation_1 = 0.0;
					deltaCamAngle_2 = 0.0;
					deltaCamElevation_2 = 0.0;
					lookRadius = 1.0;
					deltaLookRadius = 0.0;
				}
				break;
			case 88:
				deltaLookRadius = -0.01;
				break;
			case 90:
				deltaLookRadius = 0.01;
				break;
			case 67:
				carIndex = (carIndex + 1) % (vehicleAssets.length - 1);
				break;
			case 70:
				toggleFullScreen();
				break;
			case 84:
				if(easterEggPresses < 5) {
					easterEggPresses += 1;
				}
				else {
					alert("I like trains");
					carIndex = vehicleAssets.length - 1;
					easterEggPresses = 0;
				}
				break;
		}
	}
}

var keyFunctionUp = function(e) {
	if(keys[e.keyCode]) {
		keys[e.keyCode] = false;
		switch(e.keyCode) {
			case 65:
			case 68:
				steeringDir = 0;
				break;
			case 87:
			case 83:
				vz = 0.0;
				break;
			case 37:
			case 39:
				deltaCamAngle_1 = 0.0;
				deltaCamAngle_2 = 0.0;
				break;
			case 38:
			case 40:
				deltaCamElevation_1 = 0.0;
				deltaCamElevation_2 = 0.0;
				break;
			case 88:
			case 90:
				deltaLookRadius = 0.0;
				break;
		}
	}
}

var mouseState = false;
var lastMouseX = -100, lastMouseY = -100;

function doMouseDown(event) {
	lastMouseX = event.pageX;
	lastMouseY = event.pageY;
	mouseState = true;
}

function doMouseUp(event) {
	lastMouseX = -100;
	lastMouseY = -100;
	mouseState = false;
}

function doMouseMove(event) {
	if(mouseState) {
		var dx = event.pageX - lastMouseX;
		var dy = lastMouseY - event.pageY;
		lastMouseX = event.pageX;
		lastMouseY = event.pageY;
		
		if((dx != 0) || (dy != 0)) {
			if(firstPersonView) {
				camAngle += 0.1 * dx;
				camElevation -= 0.1 * dy;
			}
		}
	}
}

function toggleFullScreen() {
	var canvas = document.getElementById("c");
	if(!document.fullscreenElement) {
		canvas.requestFullscreen();
	}
	else {
		if(document.exitFullscreen) {
			document.exitFullscreen(); 
		}
	}
}

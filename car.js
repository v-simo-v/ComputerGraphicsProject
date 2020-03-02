function setCarDimensions(vehicleIndex) {
	var minX = Infinity;
	var maxX = -Infinity;
	var minY = Infinity;
	var maxY = -Infinity;
	var minZ = Infinity;
	var maxZ = -Infinity;

	utils.get_json(JSONVehiclesDir + vehicleAssetsJSONs[vehicleIndex], function(loadedModel){assetModel = loadedModel;});
	var meshes = assetModel.meshes;

	for(var i = 0; i < meshes.length; i++) {
		for(var j = 0; j < meshes[i].vertices.length; j+=3){
			minX = Math.min(minX, meshes[i].vertices[j]);
			maxX = Math.max(maxX, meshes[i].vertices[j]);
			minY = Math.min(minY, meshes[i].vertices[j+1]);
			maxY = Math.max(maxY, meshes[i].vertices[j+1]);
			minZ = Math.min(minZ, meshes[i].vertices[j+2]);
			maxZ = Math.max(maxZ, meshes[i].vertices[j+2]);
		}
	}
	carLength[vehicleIndex] = (maxX - minX) * carScale[vehicleIndex];
	carHeight[vehicleIndex] = (maxY - minY) * carScale[vehicleIndex];
	carWidth[vehicleIndex] = (maxZ - minZ) * carScale[vehicleIndex];
}

// car steering dynamics
function ackermann(v, steering_angle) {
	
	var old_theta = carAngle / 180 * Math.PI;

	steering_angle *= Math.PI / 180;
	
	if(steering_angle != 0) {
		var r = distance / Math.tan(steering_angle);
		var d_theta = (v * Math.sin(steering_angle)) / distance;
		var _d_x = r * Math.sin(d_theta);
		var _d_y = r * (1 - Math.cos(d_theta));
		var d_x = _d_x*Math.cos(old_theta) - _d_y*Math.sin(old_theta);
		var d_y = _d_x*Math.sin(old_theta) + _d_y*Math.cos(old_theta);
	}
	else {
		var d_x = v * Math.cos(old_theta);
		var d_y = v * Math.sin(old_theta);
		var d_theta = 0.0;
	}
	
	carAngle = (carAngle + d_theta / Math.PI * 180 + 180) % 360 - 180;
	if(carAngle <= -180) carAngle += 360;
	
	var new_theta = carAngle / 180 * Math.PI;
	
	carX += odom_offset*(Math.sin(new_theta)-Math.sin(old_theta)) + d_y;
	carZ += odom_offset*(Math.cos(new_theta)-Math.cos(old_theta)) + d_x;
}

function computeCarWVP(vz, steeringDir) {
	var W, V, P;
	
	// compute time interval
	//var currentTime = (new Date).getTime();
	var deltaT;
	if(lastUpdateTime){
		deltaT = (currentTime - lastUpdateTime) / 1000.0;
	} else {
		deltaT = 1/50;
	}
	//lastUpdateTime = currentTime;
	
	// computing car velocity
	if(simpleMotion) {
		carLinVel = 0.7 * vz;
	}
	else {
		if(vz > 0.1) {
			if(preVz > 0.1) {
			carLinAcc = carLinAcc + ATur * deltaT;
			if(carLinAcc > mAT) carLinAcc = mAT;
			} else if(carLinAcc < sAT) carLinAcc = sAT;
		} else if(vz > -0.1) {
			carLinAcc = carLinAcc - ATdr * deltaT * Math.sign(carLinAcc);
			if(Math.abs(carLinAcc) < 0.001) carLinAcc = 0.0;
		} else { 
			if(preVz < 0.1) {
			carLinAcc = carLinAcc - BTur * deltaT;
			if(carLinAcc < -mBT) carLinAcc = -mBT;
			} else if(carLinAcc > -sBT) carLinAcc = -sBT;
		}
		preVz = vz;
		
		if((Math.abs(carLinVel) > 1e-3) || (vz != 0.0)) {
			carLinVel = carLinVel * Math.exp(Tfric * deltaT) + deltaT * carLinAcc;
		}
		else {
			carLinVel = 0.0;
			carLinAcc = 0.0;
		}
	}
	
	if(collisionDetected) {
		carLinVel *= collisionFriction;
		if((vz < 1) && (carLinVel > 0.0)) {
			carLinAcc = 0.0;
		}
	}
	
	// Magic for moving the car
	var steeringAngle = steeringDir * maxSteering;
	
	prevCarAngle = carAngle;
	
	deltaCarAngle = -carAngle;
	
	odom_offset = (carLength[carIndex] / 2) * 0.8;
	
	ackermann(carLinVel, steeringAngle);
	
	carY = 1/300 * carScale[carIndex];
	
	// define collision vertices of the car
	var w = carWidth[carIndex];
	var l = carLength[carIndex];
	var vertPos = [
					[w/2,l/2],
					[-w/2,l/2],
					[-w/2,-l/2],
					[w/2,-l/2],
					[w/2,0.0],
					[-w/2,0.0]
					];
	bounceAfterCollision(vertPos);
	
	P = utils.MakePerspective(fov, aspectRatio, 0.1, 1000.0);
	
	W = utils.MakeWorld(carX, carY, carZ, 0.0, carAngle, 0.0, 1.0);
	
	deltaCarAngle += carAngle;
	
	camAngle = (camAngle + deltaCarAngle + deltaCamAngle_1 + deltaCamAngle_2 + 180) % 360 - 180;
	if(camAngle <= -180) camAngle += 360;
	camElevation += deltaCamElevation_1 + deltaCamElevation_2;
	camRoll = 0.0;
	
	var nLookRadius = lookRadius + deltaLookRadius;
	if((nLookRadius >= 0.8) && (nLookRadius <= 1.5) && !firstPersonView) {
		lookRadius = nLookRadius;
	}
	
	var driverPos;
	
	// define camera (target) position
	if(firstPersonView) {
		var minElev = -60.0;
		var maxElev = 60.0;
		
		camElevation = Math.min(Math.max(camElevation, minElev), maxElev);
	}
	else {
		var minElev = -90.0;
		var maxElev = 0.0;
		
		if(camElevation <= -90.0) deltaCamElevation_2 += minElev - camElevation;
		if(camElevation >= 0.0) deltaCamElevation_2 += maxElev - camElevation;
		
		camElevation = Math.min(Math.max(camElevation, minElev), maxElev);
		
		var quat = new Quaternion.fromAxisAngle([Math.cos(utils.degToRad(camAngle - carAngle + 180)), 0.0, -Math.sin(utils.degToRad(camAngle - carAngle + 180))], -utils.degToRad(deltaCamElevation_2));
		var driverRotMat = utils.multiplyMatrices(quat.toMatrix4(), utils.MakeRotateYMatrix(deltaCamAngle_2));
		var newDriverPos = utils.multiplyMatrixVector(driverRotMat, [driverPosX, driverPosY-lookAtPosY, driverPosZ, 1.0]);
		driverPosX = newDriverPos[0];
		driverPosY = newDriverPos[1] + lookAtPosY;
		driverPosZ = newDriverPos[2];
	}
	var nC = utils.multiplyMatrixVector(W, [lookRadius*driverPosX, lookRadius*(driverPosY-lookAtPosY)+lookAtPosY, lookRadius*driverPosZ, 1.0]);
	
	// camera position
	if(simpleCam) {
		camX = nC[0];
		camY = nC[1];
		camZ = nC[2];
	}
	else {
		// distance from target	
		deltaCam = [camX - nC[0], camY - nC[1], camZ - nC[2]];
		camAcc = [-fSk * deltaCam[0] - fDk * camVel[0], -fSk * deltaCam[1] - fDk * camVel[1], -fSk * deltaCam[2] - fDk * camVel[2]];
		camVel = [camVel[0] + camAcc[0] * deltaT, camVel[1] + camAcc[1] * deltaT, camVel[2] + camAcc[2] * deltaT];
		
		camX += camVel[0] * deltaT;
		camY += camVel[1] * deltaT;
		camZ += camVel[2] * deltaT;
	}
	
	if(firstPersonView) {
		V = utils.MakeView(camX, camY, camZ, camElevation, camAngle);
	}
	else {
		var camRotMat = utils.multiplyMatrices(utils.MakeRotateYMatrix(camAngle - carAngle + 180), utils.MakeRotateXMatrix(camElevation));
		V = utils.multiplyMatrices(utils.invertMatrix(camRotMat), utils.MakeView(camX, camY, camZ, 0.0, carAngle + 180));
	}
	
	return [W, V, P];
}

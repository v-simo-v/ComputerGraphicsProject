function bounceAfterCollision(verticesPos) {
	var carVerticesX = [];
	var carVerticesZ = [];
	var collision;
	collisionDetected = false;
	var bounce = [0.0, 0.0, 0.0];
	for(var i = 0; i < verticesPos.length; i++) {
		carVerticesX[i] = carX - (-verticesPos[i][0]*Math.cos(utils.degToRad(carAngle)) - verticesPos[i][1]*Math.sin(utils.degToRad(carAngle)));
		carVerticesZ[i] = carZ + (-verticesPos[i][0]*Math.sin(utils.degToRad(carAngle)) + verticesPos[i][1]*Math.cos(utils.degToRad(carAngle)));
		collision = checkRoadCollision(carVerticesX[i], carY, carVerticesZ[i]);
		if(collision.detected) {
			if(Math.abs(collision.position[0] - carVerticesX[i]) > Math.abs(bounce[0])) {
				bounce[0] = collision.position[0] - carVerticesX[i];
			}
			if(Math.abs(collision.position[2] - carVerticesZ[i]) > Math.abs(bounce[2])) {
				bounce[2] = collision.position[2] - carVerticesZ[i];
			}
			collisionDetected = true;
		}
	}
	carX += bounce[0];
	carZ += bounce[2];
}

function checkRoadCollision(x, y, z) {
	
	var v_Nx = Math.round(-x/roadDistance);
	var v_Ny = Math.round(z/roadDistance);
	
	var currRoad = roadMap[mapDim + v_Nx - Nx][mapDim + v_Ny - Ny];
	
	var worldMatrix = utils.MakeWorld(-roadDistance*v_Nx, 0.0, roadDistance*v_Ny, 0.0, currRoad.rotation*90, 0.0, 1.0);
	
	var localPos = utils.multiplyMatrixVector(utils.invertMatrix(worldMatrix), [x, y, z, 1.0]);
	
	var laneWidth = (roadDistance / 2) - sidewalkWidth;
	var collision = undefined;
	switch(currRoad.roadNum) {
		case 0:
			collision = checkCircCollision(roadDistance/2, roadDistance/2, sidewalkWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			collision = checkCircCollision(roadDistance/2, -roadDistance/2, sidewalkWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			collision = checkCircCollision(-roadDistance/2, roadDistance/2, sidewalkWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			collision = checkCircCollision(-roadDistance/2, -roadDistance/2, sidewalkWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			break;
		case 1:
		case 3:
			collision = checkLineCollision(0.0, -1.0, laneWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			collision = checkLineCollision(0.0, 1.0, laneWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			break;
		case 2:
			collision = checkLineCollision(-1.0, 0.0, laneWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			collision = checkCircCollision(-roadDistance/2, roadDistance/2, sidewalkWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			collision = checkCircCollision(-roadDistance/2, -roadDistance/2, sidewalkWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			break;
		case 4:
			collision = checkCircCollision(roadDistance/2, roadDistance/2, sidewalkWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			collision = checkCircCollision(roadDistance/2, roadDistance/2, roadDistance - sidewalkWidth, localPos[2], localPos[0]);
			if(collision.position != [localPos[0], localPos[2]]) collision.detected = !collision.detected;
			if(collision.detected) break;
			break;
		case 6:
			collision = checkLineCollision(0.0, -1.0, laneWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			collision = checkLineCollision(0.0, 1.0, laneWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			collision = checkLineCollision(1.0, 0.0, laneWidth, localPos[2], localPos[0]);
			if(collision.detected) break;
			break;
	}
	
	if(collision && collision.detected) {
		localPos[0] = collision.position[1];
		localPos[2] = collision.position[0];
	}
	
	var worldPos = utils.multiplyMatrixVector(worldMatrix, localPos);
	
	return {"detected" : collision.detected, "position" : [worldPos[0], worldPos[1], worldPos[2]]}
	
}

// collision for lines of the form a*x+b*y+c=0
function checkLineCollision(a, b, c, x, y) {
	var xp = (b*(b*x - a*y) - a*c) / (a*a + b*b);
	var yp = (a*(-b*x + a*y) - b*c) / (a*a + b*b);
	var dot = a*x + b*y + c;
	return {"detected" : (dot <= 0), "position" : [xp, yp]};
}

// collision for circumference of the form (x - x0)^2+(y - y0)^2=r^2
function checkCircCollision(x0, y0, r, x, y) {
	x -= x0;
	y -= y0;
	var theta = Math.atan2(y, x);
	var xp = r*Math.cos(theta) + x0;
	var yp = r*Math.sin(theta) + y0;
	var collision = false;
	return {"detected" : (x*x + y*y <= r*r), "position" : [xp, yp]};
}

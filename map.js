function initRoadMap() {
	
	noise.seed(Math.random());
	
	roadMap = [];
	
	for(var i = 0; i < 2*mapDim+1; i++) {
		roadMap[i] = [];
		for(var j = 0; j < 2*mapDim+1; j++) {
			roadMap[i][j] = undefined;
		}
	}
	
	var roadSample = getMapSample(0, 0);
	if(roadSample) {
		roadMap[mapDim][mapDim] = {"roadNum" : roadSample[0], "rotation" : roadSample[1]};
	}
}

function generateMap() {
	
	var l = 2 * mapDim + 1;
	var x = 0;
	var y = 0;
    var dx = -1;
    var dy = 0;
    for(var i = 0; i < l*l; i++) {
        if((-l/2 < x) && (x <= l/2) && (-l/2 < y) && (y <= l/2)) {
			if(roadMap[mapDim + x][mapDim + y] == undefined) {
				var roadSample = getMapSample(Nx + x, Ny + y);
				if(roadSample) {
					roadMap[mapDim + x][mapDim + y] = {"roadNum" : roadSample[0], "rotation" : roadSample[1]};
				}
			}
        }
        if((x == y) || ((y < 0) && (y == -x)) || ((y > 0) && (y == 1 - x))) {
			t = dy;
            dy = -dx;
            dx = t;
        }
        x += dx;
        y += dy;
	}
}

function getMapSample(x, y) {
	
	var s1 = 3*(noise.simplex2(x, y+0.5) + 1) + noise.simplex2(x*10, (y+0.5)*10) + 1;
	var s2 = 3*(noise.simplex2(x+0.5, y) + 1) + noise.simplex2((x+0.5)*10, y*10) + 1;
	var s3 = 3*(noise.simplex2(x, y-0.5) + 1) + noise.simplex2(x*10, (y-0.5)*10) + 1;
	var s4 = 3*(noise.simplex2(x-0.5, y) + 1) + noise.simplex2((x-0.5)*10, y*10) + 1;
	
	var b1 = (((s1 > cityDensity) && (x % 2 == 0)) || ((x == 0) && (y == 0)) || ((x == 0) && (y == -1)));
	var b2 = (((s2 > cityDensity) && (y % 2 == 0)) || ((x == 0) && (y == 0)) || ((x == -1) && (y == 0)));
	var b3 = (((s3 > cityDensity) && (x % 2 == 0)) || ((x == 0) && (y == 0)) || ((x == 0) && (y == 1)));
	var b4 = (((s4 > cityDensity) && (y % 2 == 0)) || ((x == 0) && (y == 0)) || ((x == 1) && (y == 0)));
	
	if((b1+b2+b3+b4 == 0) || ((x % 2 == 1) && (y % 2 == 1)))
	{
		//Select a building by using noise
		var s0 = noise.simplex2(x*100+500, y*100+450);
		var r0 = noise.simplex2(x*100-500, y*100-450);
		
		var r;
		
		if(r0 < -0.5) r = 0;
		else if(r0 < 0.0) r = 1;
		else if(r0 < 0.5) r = 2;
		else r = 3;
		
		if(s0 < -0.6) return [7, r];
		if(s0 < -0.2) return [8, r];
		if(s0 < 0.2) return [9, r];
		if(s0 < 0.6) return [10, r];
		if(s0 < 1.0) return [11, r];
	}
	
	if(b1+b2+b3+b4 == 1)
	{
		if(b1 == 1)
		{
			return [6, 0];
		}
		if(b2 == 1)
		{
			return [6, 3];
		}
		if(b3 == 1)
		{
			return [6, 2];
		}
		if(b4 == 1)
		{
			return [6, 1];
		}
	}
	
	if(b1+b2+b3+b4 == 2)
	{
		if(b1+b2 == 2)
		{
			return [4, 3];
		}
		if(b1+b3 == 2)
		{
			return [1, 0];
		}
		if(b1+b4 == 2)
		{
			return [4, 0];
		}
		if(b2+b3 == 2)
		{
			return [4, 2];
		}
		if(b2+b4 == 2)
		{
			return [1, 1];
		}
		if(b3+b4 == 2)
		{
			return [4, 1];
		}
	}
	
	if(b1+b2+b3+b4 == 3)
	{
		if(b1+b2+b3 == 3)
		{
			return [2, 1];
		}
		if(b1+b2+b4 == 3)
		{
			return [2, 2];
		}
		if(b1+b3+b4 == 3)
		{
			return [2, 3];
		}
		if(b2+b3+b4 == 3)
		{
			return [2, 0];
		}
	}
	
	if(b1+b2+b3+b4 == 4)
	{
		return [0, 0];
	}
}

function shiftMapX(n) {
	roadMap = shiftArray(roadMap, n);
	if(n > 0) {
		for(var j = 0; j < roadMap[0].length; j++) {
			roadMap[0][j] = undefined;
		}
	}
	else if(n < 0) {
		for(var j = 0; j < roadMap[roadMap.length - 1].length; j++) {
			roadMap[roadMap.length - 1][j] = undefined;
		}
	}
}

function shiftMapY(n) {
	for(var i = 0; i < roadMap.length; i++) {
		roadMap[i] = shiftArray(roadMap[i], n);
		if(n > 0) {
			roadMap[i][0] = undefined;
		}
		else if(n < 0) {
			roadMap[i][roadMap[i].length - 1] = undefined;
		}
	}
}

function isVisible(x, y) {
	
	var offsetX = -camX/roadDistance - Nx;
	var offsetY = camZ/roadDistance - Ny;
	
	var horiz_fov = 2 * Math.atan(aspectRatio * Math.tan(utils.degToRad(fov) / 2));
	
	var theta = (Math.PI - horiz_fov) / 2;
	
	var line1 = [-Math.sin(utils.degToRad(camAngle - 180.0) + theta), Math.cos(utils.degToRad(camAngle - 180.0) + theta), lineMargin];
	var line2 = [-Math.sin(utils.degToRad(camAngle - 180.0) - theta), Math.cos(utils.degToRad(camAngle - 180.0) - theta), lineMargin];
	
	var dot1 = (x - offsetX)*line1[0] + (y - offsetY)*line1[1] + line1[2];
	var dot2 = (x - offsetX)*line2[0] + (y - offsetY)*line2[1] + line2[2];
	
	return (((dot1 > 0) && (dot2 > 0)) || ((Math.abs(x) <= neighborMargin) && (Math.abs(y) <= neighborMargin)));
}

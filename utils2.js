function alignObj(meshes) {
	var minX = Infinity;
	var maxX = -Infinity;
	var minZ = Infinity;
	var maxZ = -Infinity;

	for(var i = 0; i < meshes.length; i++) {
		for(var j = 0; j < meshes[i].vertices.length; j+=3){
			minX = Math.min(minX, meshes[i].vertices[j]);
			maxX = Math.max(maxX, meshes[i].vertices[j]);
			
			minZ = Math.min(minZ, meshes[i].vertices[j+2]);
			maxZ = Math.max(maxZ, meshes[i].vertices[j+2]);
		}
	}
	var offsetX = (minX + maxX)/2;
	var offsetZ = (minZ + maxZ)/2;
	
	for(var i = 0; i < meshes.length; i++) {
		for(var j = 0; j < meshes[i].vertices.length; j += 3){
			meshes[i].vertices[j] -= offsetX;
			meshes[i].vertices[j+2] -= offsetZ;
		}
	}
	return meshes;
}

function shiftArray(array, n) {
	var array2 = [];
	if(n < 0) {
	n += array.length;
	}
	n %= array.length;
	for(var i = 0; i < n; i++) {
		array2[i] = array[array.length-n+i];
	}
	for(var i = n; i < array.length; i++) {
		array2[i] = array[i-n];
	}
	return array2;
}

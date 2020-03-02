var shaderDir = "shaders/";
var JSONRoadsDir = "models/roads/";
var JSONRoadOrnamentsDir = "models/ornaments/";
var JSONVehiclesDir = "models/vehicles/";
var program = null;

var currentTime;
var lastUpdateTime = (new Date).getTime();

var firstPersonView = true;

// camera position w.r.t. car (object space)
var driverPosX = 0.0;
var driverPosY = 3.0;
var driverPosZ = 0.0;

var lookAtPosY = 2.5;

var planarDist = Math.sqrt(Math.pow(driverPosX, 2) + Math.pow(driverPosZ, 2));

// camera pose
var camX = 0.0;
var camY = 0.0;
var camZ = 0.0;
var camElevation = 0.0;
var camAngle = 180.0;
var camRoll = 0.0;

// camera orientation variation for first-person view
var deltaCamAngle_1 = 0.0;
var deltaCamElevation_1 = 0.0;

// camera orientation variation for third-person view
var deltaCamAngle_2 = 0.0;
var deltaCamElevation_2 = 0.0;

var camVel = [0.0, 0.0, 0.0];

var carIndex = 0;

// dimensions for each vehicle
var carWidth = [];
var carHeight = [];
var carLength = [];

// car pose
var carX = 0.0;
var carY = 0.0;
var carZ = 0.0;
var carAngle = 0.0;

var deltaCarAngle = 0.0;

var vz = 0.0;			// control input for moving the car
var preVz = 0.0;
var carLinAcc = 0.0;
var carLinVel = 0.0;

var steeringDir = 0;	// 1 = steering left, 0 = going straight, -1 = steering right
var maxSteering = 40;	// max steering angle in degree

var collisionFriction = 0.9;
var collisionDetected = false;

var simpleMotion = false;
var simpleCam = true;

var distance = 8.0;		// distance between car wheel axes
var odom_offset = 4.0;	// offset distance between ackermann odometry center and car model origin

// Camera dynamic coefficients
var fSk = 500.0;
var fDk = 2.0 * Math.sqrt(fSk);

// Driving dynamic coefficients
var sAT = 0.5;
var mAT = 2.0;
var ATur = 3.0;
var ATdr = 1.0;
var sBT = 0.2;
var mBT = 0.9;
var BTur = 5.0;
var BTdr = 5.5;
var Tfric = Math.log(0.05);
var sAS = 0.1;	// Not used yet
var mAS = 108.0;
var ASur = 1.0;	// Not used yet
var ASdr = 0.5;	// Not used yet

var fov = 70;
var aspectRatio;

var roadScale = 15.0;
var roadDistance = roadScale * 2.291;
var sidewalkWidth = roadDistance * 0.25;

// discrete car position
var Nx = Math.round(-carX/roadDistance);
var Ny = Math.round(carZ/roadDistance);

var mapDim = 7;

var cityDensity = 2.5;

var observerPosition = [carX, carY, carZ];

// directional light
var directionalLightDir = [0.0, -1.0, 0.0];
var lightAlpha = 1.0;
var directionalLightColor = [1.0, 1.0, 1.0];

var materialColor = [0.0, 0.0, 0.0];
var specularColor = [1.0, 1.0, 1.0];     
var specularPower = 20.0;

var sunRise = 0.0;
var dayLightColor = [0.6, 0.8, 0.95];
var sunsetLightColor = [1.0, 0.83, 0.44];
var darkLightColor = [0.07, 0.07, 0.12];
var skyAlpha = 1.0;
var skyColor = [0.0, 0.0, 0.0];
var ambientLightCoeff = 0.3;
var ambientLightAlpha = 0.0;

var spotLightPos1 = [0.0, 0.0, 0.0];
var spotLightPos2 = [0.0, 0.0, 0.0]
var spotLightDir = [0.0, 0.0, 1.0];
var spotLightColor = [1.0, 1.0, 0.75];
var spotLightTarget = 8.0;
var spotLightDecay = 2;
var outerCone = 120.0;
var innerCone = 60.0;

var viewMatrix;
var perspectiveMatrix;

var roadAssetsJSONs = [
			"road01.json",
			"road02.json",
			"road03.json",
			"road04.json",
			"road05.json",
			"road06.json",
			"road07.json",
			"road09.json",
			"road10.json",
			"road11.json",
			"road12.json",
			"road13.json"
			];

var roadAssets = [];

var roadOrnamentAssetsJSONs = [
			"stop_light.json",
			"road_barrier.json",
			"street_lamp.json"
			];

var roadOrnamentAssets = [];

// scaling factors for each car
var carScale = [
			3.5,
			6.0,
			4.3,
			5.0,
			4.5
			];

var vehicleAssetsJSONs = [
			"car01.json",
			"car02.json",
			"truck01.json",
			"bus01.json",
			"train.json"
			];

var vehicleAssets = [];

var cloudAssetsJSON = "cloud.json";

// do not apply minification filter to this textures
var minFilterBlacklist = [
			"Vereda.jpg",
			"grass-pattern.jpg"
			];

// traffic light poses and light colors
var tlPoses = [
			[0.7, 1.0, 0],
			[-0.7, 1.0, 0],
			[-0.7, -1.0, 180],
			[0.7, -1.0, 180],
			[1.0, -0.7, 90],
			[1.0, 0.7, 90],
			[-1.0, 0.7, -90],
			[-1.0, -0.7, -90]
			];
var tlRed = [1.0, 0.0, 0.0];
var tlYellow = [1.0, 0.6, 0.0];
var tlGreen = [0.0, 1.0, 0.0];
var tlRedDuration = 20;
var tlYellowDuration = 3;

// street lamp light
var streetLampEmiss = [0.8, 0.8, 0.5];

// road map matrix ((2*mapDim+1)^2 elements)
var roadMap;

// camera visibility margins
var lineMargin = 1 / Math.sqrt(2);
var neighborMargin = 1;

var lookRadius = 1.0;
var deltaLookRadius = 0.0;

var keys = [];

var easterEggPresses = 0;


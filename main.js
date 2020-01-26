/* 
=============
Params
=============
*/

let imageSize = {
    width: 640,
    height: 480
};
// let scaledImageSize = {
//     width: 640,
//     height: 480
// };
let scaleSize = {
    x: 1.0,
    y: 1.0
};

let modelConfigParams;
let mobilenetConfigParams = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: { width: 640, height: 480 },
    multiplier: 0.75
}
let resnetConfigParams = {
    architecture: 'ResNet50',
    outputStride: 16,
    inputResolution: { width: 640, height: 480 },
    quantBytes: 2
}

let poseNet;
let poses = [];

let partsOfDisp = ["nose","leftWrist","rightWrist","leftAnkle","rightAnkle"];
let recordPosNum = 5;
let position = {
    x:0.0,
    y:0.0
}
let recordNosePos = [];
let recordWristPos = [];
let recordAnklePos = [];
let dispFlag = true;

let partsInfo = [];
let partInfo = {
    x: 0.0,
    y: 0.0,
    enable: false
}

/* 
=============
Main Function
=============
*/

function preload() {

}

function setup() {
    createCanvas(windowWidth, windowHeight);
    textSize(15);

    scaleSize.x = windowWidth/imageSize.width;
    scaleSize.y = windowHeight/imageSize.height;

    // select MobileNet Architecture
    modelConfigParams = mobilenetConfigParams;
    //modelConfigParams = resnetConfigParams;

    setupCamera();

    // init partsInfo
    for(let j=0;j<2;j++){
        for(let i=0;i<5;i++){
            partsInfo[i] = JSON.parse(JSON.stringify(partInfo));;
        }
    }
}

function setupCamera() {
    //【memo】captureinput: USB_Camera (0458:708c) id = e2310dc0ade15f8036395bdf981b6bff07cb78360efee005876718a03de6088d
    var options = {
        capture: {
          optional: [{
            sourceId: 'e2310dc0ade15f8036395bdf981b6bff07cb78360efee005876718a03de6088d' //'put_desired_source_id_here'
          }]
        }
      };
    capture = createCapture(VIDEO, cameraLoaded);
    // capture = createCapture(options);

    capture.size(imageSize.width, imageSize.height);

    // Hide the capture element, and just show the canvas
    capture.hide();
}

function cameraLoaded(){
    setupPosenet();
}

function setupPosenet(){
    posenet.load(modelConfigParams).then(function(loadedNet) {
        net = loadedNet;
        // when it's loaded, start estimating poses
        requestAnimationFrame(function() {
            estimatePoses();
        });
    })
}

function estimatePoses(){
    // call posenet to estimate a pose
    net.estimateMultiplePoses(capture.elt, {
        flipHorizontal: true,
        maxDetections: 10,
        scoreThreshold: 0.5,
        nmsRadius: 20
    })
    .then(function(estimatedPoses) {
        // store the poses to draw them below
        poses = estimatedPoses;
        // next animation loop, call posenet again to estimate poses
        requestAnimationFrame(function() {
            estimatePoses();
        });
    });
}

function draw() {
    background(0);

    push();
    scale(-1,1);
    //image(capture, 0, 0, imageSize.width, imageSize.height);
    image(capture, -windowWidth, 0, windowWidth, windowHeight);
    pop();

    drawLineEffect();
}

function drawLineEffect(){
    fill(255,255,255,50);
    //for (let i = 0; i < poses.length; i++) {
    if (poses.length>0) {
        let pose = poses[0];

        // get position
        for (let point of pose.keypoints) {
            // console.log("partsInfo-len:",partsInfo.length)
            // console.log("partsInfo:",partsInfo)
            // console.log("partsInfo[0]:",partsInfo[0].x)
            // console.log("partsInfo[1]:",partsInfo[1].x)
            if(point.part == "nose"){
                if(point.score > 0.5){
                    partsInfo[0].x = point.position.x*scaleSize.x;
                    partsInfo[0].y = point.position.y*scaleSize.y;
                    partsInfo[0].enable = true;
                }else{
                    partsInfo[0].enable = false;
                }
            }else if(point.part == "leftEye"){
                if(point.score > 0.5){
                    partsInfo[1].x = point.position.x*scaleSize.x;
                    partsInfo[1].y = point.position.y*scaleSize.y;
                    partsInfo[1].enable = true;
                }else{
                    partsInfo[1].enable = false;
                }
            }else if(point.part == "rightEye"){
                if(point.score > 0.5){
                    partsInfo[4].x = point.position.x*scaleSize.x;
                    partsInfo[4].y = point.position.y*scaleSize.y;
                    partsInfo[4].enable = true;
                }else{
                    partsInfo[4].enable = false;
                }
            }else if(point.part == "leftEar"){
                if(point.score > 0.5){
                    partsInfo[2].x = point.position.x*scaleSize.x;
                    partsInfo[2].y = point.position.y*scaleSize.y;
                    partsInfo[2].enable = true;
                }else{
                    partsInfo[2].enable = false;
                }
            }else if(point.part == "rightEar"){
                if(point.score > 0.5){
                    partsInfo[3].x = point.position.x*scaleSize.x;
                    partsInfo[3].y = point.position.y*scaleSize.y;
                    partsInfo[3].enable = true;
                }else{
                    partsInfo[3].enable = false;
                }
            }
        }

        // draw
        let count=0;
        for(let j=1;j<partsInfo.length;j++){
            if(partsInfo[j-1].enable && partsInfo[j].enable){
                stroke(255, 255, 255, 200);
                strokeWeight(1);
                line(partsInfo[j-1].x, partsInfo[j-1].y, partsInfo[j].x, partsInfo[j].y);
            }
        }
        if(partsInfo[partsInfo.length-1].enable && partsInfo[0].enable){
            stroke(255, 255, 255, 200);
            strokeWeight(1);
            line(partsInfo[partsInfo.length-1].x, partsInfo[partsInfo.length-1].y, partsInfo[0].x, partsInfo[0].y);
        }
        //多角形
        fill(255,255,255,70);
        beginShape();
        for(let j=0;j<partsInfo.length;j++){
            if(partsInfo[j].enable){
                vertex(partsInfo[j].x, partsInfo[j].y);
            }
        }
        endShape(CLOSE);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);

    // scaleSize = windowHeight/imageSize.height;
    // scaledImageSize.width = imageSize.width*scaleSize
    // scaledImageSize.height = imageSize.height*scaleSize

    scaleSize.x = windowWidth/imageSize.width;
    scaleSize.y = windowHeight/imageSize.height;
}

function keyTyped() {
    switch (key) {
        case 'f':
            let fs = fullscreen();
            fullscreen(!fs);
            break;
        default:
            break;
    }
}
const socket=io()
let client;
let channel;

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')
let role = urlParams.get('client')
console.log(role)
if(!roomId){
    window.location = 'index.html'
}

let localStream;
let remoteStream;
let peerConnection;


  
const servers = {
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }, {
            username: "mligxW9DblMS1X7AYeVQV-4SUCT7k2EpXbF1JWPWTHnooHM-kDddb75VtoROX21TAAAAAGRRCS5EaHJ1dg==",
            credential: "2b0a3b8c-e8e9-11ed-83b0-0242ac140004",
            urls: [
                "turn:bn-turn1.xirsys.com:80?transport=udp",
                "turn:bn-turn1.xirsys.com:3478?transport=udp",
                "turn:bn-turn1.xirsys.com:80?transport=tcp",
                "turn:bn-turn1.xirsys.com:3478?transport=tcp",
                "turns:bn-turn1.xirsys.com:443?transport=tcp",
                "turns:bn-turn1.xirsys.com:5349?transport=tcp"
            ]
         }
    ]
}



let constraints = {
    video:{
    width: { min: 640, ideal: 1920, max: 1920 },
    height: { min: 480, ideal: 1080, max: 1080 },
    },
    audio:true
}

const init=async()=>{
    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    document.getElementById('user-1').srcObject = localStream
    
    }

if(role){

let lastLandmarks = null; // Store the landmarks from the previous frame
let trigger=0;
async function loadFaceAPI() {
    await faceapi.loadSsdMobilenetv1Model('/models');
    await faceapi.loadFaceLandmarkModel('/models');
    await faceapi.loadFaceRecognitionModel('/models');
}
loadFaceAPI().then(init);

}else{
    init()
}



socket.emit('UserJoined',{roomId})

socket.on('PeerJoined',({id,room})=>{
    createOffer(id,roomId)

})

socket.on('MessageFromPeer',async(message,MemberId)=>{
    message = JSON.parse(message.text)

    if(message.type === 'offer'){
        sendAnswer(MemberId, message.offer)
    }

    if(message.type === 'answer'){
        addAnswer(message.answer)
    }

    if(message.type === 'candidate'){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }


})

socket.on('PeerLeft',(MemberId) => {
    document.getElementById('user-2').style.display = 'none'
    document.getElementById('user-1').classList.remove('smallFrame')
})

socket.on("NotAllowed",()=>{
    window.location = 'index.html'
})




let createPeerConnection = async (MemberId) => {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream
    document.getElementById('user-2').style.display = 'block'

    document.getElementById('user-1').classList.add('smallFrame')


    if(!localStream){
        localStream = await navigator.mediaDevices.getUserMedia(constraints)
        document.getElementById('user-1').srcObject = localStream
    }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            console.log('ontrack:', track)

            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate){
            // client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate':event.candidate})}, MemberId)
                socket.emit('MessagePeer',{text:JSON.stringify({'type':'candidate', 'candidate':event.candidate})}, MemberId ,{ broadcast: true });

        }
    }}



let createOffer = async (MemberId,room) => {
    await createPeerConnection(MemberId)

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    // client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberId)
    socket.emit('MessagePeer',{text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberId ,{ broadcast: true });

}


let sendAnswer = async (MemberId, offer) => {
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    // client.sendMessageToPeer({text:JSON.stringify({'type':'answer', 'answer':answer})}, MemberId)
    socket.emit('MessagePeer',{text:JSON.stringify({'type':'answer', 'answer':answer})}, MemberId ,{ broadcast: true });

}

let addAnswer = async (answer) => {
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}



let toggleCamera = async () => {
    let videoTrack = localStream.getTracks().find(track => track.kind === 'video')

    if(videoTrack.enabled){
        videoTrack.enabled = false
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
    }else{
        videoTrack.enabled = true
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}

let toggleMic = async () => {

    let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')
    if(audioTrack.enabled){
        audioTrack.enabled = false
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
    }else{
        audioTrack.enabled = true
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}
  
// window.addEventListener('beforeunload', socket.disconnect())

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
console.log(role)
if(role){
    let lastLandmarks = null; // Store the landmarks from the previous frame
    let trigger=0;
    
    console.log("jlhhl")
    document.getElementById('user-1').addEventListener("play", () => {
        const canvas = faceapi.createCanvasFromMedia(document.getElementById('user-1'));
        document.body.append(canvas);
        faceapi.matchDimensions(canvas, { height: document.getElementById('user-1').height, width: document.getElementById('user-1').width });
        // console.log(document.getElementById('user-1'))
        setInterval(async () => {
        //   const detections = await faceapi
        //     .detectAllFaces(document.getElementById('user-1'), new faceapi.TinyFaceDetectorOptions())
        //     .withFaceLandmarks();
        const detections = await faceapi.detectAllFaces(document.getElementById('user-1')).withFaceLandmarks().withFaceDescriptors();

            const resizedDetections = faceapi.resizeResults(detections, {
            height: 480,
            width: 640,
          });
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    //     if (lastLandmarks) {
    //         // Calculate the Euclidean distance between the current and previous landmarks
    //        try{
    //         const distance = calculateLandmarkDistance(lastLandmarks._positions, detections[0].landmarks._positions);
           
    //         // You can define a threshold to determine what constitutes significant movement
    //         const movementThreshold = 2500; // Adjust this value as needed
              
    //         if (distance > movementThreshold) {
    //           // console.error("Face movement detected!");
    //           // Trigger your error handling code here
    //           console.log("Facce not properly visible")
    //           trigger++
    //           if(trigger>0 && trigger%5==0){
    //               alert("you better not move")
    //           }
      
    //         }
    //       }catch(e){
    //           // console.log("Facce not properly visible")
    //           // trigger++
    //           // if(trigger>0 && trigger%30==0){
    //           //     alert("you better not move")
    //           // }
    //       }
    //       }
    //   // 
    //   try{
    //       lastLandmarks = detections[0].landmarks;
    //   }catch(e){
    //       //  console.log("Face properly not detected")
    //   }

    const deviationThreshold = 15;
    resizedDetections.forEach((detection) => {
        const landmarks = detection.landmarks._positions;
        const nose = landmarks[30]; // Nose landmark
        const leftEye = landmarks[36]; // Left eye landmark
        const rightEye = landmarks[45]; // Right eye landmark

        // Calculate the midpoint between the eyes
        const eyeMidpointX = (leftEye.x + rightEye.x) / 2;

        // Calculate the deviation of the nose from the midpoint
        const deviation = Math.abs(nose.x - eyeMidpointX);

        // Check if the deviation is within the threshold
        if (deviation < deviationThreshold) {
            // console.log('Looking straight ahead');
        } else {
            trigger+=1;
            if(trigger%4==0 && trigger>0){ alert("Not looking straight ahead")}
            console.log('Not looking straight ahead');
        }
    });
        }, 100);
      });
      
      // Function to calculate Euclidean distance between two sets of landmarks
      function calculateLandmarkDistance(landmarks1, landmarks2) {
        let distance = 0;
        for (let i = 0; i < landmarks1.length; i++) {
          const x1 = landmarks1[i]._x;
          const y1 = landmarks1[i]._y;
          const x2 = landmarks2[i]._x;
          const y2 = landmarks2[i]._y;
          distance += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        }
        return distance;
      }
}
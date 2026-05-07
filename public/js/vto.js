/* ── VTO ADVANCED AI ENGINE ── */
let vtoStream = null;
let modelLoaded = false;
let isVTOActive = false;
let trackingInterval = null;

// Calibration Offsets (Manual refinement)
let manualScale = 1.0;
let manualY = 0;

window.startVTO = async function(frameUrl) {
    const overlay = document.getElementById('vtoOverlay');
    const video = document.getElementById('vto-video');
    const frame = document.getElementById('vtoFrame');
    const loader = document.getElementById('vto-loader');
    
    overlay.classList.add('active');
    if (frameUrl) frame.src = frameUrl;
    isVTOActive = true;

    // 1. Initial Access
    try {
        vtoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        video.srcObject = vtoStream;
    } catch (err) {
        alert("Camera access denied. Please enable it for AR Try-On.");
        vtoClose();
        return;
    }

    // 2. Load Models if not loaded
    if (!modelLoaded) {
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models')
            ]);
            modelLoaded = true;
        } catch (e) {
            console.error("AI Model Load Fail:", e);
            loader.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size:2rem; margin-bottom:15px; color:var(--accent);"></i>
                <span>Vision AI Offline</span>
                <button onclick="closeVTO()" style="margin-top:20px; background:none; border:1px solid #fff; color:#fff; padding:8px 20px; border-radius:30px; cursor:pointer;">Close</button>
            `;
            return;
        }
    }

    loader.style.display = 'none';
    startTracking();
};

async function startTracking() {
    const video = document.getElementById('vto-video');
    const frame = document.getElementById('vtoFrame');
    const status = document.getElementById('vto-status');

    trackingInterval = setInterval(async () => {
        if (!isVTOActive) return;

        const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                    .withFaceLandmarks(true);

        if (detections) {
            status.style.opacity = 1;
            const landmarks = detections.landmarks;
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();

            // Midpoint between eyes
            const eyeCenter = {
                x: (leftEye[0].x + rightEye[3].x) / 2,
                y: (leftEye[0].y + rightEye[3].y) / 2
            };

            // Distance between eyes for scaling
            const dx = rightEye[3].x - leftEye[0].x;
            const dy = rightEye[3].y - leftEye[0].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Angle for rotation
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            // Apply to overlay
            // We flip X because of mirror video
            const vWidth = video.clientWidth;
            const vHeight = video.clientHeight;

            // Positioning (video is mirrored, so landmarks.x is pixels from left)
            // But we used transform: scaleX(-1) on video, so we might need to adjust
            frame.style.display = 'block';
            frame.style.left = `${(vWidth - eyeCenter.x)}px`; // Mirrored X
            frame.style.top = `${eyeCenter.y + manualY}px`;
            
            // Scaling (2.2 is an empirical multiplier for frame width vs eye distance)
            frame.style.width = `${distance * 2.2 * manualScale}px`;
            
            // Rotation
            frame.style.transform = `translate(-50%, -50%) rotate(${-angle}deg)`;
        } else {
            status.style.opacity = 0;
            // frame.style.display = 'none'; // Optional: hide if no face
        }
    }, 60);
}

window.closeVTO = function() {
    isVTOActive = false;
    clearInterval(trackingInterval);
    const overlay = document.getElementById('vtoOverlay');
    overlay.classList.remove('active');
    
    if (vtoStream) {
        vtoStream.getTracks().forEach(track => track.stop());
        vtoStream = null;
    }
};

window.adjustFrame = function(delta) {
    manualScale += (delta / 100);
};

window.moveFrame = function(delta) {
    manualY += delta;
};

window.switchFrame = function(url, el) {
    document.getElementById('vtoFrame').src = url;
    document.querySelectorAll('.vto-thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
};

window.takeSnap = function() {
    const video = document.getElementById('vto-video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Mirror the capture
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1,0,0,1,0,0);
    
    // Draw Frame
    const frame = document.getElementById('vtoFrame');
    const rect = frame.getBoundingClientRect();
    const vRect = video.getBoundingClientRect();
    
    // Calculate relative pos
    const rx = (rect.left - vRect.left) * (canvas.width / vRect.width);
    const ry = (rect.top - vRect.top) * (canvas.height / vRect.height);
    const rw = rect.width * (canvas.width / vRect.width);
    const rh = rect.height * (canvas.height / vRect.height);
    
    ctx.drawImage(frame, rx, ry, rw, rh);
    
    const link = document.createElement('a');
    link.download = 'vto-snapshot.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
};

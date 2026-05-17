import cv2
import asyncio
import os
import time
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO

# Setup directories
for d in ["uploads", "outputs", "captures/safe", "captures/violation"]:
    os.makedirs(d, exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for captures and outputs
app.mount("/captures", StaticFiles(directory="captures"), name="captures")
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Load your thesis model
model = YOLO("models/best.pt")

CLASS_NAMES = {
    0: "motorcycle",
    1: "helmet",
    2: "rider"
}

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1]
    video_id = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join("uploads", video_id)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"video_id": video_id}

@app.get("/api/stream/{video_id}")
async def stream_video(video_id: str):
    video_path = os.path.join("uploads", video_id)
    
    def generate():
        cap = cv2.VideoCapture(video_path)
        
        # Get video properties for saving
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        if fps == 0: fps = 30
        
        output_filename = f"out_{video_id}"
        output_path = os.path.join("outputs", output_filename)
        
        # Use mp4v codec for output
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        last_violation_capture = 0
        last_safe_capture = 0
        
        try:
            while cap.isOpened():
                success, frame = cap.read()
                if not success:
                    break

                # Run inference
                results = model(frame, verbose=False)
                
                # Let YOLO draw its own boxes for the video output and stream
                annotated_frame = results[0].plot()
                
                # Save to output video
                out.write(annotated_frame)
                
                # Check for captures
                current_time = time.time()
                has_violation = False
                has_safe = False
                
                for r in results:
                    for box in r.boxes:
                        cls_id = int(box.cls[0])
                        if cls_id == 2: # no_helmet
                            has_violation = True
                        elif cls_id == 1: # helmet
                            has_safe = True

                # Capture logic (cooldown of 2 seconds to prevent spam)
                if has_violation and current_time - last_violation_capture > 2:
                    cv2.imwrite(f"captures/violation/{uuid.uuid4().hex}.jpg", annotated_frame)
                    last_violation_capture = current_time
                    
                if has_safe and not has_violation and current_time - last_safe_capture > 2:
                    cv2.imwrite(f"captures/safe/{uuid.uuid4().hex}.jpg", annotated_frame)
                    last_safe_capture = current_time

                # Encode frame for streaming
                ret, buffer = cv2.imencode('.jpg', annotated_frame)
                frame_bytes = buffer.tobytes()

                # Yield in multipart format
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                       
                # Prevent blocking and control streaming speed (approx target fps)
                time.sleep(1/fps)
                
        finally:
            cap.release()
            out.release()
            
    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/api/captures")
async def get_captures():
    safe_dir = "captures/safe"
    violation_dir = "captures/violation"
    
    # Safely get and sort files by modification time
    safe_files = [f for f in os.listdir(safe_dir) if f.endswith('.jpg')]
    safe_files.sort(key=lambda f: os.path.getmtime(os.path.join(safe_dir, f)), reverse=True)
    safe_urls = [f"/captures/safe/{f}" for f in safe_files]
    
    violation_files = [f for f in os.listdir(violation_dir) if f.endswith('.jpg')]
    violation_files.sort(key=lambda f: os.path.getmtime(os.path.join(violation_dir, f)), reverse=True)
    violation_urls = [f"/captures/violation/{f}" for f in violation_files]
    
    return {
        "safe": safe_urls,
        "violation": violation_urls
    }
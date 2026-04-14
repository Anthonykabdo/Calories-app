from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/analyze")
async def analyze(image: UploadFile = File(...)):
    # Dummy response for MVP
    return {
        "food": "apple",
        "confidence": 0.95,
        "calories": 95,
        "protein": 0.5,
        "carbs": 25,
        "fat": 0.3
    }

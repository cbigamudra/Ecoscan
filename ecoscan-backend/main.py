import pytesseract
from PIL import Image, ImageEnhance, ImageOps
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import io
import re

# 1. Tesseract Path (Double-check this with 'which tesseract' in your terminal)
pytesseract.pytesseract.tesseract_cmd = r'/opt/local/bin/tesseract'

app = FastAPI()

# 2. CORS - Crucial for mobile-to-mac communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Extensive Buzzword Database
GREENWASHING_DB = [
    "natural", "all-natural", "green", "eco-friendly", "earth-friendly", 
    "pure", "clean", "sustainable", "ethical", "conscious", "eco", 
    "non-toxic", "chemical-free", "biodegradable", "carbon-neutral", 
    "plant-based", "plant based", "cruelty-free", "vegan-friendly",
    "nature's choice", "gentle on the planet", "renewable", "purclean",
    "organic-inspired", "earth-loving", "bio-identical"
]

@app.get("/")
def read_root():
    return {"status": "Backend is running!", "ip": "172.20.10.2"}

@app.post("/scan")
async def scan_label(file: UploadFile = File(...)):
    try:
        # Read the image sent from the phone
        request_object_content = await file.read()
        img = Image.open(io.BytesIO(request_object_content))

        # --- DYNAMIC PRE-PROCESSING ---
        # 1. Convert to Grayscale
        img = img.convert('L') 
        
        # 2. Auto-Contrast (Stretches colors to make text stand out from background)
        img = ImageOps.autocontrast(img)
        
        # 3. Enhance Sharpness and Contrast manually
        img = ImageEnhance.Sharpness(img).enhance(2.0)
        img = ImageEnhance.Contrast(img).enhance(1.5)
        
        # 4. Resize: Magnify by 3x (Smaller text becomes easier for AI to read)
        width, height = img.size
        img = img.resize((width * 3, height * 3), Image.Resampling.LANCZOS)
        
        # 5. Perform OCR
        # --psm 11 is designed to find "sparse text" at various angles
        custom_config = r'--oem 3 --psm 11'
        raw_text = pytesseract.image_to_string(img, config=custom_config)
        
        # --- ANALYSIS LOGIC ---
        # Clean text: keep only letters and spaces
        processed_text = re.sub(r'[^a-zA-Z\s]', ' ', raw_text).lower()
        processed_text = " ".join(processed_text.split())

        detected_words = []
        for word in GREENWASHING_DB:
            # Look for exact word matches using boundaries \b
            if re.search(rf'\b{word}\b', processed_text):
                detected_words.append(word)

        # Calculate Results
        detected_words = list(set(detected_words))
        score = max(0, 100 - (len(detected_words) * 20))

        # Debugging: Print to your Mac Terminal
        print(f"\n--- NEW SCAN ATTEMPT ---")
        print(f"RAW OCR READ: '{raw_text.strip()}'")
        print(f"DETECTED WORDS: {detected_words}")
        print(f"FINAL SCORE: {score}")

        return {
            "is_suspicious": len(detected_words) > 0,
            "detected_buzzwords": detected_words,
            "score": score,
            "raw_text": raw_text.strip() if raw_text.strip() else "NO TEXT DETECTED",
            "message": "Potential greenwashing detected!" if len(detected_words) > 0 else "Label looks okay."
        }

    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Host must be your Personal Hotspot IP
    uvicorn.run(app, host="172.20.10.2", port=8000)
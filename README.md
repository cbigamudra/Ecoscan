#EcoScan: Greenwashing Detector
EcoScan is a mobile application designed to help consumers identify potential "greenwashing" on product labels. Using Tesseract OCR and a FastAPI backend, the app scans labels for vague sustainability buzzwords and provides an "Eco-Score" based on the transparency of the marketing.
Features
Live Camera Scan: Capture product labels directly through the app interface.
Real-time OCR: Uses Tesseract to extract text from physical labels or digital screens.
Dynamic Image Processing: Includes auto-contrast, grayscale conversion, and sharpening to improve text recognition in various lighting conditions.
Greenwashing Database: Compares extracted text against a database of common vague marketing terms (e.g., "all-natural," "pure," "earth-friendly").
Eco-Score: Provides an instant rating (0-100) based on the number of suspicious buzzwords detected.

Ecoscan/
├── ecoscan-backend/      # Python FastAPI server logic
│   ├── main.py           # API endpoints and OCR processing
│   └── requirements.txt  # Python dependencies
└── ecoscan-mobile/       # React Native Expo application
    ├── App.tsx           # Main application logic and Camera UI
    └── package.json      # Node.js dependencies

brew install tesseract - older macOS users skip and instead use MacPorts to download this dependency, on  a macOC Ventura this gave me repeated issues.

cd ecoscan-backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
cd ecoscan-mobile
npm install

MAKE SURE YOUR BACKENND URL MATCHES YOUR IP ADDRESS
npx expo start

For ease of use, use two terminal tabs and run you backend in one and mobile app in the other.

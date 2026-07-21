# Dock-Ex: Intelligent Document OCR & Data Extraction System

Dock-Ex is a production-ready, intelligent, end-to-end identity document OCR and structured attribute extraction system. It automatically identifies Indian government identity documents: **Aadhaar Cards** (merging front & back), **PAN Cards**, **Driving Licenses**, and **Vehicle Registration Certificates (RC)**, parses them using rule-based or generative AI, evaluates image quality in real-time, and saves the verified logs securely.

## 🚀 Key Features

* **Auto-Classification:** Upload any of the 4 supported types (Aadhaar, PAN, DL, RC) without selecting the type manually.
* **Double-sided Merging:** Upload Aadhaar front and back together. The system merges details like Name/DOB from the front and Address/Pincode from the back into a single record.
* **Quality Guardrails:** Sharp-based analytics check image resolution, contrast issues (glare / under-exposure), and blur using **Laplacian kernel convolve**.
* **OCR Enhancement:** Local preprocessing scales, grayscales, and sharpens images, reducing noise before character recognition.
* **Flexible Engine Architecture:** 
  * `gemini`: Cloud generative OCR using Gemini 1.5 Flash for state-of-the-art multimodal parsing.
  * `tesseract`: High-performance local engine using Tesseract.js combined with regex parsers.
  * `mock`: Interactive simulation engine to run demos out of the box using test files.
* **Review UI:** Premium dark glassmorphic portal to edit fields, download JSON payloads, and inspect raw OCR output.

---

## 🛠️ Project Structure

```
Dock-Ex/
├── backend/                  # Express (TypeScript) server
│   ├── src/
│   │   ├── config/           # DB connection & env variables
│   │   ├── controllers/      # REST API route handlers
│   │   ├── middleware/       # Multer file validations & rate limits
│   │   ├── models/           # Mongoose schemas
│   │   ├── services/         # Sharp quality check & OCR engines
│   │   │   └── ocr/          # Tesseract, Gemini, Mock providers
│   │   └── utils/            # Winston logging & parser utilities
│   └── uploads/              # Storage directory for uploads
├── frontend/                 # React (TypeScript) client via Vite
│   ├── src/
│   │   ├── components/       # Upload cards, lists, viewers
│   │   ├── services/         # Axios API connection layer
│   │   ├── index.css         # Custom Vanilla CSS theme
│   │   └── main.tsx          # Client bootstrapper
└── package.json              # Monorepo startup commands
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `backend/` directory (see `.env.example`):

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/dock-ex
OCR_PROVIDER=tesseract   # Options: gemini | tesseract | mock
GEMINI_API_KEY=your_gemini_api_key_here
UPLOAD_DIR=uploads
```

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [MongoDB](https://www.mongodb.com/) running locally or an Atlas connection URI

### Installation & Run

1. **Install all dependencies:**
   From the root directory:
   ```bash
   npm run install:all
   ```

2. **Launch development servers:**
   Starts both Vite React frontend (port `5173`) and Express backend (port `5001` with nodemon) concurrently:
   ```bash
   npm start
   ```

3. **Open application:**
   Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔬 Image Quality Assessment Metrics

* **Blur Score:** The backend convolves image buffers using a 3x3 Laplacian filter kernel `[0, 1, 0, 1, -4, 1, 0, 1, 0]`. Standard deviation of convolved pixels squared gives the variance. A variance below 30 triggers a focus warning.
* **Exposure Checks:** Calculates mean luminosity. Values below 40 highlight dark image issues, while values above 230 highlight over-exposure or camera flash glare.
* **Resolution Guard:** Checks pixel dimensions. Resolving configurations below 800px on either side triggers low-resolution alerts.
* **Incorrect Orientation:** Portrait aspect ratios (height > 1.3 * width) on standard landscape cards flag orientation warnings.

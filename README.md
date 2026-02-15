# AI PDF Tools

A lightweight, local web application for working with PDF files. All processing happens on your machine — no files are uploaded to external servers.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?logo=flask&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

| Feature | Description |
|---------|-------------|
| **PDF to Word** | Convert PDF files to editable `.docx` format |
| **Compress PDF** | Reduce PDF file size with 3 compression levels (Low / Medium / High) |
| **OCR PDF** | Extract text from scanned/image-based PDFs with 20+ language support |
| **Unlock PDF** | Remove password protection and restrictions from PDF files |

## Screenshots

### PDF to Word
Upload a PDF and convert it to an editable Word document.

### Compress PDF
Choose compression level and reduce your PDF file size.

### OCR PDF
Extract text from scanned documents with multi-language support.

### Unlock PDF
Remove password protection from locked PDF files.

## Tech Stack

- **Backend:** Flask (Python)
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **PDF to Word:** pdf2docx (PyMuPDF + python-docx)
- **Compression:** pypdf
- **OCR:** Tesseract OCR + pdf2image + Pillow
- **PDF Unlock:** pypdf

## Prerequisites

- Python 3.10+
- Tesseract OCR (for OCR feature)
- Poppler (for OCR feature)

### macOS

```bash
brew install tesseract tesseract-lang poppler
```

### Ubuntu / Debian

```bash
sudo apt-get install tesseract-ocr tesseract-ocr-all poppler-utils
```

### Windows

- Tesseract: Download from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
- Poppler: Download from [oschwartz10612/poppler-windows](https://github.com/oschwartz10612/poppler-windows/releases)

## Installation

```bash
git clone https://github.com/romizone/PDFtoword.git
cd PDFtoword
python3 -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

```bash
python app.py
```

Open **http://127.0.0.1:5000** in your browser.

## Docker

```bash
docker build -t ai-pdf-tools .
docker run -p 5000:5000 ai-pdf-tools
```

## OCR Supported Languages

English, Bahasa Indonesia, Malay, Japanese, Chinese (Simplified & Traditional), Korean, Arabic, Hindi, Thai, Vietnamese, French, German, Spanish, Portuguese, Italian, Dutch, Russian, Turkish, Polish, and more.

## Project Structure

```
PDFtoword/
├── app.py                  # Flask application & API routes
├── config.py               # Configuration
├── requirements.txt        # Python dependencies
├── Dockerfile              # Docker deployment
├── Procfile                # Cloud deployment
├── services/
│   ├── pdf_to_word.py      # PDF to Word conversion
│   ├── pdf_compress.py     # PDF compression
│   ├── pdf_ocr.py          # OCR text extraction
│   └── pdf_unlock.py       # PDF unlock/decrypt
├── templates/
│   └── index.html          # Web UI
├── static/
│   ├── css/style.css       # Styles
│   └── js/app.js           # Frontend logic
├── uploads/                # Temp uploads (auto-cleaned)
└── outputs/                # Temp outputs (auto-cleaned)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Web UI |
| `POST` | `/api/convert` | PDF to Word (returns `.docx`) |
| `POST` | `/api/compress` | Compress PDF (returns compressed `.pdf`) |
| `POST` | `/api/ocr` | OCR extraction (returns JSON with text) |
| `POST` | `/api/unlock` | Unlock PDF (returns unlocked `.pdf`) |

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Romi Nur Ismanto** — [@romizone](https://github.com/romizone)

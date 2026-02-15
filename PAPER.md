# AI PDF Tools: A Lightweight Local Web Application for PDF Processing

**Author:** Romi Nur Ismanto
**Repository:** [github.com/romizone/PDFtoword](https://github.com/romizone/PDFtoword)
**Version:** 1.0.0
**Date:** February 2026

---

## Abstract

AI PDF Tools is a lightweight, privacy-focused web application that provides a comprehensive suite of PDF processing utilities. Built with Flask (Python) and vanilla JavaScript, the application runs entirely on the user's local machine, ensuring that no files are transmitted to external servers. The tool supports six core features: PDF-to-Word conversion, PDF compression, Optical Character Recognition (OCR), PDF unlocking, PDF merging, and PDF splitting. This paper presents the system architecture, implementation details, and design decisions behind the application.

---

## 1. Introduction

PDF (Portable Document Format) is one of the most widely used document formats across industries. Users frequently need to convert, compress, extract text from, or manipulate PDF files. While numerous online tools exist for these tasks, they often require uploading sensitive documents to third-party servers, raising privacy and security concerns.

AI PDF Tools addresses this problem by providing a locally-hosted web application that performs all processing on the user's own machine. The application combines multiple PDF utilities into a single, unified interface with a modern and intuitive user experience.

### 1.1 Objectives

- Provide a unified interface for common PDF operations
- Ensure user privacy by processing all files locally
- Support multi-language OCR for global accessibility
- Maintain simplicity in deployment and usage

---

## 2. System Architecture

### 2.1 Overview

The application follows a client-server architecture within a local environment:

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  ┌─────────────────────────────────────────┐ │
│  │   HTML/CSS/JavaScript Frontend          │ │
│  │   (Tab-based SPA, Drag & Drop UI)       │ │
│  └──────────────┬──────────────────────────┘ │
│                 │ Fetch API (multipart/form)  │
│  ┌──────────────▼──────────────────────────┐ │
│  │   Flask Backend (Python)                │ │
│  │   ┌────────────────────────────────┐    │ │
│  │   │  Service Layer                 │    │ │
│  │   │  ├── pdf_to_word (pdf2docx)    │    │ │
│  │   │  ├── pdf_compress (pypdf)      │    │ │
│  │   │  ├── pdf_ocr (pytesseract)     │    │ │
│  │   │  ├── pdf_unlock (pypdf)        │    │ │
│  │   │  ├── pdf_merge (pypdf)         │    │ │
│  │   │  └── pdf_split (pypdf)         │    │ │
│  │   └────────────────────────────────┘    │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) | User interface |
| Backend | Flask 3.x (Python) | HTTP server and API routing |
| PDF Conversion | pdf2docx (PyMuPDF + python-docx) | PDF to Word conversion |
| PDF Manipulation | pypdf | Compression, unlock, merge, split |
| OCR Engine | Tesseract OCR + pdf2image + Pillow | Text extraction from images |
| Deployment | Docker, Gunicorn | Production hosting |

---

## 3. Feature Implementation

### 3.1 PDF to Word Conversion

The conversion module uses the `pdf2docx` library, which internally leverages PyMuPDF for PDF parsing and `python-docx` for Word document generation. The converter preserves document structure including text formatting, tables, and embedded images.

**Process flow:**
1. User uploads a PDF file via multipart form data
2. The backend saves the file to a temporary directory
3. `pdf2docx.Converter` processes the PDF and generates a `.docx` file
4. The generated file is returned as a download
5. Temporary files are cleaned up after the response

### 3.2 PDF Compression

The compression module employs `pypdf` with a three-tier quality system:

| Level | Method | Image Quality |
|-------|--------|--------------|
| Low | Content stream compression + deduplication | Original |
| Medium | Content stream compression + deduplication + image recompression | 60% |
| High | Content stream compression + deduplication + image recompression | 40% |

A safety mechanism ensures that if the compressed output is larger than the original (which can occur with already-optimized PDFs), the original file is returned instead.

### 3.3 Optical Character Recognition (OCR)

The OCR pipeline consists of three stages:

1. **PDF to Image Conversion:** Each PDF page is converted to a 300 DPI image using `pdf2image` (backed by Poppler)
2. **Image Preprocessing:** Images undergo grayscale conversion, contrast enhancement (2.0x), and sharpening using Pillow's `ImageFilter` and `ImageEnhance` modules
3. **Text Extraction:** Tesseract OCR processes each preprocessed image

The module supports 20+ languages including English, Bahasa Indonesia, Japanese, Chinese (Simplified and Traditional), Korean, Arabic, and major European languages.

### 3.4 PDF Unlock

The unlock module uses `pypdf.PdfReader` to decrypt password-protected PDFs. It supports both user passwords and owner passwords. The decrypted content is written to a new PDF file with all restrictions removed.

### 3.5 PDF Merge

The merge module accepts multiple PDF files and combines them sequentially using `pypdf.PdfWriter`. Users can reorder files in the web interface before merging. The resulting PDF maintains all page content and formatting from the source files.

### 3.6 PDF Split

The split module offers two modes:

- **All Pages:** Extracts every page into individual PDF files
- **Page Range:** Extracts specific pages using a flexible range syntax (e.g., `1-3, 5, 8-10`)

Output files are packaged into a ZIP archive for convenient download.

---

## 4. Frontend Design

The frontend is implemented as a Single Page Application (SPA) using vanilla JavaScript without any framework dependencies. Key design decisions include:

- **Tab-based Navigation:** Six tabs provide access to each feature, with smooth transitions
- **Drag & Drop Upload:** All panels support drag-and-drop file upload with visual feedback (border color change, scale animation)
- **Multi-file Support:** The merge panel supports selecting and managing multiple files with an ordered list interface
- **Progress Indication:** Animated indeterminate progress bars provide visual feedback during processing
- **Responsive Design:** The interface adapts to mobile and desktop viewports using CSS media queries

The design system uses the Inter typeface, an indigo (#4F46E5) accent color, and follows modern card-based layout principles with subtle shadows and rounded corners.

---

## 5. Security and Privacy

### 5.1 Local Processing

All file processing occurs on the user's local machine. No files are transmitted to external servers, eliminating data leakage risks.

### 5.2 Temporary File Management

- Uploaded files are stored with UUID-prefixed filenames to prevent collisions
- Files are deleted immediately after the HTTP response is sent using Flask's `after_this_request` callback
- A background cleanup routine runs every 10 minutes to remove orphaned files older than 1 hour
- The `uploads/` and `outputs/` directories are excluded from version control via `.gitignore`

### 5.3 Input Validation

- File extension validation restricts uploads to PDF files only
- File size is limited to 50 MB via Flask's `MAX_CONTENT_LENGTH` configuration
- Error responses use JSON format with descriptive error messages

---

## 6. Deployment

The application supports multiple deployment options:

### 6.1 Local Development

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 6.2 Docker

A Dockerfile is provided that includes all system dependencies (Tesseract OCR, Poppler) and runs the application with Gunicorn for production use.

### 6.3 Cloud Platforms

A `Procfile` enables deployment to cloud platforms such as Railway, Render, and Heroku. The application reads the `PORT` environment variable for dynamic port assignment.

---

## 7. Dependencies

### 7.1 Python Packages

| Package | Version | Purpose |
|---------|---------|---------|
| Flask | 3.x | Web framework |
| Gunicorn | Latest | Production WSGI server |
| pdf2docx | 0.5.x | PDF to Word conversion |
| pypdf | 6.x | PDF manipulation (compress, merge, split, unlock) |
| pytesseract | 0.3.x | Tesseract OCR wrapper |
| pdf2image | 1.17.x | PDF to image conversion |
| Pillow | 12.x | Image preprocessing |

### 7.2 System Dependencies

| Package | Purpose |
|---------|---------|
| Tesseract OCR | OCR engine |
| Poppler | PDF rendering (used by pdf2image) |

---

## 8. API Reference

| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| GET | `/` | — | HTML page |
| POST | `/api/convert` | `file` (PDF) | `.docx` file |
| POST | `/api/compress` | `file` (PDF), `quality` | Compressed PDF |
| POST | `/api/ocr` | `file` (PDF), `language` | JSON with extracted text |
| POST | `/api/unlock` | `file` (PDF), `password` | Unlocked PDF |
| POST | `/api/merge` | `files` (multiple PDFs) | Merged PDF |
| POST | `/api/split` | `file` (PDF), `mode`, `pages` | ZIP of split PDFs |

---

## 9. Limitations and Future Work

### 9.1 Current Limitations

- PDF-to-Word conversion may not perfectly preserve complex layouts (multi-column, overlapping elements)
- OCR accuracy depends on image quality and may struggle with handwritten text
- Large PDFs (100+ pages) may consume significant memory during OCR processing
- Compression effectiveness varies depending on the original PDF's content and encoding

### 9.2 Future Enhancements

- **PDF Watermark:** Add or remove watermarks from PDF files
- **PDF Rotate:** Rotate individual or all pages
- **PDF to Image:** Export PDF pages as PNG/JPG images
- **Batch Processing:** Process multiple files simultaneously
- **Page Reorder:** Drag-and-drop page reordering before split/merge
- **AI-Powered OCR:** Integration with modern ML-based OCR for improved accuracy

---

## 10. Conclusion

AI PDF Tools demonstrates that a comprehensive PDF processing suite can be built using open-source Python libraries while maintaining user privacy through local processing. The modular service-layer architecture enables easy addition of new features, and the lightweight frontend approach ensures fast load times without framework overhead. The application serves as both a practical tool and a reference implementation for building local-first web applications.

---

## References

1. Flask Web Framework. https://flask.palletsprojects.com/
2. pypdf Documentation. https://pypdf.readthedocs.io/
3. pdf2docx Library. https://pdf2docx.readthedocs.io/
4. Tesseract OCR Engine. https://github.com/tesseract-ocr/tesseract
5. Poppler PDF Rendering Library. https://poppler.freedesktop.org/
6. Pillow (PIL Fork). https://pillow.readthedocs.io/

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

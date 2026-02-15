from pdf2image import convert_from_path
from PIL import Image, ImageFilter, ImageEnhance
import pytesseract


def preprocess_image(image: Image.Image) -> Image.Image:
    gray = image.convert("L")
    enhancer = ImageEnhance.Contrast(gray)
    enhanced = enhancer.enhance(2.0)
    sharpened = enhanced.filter(ImageFilter.SHARPEN)
    return sharpened


def extract_text(input_path: str, language: str = "eng") -> dict:
    images = convert_from_path(input_path, dpi=300)
    pages = []

    for i, image in enumerate(images):
        processed = preprocess_image(image)
        text = pytesseract.image_to_string(processed, lang=language)
        pages.append({
            "page": i + 1,
            "text": text.strip()
        })

    full_text = "\n\n".join(p["text"] for p in pages)
    return {
        "text": full_text,
        "pages": pages,
        "page_count": len(pages)
    }

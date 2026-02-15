import os
import pypdf


def compress(input_path: str, output_path: str, quality: str = "medium") -> dict:
    reader = pypdf.PdfReader(input_path)
    writer = pypdf.PdfWriter()

    for page in reader.pages:
        page.compress_content_streams()
        writer.add_page(page)

    writer.compress_identical_objects(
        remove_identicals=True,
        remove_orphans=True
    )

    # Image quality reduction based on compression level
    if quality in ("medium", "high"):
        image_quality = 40 if quality == "high" else 60
        for page in writer.pages:
            for img in page.images:
                try:
                    img.replace(img.image, quality=image_quality)
                except Exception:
                    pass  # Skip images that can't be recompressed

    with open(output_path, "wb") as f:
        writer.write(f)

    original_size = os.path.getsize(input_path)
    compressed_size = os.path.getsize(output_path)

    # If compressed is larger, use original
    if compressed_size >= original_size:
        import shutil
        shutil.copy2(input_path, output_path)
        compressed_size = original_size

    return {
        "original_size": original_size,
        "compressed_size": compressed_size
    }

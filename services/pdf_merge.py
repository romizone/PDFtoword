import pypdf


def merge(input_paths: list, output_path: str) -> dict:
    writer = pypdf.PdfWriter()
    total_pages = 0

    for path in input_paths:
        reader = pypdf.PdfReader(path)
        for page in reader.pages:
            writer.add_page(page)
        total_pages += len(reader.pages)

    with open(output_path, "wb") as f:
        writer.write(f)

    return {"total_pages": total_pages, "file_count": len(input_paths)}

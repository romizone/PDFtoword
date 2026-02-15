import os
import zipfile
import pypdf


def split(input_path: str, output_dir: str, mode: str = "all", pages_str: str = "") -> dict:
    reader = pypdf.PdfReader(input_path)
    total = len(reader.pages)
    output_files = []

    if mode == "range" and pages_str:
        page_indices = parse_page_range(pages_str, total)
        writer = pypdf.PdfWriter()
        for i in page_indices:
            writer.add_page(reader.pages[i])
        out_path = os.path.join(output_dir, "split_pages.pdf")
        with open(out_path, "wb") as f:
            writer.write(f)
        output_files.append(out_path)
    else:
        for i in range(total):
            writer = pypdf.PdfWriter()
            writer.add_page(reader.pages[i])
            out_path = os.path.join(output_dir, f"page_{i + 1}.pdf")
            with open(out_path, "wb") as f:
                writer.write(f)
            output_files.append(out_path)

    zip_path = os.path.join(output_dir, "split_result.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in output_files:
            zf.write(fp, os.path.basename(fp))

    for fp in output_files:
        os.remove(fp)

    return {"zip_path": zip_path, "total_pages": total, "output_count": len(output_files)}


def parse_page_range(pages_str: str, total: int) -> list:
    indices = set()
    for part in pages_str.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-", 1)
            start = max(1, int(start.strip()))
            end = min(total, int(end.strip()))
            for i in range(start, end + 1):
                indices.add(i - 1)
        else:
            num = int(part)
            if 1 <= num <= total:
                indices.add(num - 1)
    return sorted(indices)

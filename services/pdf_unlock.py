import pypdf


def unlock(input_path: str, output_path: str, password: str = "") -> dict:
    reader = pypdf.PdfReader(input_path)

    if reader.is_encrypted:
        if not reader.decrypt(password):
            raise ValueError("Incorrect password. Please try again.")

    writer = pypdf.PdfWriter()
    for page in reader.pages:
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)

    return {"pages": len(reader.pages)}

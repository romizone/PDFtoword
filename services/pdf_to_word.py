from pdf2docx import Converter


def convert(input_path: str, output_path: str) -> str:
    cv = Converter(input_path)
    cv.convert(output_path)
    cv.close()
    return output_path

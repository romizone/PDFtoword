import os
import uuid
import time
import threading

from flask import Flask, render_template, request, send_file, jsonify, after_this_request
from config import UPLOAD_FOLDER, OUTPUT_FOLDER, MAX_CONTENT_LENGTH, ALLOWED_EXTENSIONS

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def unique_filename(original, ext=None):
    name = os.path.splitext(original)[0]
    if ext is None:
        ext = os.path.splitext(original)[1]
    return f"{uuid.uuid4().hex[:8]}_{name}{ext}"


def cleanup_old_files():
    """Remove files older than 1 hour from uploads and outputs."""
    cutoff = time.time() - 3600
    for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
        for f in os.listdir(folder):
            path = os.path.join(folder, f)
            if os.path.isfile(path) and os.path.getmtime(path) < cutoff:
                try:
                    os.remove(path)
                except OSError:
                    pass


def schedule_cleanup():
    cleanup_old_files()
    timer = threading.Timer(600, schedule_cleanup)  # every 10 minutes
    timer.daemon = True
    timer.start()


# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/convert', methods=['POST'])
def convert_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file. Please upload a PDF.'}), 400

    input_path = os.path.join(UPLOAD_FOLDER, unique_filename(file.filename))
    output_name = unique_filename(file.filename, '.docx')
    output_path = os.path.join(OUTPUT_FOLDER, output_name)

    try:
        file.save(input_path)

        from services.pdf_to_word import convert
        convert(input_path, output_path)

        @after_this_request
        def cleanup(response):
            for p in [input_path, output_path]:
                try:
                    os.remove(p)
                except OSError:
                    pass
            return response

        return send_file(
            output_path,
            as_attachment=True,
            download_name=os.path.splitext(file.filename)[0] + '.docx'
        )
    except Exception as e:
        for p in [input_path, output_path]:
            try:
                os.remove(p)
            except OSError:
                pass
        return jsonify({'error': f'Conversion failed: {str(e)}'}), 500


@app.route('/api/compress', methods=['POST'])
def compress_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file. Please upload a PDF.'}), 400

    quality = request.form.get('quality', 'medium')

    input_path = os.path.join(UPLOAD_FOLDER, unique_filename(file.filename))
    output_name = unique_filename(file.filename, '.pdf')
    output_path = os.path.join(OUTPUT_FOLDER, output_name)

    try:
        file.save(input_path)

        from services.pdf_compress import compress
        result = compress(input_path, output_path, quality)

        @after_this_request
        def cleanup(response):
            for p in [input_path, output_path]:
                try:
                    os.remove(p)
                except OSError:
                    pass
            return response

        response = send_file(
            output_path,
            as_attachment=True,
            download_name='compressed_' + file.filename
        )
        response.headers['X-Original-Size'] = str(result['original_size'])
        response.headers['X-Compressed-Size'] = str(result['compressed_size'])
        response.headers['Access-Control-Expose-Headers'] = 'X-Original-Size, X-Compressed-Size'
        return response
    except Exception as e:
        for p in [input_path, output_path]:
            try:
                os.remove(p)
            except OSError:
                pass
        return jsonify({'error': f'Compression failed: {str(e)}'}), 500


@app.route('/api/ocr', methods=['POST'])
def ocr_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file. Please upload a PDF.'}), 400

    language = request.form.get('language', 'eng')

    input_path = os.path.join(UPLOAD_FOLDER, unique_filename(file.filename))

    try:
        file.save(input_path)

        from services.pdf_ocr import extract_text
        result = extract_text(input_path, language)

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'OCR failed: {str(e)}'}), 500
    finally:
        try:
            os.remove(input_path)
        except OSError:
            pass


@app.route('/api/unlock', methods=['POST'])
def unlock_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file. Please upload a PDF.'}), 400

    password = request.form.get('password', '')

    input_path = os.path.join(UPLOAD_FOLDER, unique_filename(file.filename))
    output_name = unique_filename(file.filename, '.pdf')
    output_path = os.path.join(OUTPUT_FOLDER, output_name)

    try:
        file.save(input_path)

        from services.pdf_unlock import unlock
        unlock(input_path, output_path, password)

        @after_this_request
        def cleanup(response):
            for p in [input_path, output_path]:
                try:
                    os.remove(p)
                except OSError:
                    pass
            return response

        return send_file(
            output_path,
            as_attachment=True,
            download_name='unlocked_' + file.filename
        )
    except ValueError as e:
        for p in [input_path, output_path]:
            try:
                os.remove(p)
            except OSError:
                pass
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        for p in [input_path, output_path]:
            try:
                os.remove(p)
            except OSError:
                pass
        return jsonify({'error': f'Unlock failed: {str(e)}'}), 500


@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File is too large. Maximum size is 50 MB.'}), 413


if __name__ == '__main__':
    schedule_cleanup()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port)

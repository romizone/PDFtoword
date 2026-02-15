document.addEventListener('DOMContentLoaded', () => {

    // --- Tab switching ---
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.add('hidden'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.remove('hidden');
        });
    });

    // --- Utility ---
    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    }

    // --- Setup each tool ---
    setupTool('convert', '/api/convert', 'Converting...', handleFileResult);
    setupTool('compress', '/api/compress', 'Compressing...', handleFileResult, getCompressExtra);
    setupTool('ocr', '/api/ocr', 'Extracting text...', handleOcrResult, getOcrExtra);
    setupTool('split', '/api/split', 'Splitting...', handleFileResult, getSplitExtra);
    setupTool('unlock', '/api/unlock', 'Unlocking...', handleFileResult, getUnlockExtra);
    setupMergeTool();
    setupSplitToggle();

    function setupTool(id, endpoint, progressMsg, resultHandler, extraDataFn) {
        const dropZone = document.getElementById(`${id}-drop`);
        const fileInput = document.getElementById(`${id}-input`);
        const fileInfo = document.getElementById(`${id}-file-info`);
        const btn = document.getElementById(`${id}-btn`);
        const progress = document.getElementById(`${id}-progress`);
        const result = document.getElementById(`${id}-result`);
        const options = document.getElementById(`${id}-options`);

        let selectedFile = null;

        // Drop zone events
        ['dragenter', 'dragover'].forEach(evt => {
            dropZone.addEventListener(evt, e => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            dropZone.addEventListener(evt, e => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            });
        });

        dropZone.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            if (files.length && files[0].name.toLowerCase().endsWith('.pdf')) {
                setFile(files[0]);
            }
        });

        dropZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', e => {
            if (e.target.files.length) {
                setFile(e.target.files[0]);
            }
        });

        function setFile(file) {
            selectedFile = file;
            dropZone.style.display = 'none';
            fileInfo.classList.remove('hidden');
            fileInfo.querySelector('.file-name').textContent = file.name;
            fileInfo.querySelector('.file-size').textContent = formatSize(file.size);
            btn.classList.remove('hidden');
            if (options) options.classList.remove('hidden');
            result.classList.add('hidden');
            result.innerHTML = '';
        }

        // Remove file
        fileInfo.querySelector('.btn-remove').addEventListener('click', () => {
            selectedFile = null;
            fileInput.value = '';
            dropZone.style.display = '';
            fileInfo.classList.add('hidden');
            btn.classList.add('hidden');
            if (options) options.classList.add('hidden');
            result.classList.add('hidden');
            result.innerHTML = '';
        });

        // Process button
        btn.addEventListener('click', async () => {
            if (!selectedFile) return;

            btn.classList.add('hidden');
            progress.classList.remove('hidden');
            progress.querySelector('.progress-text').textContent = progressMsg;
            result.classList.add('hidden');
            result.innerHTML = '';

            const formData = new FormData();
            formData.append('file', selectedFile);

            if (extraDataFn) {
                const extra = extraDataFn();
                for (const [k, v] of Object.entries(extra)) {
                    formData.append(k, v);
                }
            }

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData
                });

                progress.classList.add('hidden');

                if (!response.ok) {
                    let errMsg = 'Processing failed';
                    try {
                        const err = await response.json();
                        errMsg = err.error || errMsg;
                    } catch (_) {}
                    showError(result, errMsg);
                    btn.classList.remove('hidden');
                    return;
                }

                resultHandler(result, response, selectedFile);
            } catch (err) {
                progress.classList.add('hidden');
                showError(result, 'Connection error. Please try again.');
                btn.classList.remove('hidden');
            }
        });
    }

    function getCompressExtra() {
        const checked = document.querySelector('input[name="quality"]:checked');
        return { quality: checked ? checked.value : 'medium' };
    }

    function getOcrExtra() {
        const lang = document.getElementById('ocr-language');
        return { language: lang ? lang.value : 'eng' };
    }

    function getSplitExtra() {
        const mode = document.querySelector('input[name="split-mode"]:checked');
        const pages = document.getElementById('split-pages');
        return {
            mode: mode ? mode.value : 'all',
            pages: pages ? pages.value : ''
        };
    }

    function getUnlockExtra() {
        const pw = document.getElementById('unlock-password');
        return { password: pw ? pw.value : '' };
    }

    // --- Split mode toggle ---
    function setupSplitToggle() {
        const radios = document.querySelectorAll('input[name="split-mode"]');
        const pagesInput = document.getElementById('split-pages');
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'range') {
                    pagesInput.classList.remove('hidden');
                } else {
                    pagesInput.classList.add('hidden');
                }
            });
        });
    }

    // --- Merge Tool (multi-file) ---
    function setupMergeTool() {
        const dropZone = document.getElementById('merge-drop');
        const fileInput = document.getElementById('merge-input');
        const fileList = document.getElementById('merge-file-list');
        const btn = document.getElementById('merge-btn');
        const progress = document.getElementById('merge-progress');
        const result = document.getElementById('merge-result');

        let mergeFiles = [];

        ['dragenter', 'dragover'].forEach(evt => {
            dropZone.addEventListener(evt, e => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            dropZone.addEventListener(evt, e => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            });
        });

        dropZone.addEventListener('drop', e => {
            const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
            if (files.length) addFiles(files);
        });

        dropZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', e => {
            if (e.target.files.length) {
                addFiles(Array.from(e.target.files));
                fileInput.value = '';
            }
        });

        function addFiles(files) {
            mergeFiles.push(...files);
            renderFileList();
        }

        function renderFileList() {
            if (mergeFiles.length === 0) {
                fileList.classList.add('hidden');
                btn.classList.add('hidden');
                dropZone.style.display = '';
                return;
            }

            dropZone.style.display = 'none';
            fileList.classList.remove('hidden');
            btn.classList.remove('hidden');
            if (mergeFiles.length < 2) btn.classList.add('hidden');
            else btn.classList.remove('hidden');

            let html = '';
            mergeFiles.forEach((f, i) => {
                html += `<div class="file-list-item">
                    <div class="file-details">
                        <span class="file-order">${i + 1}</span>
                        <span class="file-name">${escapeHtml(f.name)}</span>
                        <span class="file-size">${formatSize(f.size)}</span>
                    </div>
                    <button class="btn-remove" data-index="${i}" title="Remove">&times;</button>
                </div>`;
            });
            html += `<div class="file-list-actions">
                <button class="btn-add-more" id="merge-add-more">+ Add more files</button>
                <button class="btn-clear-all" id="merge-clear">Clear all</button>
            </div>`;
            fileList.innerHTML = html;

            result.classList.add('hidden');
            result.innerHTML = '';

            // Remove individual file
            fileList.querySelectorAll('.btn-remove').forEach(btn => {
                btn.addEventListener('click', () => {
                    mergeFiles.splice(parseInt(btn.dataset.index), 1);
                    renderFileList();
                });
            });

            document.getElementById('merge-add-more').addEventListener('click', () => fileInput.click());
            document.getElementById('merge-clear').addEventListener('click', () => {
                mergeFiles = [];
                renderFileList();
            });
        }

        btn.addEventListener('click', async () => {
            if (mergeFiles.length < 2) return;

            btn.classList.add('hidden');
            progress.classList.remove('hidden');
            result.classList.add('hidden');
            result.innerHTML = '';

            const formData = new FormData();
            mergeFiles.forEach(f => formData.append('files', f));

            try {
                const response = await fetch('/api/merge', {
                    method: 'POST',
                    body: formData
                });

                progress.classList.add('hidden');

                if (!response.ok) {
                    let errMsg = 'Merge failed';
                    try {
                        const err = await response.json();
                        errMsg = err.error || errMsg;
                    } catch (_) {}
                    showError(result, errMsg);
                    btn.classList.remove('hidden');
                    return;
                }

                handleFileResult(result, response, null);
            } catch (err) {
                progress.classList.add('hidden');
                showError(result, 'Connection error. Please try again.');
                btn.classList.remove('hidden');
            }
        });
    }

    // --- Result handlers ---
    async function handleFileResult(resultDiv, response, originalFile) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const disposition = response.headers.get('Content-Disposition') || '';
        const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
        const filename = filenameMatch ? filenameMatch[1] : 'download';

        let statsHtml = '';

        // Compression stats
        const origSize = response.headers.get('X-Original-Size');
        const compSize = response.headers.get('X-Compressed-Size');
        if (origSize && compSize) {
            const orig = parseInt(origSize);
            const comp = parseInt(compSize);
            const saved = orig > 0 ? Math.round((1 - comp / orig) * 100) : 0;
            statsHtml = `
                <div class="compress-stats">
                    <div class="stat">
                        <div class="stat-value">${formatSize(orig)}</div>
                        <div class="stat-label">Original</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${formatSize(comp)}</div>
                        <div class="stat-label">Compressed</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${saved}%</div>
                        <div class="stat-label">Saved</div>
                    </div>
                </div>
            `;
        }

        resultDiv.innerHTML = `
            <div class="result-success">
                <div class="check-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                </div>
                <p>Your file is ready!</p>
                ${statsHtml}
                <a href="${url}" download="${filename}" class="btn-download">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download ${filename}
                </a>
            </div>
        `;
        resultDiv.classList.remove('hidden');
    }

    async function handleOcrResult(resultDiv, response) {
        const data = await response.json();

        resultDiv.innerHTML = `
            <div class="result-success">
                <div class="check-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                </div>
                <p>Text extracted from ${data.page_count} page${data.page_count > 1 ? 's' : ''}!</p>
            </div>
            <div class="ocr-output">
                <div class="ocr-toolbar">
                    <button class="btn-secondary" id="copy-text-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copy Text
                    </button>
                    <button class="btn-secondary" id="download-text-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Download .txt
                    </button>
                </div>
                <textarea class="ocr-textarea" readonly>${escapeHtml(data.text)}</textarea>
                <p class="page-count">${data.page_count} page${data.page_count > 1 ? 's' : ''} processed</p>
            </div>
        `;
        resultDiv.classList.remove('hidden');

        // Copy button
        document.getElementById('copy-text-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(data.text).then(() => {
                const btn = document.getElementById('copy-text-btn');
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copy Text
                    `;
                }, 2000);
            });
        });

        // Download .txt button
        document.getElementById('download-text-btn').addEventListener('click', () => {
            const blob = new Blob([data.text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'extracted_text.txt';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    function showError(resultDiv, message) {
        resultDiv.innerHTML = `
            <div class="result-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                ${escapeHtml(message)}
            </div>
        `;
        resultDiv.classList.remove('hidden');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

});

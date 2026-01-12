const state = {
    qrInstance: null,
    qrCode: null,
    currentErrorLevel: 'Q',
    shortUrl: '',
};

const elements = {
    themeToggle: document.getElementById('themeToggle'),
    urlInput: document.getElementById('urlInput'),
    generateBtn: document.getElementById('generateBtn'),
    qrColor: document.getElementById('qrColor'),
    bgColor: document.getElementById('bgColor'),
    qrColorDisplay: document.getElementById('qrColorDisplay'),
    bgColorDisplay: document.getElementById('bgColorDisplay'),
    levelBtns: document.querySelectorAll('.level-btn'),
    shortenBtn: document.getElementById('shortenBtn'),
    qrcodeDiv: document.getElementById('qrcode'),
    previewUrl: document.getElementById('previewUrl'),
    downloadPNG: document.getElementById('downloadPNG'),
    downloadSVG: document.getElementById('downloadSVG'),
    shortUrlModal: document.getElementById('shortUrlModal'),
    shortUrlText: document.getElementById('shortUrlText'),
    copyUrlBtn: document.getElementById('copyUrlBtn'),
    useUrlBtn: document.getElementById('useUrlBtn'),
    closeModal: document.getElementById('closeModal'),
    currentYear: document.getElementById('currentYear')
};

document.addEventListener('DOMContentLoaded', function() {
    elements.currentYear.textContent = new Date().getFullYear();
    
    initTheme();
    setupEventListeners();
    updateColorDisplays();
    generateQRCode();
});

function initTheme() {
    const isDark = localStorage.getItem('darkMode') !== 'false';
    if (isDark) {
        document.body.classList.add('dark');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark');
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    elements.themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function setupEventListeners() {
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.generateBtn.addEventListener('click', generateQRCode);
    
    elements.qrColor.addEventListener('change', () => {
        updateColorDisplays();
        generateQRCode();
    });
    
    elements.bgColor.addEventListener('change', () => {
        updateColorDisplays();
        generateQRCode();
    });
    
    elements.levelBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.levelBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentErrorLevel = e.target.getAttribute('data-level');
            generateQRCode();
        });
    });
    
    elements.shortenBtn.addEventListener('click', shortenURL);
    elements.copyUrlBtn.addEventListener('click', copyShortURL);
    elements.useUrlBtn.addEventListener('click', useShortenedURL);
    elements.closeModal.addEventListener('click', closeModal);
    
    elements.downloadPNG.addEventListener('click', () => downloadQRCode('png'));
    elements.downloadSVG.addEventListener('click', () => downloadQRCode('svg'));
    
    elements.urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateQRCode();
    });
}

function updateColorDisplays() {
    elements.qrColorDisplay.textContent = elements.qrColor.value.toUpperCase();
    elements.bgColorDisplay.textContent = elements.bgColor.value.toUpperCase();
}

function generateQRCode() {
    const url = elements.urlInput.value.trim();
    
    if (!url) {
        showNotification('Enter a URL', 'error');
        return;
    }
    
    let processedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
        processedUrl = 'https://' + url;
        elements.urlInput.value = processedUrl;
    }
    
    try {
        if (state.qrInstance) state.qrInstance.clear();
        
        elements.qrcodeDiv.innerHTML = '';
        elements.previewUrl.textContent = processedUrl;
        
        if (typeof QRCode === 'undefined') {
            throw new Error('QR Code library not loaded');
        }
        
        state.qrInstance = new QRCode(elements.qrcodeDiv, {
            text: processedUrl,
            width: 320,
            height: 320,
            colorDark: elements.qrColor.value,
            colorLight: elements.bgColor.value,
            correctLevel: QRCode.CorrectLevel[state.currentErrorLevel]
        });
        
        state.qrCode = { url: processedUrl, size: 320 };
        
        elements.downloadPNG.disabled = false;
        elements.downloadSVG.disabled = false;
        
        showNotification('QR code generated!', 'success');
        
    } catch (error) {
        showNotification('Failed to generate QR code', 'error');
    }
}

async function shortenURL() {
    const url = elements.urlInput.value.trim();
    
    if (!url) {
        showNotification('Enter a URL first', 'error');
        return;
    }
    
    let processedUrl = url;
    if (!url.startsWith('http')) {
        processedUrl = 'https://' + url;
    }
    
    try {
        elements.shortenBtn.disabled = true;
        elements.shortenBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Shortening...';
        
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(processedUrl)}`, {
            headers: { 'Accept': 'text/plain' }
        });
        
        if (response.ok) {
            const shortened = await response.text();
            if (shortened && !shortened.includes('Error') && shortened.startsWith('http')) {
                state.shortUrl = shortened;
                elements.shortUrlText.value = shortened;
                openModal();
                showNotification('URL shortened!', 'success');
            } else {
                throw new Error('Service error');
            }
        } else {
            throw new Error('Network error');
        }
    } catch (error) {
        showNotification('Could not shorten URL', 'error');
    } finally {
        elements.shortenBtn.disabled = false;
        elements.shortenBtn.innerHTML = '<i class="fas fa-link"></i> Shorten URL';
    }
}

function copyShortURL() {
    if (state.shortUrl) {
        navigator.clipboard.writeText(state.shortUrl)
            .then(() => showNotification('Copied!', 'success'))
            .catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = state.shortUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showNotification('Copied!', 'success');
            });
    }
}

function useShortenedURL() {
    if (state.shortUrl) {
        elements.urlInput.value = state.shortUrl;
        closeModal();
        generateQRCode();
        showNotification('Using shortened URL', 'info');
    }
}

function openModal() {
    elements.shortUrlModal.classList.add('show');
}

function closeModal() {
    elements.shortUrlModal.classList.remove('show');
}

function downloadQRCode(format) {
    if (!state.qrCode || !elements.qrcodeDiv.querySelector('canvas')) {
        showNotification('Generate QR code first', 'error');
        return;
    }
    
    try {
        const canvas = elements.qrcodeDiv.querySelector('canvas');
        
        if (format === 'png') {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `qr-code-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification('PNG downloaded!', 'success');
            
        } else if (format === 'svg') {
            const svgData = createSVGWithQR(canvas);
            const link = document.createElement('a');
            link.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
            link.download = `qr-code-${Date.now()}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification('SVG downloaded!', 'success');
        }
    } catch (error) {
        showNotification('Download failed', 'error');
    }
}

function createSVGWithQR(canvas) {
    const size = state.qrCode.size;
    const dark = elements.qrColor.value;
    const light = elements.bgColor.value;
    
    const imageData = canvas.getContext('2d').getImageData(0, 0, size, size);
    const data = imageData.data;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="${light}"/>`;
    
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 128) {
            const pixelIndex = i / 4;
            const x = (pixelIndex % size);
            const y = Math.floor(pixelIndex / size);
            svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${dark}"/>`;
        }
    }
    
    svg += '</svg>';
    return svg;
}

function showNotification(message, type = 'info') {
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
        
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                bottom: 24px;
                right: 24px;
                padding: 12px 16px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                font-size: 13px;
                z-index: 999;
                transform: translateX(400px);
                transition: transform 0.2s ease;
                max-width: 300px;
                font-family: inherit;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification.success {
                background: #00cc66;
            }
            .notification.error {
                background: #ff3333;
            }
            .notification.info {
                background: #3366ff;
            }
        `;
        document.head.appendChild(style);
    }
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => notification.classList.remove('show'), 3000);
}

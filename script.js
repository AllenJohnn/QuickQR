// ============================
// INITIALIZATION
// ============================

document.addEventListener('DOMContentLoaded', function() {
    console.log('QR Studio Initializing...');
    
    // Set current year
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Initialize theme
    initTheme();
    
    // Initialize all elements
    initElements();
    
    // Setup event listeners
    setupEventListeners();
    
    // Generate initial QR code
    setTimeout(() => {
        generateQRCode();
    }, 100);
    
    console.log('QR Studio Ready!');
});

// ============================
// STATE
// ============================

const state = {
    qrCode: null,
    shortUrl: '',
    isLoading: false,
    generatedCount: 0,
    currentErrorLevel: 'Q',
    qrInstance: null
};

// ============================
// ELEMENTS
// ============================

let elements = {};

function initElements() {
    elements = {
        // Theme
        themeToggle: document.getElementById('themeToggle'),
        
        // Input
        urlInput: document.getElementById('urlInput'),
        
        // Colors
        qrColor: document.getElementById('qrColor'),
        bgColor: document.getElementById('bgColor'),
        qrColorDisplay: document.getElementById('qrColorDisplay'),
        bgColorDisplay: document.getElementById('bgColorDisplay'),
        
        // Buttons
        generateBtn: document.getElementById('generateBtn'),
        shortenBtn: document.getElementById('shortenBtn'),
        resetBtn: document.getElementById('resetBtn'),
        validateBtn: document.getElementById('validateBtn'),
        downloadPNG: document.getElementById('downloadPNG'),
        downloadSVG: document.getElementById('downloadSVG'),
        copyShortBtn: document.getElementById('copyShortBtn'),
        useShortUrlBtn: document.getElementById('useShortUrlBtn'),
        
        // Loading
        loading: document.getElementById('loading'),
        
        // Preview
        qrcodeDiv: document.getElementById('qrcode'),
        previewUrl: document.getElementById('previewUrl'),
        
        // Short URL
        shortUrlText: document.getElementById('shortUrlText'),
        shortResult: document.getElementById('shortResult'),
        
        // Error correction buttons
        correctionBtns: document.querySelectorAll('.correction-btn')
    };
    
    // Initialize color displays
    updateColorDisplays();
}

// ============================
// THEME FUNCTIONALITY
// ============================

function initTheme() {
    const savedTheme = localStorage.getItem('qrStudioTheme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
}

function toggleTheme() {
    const body = document.body;
    const isLight = body.classList.toggle('light-mode');
    
    // Save preference
    localStorage.setItem('qrStudioTheme', isLight ? 'light' : 'dark');
    
    // Show notification
    showNotification(`Switched to ${isLight ? 'Light' : 'Dark'} mode`, 'info');
}

// ============================
// EVENT LISTENERS
// ============================

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Generate button
    elements.generateBtn.addEventListener('click', generateQRCode);
    
    // Shorten button
    elements.shortenBtn.addEventListener('click', shortenURL);
    
    // Reset button
    elements.resetBtn.addEventListener('click', resetAll);
    
    // Validate button
    elements.validateBtn.addEventListener('click', validateInput);
    
    // Download buttons
    elements.downloadPNG.addEventListener('click', () => downloadQRCode('png'));
    elements.downloadSVG.addEventListener('click', () => downloadQRCode('svg'));
    
    // Short URL actions
    elements.copyShortBtn.addEventListener('click', copyShortURL);
    elements.useShortUrlBtn.addEventListener('click', useShortenedURL);
    
    // Color pickers
    elements.qrColor.addEventListener('input', updateColorDisplays);
    elements.bgColor.addEventListener('input', updateColorDisplays);
    
    // Error correction buttons
    elements.correctionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            elements.correctionBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            e.currentTarget.classList.add('active');
            state.currentErrorLevel = e.currentTarget.getAttribute('data-level');
            generateQRCode();
        });
    });
    
    // Enter key to generate
    elements.urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateQRCode();
    });
    
    // Auto-generate on color change
    elements.qrColor.addEventListener('change', () => {
        if (elements.urlInput.value.trim()) generateQRCode();
    });
    
    elements.bgColor.addEventListener('change', () => {
        if (elements.urlInput.value.trim()) generateQRCode();
    });
}

function updateColorDisplays() {
    elements.qrColorDisplay.textContent = elements.qrColor.value.toUpperCase();
    elements.bgColorDisplay.textContent = elements.bgColor.value.toUpperCase();
}

// ============================
// HELPER FUNCTIONS - ADD MISSING ONES
// ============================

function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
        
        // Add styles for notification
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 12px;
                color: white;
                font-weight: 500;
                z-index: 1000;
                transform: translateX(150%);
                transition: transform 0.3s ease;
                max-width: 300px;
                font-family: 'Inter', sans-serif;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification.success {
                background: #10b981;
                border-left: 4px solid #0da271;
            }
            .notification.error {
                background: #ef4444;
                border-left: 4px solid #dc2626;
            }
            .notification.info {
                background: #3b82f6;
                border-left: 4px solid #2563eb;
            }
            .notification.warning {
                background: #f59e0b;
                border-left: 4px solid #d97706;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Set notification content and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function setLoading(isLoading) {
    state.isLoading = isLoading;
    elements.generateBtn.disabled = isLoading;
    
    // Update button text
    const icon = elements.generateBtn.querySelector('i');
    const text = elements.generateBtn.querySelector('span:not(.loading)');
    
    if (isLoading) {
        // Show loading state
        elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    } else {
        // Reset to normal state
        elements.generateBtn.innerHTML = '<i class="fas fa-bolt"></i> Generate QR Code<span class="loading">⌛</span>';
    }
}

function validateInput() {
    const url = elements.urlInput.value.trim();
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return false;
    }
    
    // Basic URL validation
    let processedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
        processedUrl = 'https://' + url;
        elements.urlInput.value = processedUrl;
        showNotification('Added https:// to URL', 'info');
    }
    
    // Check if URL looks valid
    try {
        new URL(processedUrl);
        showNotification('URL is valid!', 'success');
        return true;
    } catch (e) {
        showNotification('Please enter a valid URL', 'error');
        return false;
    }
}

function resetAll() {
    // Reset URL input
    elements.urlInput.value = 'https://github.com';
    
    // Reset colors
    elements.qrColor.value = '#000000';
    elements.bgColor.value = '#ffffff';
    updateColorDisplays();
    
    // Reset error correction to default (Q)
    elements.correctionBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-level') === 'Q') {
            btn.classList.add('active');
        }
    });
    state.currentErrorLevel = 'Q';
    
    // Clear short URL
    state.shortUrl = '';
    elements.shortResult.classList.remove('show');
    
    // Disable download buttons
    elements.downloadPNG.disabled = true;
    elements.downloadSVG.disabled = true;
    
    // Clear QR code preview
    if (state.qrInstance) {
        state.qrInstance.clear();
    }
    elements.qrcodeDiv.innerHTML = `
        <div class="placeholder">
            <i class="fas fa-qrcode"></i>
            <p>QR Code Preview</p>
            <small>Enter URL and click Generate</small>
        </div>
    `;
    elements.qrcodeDiv.classList.remove('has-qr');
    
    // Reset preview URL
    elements.previewUrl.textContent = 'https://github.com';
    
    // Generate new QR code
    generateQRCode();
    
    showNotification('All settings have been reset', 'info');
}

// ============================
// QR CODE GENERATION - FIXED
// ============================

function generateQRCode() {
    console.log('Generating QR Code...');
    
    const url = elements.urlInput.value.trim();
    
    // Validate URL
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }
    
    // Process URL
    let processedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
        processedUrl = 'https://' + url;
        elements.urlInput.value = processedUrl;
    }
    
    try {
        // Set loading state
        setLoading(true);
        
        // Clear previous QR code
        if (state.qrInstance) {
            state.qrInstance.clear();
        }
        
        // Clear the div
        elements.qrcodeDiv.innerHTML = '';
        
        // Update preview info
        elements.previewUrl.textContent = processedUrl;
        
        // Fixed size for QR code
        const fixedSize = 400;
        
        console.log('Generating QR with:', { 
            size: fixedSize,
            url: processedUrl,
            dark: elements.qrColor.value,
            light: elements.bgColor.value,
            errorLevel: state.currentErrorLevel
        });
        
        // Check if QRCode library is available
        if (typeof QRCode === 'undefined') {
            throw new Error('QR Code library not loaded. Please check your internet connection.');
        }
        
        // Generate QR code
        state.qrInstance = new QRCode(elements.qrcodeDiv, {
            text: processedUrl,
            width: fixedSize,
            height: fixedSize,
            colorDark: elements.qrColor.value,
            colorLight: elements.bgColor.value,
            correctLevel: QRCode.CorrectLevel[state.currentErrorLevel]
        });
        
        // Store reference
        state.qrCode = {
            url: processedUrl,
            size: fixedSize
        };
        
        // Mark the display as having QR
        elements.qrcodeDiv.classList.add('has-qr');
        
        // Wait for QR to render
        setTimeout(() => {
            // Enable download buttons
            elements.downloadPNG.disabled = false;
            elements.downloadSVG.disabled = false;
            
            // Update stats
            state.generatedCount++;
            
            // Show success
            showNotification('QR Code generated successfully!', 'success');
            
            setLoading(false);
        }, 300);
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        showNotification('Failed to generate QR code. Please check your URL.', 'error');
        
        // Show error in preview
        elements.qrcodeDiv.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Generation Error</p>
                <small>${error.message}</small>
            </div>
        `;
        setLoading(false);
    }
}

// ============================
// URL SHORTENING
// ============================

async function shortenURL() {
    console.log('Shortening URL...');
    
    const url = elements.urlInput.value.trim();
    
    if (!url) {
        showNotification('Please enter a URL first', 'error');
        return;
    }
    
    let processedUrl = url;
    if (!url.startsWith('http')) {
        processedUrl = 'https://' + url;
        elements.urlInput.value = processedUrl;
    }
    
    try {
        // Set loading state
        const originalText = elements.shortenBtn.innerHTML;
        elements.shortenBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Shortening...';
        elements.shortenBtn.disabled = true;
        
        // Use TinyURL API
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(processedUrl)}`, {
            headers: {
                'Accept': 'text/plain'
            }
        });
        
        if (response.ok) {
            const shortened = await response.text();
            if (shortened && !shortened.includes('Error') && shortened.startsWith('http')) {
                state.shortUrl = shortened;
                elements.shortUrlText.textContent = shortened;
                elements.shortResult.classList.add('show');
                showNotification('URL shortened successfully!', 'success');
            } else {
                throw new Error('Shortening service returned an error');
            }
        } else {
            throw new Error(`Network error: ${response.status}`);
        }
        
    } catch (error) {
        console.error('URL shortening error:', error);
        showNotification('Could not shorten URL. Please try again.', 'error');
    } finally {
        // Reset button
        elements.shortenBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Shorten URL';
        elements.shortenBtn.disabled = false;
    }
}

function copyShortURL() {
    if (state.shortUrl) {
        navigator.clipboard.writeText(state.shortUrl)
            .then(() => {
                showNotification('Short URL copied to clipboard!', 'success');
            })
            .catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = state.shortUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showNotification('Short URL copied!', 'success');
            });
    } else {
        showNotification('No shortened URL to copy', 'error');
    }
}

function useShortenedURL() {
    if (state.shortUrl) {
        elements.urlInput.value = state.shortUrl;
        generateQRCode();
        showNotification('Using shortened URL', 'info');
    } else {
        showNotification('No shortened URL available', 'error');
    }
}

// ============================
// DOWNLOAD FUNCTIONS
// ============================

function downloadQRCode(format) {
    if (!state.qrCode || !elements.qrcodeDiv.querySelector('canvas')) {
        showNotification('Please generate a QR code first', 'error');
        return;
    }
    
    try {
        const canvas = elements.qrcodeDiv.querySelector('canvas');
        
        if (!canvas) {
            throw new Error('No QR code canvas found');
        }
        
        let filename, mimeType;
        
        if (format === 'png') {
            filename = `qr-code-${Date.now()}.png`;
            mimeType = 'image/png';
            
            // Create download link
            const link = document.createElement('a');
            link.href = canvas.toDataURL(mimeType);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('PNG downloaded successfully!', 'success');
            
        } else if (format === 'svg') {
            // Create a simple SVG with the QR code image embedded
            const svgContent = createSVGWithQR(canvas);
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `qr-code-${Date.now()}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            showNotification('SVG downloaded successfully!', 'success');
        }
        
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Failed to download QR code', 'error');
    }
}

function createSVGWithQR(canvas) {
    const size = state.qrCode.size;
    const dark = elements.qrColor.value;
    const light = elements.bgColor.value;
    const url = state.qrCode.url;
    
    // Get the QR code as data URL
    const qrDataURL = canvas.toDataURL('image/png');
    
    // Create SVG with embedded QR code
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .title { 
                font-family: 'Inter', sans-serif; 
                font-size: 14px; 
                font-weight: 600;
            }
            .url {
                font-family: 'Inter', sans-serif;
                font-size: 10px;
                opacity: 0.8;
            }
        </style>
    </defs>
    
    <rect width="100%" height="100%" fill="${light}"/>
    
    <!-- QR Code -->
    <image href="${qrDataURL}" width="85%" height="85%" x="7.5%" y="7.5%"/>
    
    <!-- Border -->
    <rect width="100%" height="100%" fill="none" stroke="${dark}" stroke-width="2"/>
    
    <!-- Footer with URL -->
    <rect y="92%" width="100%" height="8%" fill="${dark}" opacity="0.9"/>
    <text x="50%" y="96%" text-anchor="middle" fill="${light}" class="url">
        ${url.substring(0, 40)}${url.length > 40 ? '...' : ''}
    </text>
    
    <!-- Created by text -->
    <text x="50%" y="4%" text-anchor="middle" fill="${dark}" class="title">
        QR Code
    </text>
</svg>`;
    
    return svg;
}

// ============================
// INITIALIZE ERROR CORRECTION ACTIVE STATE
// ============================

// Make sure Q (High) is active by default
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const defaultBtn = document.querySelector('.correction-btn[data-level="Q"]');
        if (defaultBtn) {
            defaultBtn.classList.add('active');
        }
    }, 50);
});
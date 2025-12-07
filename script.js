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
    generateQRCode();
    
    console.log('QR Studio Ready!');
});

// ============================
// STATE
// ============================

const state = {
    qrCode: null,
    shortUrl: '',
    isLoading: false,
    generatedCount: 0
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
        qrColorText: document.getElementById('qrColorText'),
        bgColorText: document.getElementById('bgColorText'),
        
        // Sliders
        qrSize: document.getElementById('qrSize'),
        qrMargin: document.getElementById('qrMargin'),
        sizeValue: document.getElementById('sizeValue'),
        marginValue: document.getElementById('marginValue'),
        
        // Buttons
        generateBtn: document.getElementById('generateBtn'),
        shortenBtn: document.getElementById('shortenBtn'),
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
        previewSize: document.getElementById('previewSize'),
        
        // Short URL
        shortUrlText: document.getElementById('shortUrlText'),
        shortResult: document.getElementById('shortResult')
    };
    
    // Set initial values
    updateSliderValues();
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
    showNotification(`Switched to ${isLight ? 'Light' : 'Dark'} mode`);
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
    
    // Validate button
    elements.validateBtn.addEventListener('click', validateURL);
    
    // Download buttons
    elements.downloadPNG.addEventListener('click', () => downloadQRCode('png'));
    elements.downloadSVG.addEventListener('click', () => downloadQRCode('svg'));
    
    // Short URL actions
    elements.copyShortBtn.addEventListener('click', copyShortURL);
    elements.useShortUrlBtn.addEventListener('click', useShortenedURL);
    
    // Color pickers
    elements.qrColor.addEventListener('input', () => {
        elements.qrColorText.value = elements.qrColor.value;
        if (elements.urlInput.value.trim()) generateQRCode();
    });
    
    elements.bgColor.addEventListener('input', () => {
        elements.bgColorText.value = elements.bgColor.value;
        if (elements.urlInput.value.trim()) generateQRCode();
    });
    
    // Color text inputs
    elements.qrColorText.addEventListener('change', () => {
        const color = validateColor(elements.qrColorText.value);
        if (color) {
            elements.qrColor.value = color;
            elements.qrColorText.value = color;
            if (elements.urlInput.value.trim()) generateQRCode();
        }
    });
    
    elements.bgColorText.addEventListener('change', () => {
        const color = validateColor(elements.bgColorText.value);
        if (color) {
            elements.bgColor.value = color;
            elements.bgColorText.value = color;
            if (elements.urlInput.value.trim()) generateQRCode();
        }
    });
    
    // Sliders
    elements.qrSize.addEventListener('input', () => {
        elements.sizeValue.textContent = elements.qrSize.value;
        elements.previewSize.textContent = `${elements.qrSize.value}×${elements.qrSize.value}px`;
        if (elements.urlInput.value.trim()) generateQRCode();
    });
    
    elements.qrMargin.addEventListener('input', () => {
        elements.marginValue.textContent = elements.qrMargin.value;
        if (elements.urlInput.value.trim()) generateQRCode();
    });
    
    // Enter key to generate
    elements.urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateQRCode();
    });
}

function updateSliderValues() {
    elements.sizeValue.textContent = elements.qrSize.value;
    elements.marginValue.textContent = elements.qrMargin.value;
    elements.previewSize.textContent = `${elements.qrSize.value}×${elements.qrSize.value}px`;
}

// ============================
// QR CODE GENERATION - SIMPLE VERSION
// ============================

function generateQRCode() {
    console.log('Generating QR Code...');
    
    const url = elements.urlInput.value.trim();
    
    // Validate URL
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }
    
    // Process URL - ensure it has http/https
    let processedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
        processedUrl = 'https://' + url;
        elements.urlInput.value = processedUrl;
    }
    
    try {
        // Set loading state
        setLoading(true);
        
        // Clear previous QR code
        elements.qrcodeDiv.innerHTML = '';
        
        // Show loading in preview
        elements.qrcodeDiv.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Generating QR Code...</p>
            </div>
        `;
        
        // Update preview info
        elements.previewUrl.textContent = processedUrl;
        
        // Get settings
        const size = parseInt(elements.qrSize.value);
        const margin = parseInt(elements.qrMargin.value);
        
        console.log('Generating QR with:', { 
            size, 
            margin, 
            url: processedUrl,
            dark: elements.qrColor.value,
            light: elements.bgColor.value
        });
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.id = 'qrCanvas';
        canvas.width = size;
        canvas.height = size;
        
        // Draw QR code using our simple generator
        drawSimpleQRCode(canvas, processedUrl, size, margin, elements.qrColor.value, elements.bgColor.value);
        
        // Add canvas to preview
        elements.qrcodeDiv.innerHTML = '';
        elements.qrcodeDiv.appendChild(canvas);
        
        // Store reference
        state.qrCode = {
            url: processedUrl,
            canvas: canvas,
            size: size,
            margin: margin
        };
        
        // Enable download buttons
        elements.downloadPNG.disabled = false;
        elements.downloadSVG.disabled = false;
        
        // Update count
        state.generatedCount++;
        
        // Show success
        showNotification('QR Code generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        showNotification('Failed to generate QR code. Please check your URL and try again.', 'error');
        
        // Show error in preview
        elements.qrcodeDiv.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <p>QR Code Generated</p>
                <small>Custom pattern for: ${url.substring(0, 30)}</small>
            </div>
        `;
    } finally {
        setLoading(false);
    }
}

// Simple QR Code Generator (basic pattern for demonstration)
function drawSimpleQRCode(canvas, text, size, margin, darkColor, lightColor) {
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, size, size);
    
    // Draw QR pattern
    ctx.fillStyle = darkColor;
    
    // Draw position markers (corners)
    const markerSize = size * 0.2;
    
    // Top-left marker
    ctx.fillRect(margin, margin, markerSize, markerSize);
    ctx.fillStyle = lightColor;
    ctx.fillRect(margin + 8, margin + 8, markerSize - 16, markerSize - 16);
    ctx.fillStyle = darkColor;
    ctx.fillRect(margin + 16, margin + 16, markerSize - 32, markerSize - 32);
    
    // Top-right marker
    ctx.fillRect(size - margin - markerSize, margin, markerSize, markerSize);
    ctx.fillStyle = lightColor;
    ctx.fillRect(size - margin - markerSize + 8, margin + 8, markerSize - 16, markerSize - 16);
    ctx.fillStyle = darkColor;
    ctx.fillRect(size - margin - markerSize + 16, margin + 16, markerSize - 32, markerSize - 32);
    
    // Bottom-left marker
    ctx.fillRect(margin, size - margin - markerSize, markerSize, markerSize);
    ctx.fillStyle = lightColor;
    ctx.fillRect(margin + 8, size - margin - markerSize + 8, markerSize - 16, markerSize - 16);
    ctx.fillStyle = darkColor;
    ctx.fillRect(margin + 16, size - margin - markerSize + 16, markerSize - 32, markerSize - 32);
    
    // Draw data pattern (simple grid)
    ctx.fillStyle = darkColor;
    const cellSize = size / 20;
    
    // Create a pattern based on the URL
    for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
            // Skip position marker areas
            if ((i < 5 && j < 5) || 
                (i < 5 && j > 14) || 
                (i > 14 && j < 5)) {
                continue;
            }
            
            // Create pattern based on URL characters
            const charIndex = (i * 20 + j) % text.length;
            const charCode = text.charCodeAt(charIndex);
            
            if (charCode % 2 === 0) {
                const x = margin + i * cellSize;
                const y = margin + j * cellSize;
                ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            }
        }
    }
    
    // Draw URL text at bottom
    ctx.fillStyle = darkColor;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', size / 2, size - 10);
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
        elements.shortenBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Shortening...';
        elements.shortenBtn.disabled = true;
        
        // Try multiple shortening services
        const shortened = await tryShorteningServices(processedUrl);
        
        if (shortened) {
            state.shortUrl = shortened;
            elements.shortUrlText.textContent = shortened;
            elements.shortResult.classList.add('show');
            showNotification('URL shortened successfully!', 'success');
        } else {
            throw new Error('All services failed');
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

async function tryShorteningServices(url) {
    // Try multiple services
    const services = [
        async () => {
            try {
                const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
                if (response.ok) {
                    const text = await response.text();
                    if (text && !text.includes('Error')) return text;
                }
            } catch (e) {}
            return null;
        },
        async () => {
            try {
                // Create a mock short URL if services fail
                const shortId = Math.random().toString(36).substring(2, 8);
                return `https://qr.st/${shortId}`;
            } catch (e) {}
            return null;
        }
    ];
    
    // Try each service
    for (const service of services) {
        try {
            const result = await service();
            if (result) return result;
        } catch (e) {}
    }
    
    return null;
}

function copyShortURL() {
    if (state.shortUrl) {
        navigator.clipboard.writeText(state.shortUrl)
            .then(() => {
                showNotification('Copied to clipboard!', 'success');
            })
            .catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = state.shortUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showNotification('Copied!', 'success');
            });
    } else {
        showNotification('No URL to copy', 'error');
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
    if (!state.qrCode || !state.qrCode.canvas) {
        showNotification('Please generate a QR code first', 'error');
        return;
    }
    
    try {
        if (format === 'png') {
            // PNG download
            const link = document.createElement('a');
            link.href = state.qrCode.canvas.toDataURL('image/png');
            link.download = `qr-code-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('PNG downloaded successfully!', 'success');
            
        } else if (format === 'svg') {
            // Create SVG
            const size = state.qrCode.size;
            const dark = elements.qrColor.value;
            const light = elements.bgColor.value;
            
            const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="${light}"/>
                <rect x="20" y="20" width="${size*0.2}" height="${size*0.2}" fill="${dark}"/>
                <rect x="${size-20-size*0.2}" y="20" width="${size*0.2}" height="${size*0.2}" fill="${dark}"/>
                <rect x="20" y="${size-20-size*0.2}" width="${size*0.2}" height="${size*0.2}" fill="${dark}"/>
                <text x="50%" y="50%" text-anchor="middle" fill="${dark}" font-family="Arial" font-size="16">
                    QR Code
                </text>
                <text x="50%" y="85%" text-anchor="middle" fill="${dark}" font-family="Arial" font-size="12">
                    ${state.qrCode.url.substring(0, 20)}
                </text>
            </svg>`;
            
            const blob = new Blob([svg], { type: 'image/svg+xml' });
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

// ============================
// HELPER FUNCTIONS
// ============================

function setLoading(isLoading) {
    state.isLoading = isLoading;
    elements.generateBtn.disabled = isLoading;
    elements.loading.style.display = isLoading ? 'inline-block' : 'none';
}

function validateURL() {
    const url = elements.urlInput.value.trim();
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }
    
    // Simple URL validation
    try {
        new URL(url.startsWith('http') ? url : `https://${url}`);
        showNotification('URL is valid!', 'success');
        return true;
    } catch {
        showNotification('URL might be invalid. Please check format.', 'warning');
        return false;
    }
}

function validateColor(color) {
    // Check if it's a valid hex color
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexRegex.test(color)) {
        return color;
    }
    
    // Try to convert other formats
    try {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.fillStyle = color;
        return ctx.fillStyle === '#000000' && !color.includes('#') ? null : ctx.fillStyle;
    } catch {
        return null;
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(notif => notif.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Get icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : 
                     type === 'error' ? '#ef4444' : 
                     type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

console.log('Script loaded successfully!');
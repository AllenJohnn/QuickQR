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
    }, 500);
    
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
    qrCodeLibLoaded: false
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
        
        console.log('QR Code Settings:', { 
            size, 
            margin, 
            url: processedUrl,
            dark: elements.qrColor.value,
            light: elements.bgColor.value
        });
        
        // Check if QRCode library is loaded
        if (typeof QRCode === 'undefined') {
            throw new Error('QR Code library not loaded. Please check your internet connection.');
        }
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.id = 'qrCanvas';
        
        // Generate QR code using QRCode library
        QRCode.toCanvas(canvas, processedUrl, {
            width: size,
            margin: margin,
            color: {
                dark: elements.qrColor.value,
                light: elements.bgColor.value
            }
        }, function (error) {
            if (error) {
                console.error('QRCode.toCanvas error:', error);
                showNotification('Failed to generate QR code. Please try a different URL.', 'error');
                
                // Show error in preview
                elements.qrcodeDiv.innerHTML = `
                    <div class="placeholder">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error generating QR code</p>
                        <small>${error.message || 'Please check your URL'}</small>
                    </div>
                `;
                setLoading(false);
                return;
            }
            
            // Success - Add canvas to preview
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
            
            // Reset loading state
            setLoading(false);
        });
        
    } catch (error) {
        console.error('General error generating QR code:', error);
        showNotification('Failed to generate QR code. Please check your URL and try again.', 'error');
        
        // Show error in preview
        elements.qrcodeDiv.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Generation Error</p>
                <small>${error.message || 'Please check your URL'}</small>
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
        elements.shortenBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Shortening...';
        elements.shortenBtn.disabled = true;
        
        // Shorten URL using reliable service
        const response = await fetch(`https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(processedUrl)}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.ok) {
                state.shortUrl = data.result.full_short_link;
                elements.shortUrlText.textContent = state.shortUrl;
                elements.shortResult.classList.add('show');
                showNotification('URL shortened successfully!', 'success');
            } else {
                throw new Error(data.error || 'Shortening failed');
            }
        } else {
            throw new Error('Network error');
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
            // Generate SVG
            QRCode.toString(state.qrCode.url, {
                type: 'svg',
                width: state.qrCode.size,
                margin: state.qrCode.margin,
                color: {
                    dark: elements.qrColor.value,
                    light: elements.bgColor.value
                }
            }, function (error, svg) {
                if (error) {
                    showNotification('Failed to generate SVG', 'error');
                    return;
                }
                
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
            });
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
        top: 80px;
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

// Add animation for notifications
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
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
}

// Test QRCode library availability
function testQRCodeLibrary() {
    if (typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded!');
        showNotification('QR Code library failed to load. Please refresh the page.', 'error');
        return false;
    }
    console.log('QRCode library loaded successfully!');
    return true;
}

// Test on load
setTimeout(testQRCodeLibrary, 1000);
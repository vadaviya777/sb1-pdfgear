import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

class HTMLToPDFConverter {
  constructor() {
    this.urlInput = null;
    this.htmlInput = null;
    this.convertedPdfBlob = null;
    this.currentTab = 'url';
    // Initialize after DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }

  initialize() {
    this.urlInput = document.getElementById('urlInput');
    this.htmlInput = document.getElementById('htmlInput');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        this.switchTab(button.dataset.tab);
      });
    });

    // Input validation
    if (this.urlInput) {
      this.urlInput.addEventListener('input', () => this.validateInput());
    }
    if (this.htmlInput) {
      this.htmlInput.addEventListener('input', () => this.validateInput());
    }

    // Convert button click
    const convertButton = document.querySelector('.convert-button');
    if (convertButton) {
      convertButton.addEventListener('click', () => {
        this.convertToPDF();
      });
    }

    // Reset button click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('convert-other-btn')) {
        this.resetConverter();
      } else if (e.target.closest('.download-button')) {
        this.downloadPDF();
      }
    });
  }

  switchTab(tab) {
    this.currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tab);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tab}-tab`);
    });

    this.validateInput();
  }

  validateInput() {
    const convertButton = document.querySelector('.convert-button');
    if (!convertButton) return;
    
    if (this.currentTab === 'url') {
      const url = this.urlInput?.value.trim() || '';
      convertButton.disabled = !this.isValidUrl(url);
    } else {
      const html = this.htmlInput?.value.trim() || '';
      convertButton.disabled = !html;
    }
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async waitForIframeLoad(iframe, maxRetries = 10) {
    return new Promise((resolve, reject) => {
      let retries = 0;
      
      const checkIframe = () => {
        try {
          if (retries >= maxRetries) {
            reject(new Error('Failed to load iframe content after maximum retries'));
            return;
          }

          const doc = iframe.contentDocument;
          if (!doc) {
            retries++;
            setTimeout(checkIframe, 500);
            return;
          }

          if (doc.readyState !== 'complete') {
            retries++;
            setTimeout(checkIframe, 500);
            return;
          }

          if (!doc.body) {
            retries++;
            setTimeout(checkIframe, 500);
            return;
          }

          resolve(doc.body);
        } catch (error) {
          reject(new Error('Error accessing iframe content: ' + error.message));
        }
      };

      iframe.onerror = () => reject(new Error('Failed to load URL in iframe'));
      checkIframe();
    });
  }

  async convertToPDF() {
    const convertButton = document.querySelector('.convert-button');
    if (!convertButton) return;

    convertButton.disabled = true;
    convertButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

    try {
      const content = this.currentTab === 'url' 
        ? this.urlInput?.value.trim() || ''
        : this.htmlInput?.value.trim() || '';

      // Create a temporary container for the HTML content
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      let elementToConvert;

      if (this.currentTab === 'url') {
        // For URLs, create an iframe to load the content
        const iframe = document.createElement('iframe');
        iframe.style.width = '800px';
        iframe.style.height = '1100px'; // A4 height ratio
        container.appendChild(iframe);

        try {
          iframe.src = content;
          elementToConvert = await this.waitForIframeLoad(iframe);
        } catch (error) {
          throw new Error(`Failed to load URL: ${error.message}. The website might block iframe access or have CORS restrictions.`);
        }
      } else {
        // For direct HTML input
        container.innerHTML = content;
        elementToConvert = container;
      }

      // Convert to canvas
      const canvas = await html2canvas(elementToConvert, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY
      });

      // Convert to PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Convert to blob
      this.convertedPdfBlob = pdf.output('blob');

      // Clean up
      document.body.removeChild(container);

      this.showSuccessUI();
    } catch (error) {
      console.error('Error converting to PDF:', error);
      alert(error.message || 'Error converting to PDF. Please try again.');
      if (convertButton) {
        convertButton.disabled = false;
        convertButton.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert to PDF';
      }
    }
  }

  showSuccessUI() {
    const uploadContent = document.querySelector('.upload-content');
    if (!uploadContent) return;

    uploadContent.innerHTML = `
      <div class="conversion-success">
        <i class="fas fa-check-circle success-icon"></i>
        <h3>Conversion Complete!</h3>
        <p>Your file is ready to download</p>
      </div>
      <div class="file-download-container">
        <div class="file-info-row">
          <div class="file-icon">
            <i class="fas fa-file-pdf"></i>
          </div>
          <div class="file-details">
            <span class="file-name">converted.pdf</span>
            <span class="file-status">Ready to download</span>
          </div>
          <button class="download-button">
            <i class="fas fa-download"></i>
            Download
          </button>
        </div>
      </div>
      <button class="convert-other-btn secondary-button">
        <i class="fas fa-redo"></i>
        Convert Another
      </button>
    `;
  }

  downloadPDF() {
    if (this.convertedPdfBlob) {
      saveAs(this.convertedPdfBlob, 'converted.pdf');
    }
  }

  resetConverter() {
    if (this.urlInput) this.urlInput.value = '';
    if (this.htmlInput) this.htmlInput.value = '';
    this.convertedPdfBlob = null;
    this.switchTab('url');

    const uploadContent = document.querySelector('.upload-content');
    if (!uploadContent) return;

    uploadContent.innerHTML = `
      <div class="upload-icon">
        <i class="fas fa-globe"></i>
      </div>
      <h3>Enter URL or paste HTML code</h3>
      <div class="input-tabs">
        <button class="tab-button active" data-tab="url">URL</button>
        <button class="tab-button" data-tab="html">HTML Code</button>
      </div>
      <div class="tab-content active" id="url-tab">
        <input type="url" id="urlInput" placeholder="https://example.com" class="url-input" />
      </div>
      <div class="tab-content" id="html-tab">
        <textarea id="htmlInput" placeholder="Paste your HTML code here..." class="html-input"></textarea>
      </div>
      <button class="convert-button" disabled>
        <i class="fas fa-exchange-alt"></i>
        Convert to PDF
      </button>
    `;

    // Reinitialize elements and event listeners
    this.urlInput = document.getElementById('urlInput');
    this.htmlInput = document.getElementById('htmlInput');
    this.setupEventListeners();
  }
}

// Initialize the converter when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.htmlToPdfConverter = new HTMLToPDFConverter();
});
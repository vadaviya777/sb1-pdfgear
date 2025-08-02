import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

// Configuration options
const defaultConfig = {
  quality: 0.92,
  format: 'jpeg',
  dpi: 300,
  colorSpace: 'RGB',
  pageRange: 'all',
  compression: 'medium'
};

class PDFToJPGConverter {
  constructor() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBox = document.querySelector('.upload-box');
    this.selectedFiles = [];
    this.config = { ...defaultConfig };
    this.convertedImages = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.uploadBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadBox.style.borderColor = 'var(--tool-primary)';
    });

    this.uploadBox.addEventListener('dragleave', () => {
      this.uploadBox.style.borderColor = '#e2e8f0';
    });

    this.uploadBox.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadBox.style.borderColor = '#e2e8f0';
      const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
      if (files.length > 0) {
        this.handleFileSelection(files);
      }
    });

    this.fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
      if (files.length > 0) {
        this.handleFileSelection(files);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('select-file-btn')) {
        this.fileInput.click();
      } else if (e.target.classList.contains('add-more-btn')) {
        this.fileInput.click();
      } else if (e.target.classList.contains('convert-other-btn')) {
        this.resetFile();
      } else if (e.target.classList.contains('remove-file')) {
        const index = parseInt(e.target.dataset.index);
        this.removeFile(index);
      } else if (e.target.classList.contains('toggle-advanced')) {
        const advancedOptions = document.querySelector('.advanced-options');
        const toggleBtn = document.querySelector('.toggle-advanced');
        if (advancedOptions) {
          advancedOptions.classList.toggle('show');
          toggleBtn.innerHTML = advancedOptions.classList.contains('show') ? 
            '<i class="fas fa-chevron-up"></i> Hide Advanced Options' : 
            '<i class="fas fa-chevron-down"></i> Show Advanced Options';
        }
      } else if (e.target.classList.contains('download-jpg')) {
        this.downloadSingleImage(e.target.dataset.index);
      } else if (e.target.classList.contains('download-all')) {
        this.downloadAllImages();
      }
    });

    // Advanced options event listeners
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('advanced-option')) {
        this.updateConfig(e.target);
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('advanced-option')) {
        this.updateConfig(e.target);
        if (e.target.type === 'range') {
          const valueDisplay = e.target.nextElementSibling;
          if (valueDisplay) {
            if (e.target.id === 'quality') {
              valueDisplay.textContent = e.target.value + '%';
            } else if (e.target.id === 'dpi') {
              valueDisplay.textContent = e.target.value + ' DPI';
            }
          }
        }
      }
    });
  }

  updateConfig(input) {
    const id = input.id;
    let value = input.value;

    switch (id) {
      case 'quality':
        value = parseInt(value) / 100;
        break;
      case 'dpi':
        value = parseInt(value);
        break;
      case 'colorSpace':
      case 'compression':
      case 'pageRange':
        break;
    }

    this.config[id] = value;
  }

  handleFileSelection(files) {
    this.selectedFiles.push(...files);
    this.updateUploadBoxContent();
  }

  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    if (this.selectedFiles.length === 0) {
      this.resetFile();
    } else {
      this.updateUploadBoxContent();
    }
  }

  updateUploadBoxContent() {
    const uploadContent = document.querySelector('.upload-content');
    const filesList = this.selectedFiles.map((file, index) => `
      <div class="selected-file-item">
        <i class="fas fa-file-pdf" style="color: #ef4444;"></i>
        <div class="file-details">
          <h4>${file.name}</h4>
          <p>${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
        <button class="remove-file" data-index="${index}">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `).join('');

    uploadContent.innerHTML = `
      <div class="selected-files-list">
        ${filesList}
      </div>
      <button class="toggle-advanced">
        <i class="fas fa-chevron-down"></i> Show Advanced Options
      </button>
      <div class="advanced-options">
        <div class="option-group">
          <label for="quality">Image Quality</label>
          <div class="range-container">
            <input type="range" id="quality" class="advanced-option" min="10" max="100" value="${Math.round(this.config.quality * 100)}">
            <span class="range-value">${Math.round(this.config.quality * 100)}%</span>
          </div>
        </div>
        <div class="option-group">
          <label for="dpi">Resolution (DPI)</label>
          <div class="range-container">
            <input type="range" id="dpi" class="advanced-option" min="72" max="600" value="${this.config.dpi}">
            <span class="range-value">${this.config.dpi} DPI</span>
          </div>
        </div>
        <div class="option-row">
          <div class="option-group half">
            <label for="colorSpace">Color Space</label>
            <select id="colorSpace" class="advanced-option">
              <option value="RGB" ${this.config.colorSpace === 'RGB' ? 'selected' : ''}>RGB Color</option>
              <option value="CMYK" ${this.config.colorSpace === 'CMYK' ? 'selected' : ''}>CMYK Color</option>
              <option value="Grayscale" ${this.config.colorSpace === 'Grayscale' ? 'selected' : ''}>Grayscale</option>
            </select>
          </div>
          <div class="option-group half">
            <label for="compression">Compression</label>
            <select id="compression" class="advanced-option">
              <option value="low" ${this.config.compression === 'low' ? 'selected' : ''}>Low</option>
              <option value="medium" ${this.config.compression === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="high" ${this.config.compression === 'high' ? 'selected' : ''}>High</option>
            </select>
          </div>
        </div>
        <div class="option-group">
          <label for="pageRange">Page Range</label>
          <select id="pageRange" class="advanced-option">
            <option value="all" ${this.config.pageRange === 'all' ? 'selected' : ''}>All Pages</option>
            <option value="first" ${this.config.pageRange === 'first' ? 'selected' : ''}>First Page Only</option>
            <option value="custom" ${this.config.pageRange === 'custom' ? 'selected' : ''}>Custom Range</option>
          </select>
        </div>
      </div>
      <div class="action-buttons">
        <button class="add-more-btn">
          <i class="fas fa-plus"></i>
          Add More Files
        </button>
        <button class="convert-button" onclick="window.pdfConverter.convertPDFToJPG()">
          <i class="fas fa-exchange-alt"></i>
          Convert to JPG
        </button>
        <button class="convert-other-btn">
          <i class="fas fa-random"></i>
          Convert Other
        </button>
      </div>
    `;
  }

  showPreview() {
    const uploadContent = document.querySelector('.upload-content');
    const previewHtml = this.convertedImages.map((image, index) => `
      <div class="preview-item">
        <img src="${image}" alt="Converted page ${index + 1}" />
        <div class="preview-actions">
          <button class="download-jpg" data-index="${index}">
            <i class="fas fa-download"></i> Download
          </button>
        </div>
      </div>
    `).join('');

    uploadContent.innerHTML = `
      <div class="preview-container">
        <h3>Converted Images</h3>
        <div class="preview-grid">
          ${previewHtml}
        </div>
        <div class="preview-actions-all">
          <button class="download-all">
            <i class="fas fa-download"></i> Download All as ZIP
          </button>
          <button class="convert-other-btn">
            <i class="fas fa-redo"></i> Convert Another File
          </button>
        </div>
      </div>
    `;
  }

  downloadSingleImage(index) {
    const link = document.createElement('a');
    link.href = this.convertedImages[index];
    link.download = `converted-page-${parseInt(index) + 1}.jpg`;
    link.click();
  }

  async downloadAllImages() {
    const zip = new JSZip();
    
    this.convertedImages.forEach((image, index) => {
      const base64Data = image.split(',')[1];
      zip.file(`page-${index + 1}.jpg`, base64Data, { base64: true });
    });
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = 'converted-images.zip';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  resetFile() {
    this.selectedFiles = [];
    this.fileInput.value = '';
    this.config = { ...defaultConfig };
    this.convertedImages = [];
    const uploadContent = document.querySelector('.upload-content');
    uploadContent.innerHTML = `
      <div class="upload-icon">
        <i class="fas fa-cloud-upload-alt"></i>
      </div>
      <h3>Drop your PDF here</h3>
      <p>or</p>
      <button class="select-file-btn">Choose File</button>
      <p class="file-info">Maximum file size: 50MB</p>
    `;
  }

  async convertPDFToJPG() {
    if (this.selectedFiles.length === 0) return;

    try {
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = true;
      convertButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

      this.convertedImages = [];
      
      for (const file of this.selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const totalPages = pdf.numPages;
        const pagesToConvert = this.config.pageRange === 'first' ? [1] :
                             this.config.pageRange === 'custom' ? [1] :
                             Array.from({ length: totalPages }, (_, i) => i + 1);

        for (const pageNum of pagesToConvert) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: this.config.dpi / 72 });
          
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({
            canvasContext: canvas.getContext('2d'),
            viewport: viewport
          }).promise;

          if (this.config.colorSpace === 'Grayscale') {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              data[i] = data[i + 1] = data[i + 2] = avg;
            }
            ctx.putImageData(imageData, 0, 0);
          }
          
          let quality = this.config.quality;
          if (this.config.compression === 'high') {
            quality *= 0.7;
          } else if (this.config.compression === 'low') {
            quality = Math.min(1, quality * 1.2);
          }
          
          const jpegData = canvas.toDataURL(`image/${this.config.format}`, quality);
          this.convertedImages.push(jpegData);
        }
      }
      
      this.showPreview();
    } catch (error) {
      console.error('Error converting PDF:', error);
      alert('Error converting PDF. Please try again.');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pdfConverter = new PDFToJPGConverter();
});
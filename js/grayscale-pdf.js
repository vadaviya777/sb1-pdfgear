import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

class PDFGrayscaleConverter {
  constructor() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBox = document.querySelector('.upload-box');
    this.selectedFiles = [];
    this.grayscalePdfBlob = null;
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
      } else if (e.target.closest('.download-button')) {
        this.downloadGrayscalePDF();
      }
    });
  }

  handleFileSelection(files) {
    this.selectedFiles = files;
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
    
    if (this.grayscalePdfBlob) {
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
              <span class="file-name">grayscale.pdf</span>
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
          Convert Another File
        </button>
      `;
    } else {
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

      uploadContent.innerHTML = this.selectedFiles.length > 0 ? `
        <div class="selected-files-list">
          ${filesList}
        </div>
        <button class="toggle-advanced">
          <i class="fas fa-chevron-down"></i> Show Advanced Options
        </button>
        <div class="advanced-options">
          <div class="option-group">
            <label for="contrast">Contrast Level</label>
            <div class="range-container">
              <input type="range" id="contrast" class="advanced-option" min="0" max="200" value="100">
              <span class="range-value">100%</span>
            </div>
          </div>
          <div class="option-group">
            <label for="brightness">Brightness Level</label>
            <div class="range-container">
              <input type="range" id="brightness" class="advanced-option" min="0" max="200" value="100">
              <span class="range-value">100%</span>
            </div>
          </div>
          <div class="option-group">
            <label for="quality">Output Quality</label>
            <select id="quality" class="advanced-option">
              <option value="high">High Quality</option>
              <option value="medium" selected>Medium Quality</option>
              <option value="low">Low Quality (Smaller file size)</option>
            </select>
          </div>
        </div>
        <div class="action-buttons">
          <button class="convert-button" onclick="window.pdfGrayscale.convertToGrayscale()">
            <i class="fas fa-adjust"></i>
            Convert to Grayscale
          </button>
          <button class="convert-other-btn">
            <i class="fas fa-random"></i>
            Convert Other
          </button>
        </div>
      ` : `
        <div class="upload-icon">
          <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <h3>Drop your PDF here</h3>
        <p>or</p>
        <button class="select-file-btn">Choose File</button>
        <p class="file-info">Maximum file size: 50MB</p>
      `;
    }
  }

  resetFile() {
    this.selectedFiles = [];
    this.grayscalePdfBlob = null;
    this.fileInput.value = '';
    this.updateUploadBoxContent();
  }

  async convertToGrayscale() {
    if (this.selectedFiles.length === 0) return;

    try {
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = true;
      convertButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

      const file = this.selectedFiles[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Get advanced options
      const contrast = parseInt(document.getElementById('contrast').value) / 100;
      const brightness = parseInt(document.getElementById('brightness').value) / 100;
      const quality = document.getElementById('quality').value;

      // Process each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        // Create a temporary canvas to process the page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;

        // Render the page to canvas
        const pdfjs = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pdfPage = await pdfjs.getPage(i + 1);
        const viewport = pdfPage.getViewport({ scale: 1 });
        
        await pdfPage.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        // Apply grayscale effect
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let j = 0; j < data.length; j += 4) {
          // Convert to grayscale using luminance formula
          const r = data[j];
          const g = data[j + 1];
          const b = data[j + 2];
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // Apply contrast
          gray = ((gray / 255 - 0.5) * contrast + 0.5) * 255;

          // Apply brightness
          gray = gray * brightness;

          // Ensure values stay within bounds
          gray = Math.max(0, Math.min(255, gray));

          data[j] = data[j + 1] = data[j + 2] = gray;
        }

        context.putImageData(imageData, 0, 0);

        // Convert canvas to image and embed in PDF
        const image = await pdfDoc.embedPng(canvas.toDataURL('image/png'));
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: width,
          height: height
        });
      }

      // Save with appropriate quality settings
      let compressionFactor;
      switch (quality) {
        case 'high':
          compressionFactor = 0.95;
          break;
        case 'medium':
          compressionFactor = 0.8;
          break;
        case 'low':
          compressionFactor = 0.6;
          break;
        default:
          compressionFactor = 0.8;
      }

      const grayscalePdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsStack: [],
        updateFieldAppearances: false,
        compress: true
      });

      this.grayscalePdfBlob = new Blob([grayscalePdfBytes], { type: 'application/pdf' });
      this.updateUploadBoxContent();
    } catch (error) {
      console.error('Error converting PDF to grayscale:', error);
      alert('Error converting PDF. Please try again.');
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = false;
      convertButton.innerHTML = '<i class="fas fa-adjust"></i> Convert to Grayscale';
    }
  }

  downloadGrayscalePDF() {
    if (this.grayscalePdfBlob) {
      saveAs(this.grayscalePdfBlob, 'grayscale.pdf');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pdfGrayscale = new PDFGrayscaleConverter();
});
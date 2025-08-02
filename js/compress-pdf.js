import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

class PDFCompressor {
  constructor() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBox = document.querySelector('.upload-box');
    this.selectedFiles = [];
    this.compressedPdfBlob = null;
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
        this.downloadCompressedPDF();
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
    
    if (this.compressedPdfBlob) {
      uploadContent.innerHTML = `
        <div class="conversion-success">
          <i class="fas fa-check-circle success-icon"></i>
          <h3>Conversion Complete!</h3>
          <p>Your files are ready to download</p>
        </div>
        <div class="file-download-container">
          <div class="file-info-row">
            <div class="file-icon">
              <i class="fas fa-file-pdf"></i>
            </div>
            <div class="file-details">
              <span class="file-name">compressed.pdf</span>
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
      const filesList = this.selectedFiles.length > 0 ? `
        <div class="selected-files-list">
          <div class="selected-file-item">
            <i class="fas fa-file-pdf" style="color: #ef4444;"></i>
            <div class="file-details">
              <h4>${this.selectedFiles[0].name}</h4>
              <p>${(this.selectedFiles[0].size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <button class="remove-file" data-index="0">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <button class="toggle-advanced">
          <i class="fas fa-chevron-down"></i> Show Advanced Options
        </button>
        <div class="advanced-options">
          <div class="option-group">
            <label for="quality">Compression Level</label>
            <select id="quality" class="advanced-option">
              <option value="high">Maximum Quality (Larger Size)</option>
              <option value="medium" selected>Balanced</option>
              <option value="low">Maximum Compression (Smaller Size)</option>
            </select>
          </div>
          <div class="option-group">
            <label for="imageQuality">Image Quality</label>
            <div class="range-container">
              <input type="range" id="imageQuality" class="advanced-option" min="30" max="100" value="80">
              <span class="range-value">80%</span>
            </div>
          </div>
        </div>
        <div class="action-buttons">
          <button class="convert-button" onclick="window.pdfCompressor.compressPDF()">
            <i class="fas fa-compress-arrows-alt"></i>
            Compress PDF
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

      uploadContent.innerHTML = filesList;
    }
  }

  resetFile() {
    this.selectedFiles = [];
    this.compressedPdfBlob = null;
    this.fileInput.value = '';
    this.updateUploadBoxContent();
  }

  async compressPDF() {
    if (this.selectedFiles.length === 0) return;

    try {
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = true;
      convertButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Compressing...';

      const quality = document.getElementById('quality').value;
      const imageQuality = parseInt(document.getElementById('imageQuality').value) / 100;

      const file = this.selectedFiles[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Compress PDF
      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsStack: [],
        updateFieldAppearances: false
      });

      this.compressedPdfBlob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
      this.updateUploadBoxContent();
    } catch (error) {
      console.error('Error compressing PDF:', error);
      alert('Error compressing PDF. Please try again.');
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = false;
      convertButton.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> Compress PDF';
    }
  }

  downloadCompressedPDF() {
    if (this.compressedPdfBlob) {
      saveAs(this.compressedPdfBlob, 'compressed.pdf');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pdfCompressor = new PDFCompressor();
});
import * as pdfjsLib from 'pdfjs-dist';
import { saveAs } from 'file-saver';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

class PDFToTextConverter {
  constructor() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBox = document.querySelector('.upload-box');
    this.selectedFiles = [];
    this.convertedText = null;
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
        this.downloadText();
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
    
    if (this.convertedText) {
      uploadContent.innerHTML = `
        <div class="conversion-success">
          <i class="fas fa-check-circle success-icon"></i>
          <h3>Conversion Complete!</h3>
          <p>Your text file is ready to download</p>
        </div>
        <div class="file-download-container">
          <div class="file-info-row">
            <div class="file-icon">
              <i class="fas fa-file-alt"></i>
            </div>
            <div class="file-details">
              <span class="file-name">extracted.txt</span>
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
            <label for="format">Output Format</label>
            <select id="format" class="advanced-option">
              <option value="plain">Plain Text</option>
              <option value="structured">Structured Text</option>
            </select>
          </div>
          <div class="option-group">
            <label for="encoding">Text Encoding</label>
            <select id="encoding" class="advanced-option">
              <option value="utf8">UTF-8</option>
              <option value="ascii">ASCII</option>
            </select>
          </div>
          <div class="option-group">
            <label for="lineBreaks">Line Breaks</label>
            <select id="lineBreaks" class="advanced-option">
              <option value="preserve">Preserve Original</option>
              <option value="normalize">Normalize</option>
            </select>
          </div>
        </div>
        <div class="action-buttons">
          <button class="convert-button" onclick="window.pdfToTextConverter.convertToText()">
            <i class="fas fa-exchange-alt"></i>
            Convert to TXT
          </button>
          <button class="convert-other-btn">
            <i class="fas fa-random"></i>
            Start Over
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
    this.convertedText = null;
    this.fileInput.value = '';
    this.updateUploadBoxContent();
  }

  async convertToText() {
    if (this.selectedFiles.length === 0) return;

    try {
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = true;
      convertButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

      const format = document.getElementById('format')?.value || 'plain';
      const encoding = document.getElementById('encoding')?.value || 'utf8';
      const lineBreaks = document.getElementById('lineBreaks')?.value || 'preserve';

      let extractedText = '';
      
      for (const file of this.selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          let pageText = textContent.items.map(item => item.str).join(' ');
          
          if (format === 'structured') {
            pageText = `Page ${i}\n${'-'.repeat(40)}\n${pageText}\n\n`;
          }
          
          if (lineBreaks === 'normalize') {
            pageText = pageText.replace(/\s+/g, ' ').trim() + '\n';
          }
          
          extractedText += pageText;
        }
      }

      // Handle encoding
      const encoder = new TextEncoder();
      const decoder = new TextDecoder(encoding);
      this.convertedText = decoder.decode(encoder.encode(extractedText));

      this.updateUploadBoxContent();
    } catch (error) {
      console.error('Error converting PDF to text:', error);
      alert('Error converting PDF. Please try again.');
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = false;
      convertButton.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert to TXT';
    }
  }

  downloadText() {
    if (this.convertedText) {
      const blob = new Blob([this.convertedText], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, 'extracted.txt');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pdfToTextConverter = new PDFToTextConverter();
});
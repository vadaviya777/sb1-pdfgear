import { saveAs } from 'file-saver';
import ConvertApi from 'convertapi-js';

class PowerPointToPDFConverter {
  constructor() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBox = document.querySelector('.upload-box');
    this.selectedFiles = [];
    this.convertedPdfBlob = null;
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
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type === 'application/vnd.ms-powerpoint' || 
        file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      );
      if (files.length > 0) {
        this.handleFileSelection(files);
      }
    });

    this.fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files).filter(file => 
        file.type === 'application/vnd.ms-powerpoint' || 
        file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      );
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
        if (advancedOptions) {
          advancedOptions.classList.toggle('show');
          e.target.innerHTML = advancedOptions.classList.contains('show') ? 
            '<i class="fas fa-chevron-up"></i> Hide Advanced Options' : 
            '<i class="fas fa-chevron-down"></i> Show Advanced Options';
        }
      } else if (e.target.closest('.download-button')) {
        this.downloadConvertedPDF();
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
    
    if (this.convertedPdfBlob) {
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
          Convert Another File
        </button>
      `;
    } else {
      const filesList = this.selectedFiles.map((file, index) => `
        <div class="selected-file-item">
          <i class="fas fa-file-powerpoint" style="color: #d35400;"></i>
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
            <label for="quality">Output Quality</label>
            <select id="quality" class="advanced-option">
              <option value="high">High Quality</option>
              <option value="medium" selected>Medium Quality</option>
              <option value="low">Low Quality (Smaller file size)</option>
            </select>
          </div>
          <div class="option-group">
            <label for="transitions">Include Transitions</label>
            <select id="transitions" class="advanced-option">
              <option value="yes" selected>Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div class="option-group">
            <label for="notes">Include Speaker Notes</label>
            <select id="notes" class="advanced-option">
              <option value="yes">Yes</option>
              <option value="no" selected>No</option>
            </select>
          </div>
          <div class="option-group">
            <label for="layout">Page Layout</label>
            <select id="layout" class="advanced-option">
              <option value="slides">Slides Only</option>
              <option value="handouts">Handouts (3 slides per page)</option>
              <option value="notes">Notes Pages</option>
            </select>
          </div>
        </div>
        <div class="action-buttons">
          <button class="convert-button" onclick="window.pptToPdfConverter.convertToPDF()">
            <i class="fas fa-exchange-alt"></i>
            Convert to PDF
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
        <h3>Drop your PowerPoint files here</h3>
        <p>or</p>
        <button class="select-file-btn">Choose Files</button>
        <p class="file-info">Maximum file size: 50MB</p>
      `;
    }
  }

  resetFile() {
    this.selectedFiles = [];
    this.convertedPdfBlob = null;
    this.fileInput.value = '';
    this.updateUploadBoxContent();
  }

  async convertToPDF() {
    if (this.selectedFiles.length === 0) return;

    try {
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = true;
      convertButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

      const quality = document.getElementById('quality')?.value || 'medium';
      const transitions = document.getElementById('transitions')?.value === 'yes';
      const notes = document.getElementById('notes')?.value === 'yes';
      const layout = document.getElementById('layout')?.value || 'slides';

      const convertApi = ConvertApi.auth('secret_j4SwEf1Hwzmw6L4J');
      const params = convertApi.createParams();
      
      params.add('File', this.selectedFiles[0]);
      params.add('StoreFile', true);
      params.add('DocumentQuality', quality.toUpperCase());
      params.add('Transitions', transitions);
      params.add('IncludeNotes', notes);
      params.add('PageLayout', layout.toUpperCase());
      
      const result = await convertApi.convert('ppt', 'pdf', params);
      const fileUrl = result.files[0].Url;

      // Download the converted PDF
      const response = await fetch(fileUrl);
      this.convertedPdfBlob = await response.blob();
      this.updateUploadBoxContent();
    } catch (error) {
      console.error('Error converting PowerPoint to PDF:', error);
      alert('Error converting file. Please try again.');
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = false;
      convertButton.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert to PDF';
    }
  }

  downloadConvertedPDF() {
    if (this.convertedPdfBlob) {
      const fileName = this.selectedFiles[0]?.name.replace(/\.[^/.]+$/, '') + '.pdf';
      saveAs(this.convertedPdfBlob, fileName || 'converted.pdf');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pptToPdfConverter = new PowerPointToPDFConverter();
});
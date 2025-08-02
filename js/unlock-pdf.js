import { saveAs } from 'file-saver';
import ConvertApi from 'convertapi-js';

class PDFUnlocker {
  constructor() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBox = document.querySelector('.upload-box');
    this.selectedFiles = [];
    this.unlockedPdfBlob = null;
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
      } else if (e.target.closest('.download-button')) {
        this.downloadUnlockedPDF();
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
    
    if (this.unlockedPdfBlob) {
      uploadContent.innerHTML = `
        <div class="conversion-success">
          <i class="fas fa-check-circle success-icon"></i>
          <h3>Unlock Complete!</h3>
          <p>Your file is ready to download</p>
        </div>
        <div class="file-download-container">
          <div class="file-info-row">
            <div class="file-icon">
              <i class="fas fa-file-pdf"></i>
            </div>
            <div class="file-details">
              <span class="file-name">unlocked.pdf</span>
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
          Unlock Another File
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
        <div class="password-input-container">
          <div class="input-group">
            <label for="pdfPassword">PDF Password:</label>
            <input type="password" id="pdfPassword" class="pdf-password" placeholder="Enter PDF password" />
          </div>
        </div>
        <div class="action-buttons">
          <button class="convert-button" onclick="window.pdfUnlocker.unlockPDF()">
            <i class="fas fa-unlock"></i>
            Unlock PDF
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
        <h3>Drop your protected PDF here</h3>
        <p>or</p>
        <button class="select-file-btn">Choose File</button>
        <p class="file-info">Maximum file size: 50MB</p>
      `;
    }
  }

  resetFile() {
    this.selectedFiles = [];
    this.unlockedPdfBlob = null;
    this.fileInput.value = '';
    this.updateUploadBoxContent();
  }

  async unlockPDF() {
    if (this.selectedFiles.length === 0) return;

    try {
      const unlockButton = document.querySelector('.convert-button');
      unlockButton.disabled = true;
      unlockButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Unlocking...';

      const passwordInput = document.getElementById('pdfPassword');
      const password = passwordInput ? passwordInput.value : '';

      const convertApi = ConvertApi.auth('secret_j4SwEf1Hwzmw6L4J');
      const params = convertApi.createParams();
      
      params.add('File', this.selectedFiles[0]);
      if (password) {
        params.add('Password', password);
      }
      
      const result = await convertApi.convert('pdf', 'unprotect', params);
      const fileUrl = result.files[0].Url;

      // Download the unlocked PDF
      const response = await fetch(fileUrl);
      this.unlockedPdfBlob = await response.blob();
      this.updateUploadBoxContent();
    } catch (error) {
      console.error('Error unlocking PDF:', error);
      let errorMessage = 'Error unlocking PDF. ';
      
      if (error.Message && error.Message.includes('password')) {
        errorMessage += 'The password you entered is incorrect. Please try again with the correct password.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
      const unlockButton = document.querySelector('.convert-button');
      if (unlockButton) {
        unlockButton.disabled = false;
        unlockButton.innerHTML = '<i class="fas fa-unlock"></i> Unlock PDF';
      }
    }
  }

  downloadUnlockedPDF() {
    if (this.unlockedPdfBlob) {
      saveAs(this.unlockedPdfBlob, 'unlocked.pdf');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pdfUnlocker = new PDFUnlocker();
});
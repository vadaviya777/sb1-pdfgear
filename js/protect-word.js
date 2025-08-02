import { saveAs } from 'file-saver';
import ConvertApi from 'convertapi-js';

class WordProtector {
  constructor() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBox = document.querySelector('.upload-box');
    this.selectedFiles = [];
    this.protectedWordBlob = null;
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
        file.type === 'application/msword' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      if (files.length > 0) {
        this.handleFileSelection(files);
      }
    });

    this.fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files).filter(file => 
        file.type === 'application/msword' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
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
      } else if (e.target.closest('.download-button')) {
        this.downloadProtectedWord();
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
    
    if (this.protectedWordBlob) {
      uploadContent.innerHTML = `
        <div class="conversion-success">
          <i class="fas fa-check-circle success-icon"></i>
          <h3>Protection Complete!</h3>
          <p>Your file is ready to download</p>
        </div>
        <div class="file-download-container">
          <div class="file-info-row">
            <div class="file-icon">
              <i class="fas fa-file-word"></i>
            </div>
            <div class="file-details">
              <span class="file-name">protected.docx</span>
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
          Protect Another File
        </button>
      `;
    } else {
      const filesList = this.selectedFiles.map((file, index) => `
        <div class="selected-file-item">
          <i class="fas fa-file-word" style="color: #4285f4;"></i>
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
            <label for="documentPassword">Document Password:</label>
            <input type="password" id="documentPassword" class="word-password" placeholder="Enter password" />
          </div>
          <div class="input-group">
            <label for="confirmPassword">Confirm Password:</label>
            <input type="password" id="confirmPassword" class="word-password" placeholder="Confirm password" />
          </div>
          <div class="permissions-list">
            <label class="checkbox-label">
              <input type="checkbox" id="allowPrint" checked>
              Allow Printing
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="allowCopy" checked>
              Allow Copy/Paste
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="allowEdit">
              Allow Editing
            </label>
          </div>
        </div>
        <div class="action-buttons">
          <button class="convert-button" onclick="window.wordProtector.protectWord()">
            <i class="fas fa-lock"></i>
            Protect Document
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
        <h3>Drop your Word document here</h3>
        <p>or</p>
        <button class="select-file-btn">Choose File</button>
        <p class="file-info">Maximum file size: 50MB</p>
      `;
    }
  }

  resetFile() {
    this.selectedFiles = [];
    this.protectedWordBlob = null;
    this.fileInput.value = '';
    this.updateUploadBoxContent();
  }

  async protectWord() {
    if (this.selectedFiles.length === 0) return;

    const password = document.getElementById('documentPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    if (!password || password !== confirmPassword) {
      alert('Passwords do not match or are empty');
      return;
    }

    try {
      const protectButton = document.querySelector('.convert-button');
      protectButton.disabled = true;
      protectButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Protecting...';

      const allowPrint = document.getElementById('allowPrint')?.checked;
      const allowCopy = document.getElementById('allowCopy')?.checked;
      const allowEdit = document.getElementById('allowEdit')?.checked;

      const convertApi = ConvertApi.auth('secret_j4SwEf1Hwzmw6L4J');
      const params = convertApi.createParams();
      
      params.add('File', this.selectedFiles[0]);
      params.add('EncryptPassword', password);
      params.add('AllowPrint', allowPrint);
      params.add('AllowCopy', allowCopy);
      params.add('AllowModify', allowEdit);
      
      const result = await convertApi.convert('docx', 'protect', params);
      const fileUrl = result.files[0].Url;

      // Download the protected Word document
      const response = await fetch(fileUrl);
      this.protectedWordBlob = await response.blob();
      this.updateUploadBoxContent();
    } catch (error) {
      console.error('Error protecting Word document:', error);
      alert('Error protecting Word document. Please try again.');
      const protectButton = document.querySelector('.convert-button');
      if (protectButton) {
        protectButton.disabled = false;
        protectButton.innerHTML = '<i class="fas fa-lock"></i> Protect Document';
      }
    }
  }

  downloadProtectedWord() {
    if (this.protectedWordBlob) {
      saveAs(this.protectedWordBlob, 'protected.docx');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.wordProtector = new WordProtector();
});
document.addEventListener('DOMContentLoaded', function() {
  // Mobile Menu Toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      mainNav.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!menuToggle.contains(event.target) && !mainNav.contains(event.target)) {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
      }
    });

    // Close menu when clicking a nav link
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
      });
    });
  }
  
  // Enhanced Tool Search Functionality
  const toolSearch = document.getElementById('toolSearch');
  const toolsSection = document.querySelector('.tools-section');
  
  if (toolSearch && toolsSection) {
    // Create search results container
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    toolSearch.parentElement.appendChild(searchResults);

    // Get all tool cards for search
    const toolCards = document.querySelectorAll('.tool-card');
    
    // Handle search input
    toolSearch.addEventListener('input', function(e) {
      const searchText = e.target.value.toLowerCase().trim();
      
      if (searchText === '') {
        searchResults.classList.remove('active');
        return;
      }

      // Clear previous results
      searchResults.innerHTML = '';
      
      // Filter tools
      const matchingTools = Array.from(toolCards).filter(card => {
        const toolTitle = card.querySelector('h3').textContent.toLowerCase();
        const toolDesc = card.querySelector('p').textContent.toLowerCase();
        return toolTitle.includes(searchText) || toolDesc.includes(searchText);
      });

      if (matchingTools.length > 0) {
        // Create and append search result items
        matchingTools.forEach(tool => {
          const resultItem = document.createElement('a');
          resultItem.href = tool.href;
          resultItem.className = 'search-result-item';

          const icon = tool.querySelector('.tool-icon img').cloneNode(true);
          const title = tool.querySelector('h3').textContent;
          const description = tool.querySelector('p').textContent;

          resultItem.innerHTML = `
            <div class="search-result-icon ${tool.querySelector('.tool-icon').className}">
              ${icon.outerHTML}
            </div>
            <div class="search-result-content">
              <div class="search-result-title">${title}</div>
              <div class="search-result-description">${description}</div>
            </div>
          `;

          searchResults.appendChild(resultItem);
        });
      } else {
        // Show no results message
        searchResults.innerHTML = `
          <div class="no-results">
            No tools found matching "${searchText}"
          </div>
        `;
      }

      searchResults.classList.add('active');
    });

    // Close search results when clicking outside
    document.addEventListener('click', function(event) {
      if (!toolSearch.contains(event.target) && !searchResults.contains(event.target)) {
        searchResults.classList.remove('active');
      }
    });

    // Close search results when pressing Escape
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        searchResults.classList.remove('active');
        toolSearch.blur();
      }
    });
  }

  // FAQ functionality
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all other FAQ items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherAnswer = otherItem.querySelector('.faq-answer');
          otherAnswer.style.maxHeight = '0';
        }
      });
      
      // Toggle current FAQ item
      item.classList.toggle('active');
      
      if (!isActive) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = '0';
      }
    });
  });
});
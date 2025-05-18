 // Function to switch language
 function switchLanguage(lang) {
  // Get all elements with data-lang attribute
  const elements = document.querySelectorAll('[data-lang]');

  // Iterate through elements and set content based on selected language
  elements.forEach(element => {
    const languageContent = element.getAttribute('data-lang');
    element.style.display = languageContent === lang ? 'block' : 'none';
  });

  // Save selected language to localStorage
  localStorage.setItem('selectedLanguage', lang);
}

// Function to load language from localStorage on page load

function loadLanguage() {
  const selectedLanguage = localStorage.getItem('selectedLanguage') || 'kin';
  switchLanguage(selectedLanguage);
}
// Load language on page loa
loadLanguage();


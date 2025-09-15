(() => {
  'use strict';

  // UI.js - FI.js User Interface Module
  // Handles form generation, styling, and user interactions

  console.log('UI.js loaded - Form generation and UI management');

  // Form element generators
  const formGenerators = {
    text: (config) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = config.id;
      input.name = config.id;
      input.value = config.value || '';
      if (config.pattern) input.pattern = config.pattern;
      if (config.placeholder) input.placeholder = config.placeholder;
      return input;
    },

    number: (config) => {
      const input = document.createElement('input');
      input.type = 'number';
      input.id = config.id;
      input.name = config.id;
      input.value = config.value || '';
      if (config.min !== undefined) input.min = config.min;
      if (config.max !== undefined) input.max = config.max;
      if (config.step !== undefined) input.step = config.step;
      return input;
    },

    email: (config) => {
      const input = document.createElement('input');
      input.type = 'email';
      input.id = config.id;
      input.name = config.id;
      input.value = config.value || '';
      return input;
    },

    select: (config) => {
      const select = document.createElement('select');
      select.id = config.id;
      select.name = config.id;
      
      if (config.options) {
        config.options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value;
          optionElement.textContent = option.label;
          if (option.value === config.value) optionElement.selected = true;
          select.appendChild(optionElement);
        });
      }
      
      return select;
    },

    radio: (config) => {
      const container = document.createElement('div');
      container.className = 'radio-group';
      
      if (config.options) {
        config.options.forEach(option => {
          const label = document.createElement('label');
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = config.id;
          input.value = option.value;
          if (option.value === config.value) input.checked = true;
          
          label.appendChild(input);
          label.appendChild(document.createTextNode(option.label));
          container.appendChild(label);
        });
      }
      
      return container;
    },

    checkbox: (config) => {
      const container = document.createElement('div');
      container.className = 'checkbox-group';
      
      if (config.options) {
        const values = Array.isArray(config.value) ? config.value : [config.value];
        config.options.forEach(option => {
          const label = document.createElement('label');
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.name = config.id;
          input.value = option.value;
          if (values.includes(option.value)) input.checked = true;
          
          label.appendChild(input);
          label.appendChild(document.createTextNode(option.label));
          container.appendChild(label);
        });
      }
      
      return container;
    },

    date: (config) => {
      const input = document.createElement('input');
      input.type = 'date';
      input.id = config.id;
      input.name = config.id;
      input.value = config.value || '';
      return input;
    },

    range: (config) => {
      const container = document.createElement('div');
      container.className = 'range-container';
      
      const input = document.createElement('input');
      input.type = 'range';
      input.id = config.id;
      input.name = config.id;
      
      // Set attributes in the correct order
      if (config.min !== undefined) input.min = config.min;
      if (config.max !== undefined) input.max = config.max;
      if (config.step !== undefined) input.step = config.step;
      
      // Set value after min/max to ensure proper positioning
      input.value = config.value || config.min || 0;
      
      const valueDisplay = document.createElement('span');
      valueDisplay.id = config.id + 'Value';
      valueDisplay.textContent = input.value + (config.unit || '');
      
      // Update display on input (real-time) and blur
      input.addEventListener('input', () => {
        valueDisplay.textContent = input.value + (config.unit || '');
      });
      
      input.addEventListener('blur', () => {
        valueDisplay.textContent = input.value + (config.unit || '');
      });
      
      container.appendChild(input);
      container.appendChild(valueDisplay);
      return container;
    },

    textarea: (config) => {
      const textarea = document.createElement('textarea');
      textarea.id = config.id;
      textarea.name = config.id;
      textarea.value = config.value || '';
      if (config.rows) textarea.rows = config.rows;
      if (config.placeholder) textarea.placeholder = config.placeholder;
      return textarea;
    },

    color: (config) => {
      const input = document.createElement('input');
      input.type = 'color';
      input.id = config.id;
      input.name = config.id;
      input.value = config.value || '#000000';
      return input;
    },

    url: (config) => {
      const input = document.createElement('input');
      input.type = 'url';
      input.id = config.id;
      input.name = config.id;
      input.value = config.value || '';
      return input;
    },

    tel: (config) => {
      const input = document.createElement('input');
      input.type = 'tel';
      input.id = config.id;
      input.name = config.id;
      input.value = config.value || '';
      return input;
    },

    password: (config) => {
      const input = document.createElement('input');
      input.type = 'password';
      input.id = config.id;
      input.name = config.id;
      input.value = config.value || '';
      return input;
    },

    hidden: (config) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.id = config.id;
      input.name = config.id;
      input.value = config.value || '';
      return input;
    },

    rate: (config) => {
      const input = document.createElement('input');
      input.type = 'number';
      input.id = config.id;
      input.name = config.id;
      input.value = config.value || '';
      if (config.min !== undefined) input.min = config.min;
      if (config.max !== undefined) input.max = config.max;
      if (config.step !== undefined) input.step = config.step;
      input.setAttribute('data-type', 'rate');
      return input;
    }
  };

  // Generate form from appConfig.forms (array format)
  function generateForm(formsConfig) {
    if (!formsConfig || !Array.isArray(formsConfig)) return null;

    const form = document.createElement('form');
    form.id = 'fiFormsForm';
    form.className = 'fi-forms-form';

    formsConfig.forEach(formConfig => {
      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';

      // Create label
      if (formConfig.type !== 'hidden') {
        const label = document.createElement('label');
        label.htmlFor = formConfig.id;
        label.textContent = formConfig.label || formConfig.id;
        formGroup.appendChild(label);
      }

      // Create input element
      const generator = formGenerators[formConfig.type];
      if (generator) {
        const element = generator(formConfig);
        formGroup.appendChild(element);
      }

      form.appendChild(formGroup);
    });

    // No submit button needed - live updates handle everything

    return form;
  }

  // Collect form data
  function collectFormData(formElement) {
    const data = {};
    
    // Get all form elements
    const elements = formElement.querySelectorAll('input, select, textarea');
    
    elements.forEach(element => {
      const name = element.name || element.id;
      if (!name) return;
      
      if (element.type === 'checkbox') {
        // Handle checkbox groups - collect all checked values
        if (!data[name]) {
          data[name] = [];
        }
        if (element.checked) {
          data[name].push(element.value);
        }
      } else if (element.type === 'radio') {
        if (element.checked) {
          data[name] = element.value;
        }
      } else if (element.type === 'range') {
        data[name] = parseFloat(element.value);
      } else if (element.type === 'number' || element.type === 'rate') {
        data[name] = parseFloat(element.value) || 0;
      } else {
        data[name] = element.value;
      }
    });
    
    // Convert single-item arrays to single values for non-checkbox fields
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key]) && data[key].length === 1) {
        data[key] = data[key][0];
      }
    });
    
    return data;
  }

  // Update appConfig with form values
  function updateAppConfigWithFormData(formData) {
    if (!window.appConfig || !window.appConfig.forms || !Array.isArray(window.appConfig.forms)) return;

    window.appConfig.forms.forEach(formConfig => {
      if (formData[formConfig.id] !== undefined) {
        formConfig.value = formData[formConfig.id];
      }
    });
  }

  // Process form data and update results
  function processFormData(formData) {
    // This will be called by the main FI.js processing pipeline
    
    // Update the global form data context
    window.formData = formData;
    
    // Trigger display update if available
    if (window.processDisplayData) {
      window.processDisplayData();
    }
    
    // Trigger FI.js data processing if available
    if (window.processTableData) {
      window.processTableData();
    }
  }

  // Initialize forms when DOM is ready
  function initializeForms() {
    if (!window.appConfig || !window.appConfig.forms) return;

    // Create main app container with y-overflow support
    const appContainer = document.createElement('div');
    appContainer.className = 'forms-app-container';
    
    // Create forms container
    const formsContainer = document.createElement('div');
    formsContainer.className = 'forms-container';
    
    // Generate and insert form
    const form = generateForm(window.appConfig.forms);
    if (form) {
      const formSection = document.createElement('div');
      formSection.className = 'form-section';
      // Get page title and appConfig description
      const pageTitle = document.title || 'FI.js Forms';
      const description = window.appConfig && window.appConfig.description ? window.appConfig.description : 'Interactive form with real-time calculations';
      
      formSection.innerHTML = `<h2>${pageTitle}</h2><p>${description}</p>`;
      formSection.appendChild(form);
      formsContainer.appendChild(formSection);
    }

    // Add forms container to app container
    appContainer.appendChild(formsContainer);

    // Add to page (replace any existing app container)
    const existingContainer = document.querySelector('.forms-app-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    document.body.appendChild(appContainer);

    // Now initialize display after forms container exists
    if (window.initializeDisplay) {
      window.initializeDisplay();
    }

    // Process initial display data
    setTimeout(() => {
      // Collect initial form data
      const formElement = document.getElementById('fiFormsForm');
      if (formElement) {
        const initialFormData = collectFormData(formElement);
        updateAppConfigWithFormData(initialFormData);
        processFormData(initialFormData);
      }
      
      if (window.processDisplayData) {
        window.processDisplayData();
      }
    }, 100);

    // Add form submission handler
    const formElement = document.getElementById('fiFormsForm');
    if (formElement) {
      // Add updates on form field blur (when user finishes editing)
      formElement.addEventListener('blur', (e) => {
        const formData = collectFormData(formElement);
        updateAppConfigWithFormData(formData);
        processFormData(formData);
      }, true); // Use capture phase to catch blur events from all form elements

      // Keep change event for select, checkbox, radio elements
      formElement.addEventListener('change', (e) => {
        const formData = collectFormData(formElement);
        updateAppConfigWithFormData(formData);
        processFormData(formData);
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeForms);
  } else {
    initializeForms();
  }

  // Export functions for use by other modules
  window.FIForms = {
    generateForm,
    collectFormData,
    updateAppConfigWithFormData,
    processFormData,
    initializeForms
  };

})();

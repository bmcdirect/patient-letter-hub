async function submitOrder(event) {
  event.preventDefault();
  
  console.log('Order submission started');
  
  // Get form data
  const form = document.getElementById('orderForm');
  const formData = new FormData(form);
  
  // Log form data for debugging
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }
  
  // Show loading state
  const submitButton = document.getElementById('submitButton');
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Creating Order...';
  submitButton.disabled = true;
  
  try {
    console.log('Sending POST request to /api/orders');
    
    const response = await fetch('/api/orders', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Order creation result:', result);
    
    if (result.success) {
      console.log('Order created successfully:', result.orderId);
      
      // Show success message
      showMessage('Order created successfully! Redirecting to confirmation...', 'success');
      
      // Redirect to confirmation page
      setTimeout(() => {
        window.location.href = `/?confirmation=${result.orderId}`;
      }, 1500);
    } else {
      throw new Error(result.message || 'Failed to create order');
    }
    
  } catch (error) {
    console.error('Order submission error:', error);
    
    // Show error message
    showMessage(`Error creating order: ${error.message}`, 'error');
    
    // Reset button
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
}

function showMessage(message, type = 'info') {
  // Remove existing messages
  const existingMessages = document.querySelectorAll('.message');
  existingMessages.forEach(msg => msg.remove());
  
  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    z-index: 1000;
    max-width: 400px;
    font-weight: 500;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  `;
  
  // Set colors based on type
  if (type === 'success') {
    messageDiv.style.backgroundColor = '#d4edda';
    messageDiv.style.color = '#155724';
    messageDiv.style.border = '1px solid #c3e6cb';
  } else if (type === 'error') {
    messageDiv.style.backgroundColor = '#f8d7da';
    messageDiv.style.color = '#721c24';
    messageDiv.style.border = '1px solid #f5c6cb';
  } else {
    messageDiv.style.backgroundColor = '#d1ecf1';
    messageDiv.style.color = '#0c5460';
    messageDiv.style.border = '1px solid #bee5eb';
  }
  
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 5000);
}

// Make functions available globally
window.submitOrder = submitOrder;
window.showMessage = showMessage;
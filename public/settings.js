let currentPractice = null;
let locations = [];
let editingLocationId = null;

// Check authentication on page load
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/user');
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      window.location.href = '/login.html';
      return;
    }
    
    if (data.user.is_admin) {
      // Redirect admins to admin dashboard
      window.location.href = '/admin.html';
      return;
    }
    
    document.getElementById('userEmail').textContent = data.user.email;
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/login.html';
  }
}

// Logout function
async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Logout failed:', error);
    window.location.href = '/login.html';
  }
}

// Load practice and location data
async function loadPracticeData() {
  try {
    const response = await fetch('/api/settings/practice');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load practice data');
    }
    
    currentPractice = data.practice;
    locations = data.locations || [];
    
    renderPracticeOverview();
    populatePracticeForm();
    renderLocations();
    
  } catch (error) {
    console.error('Failed to load practice data:', error);
    showMessage('Failed to load practice data: ' + error.message, 'error');
  }
}

// Render practice overview
function renderPracticeOverview() {
  const container = document.getElementById('practiceOverview');
  
  if (!currentPractice) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Practice Information</h3>
        <p>Complete the practice details form to get started.</p>
      </div>
    `;
    return;
  }
  
  const activeLocations = locations.filter(loc => loc.active).length;
  const defaultLocation = locations.find(loc => loc.is_default);
  
  const contactName = [
    currentPractice.contact_prefix,
    currentPractice.contact_first_name,
    currentPractice.contact_middle_initial,
    currentPractice.contact_last_name,
    currentPractice.contact_suffix
  ].filter(Boolean).join(' ');

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="color: #2d3748; margin-bottom: 0.5rem;">${escapeHtml(currentPractice.name)}</h3>
      <p style="color: #4a5568; margin-bottom: 0.25rem;"><strong>Practice ID:</strong> ${currentPractice.id}</p>
      <p style="color: #4a5568; margin-bottom: 0.25rem;"><strong>Contact:</strong> ${escapeHtml(contactName || 'Not set')}</p>
      <p style="color: #4a5568; margin-bottom: 0.25rem;"><strong>Email:</strong> ${escapeHtml(currentPractice.email || 'Not set')}</p>
      <p style="color: #4a5568; margin-bottom: 0.25rem;"><strong>Phone:</strong> ${escapeHtml(currentPractice.phone || 'Not set')}</p>
    </div>
    
    <div style="margin-bottom: 1.5rem;">
      <h4 style="color: #2d3748; margin-bottom: 0.5rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Main Address</h4>
      <p style="color: #4a5568; font-size: 0.875rem;">
        ${currentPractice.main_address ? escapeHtml(currentPractice.main_address) : 'Not set'}
      </p>
    </div>
    
    <div>
      <h4 style="color: #2d3748; margin-bottom: 0.5rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Locations Summary</h4>
      <p style="color: #4a5568; font-size: 0.875rem;">
        <strong>${activeLocations}</strong> active location${activeLocations !== 1 ? 's' : ''}
        ${defaultLocation ? ` • Default: ${escapeHtml(defaultLocation.label)}` : ''}
      </p>
    </div>
  `;
}

// Populate practice form with existing data
function populatePracticeForm() {
  if (!currentPractice) return;
  
  document.getElementById('practiceName').value = currentPractice.name || '';
  document.getElementById('contactPrefix').value = currentPractice.contact_prefix || '';
  document.getElementById('contactFirstName').value = currentPractice.contact_first_name || '';
  document.getElementById('contactMiddleInitial').value = currentPractice.contact_middle_initial || '';
  document.getElementById('contactLastName').value = currentPractice.contact_last_name || '';
  document.getElementById('contactSuffix').value = currentPractice.contact_suffix || '';
  document.getElementById('contactTitle').value = currentPractice.contact_title || '';
  document.getElementById('phone').value = currentPractice.phone || '';
  document.getElementById('email').value = currentPractice.email || '';
  document.getElementById('mainAddress').value = currentPractice.main_address || '';
  document.getElementById('mainCity').value = currentPractice.main_city || '';
  document.getElementById('mainState').value = currentPractice.main_state || '';
  document.getElementById('mainZip').value = currentPractice.main_zip || '';
  document.getElementById('emrId').value = currentPractice.emr_id || '';
  document.getElementById('operatingHours').value = currentPractice.operating_hours || '';
  
  // Handle mailing address
  const hasDifferentMailing = currentPractice.mailing_address && 
    currentPractice.mailing_address !== currentPractice.main_address;
  
  if (hasDifferentMailing) {
    document.getElementById('sameAsMain').checked = false;
    document.getElementById('mailingAddressFields').style.display = 'block';
    document.getElementById('mailingAddress').value = currentPractice.mailing_address || '';
    document.getElementById('mailingCity').value = currentPractice.mailing_city || '';
    document.getElementById('mailingState').value = currentPractice.mailing_state || '';
    document.getElementById('mailingZip').value = currentPractice.mailing_zip || '';
  }
}

// Render locations list
function renderLocations() {
  const container = document.getElementById('locationsContainer');
  
  // Create main location from practice if it exists
  let allLocations = [...locations];
  if (currentPractice && currentPractice.main_address) {
    const mainLocation = {
      id: 'main',
      label: 'Main Location',
      contact_name: [
        currentPractice.contact_prefix,
        currentPractice.contact_first_name,
        currentPractice.contact_middle_initial,
        currentPractice.contact_last_name,
        currentPractice.contact_suffix
      ].filter(Boolean).join(' '),
      contact_title: currentPractice.contact_title,
      phone: currentPractice.phone,
      email: currentPractice.email,
      address: currentPractice.main_address,
      city: currentPractice.main_city,
      state: currentPractice.main_state,
      zip_code: currentPractice.main_zip,
      location_suffix: `${currentPractice.id}.0`,
      is_default: !locations.some(loc => loc.is_default),
      active: true,
      notes: 'Primary practice location'
    };
    allLocations.unshift(mainLocation);
  }
  
  if (allLocations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Locations Added</h3>
        <p>Complete the practice information form to create your main location, then add additional locations as needed.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = allLocations.map(location => {
    const badges = [];
    if (location.is_default) badges.push('<span class="badge default">Default</span>');
    if (!location.active) badges.push('<span class="badge inactive">Inactive</span>');
    
    const fullAddress = [
      location.address,
      location.city,
      location.state,
      location.zip_code
    ].filter(Boolean).join(', ');
    
    const displayLabel = location.location_suffix ? 
      `${escapeHtml(location.label)} (${location.location_suffix})` : 
      escapeHtml(location.label);
    
    return `
      <div class="location-card ${location.is_default ? 'default' : ''} ${!location.active ? 'inactive' : ''}">
        <div class="location-header">
          <div class="location-title">${escapeHtml(displayName)}</div>
          <div class="location-badges">${badges}</div>
        </div>
        <div class="location-details">
          <strong>Contact:</strong> ${escapeHtml(fullName)}<br>
          ${location.phone ? `<strong>Phone:</strong> ${escapeHtml(location.phone)}<br>` : ''}
          ${location.email ? `<strong>Email:</strong> ${escapeHtml(location.email)}<br>` : ''}
          <strong>Address:</strong> ${escapeHtml(fullAddress)}<br>
        </div>
        <div class="location-actions">
          ${location.id !== 'main' ? `
            <button class="button secondary" onclick="editLocation(${location.id})">Edit</button>
            ${!location.is_default ? `<button class="button secondary" onclick="setDefaultLocation(${location.id})">Set Default</button>` : ''}
            <button class="button secondary" onclick="toggleLocationStatus(${location.id})">${location.active ? 'Deactivate' : 'Activate'}</button>
            <button class="button danger" onclick="deleteLocation(${location.id})">Delete</button>
          ` : `
            <small style="color: #718096; font-style: italic;">Main location is managed through practice information above</small>
          `}
        </div>
      </div>
    `;
  }).join('');
}

// Show location form
function showLocationForm(locationData = null) {
  editingLocationId = locationData ? locationData.id : null;
  
  document.getElementById('locationFormTitle').textContent = 
    locationData ? 'Edit Location' : 'Add New Location';
  
  if (locationData) {
    // Populate form with existing data
    document.getElementById('locationId').value = locationData.id;
    document.getElementById('locationLabel').value = locationData.label || '';
    document.getElementById('locationContactName').value = locationData.contact_name || '';
    document.getElementById('locationContactTitle').value = locationData.contact_title || '';
    document.getElementById('locationPhone').value = locationData.phone || '';
    document.getElementById('locationEmail').value = locationData.email || '';
    document.getElementById('locationAddress').value = locationData.address || '';
    document.getElementById('locationCity').value = locationData.city || '';
    document.getElementById('locationState').value = locationData.state || '';
    document.getElementById('locationZip').value = locationData.zip_code || '';
    document.getElementById('locationNotes').value = locationData.notes || '';
    document.getElementById('isDefault').checked = locationData.is_default || false;
    document.getElementById('isActive').checked = locationData.active !== false;
  } else {
    // Clear form
    document.getElementById('locationForm').reset();
    document.getElementById('isActive').checked = true;
  }
  
  document.getElementById('locationFormSection').style.display = 'block';
  document.getElementById('locationFormSection').scrollIntoView({ behavior: 'smooth' });
}

// Hide location form
function hideLocationForm() {
  document.getElementById('locationFormSection').style.display = 'none';
  document.getElementById('locationForm').reset();
  editingLocationId = null;
}

// Edit location
function editLocation(locationId) {
  const location = locations.find(loc => loc.id === locationId);
  if (location) {
    showLocationForm(location);
  }
}

// Set default location
async function setDefaultLocation(locationId) {
  try {
    const response = await fetch(`/api/settings/practice/locations/${locationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to set default location');
    }
    
    showMessage('Default location updated successfully', 'success');
    loadPracticeData();
    
  } catch (error) {
    console.error('Failed to set default location:', error);
    showMessage('Failed to set default location: ' + error.message, 'error');
  }
}

// Toggle location active status
async function toggleLocationStatus(locationId) {
  const location = locations.find(loc => loc.id === locationId);
  if (!location) return;
  
  try {
    const response = await fetch(`/api/settings/practice/locations/${locationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !location.active })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to update location status');
    }
    
    showMessage(`Location ${location.active ? 'deactivated' : 'activated'} successfully`, 'success');
    loadPracticeData();
    
  } catch (error) {
    console.error('Failed to update location status:', error);
    showMessage('Failed to update location status: ' + error.message, 'error');
  }
}

// Delete location
async function deleteLocation(locationId) {
  if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/settings/practice/locations/${locationId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete location');
    }
    
    showMessage('Location deleted successfully', 'success');
    loadPracticeData();
    
  } catch (error) {
    console.error('Failed to delete location:', error);
    showMessage('Failed to delete location: ' + error.message, 'error');
  }
}

// Show message
function showMessage(message, type = 'success') {
  const container = document.getElementById('messageContainer');
  container.innerHTML = `<div class="${type}">${escapeHtml(message)}</div>`;
  
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle mailing address toggle
document.getElementById('sameAsMain').addEventListener('change', function() {
  const mailingFields = document.getElementById('mailingAddressFields');
  mailingFields.style.display = this.checked ? 'none' : 'block';
  
  if (this.checked) {
    // Clear mailing address fields
    document.getElementById('mailingAddress').value = '';
    document.getElementById('mailingCity').value = '';
    document.getElementById('mailingState').value = '';
    document.getElementById('mailingZip').value = '';
  }
});

// Handle practice form submission
document.getElementById('practiceForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const practiceData = {
    name: formData.get('practiceName'),
    contact_prefix: formData.get('contactPrefix'),
    contact_first_name: formData.get('contactFirstName'),
    contact_middle_initial: formData.get('contactMiddleInitial'),
    contact_last_name: formData.get('contactLastName'),
    contact_suffix: formData.get('contactSuffix'),
    contact_title: formData.get('contactTitle'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    main_address: formData.get('mainAddress'),
    main_city: formData.get('mainCity'),
    main_state: formData.get('mainState'),
    main_zip: formData.get('mainZip'),
    emr_id: formData.get('emrId'),
    operating_hours: formData.get('operatingHours')
  };
  
  // Handle mailing address
  if (!document.getElementById('sameAsMain').checked) {
    practiceData.mailing_address = formData.get('mailingAddress');
    practiceData.mailing_city = formData.get('mailingCity');
    practiceData.mailing_state = formData.get('mailingState');
    practiceData.mailing_zip = formData.get('mailingZip');
  }
  
  try {
    const response = await fetch('/api/settings/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(practiceData)
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to save practice information');
    }
    
    showMessage('Practice information saved successfully', 'success');
    loadPracticeData();
    
  } catch (error) {
    console.error('Failed to save practice:', error);
    showMessage('Failed to save practice information: ' + error.message, 'error');
  }
});

// Handle location form submission
document.getElementById('locationForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const locationData = {
    label: formData.get('locationLabel'),
    contact_name: formData.get('locationContactName'),
    contact_title: formData.get('locationContactTitle'),
    phone: formData.get('locationPhone'),
    email: formData.get('locationEmail'),
    address: formData.get('locationAddress'),
    city: formData.get('locationCity'),
    state: formData.get('locationState'),
    zip_code: formData.get('locationZip'),
    notes: formData.get('locationNotes'),
    is_default: document.getElementById('isDefault').checked,
    active: document.getElementById('isActive').checked
  };
  
  try {
    const isEdit = editingLocationId !== null;
    const url = isEdit 
      ? `/api/settings/practice/locations/${editingLocationId}`
      : '/api/settings/practice/locations';
    const method = isEdit ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationData)
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} location`);
    }
    
    showMessage(`Location ${isEdit ? 'updated' : 'created'} successfully`, 'success');
    hideLocationForm();
    loadPracticeData();
    
  } catch (error) {
    console.error('Failed to save location:', error);
    showMessage('Failed to save location: ' + error.message, 'error');
  }
});

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  checkAuth().then(() => {
    loadPracticeData();
  });
});
async function loadLocations() {
  const container = document.getElementById('locationsContainer');
  container.innerHTML = '<div class="loading">Loading locations...</div>';

  try {
    const res = await fetch('/api/settings/practice/locations');
    const data = await res.json();

    if (!data.success || !Array.isArray(data.locations)) {
      container.innerHTML = '<div class="error">Failed to load locations.</div>';
      return;
    }

    if (data.locations.length === 0) {
      container.innerHTML = '<div class="empty-state"><h3>No locations found</h3></div>';
      return;
    }

    container.innerHTML = '';
    data.locations.forEach(loc => {
      const card = document.createElement('div');
      card.className = 'location-card' + (loc.is_default ? ' default' : '') + (loc.active ? '' : ' inactive');

      card.innerHTML = `
        <div class="location-header">
          <div class="location-title">${loc.name}</div>
          <div class="location-badges">
            ${loc.is_default ? '<span class="badge default">Default</span>' : ''}
            ${!loc.active ? '<span class="badge inactive">Inactive</span>' : ''}
          </div>
        </div>
        <div class="location-details">
          ${loc.address_line1}, ${loc.city}, ${loc.state} ${loc.zip_code} <br/>
          Contact: ${loc.contact_prefix || ''} ${loc.contact_first_name} ${loc.contact_last_name}
        </div>
        <div class="location-actions">
          <button class="button secondary" onclick="editLocation(${loc.id})">Edit</button>
          <button class="button danger" onclick="deleteLocation(${loc.id})">Delete</button>
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = '<div class="error">Error loading locations.</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadLocations();
});

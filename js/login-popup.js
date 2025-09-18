document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (loginOverlay.classList.contains('active')) {
        closeLogin();
      } else {
        closeMenu();
      }
    }
  });

// Add this variable with your existing ones
const loginOverlay = document.getElementById('loginOverlay');

// Login popup functions
function showLogin(event) {
  event.preventDefault();
  closeMenu(); // Close the menu first
  loginOverlay.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent scrolling
  
  // Focus on email input
  setTimeout(() => {
    document.getElementById('loginEmail').focus();
  }, 100);
}

function closeLogin(event) {
  if (event && event.target !== loginOverlay && event.target.closest('.login-form-container')) {
    return; // Don't close if clicking inside the form
  }
  
  loginOverlay.classList.remove('active');
  document.body.style.overflow = ''; // Restore scrolling
  
  // Clear form
  document.getElementById('loginForm').reset();
  document.getElementById('loginMessage').textContent = '';
}

// Forgot password function
function forgotPassword(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  
  if (!email) {
    showMessage('Please enter your email address first.', 'error');
    return;
  }
  
  // Here you would implement Firebase password reset
  showMessage('Password reset email sent! Check your inbox.', 'success');
}

// Show message helper
function showMessage(text, type) {
  const messageEl = document.getElementById('loginMessage');
  messageEl.textContent = text;
  messageEl.className = `login-message ${type}`;
}

// Firebase login handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const loginBtn = document.getElementById('loginBtn');
  
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';
  
  try {
    // Demo mode - replace with Firebase when ready
    if (email && password) {
      showMessage('Login successful! (Demo mode)', 'success');
      setTimeout(() => closeLogin(), 1500);
    } else {
      throw new Error('Please fill in all fields');
    }
    
  } catch (error) {
    showMessage(error.message || 'Login failed. Please try again.', 'error');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
});
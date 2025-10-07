// Login popup functionality - shared across all pages
document.addEventListener('DOMContentLoaded', function () {
  const loginOverlay = document.getElementById('loginOverlay');

  // Initialize Firebase Auth State Management
  initializeAuthState();

  // Global ESC key handler for both menu and login
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (loginOverlay && loginOverlay.classList.contains('active')) {
        closeLogin();
      } else if (typeof closeMenu === 'function') {
        closeMenu();
      }
    }
  });

  // Login popup functions
  window.showLogin = function(event) {
    event.preventDefault();
    if (typeof closeMenu === 'function') {
      closeMenu(); // Close the menu first
    }
    if (loginOverlay) {
      loginOverlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
      
      // Focus on email input
      setTimeout(() => {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.focus();
      }, 100);
    }
  };

  window.closeLogin = function(event) {
    if (event && event.target !== loginOverlay && event.target.closest('.login-form-container')) {
      return; // Don't close if clicking inside the form
    }
    
    if (loginOverlay) {
      loginOverlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
      
      // Clear form
      const loginForm = document.getElementById('loginForm');
      const loginMessage = document.getElementById('loginMessage');
      if (loginForm) loginForm.reset();
      if (loginMessage) loginMessage.textContent = '';
    }
  };

  // Logout function
  window.handleLogout = async function(event) {
    event.preventDefault();
    
    try {
      if (window.auth) {
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        await signOut(window.auth);
        console.log('User logged out');
        
        // Close menu after logout
        if (typeof closeMenu === 'function') {
          closeMenu();
        }
        
        // Refresh page to reset state
        window.location.reload();
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out. Please try again.');
    }
  };

  // Forgot password function
  window.forgotPassword = async function(event) {
    event.preventDefault();
    const emailInput = document.getElementById('loginEmail');
    const email = emailInput ? emailInput.value.trim() : '';
    
    if (!email) {
      showMessage('Please enter your email address first.', 'error');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address.', 'error');
      return;
    }
    
    try {
      // Ensure Firebase is initialized
      if (!window.auth) {
        await initializeAuthState();
      }
      
      // Import Firebase password reset function
      const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      
      // Send password reset email
      await sendPasswordResetEmail(window.auth, email);
      
      showMessage('Password reset email sent! Check your inbox and spam folder.', 'success');
      console.log('Password reset email sent to:', email);
      
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please wait a moment and try again.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
      }
      
      showMessage(errorMessage, 'error');
    }
  };

  // Show message helper
  function showMessage(text, type) {
    const messageEl = document.getElementById('loginMessage');
    if (messageEl) {
      messageEl.textContent = text;
      messageEl.className = `login-message ${type}`;
    }
  }

  // Initialize Firebase and Auth State Listener
  async function initializeAuthState() {
    try {
      // Initialize Firebase if not already done
      if (!window.auth) {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        
        const firebaseConfig = {
          apiKey: "AIzaSyAX9ivQ4aKQzokUMEkNpGTIbbAUMJhLlys",
          authDomain: "playon-1a86b.firebaseapp.com",
          projectId: "playon-1a86b",
          storageBucket: "playon-1a86b.firebasestorage.app",
          messagingSenderId: "28141646391",
          appId: "1:28141646391:web:98d83339ed46c17efa45b2"
        };
        
        const app = initializeApp(firebaseConfig);
        window.auth = getAuth(app);
      }

      // Set up auth state listener
      const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      
      onAuthStateChanged(window.auth, (user) => {
        updateMenuForAuthState(user);
      });

    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }

  // Update menu based on authentication state
  async function updateMenuForAuthState(user) {
    const sideMenu = document.getElementById('sideMenu');
    if (!sideMenu) return;

    // Find existing auth-related links
    const loginLink = sideMenu.querySelector('a[onclick*="showLogin"]');
    const registerLink = sideMenu.querySelector('a[href*="register"]');
    const logoutLink = sideMenu.querySelector('a[onclick*="handleLogout"]');
    const userInfo = sideMenu.querySelector('.user-info');
    const myVacanciesLink = sideMenu.querySelector('a[href*="manager-vacancies"]');

    if (user) {
      // User is logged in - check if they're a manager
      let isManager = false;
      
      try {
        // Initialize Firestore if needed
        if (!window.db) {
          const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
          window.db = getFirestore();
        }
        
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const userDoc = await getDoc(doc(window.db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          isManager = userData.userType === 'manager';
          console.log('User type:', userData.userType);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

      // Hide login and register links
      if (loginLink) loginLink.style.display = 'none';
      if (registerLink) registerLink.style.display = 'none';

      // Create or show user info
      if (!userInfo) {
        const userInfoDiv = document.createElement('div');
        userInfoDiv.className = 'user-info';
        userInfoDiv.innerHTML = `
          <div style="color: #fff; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.2); margin-bottom: 1rem;">
            <small>Logged in as:</small><br>
            <strong>${user.displayName || user.email}</strong>
          </div>
        `;
        
        // Insert after the vacancies link
        const vacanciesLink = sideMenu.querySelector('a[href*="vacancies"]');
        if (vacanciesLink) {
          vacanciesLink.insertAdjacentElement('afterend', userInfoDiv);
        }
      } else {
        userInfo.style.display = 'block';
      }

      // Show "My Vacancies" link only for managers
      if (isManager) {
        if (!myVacanciesLink) {
          const myVacanciesLinkEl = document.createElement('a');
          myVacanciesLinkEl.href = 'manager-vacancies.html';
          myVacanciesLinkEl.textContent = 'My Vacancies';
          myVacanciesLinkEl.className = 'manager-link';
          
          // Insert after the vacancies link
          const vacanciesLink = sideMenu.querySelector('a[href*="vacancies.html"]');
          if (vacanciesLink) {
            vacanciesLink.insertAdjacentElement('afterend', myVacanciesLinkEl);
          }
        } else {
          myVacanciesLink.style.display = 'block';
        }
      } else {
        // Hide for non-managers
        if (myVacanciesLink) myVacanciesLink.style.display = 'none';
      }

      // Create or show logout link
      if (!logoutLink) {
        const logoutLinkEl = document.createElement('a');
        logoutLinkEl.href = '#';
        logoutLinkEl.onclick = handleLogout;
        logoutLinkEl.textContent = 'Logout';
        logoutLinkEl.className = 'logout-link';
        
        // Insert before the menu logo
        const menuLogo = sideMenu.querySelector('.menu-logo');
        if (menuLogo) {
          menuLogo.insertAdjacentElement('beforebegin', logoutLinkEl);
        }
      } else {
        logoutLink.style.display = 'block';
      }

    } else {
      // User is logged out
      console.log('User is logged out');

      // Show login and register links
      if (loginLink) loginLink.style.display = 'block';
      if (registerLink) registerLink.style.display = 'block';

      // Hide manager-specific links, logout link and user info
      if (myVacanciesLink) myVacanciesLink.style.display = 'none';
      if (logoutLink) logoutLink.style.display = 'none';
      if (userInfo) userInfo.style.display = 'none';
    }
  }

  // Firebase login handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailInput = document.getElementById('loginEmail');
      const passwordInput = document.getElementById('loginPassword');
      const loginBtn = document.getElementById('loginBtn');
      
      if (!emailInput || !passwordInput || !loginBtn) return;
      
      const email = emailInput.value;
      const password = passwordInput.value;
      
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing in...';
      
      try {
        // Import Firebase auth functions
        const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        
        // Ensure Firebase is initialized
        if (!window.auth) {
          await initializeAuthState();
        }
        
        // Sign in user
        const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
        const user = userCredential.user;
        
        showMessage('Login successful!', 'success');
console.log('User logged in:', user.uid);

setTimeout(() => {
  window.closeLogin();
  window.location.reload(); // Reload page to refresh all content
}, 1500);
        
      } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection.';
            break;
        }
        
        showMessage(errorMessage, 'error');
        
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      }
    });
  }
});
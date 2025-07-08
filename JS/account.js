document.addEventListener('DOMContentLoaded', function () {
  // Get logged-in user data
  let loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

  if (!loggedInUser) {
    alert('No user is logged in!');
    window.location.href = '/HTML/index.html';
    return;
  }

  // DOM Elements
  const editBtn = document.querySelector('.btn-light, .btn-primary');
  const deleteBtn = document.querySelector('.btn-danger');
  const avatarImg = document.getElementById('avatar-img');
  const navbarAvatar = document.getElementById('navbar-avatar');
  const navbarUsername = document.getElementById('navbar-username');
  const userName = document.getElementById('user-name');
  const userTitle = document.getElementById('user-title');
  const userBio = document.getElementById('user-bio');
  const userEmail = document.getElementById('user-email');
  const userPhone = document.getElementById('user-phone');
  const userProfession = document.getElementById('user-profession');
  const userLocation = document.getElementById('user-location');
  const userCompany = document.getElementById('user-company');
  const userGender = document.getElementById('user-gender');
  const userDOB = document.getElementById('user-dob');
  const avatarUpload = document.getElementById('avatar-upload-input');
  const avatarUploadBtn = document.getElementById('avatar-upload-btn');

  const editableFields = [
    userName, userTitle, userBio,
    userEmail, userPhone, userProfession,
    userLocation, userCompany, userGender, userDOB
  ];

  loadUserData();

  editBtn.addEventListener('click', function () {
    if (editBtn.textContent === 'Edit') {
      enableEditMode();
    } else {
      saveChanges();
    }
  });

  deleteBtn.addEventListener('click', function () {
    if (confirm('Are you sure you want to delete your account?')) {
      let users = JSON.parse(localStorage.getItem('users')) || [];
      users = users.filter(user => user.email !== loggedInUser.email);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.removeItem('loggedInUser');
      showToast('Account deleted. Redirecting to login...');
      setTimeout(() => window.location.href = '/HTML/index.html', 2000);
    }
  });

  if (avatarUploadBtn && avatarUpload) {
    avatarUploadBtn.addEventListener('click', function () {
      avatarUpload.click();
    });

    avatarUpload.addEventListener('change', function (event) {
      const file = event.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const newAvatar = e.target.result;
          avatarImg.src = newAvatar;
          if (navbarAvatar) navbarAvatar.src = newAvatar;
          loggedInUser.image = newAvatar;
          updateUserData(loggedInUser);
          showToast('Avatar updated successfully!');
        };
        reader.readAsDataURL(file);
      } else {
        showToast('Please select a valid image file.');
      }
      avatarUpload.value = '';
    });
  }

  function loadUserData() {
    userName.value = loggedInUser.fullname || '';
    userTitle.value = loggedInUser.title || 'Your Profession';
    userBio.value = loggedInUser.bio || "Hi! I'm a new user.";
    userEmail.value = loggedInUser.email || '';
    userPhone.value = loggedInUser.phone || '';
    userProfession.value = loggedInUser.profession || '';
    userLocation.value = loggedInUser.location || '';
    userCompany.value = loggedInUser.company || '';
    userGender.value = loggedInUser.gender || '';
    userDOB.value = loggedInUser.dob || '';
    avatarImg.src = loggedInUser.image || '1.jpg';
    if (navbarAvatar) navbarAvatar.src = loggedInUser.image || '1.jpg';
    if (navbarUsername) navbarUsername.textContent = loggedInUser.fullname || 'User';
  }

  function enableEditMode() {
    editableFields.forEach(field => {
      if (field.tagName === 'SELECT') {
        field.disabled = false;
      } else {
        field.readOnly = false;
      }
      field.classList.add('bg-body', 'border', 'px-2');
      field.classList.remove('bg-transparent', 'border-0', 'px-0');
    });
    if (avatarUploadBtn) avatarUploadBtn.style.display = 'flex';
    editBtn.textContent = 'Save';
    editBtn.classList.remove('btn-light');
    editBtn.classList.add('btn-primary');
  }

  function disableEditMode() {
    editableFields.forEach(field => {
      if (field.tagName === 'SELECT') {
        field.disabled = true;
      } else {
        field.readOnly = true;
      }
      field.classList.remove('bg-body', 'border', 'px-2');
      field.classList.add('bg-transparent', 'border-0', 'px-0');
    });
    if (avatarUploadBtn) avatarUploadBtn.style.display = 'none';
    editBtn.textContent = 'Edit';
    editBtn.classList.remove('btn-primary');
    editBtn.classList.add('btn-light');
  }

  function saveChanges() {
    loggedInUser.fullname = userName.value;
    loggedInUser.title = userProfession.value;
    loggedInUser.profession = userProfession.value;
    loggedInUser.bio = userBio.value;
    loggedInUser.email = userEmail.value;
    loggedInUser.phone = userPhone.value;
    loggedInUser.location = userLocation.value;
    loggedInUser.company = userCompany.value;
    loggedInUser.gender = userGender.value;
    loggedInUser.dob = userDOB.value;

    userTitle.value = userProfession.value;

    updateUserData(loggedInUser);

    if (navbarUsername) navbarUsername.textContent = loggedInUser.fullname || 'User';

    disableEditMode();
    showToast('Changes saved successfully!');
  }

  function updateUserData(updatedUser) {
    localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const updatedUsers = users.map(user => {
      if (user.email === updatedUser.email) {
        return updatedUser;
      }
      return user;
    });
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '1050';
    toast.innerHTML = `
      <div class="toast show bg-dark text-white" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-body">${message}</div>
      </div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  if (userProfession) {
    userProfession.addEventListener('input', function () {
      userTitle.value = userProfession.value;
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      localStorage.removeItem('loggedInUser');
      showToast('Logged out successfully! Redirecting...');
      setTimeout(() => window.location.href = '/HTML/index.html', 1500);
    });
  }
});

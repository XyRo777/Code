// Show or hide the backdrop for authentication modals
function showCustomBackdrop() {
  document.getElementById('customBackdrop').style.display = 'block';
}

function hideCustomBackdrop() {
  document.getElementById('customBackdrop').style.display = 'none';
}

// On page load
window.onload = function () {
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

  if (!loggedInUser) {
    showCustomBackdrop();
    const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
    signupModal.show();

    document.getElementById('signupModal').addEventListener('hidden.bs.modal', hideCustomBackdrop);
    document.getElementById('signinModal').addEventListener('hidden.bs.modal', hideCustomBackdrop);
  } else {
    if (loggedInUser.fullname) {
      document.getElementById('welcomeUser').innerText = `Hello! ${loggedInUser.fullname}`;
      document.getElementById('userDropdownName').innerText = loggedInUser.fullname;

      // Set user image if available
      if (loggedInUser.image) {
        const userAvatar = document.getElementById('userDropdownImage');
        if (userAvatar) {
          userAvatar.src = loggedInUser.image;
        }
      }
    }

    renderTopPerformer(loggedInUser);
    updateDashboardCounts(loggedInUser); //eta
    hideCustomBackdrop();
  }
};

function updateDashboardCounts(user) {
  const completedCount = user.QuestionsCompleted?.length || 0;
  const attemptedCount = user.QuestionsAttempted?.length || 0;
  const unattemptedCount = user.QuestionsUnAttempted?.length || 0;

  // Completed Card
  const completedElement = document.querySelectorAll('.fs-4.fw-semibold')[0];
  if (completedElement) completedElement.textContent = completedCount;

  // In Progress Card
  const inProgressElement = document.querySelectorAll('.fs-4.fw-semibold')[1];
  if (inProgressElement) inProgressElement.textContent = attemptedCount;

  // Untouched Card
  const untouchedElement = document.querySelectorAll('.fs-4.fw-semibold')[2];
  if (untouchedElement) untouchedElement.textContent = unattemptedCount;
}

// Render the Top Performer section dynamically
function renderTopPerformer(user) {
  const topBox = document.getElementById('topPerformerBox');

  if (!user) {
    topBox.innerHTML = `<p>No user info available.</p>`;
    return;
  }

  const solved = user.QuestionsCompleted?.length || 0;
  const accuracy = solved > 0 ? user.Accuracy || '' : '';
  const avgTime = solved > 0 ? user.AvgTime || '' : '';
  const streak = solved > 0 ? user.Streak || '' : '';

  const avatarContent = user.image
    ? `<img src="${user.image}" class="rounded-circle border border-3 border-gold" style="width: 70px; height: 70px; object-fit: cover;" />`
    : `<div class="avatar rounded-circle border border-3 border-gold bg-secondary d-flex justify-content-center align-items-center text-white" 
          style="width: 70px; height: 70px; font-size: 24px; margin: auto;">
          ${user.fullname[0].toUpperCase()}
       </div>`;

  topBox.innerHTML = `
    <div class="p-2 text-center bg-light bg-opacity-10">
      <div class="position-relative mb-2">
        <span class="badge bg-gold rounded-circle position-absolute top-0 start-50 translate-middle" style="width: 24px; height: 24px; line-height: 24px;">1</span>
        ${avatarContent}
      </div>
      <h6 class="mb-1" style="font-size: 16px;">${user.fullname}</h6>
      <span class="badge bg-success bg-opacity-10 text-success mb-2" style="font-size: 12px;">Weekly Champion</span>

      <div class="d-flex flex-column gap-1 mx-auto" style="max-width: 230px;">
        <div class="d-flex justify-content-between">
          <span class="text-body-secondary">Solved:</span>
          <span class="fw-bold">${solved} problems</span>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-body-secondary">Accuracy:</span>
          <span class="fw-bold">${accuracy ? accuracy + ' <small class="text-success">(+2.4%)</small>' : ''}</span>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-body-secondary">Avg Time:</span>
          <span class="fw-bold">${avgTime}</span>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-body-secondary">Streak:</span>
          <span class="fw-bold">${streak ? streak + ' <i class="fas fa-fire text-danger ms-1"></i>' : ''}</span>
        </div>
      </div>

      <div class="progress mt-2 mx-auto" style="height: 4px; width: 80%;">
        <div class="progress-bar bg-gold" role="progressbar" style="width: ${solved > 0 ? '95%' : '0%'};" aria-valuenow="${solved > 0 ? '95' : '0'}" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
    </div>
  `;
}

// Switch modals: Sign Up <=> Sign In
document.getElementById('toSignin').addEventListener('click', function (e) {
  e.preventDefault();
  const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
  signupModal.hide();

  document.getElementById('signupModal').addEventListener('hidden.bs.modal', function handler() {
    const signinModal = new bootstrap.Modal(document.getElementById('signinModal'));
    signinModal.show();
    showCustomBackdrop();
    this.removeEventListener('hidden.bs.modal', handler);
  });
});

document.getElementById('toSignup').addEventListener('click', function (e) {
  e.preventDefault();
  const signinModal = bootstrap.Modal.getInstance(document.getElementById('signinModal'));
  signinModal.hide();

  document.getElementById('signinModal').addEventListener('hidden.bs.modal', function handler() {
    const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
    signupModal.show();
    showCustomBackdrop();
    this.removeEventListener('hidden.bs.modal', handler);
  });
});

// Form Submit Listeners
document.getElementById('signupForm').addEventListener('submit', register);
document.getElementById('signinForm').addEventListener('submit', login);

// Register Logic (with image upload)
function register(event) {
  event.preventDefault();
  const fullname = document.getElementById('signupFullname').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;
  const imageInput = document.getElementById('signupImage');
  const file = imageInput.files[0];

  if (!fullname || !email || !password || !confirmPassword || !file) {
    alert('Please fill all fields and upload an image!');
    return;
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match!');
    return;
  }

  if (file.size > 1024 * 1024) {
    alert('Please upload an image under 1MB.');
    return;
  }

  const users = JSON.parse(localStorage.getItem('users')) || [];

  if (users.find(user => user.email === email)) {
    alert('User with this email already exists!');
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    const imageData = reader.result;
    const newId = users.length > 0 ? users[users.length - 1].id + 1 : 101;

    // Fetch all question IDs from question.json
    fetch("question.json")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load questions");
        return res.json();
      })
      .then(data => {
        const allQuestionIds = [];
        data.topics.forEach(topic => {
          topic.difficultyLevels.forEach(level => {
            level.questions.forEach(q => {
              allQuestionIds.push(q.id);
            });
          });
        });

        const newUser = {
          id: newId,
          fullname,
          email,
          password,
          image: imageData,
          QuestionsCompleted: [],
          QuestionsUnAttempted: allQuestionIds, // ✅ Assign all 97 questions
          QuestionsAttempted: [],
          TotalPoints: 0,
          Badges: [],
          Accuracy: 0
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('loggedInUser', JSON.stringify(newUser));

        alert('Registration successful! Your User ID is: ' + newId);

        const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
        signupModal.hide();
        location.reload();
      })
      .catch(error => {
        console.error("Error loading questions:", error);
        alert("Something went wrong during registration. Please try again.");
      });
  };

  reader.readAsDataURL(file); // Only one read trigger is needed
}


// Login Logic
function login(event) {
  event.preventDefault();
  const email = document.getElementById('signinEmail').value.trim();
  const password = document.getElementById('signinPassword').value;

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const validUser = users.find(user => user.email === email && user.password === password);

  if (validUser) {
    alert('Login successful!');
    localStorage.setItem('loggedInUser', JSON.stringify(validUser));
    location.reload();
  } else {
    alert('Invalid email or password!');
  }
}

;
// Logout Logic
document.getElementById('signOutButton').addEventListener('click', function (e) {
  e.preventDefault();
  localStorage.removeItem('loggedInUser'); // Remove from local storage
  sessionStorage.clear(); // 🧹 Clear all session storage for this user
  location.reload(); // Refresh page
});
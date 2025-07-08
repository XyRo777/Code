// Global reference for console access
document.addEventListener("DOMContentLoaded", function () {
  window.users = JSON.parse(localStorage.getItem('users')) || [];
  window.loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')) || null;
});

function register(event) {
  event.preventDefault();

  let fullname = document.getElementById('signupFullname').value.trim();
  let email = document.getElementById('signupEmail').value.trim();
  let password = document.getElementById('signupPassword').value;
  let confirmPassword = document.getElementById('signupConfirmPassword').value;
  let imageInput = document.getElementById('signupImage');
  let file = imageInput.files[0];

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

  let users = JSON.parse(localStorage.getItem('users')) || [];

  if (users.find(user => user.email === email)) {
    alert('User with this email already exists!');
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    const imageData = reader.result;

    let newId = users.length > 0 ? users[users.length - 1].id + 1 : 101;

    // Step: Fetch all question IDs from question.json
     fetch("/json/question.json")
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
          completedQuestions: [],
          attemptedQuestions: [],
          unattemptedQuestions: allQuestionIds
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('loggedInUser', JSON.stringify(newUser));
        sessionStorage.setItem('loggedInUserId', newUser.id);
        window.users = users;
        window.loggedInUser = newUser;

        alert('Registration successful! Your User ID is: ' + newId);

        const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
        signupModal.hide();

        document.getElementById("signupForm").reset();
        location.reload();
      })
      .catch(error => {
        console.error("Question loading failed during registration:", error);
        alert("Failed to load questions. Please try again.");
      });
  };

  reader.readAsDataURL(file);
}


function login(event) {
  event.preventDefault();
  let email = document.getElementById('signinEmail').value.trim();
  let password = document.getElementById('signinPassword').value;

  let users = JSON.parse(localStorage.getItem('users')) || [];

  let validUser = users.find(user => user.email === email && user.password === password);

  if (validUser) {
    // Pull the full object from the stored users array (to get the latest updated one)
    let latestUsers = JSON.parse(localStorage.getItem('users')) || [];
    let latestValidUser = latestUsers.find(user => user.id === validUser.id);

    alert('Login successful!');
    localStorage.setItem('loggedInUser', JSON.stringify(latestValidUser));
    sessionStorage.setItem('loggedInUserId', latestValidUser.id);
    location.reload();
  } else {
    // 🛑 Don't forget to alert on failure!
    alert('Invalid email or password!');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Search Functionality
  const searchInput = document.getElementById('searchInput');
  const table = document.getElementById('dataTable');
  const rows = table.querySelectorAll('tbody tr');

  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    
    rows.forEach(row => {
      const nameCell = row.querySelector('td:nth-child(2)'); // Name column
      if (nameCell) {
        const nameText = nameCell.textContent.toLowerCase();
        row.style.display = nameText.includes(searchTerm) ? '' : 'none';
      }
    });
  });

  // Load user data for Navbar
  const navbarAvatar = document.getElementById('navbar-avatar');
  const navbarUsername = document.getElementById('navbar-username');

  let loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (loggedInUser) {
    navbarAvatar.src = loggedInUser.image || 'freepik__upload__71749-512x512.jpg';
    navbarUsername.textContent = loggedInUser.fullname || 'Guest';
  } else {
    // If no user logged in, redirect to dashboard (or login)
    window.location.href = 'index.html';
  }

  // Logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('loggedInUser');
      window.location.href = 'index.html'; // Redirect to dashboard
    });
  }
});


document.getElementById("screensht").addEventListener("click", function() {
  const target = document.getElementById("leaderboardWrapper");

  html2canvas(target, {
    scrollY: 0,
    width: target.scrollWidth,
    height: target.scrollHeight,
    backgroundColor: "#121212"
  }).then(canvas => {
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = "dashboard-screenshot.png";
    link.click();
  });
});

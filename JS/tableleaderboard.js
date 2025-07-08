document.addEventListener("DOMContentLoaded", () => {
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const tableBody = document.querySelector("#dataTable tbody");
  const paginationContainer = document.querySelector(".pagination");
  const rowsPerPage = 5;
  let currentPage = 1;

  if (!tableBody) return;

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const loggedInEmail = loggedInUser?.email;

  // Create user data with ranking info
  const sortedUsers = users.map(user => {
    const completed = user.QuestionsCompleted || [];
    const attempted = user.QuestionsAttempted || [];
    const totalTried = completed.length + attempted.length;
    const accuracy = totalTried > 0 ? ((completed.length / totalTried) * 100).toFixed(2) : "0.00";

    const solved = completed.length;
    const badgeText = getBadgeText(solved);
    const badge = getBadge(solved);

    return {
      fullname: user.fullname,
      email: user.email,
      image: user.image || "default.jpg",
      solved,
      accuracy,
      badge,
      badgeText,
    };
  }).sort((a, b) => b.solved - a.solved);

  // Store original rank before pinning
  sortedUsers.forEach((user, index) => {
    user.originalRank = index + 1;
  });

  // Pin logged-in user to top if present
  if (loggedInEmail) {
    const index = sortedUsers.findIndex(user => user.email === loggedInEmail);
    if (index !== -1) {
      const [loggedUser] = sortedUsers.splice(index, 1);
      sortedUsers.unshift(loggedUser);
    }
  }

  // Enable search filtering
  let filteredUsers = [...sortedUsers];

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase().trim();
      filteredUsers = sortedUsers.filter(user =>
        user.fullname.toLowerCase().includes(searchTerm) ||
        user.badgeText.toLowerCase().includes(searchTerm) ||
        user.solved.toString().includes(searchTerm) ||
        user.accuracy.toString().includes(searchTerm)
      );
      currentPage = 1;
      paginateAndRender();
    });
  }

  function paginateAndRender() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const usersToShow = filteredUsers.slice(start, end);

    tableBody.innerHTML = "";

    usersToShow.forEach((user, index) => {
      const actualUser = filteredUsers[start + index];
      const rank = actualUser.originalRank;
      const rankStyle = getRankColor(rank);

      const row = document.createElement("tr");
      row.setAttribute("role", "button");
      row.setAttribute("data-bs-toggle", "offcanvas");
      row.setAttribute("data-bs-target", "#productModal");

      // Highlight logged-in user
      if (actualUser.email === loggedInEmail) {
        row.style.border = "2px solid #0d6efd";
        row.style.backgroundColor = "#f0f8ff";
      }

      row.innerHTML = `
        <td style="font-weight: 600; ${rankStyle.color}">${rank}</td>
        <td>
          <div class="d-flex align-items-center">
            <div class="avatar text-primary">
              <img class="avatar-img" src="${actualUser.image}" alt="...">
            </div>
            <div class="ms-4">
              <div style="${rankStyle.nameStyle}">${actualUser.fullname}</div>
            </div>
          </div>
        </td>
        <td style="padding-left: 47px; ${rankStyle.nameStyle}">${actualUser.solved}</td>
        <td>
  <span class="badge ${getAccuracyClass(actualUser.accuracy)}">
    ${actualUser.accuracy}%
  </span>
</td>

        <td>
          <div class="d-flex gap-2">${actualUser.badge}</div>
        </td>
      `;

      tableBody.appendChild(row);
    });

    setupPagination();
  }

  function setupPagination() {
    if (!paginationContainer) return;

    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    paginationContainer.innerHTML = `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" aria-label="Previous">
          <span aria-hidden="true">«</span>
        </a>
      </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      paginationContainer.innerHTML += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#">${i}</a>
        </li>
      `;
    }

    paginationContainer.innerHTML += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" aria-label="Next">
          <span aria-hidden="true">»</span>
        </a>
      </li>
    `;

    // Event listeners
    const pageItems = paginationContainer.querySelectorAll('.page-item');
    pageItems.forEach((item, idx) => {
      const link = item.querySelector('a');
      if (!link) return;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (item.classList.contains('disabled')) return;

        if (idx === 0 && currentPage > 1) {
          currentPage--;
        } else if (idx === pageItems.length - 1 && currentPage < totalPages) {
          currentPage++;
        } else if (idx > 0 && idx < pageItems.length - 1) {
          currentPage = parseInt(link.textContent);
        }

        paginateAndRender();
      });
    });
  }

  // Badge generator
  function getBadge(count) {
    if (count < 10) {
      return `<span class="badge" style="
        background: linear-gradient(135deg, #d3d3d3, #f0f0f0);
        color: #333;
        font-weight: 500;
        border: 1px solid #bbb;
        box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);">
        <span class="material-symbols-outlined fs-6 me-1" style="color: #555;">rocket_launch</span>
        New Challenger
      </span>`;
    } else if (count < 30) {
      return `<span class="badge" style="background: #cd7f32; color: white;">
        <span class="material-symbols-outlined fs-6 me-1">military_tech</span>
        Bronze Achiever
      </span>`;
    } else if (count < 70) {
      return `<span class="badge" style="background: #c0c0c0; color: black;">
        <span class="material-symbols-outlined fs-6 me-1">military_tech</span>
        Silver Champion
      </span>`;
    } else if (count < 120) {
      return `<span class="badge" style="background: #ffd700; color: black;">
        <span class="material-symbols-outlined fs-6 me-1">military_tech</span>
        Gold Prodigy
      </span>`;
    } else if (count < 200) {
      return `<span class="badge" style="background: linear-gradient(to right, #8a2be2, #4b0082); color: white;">
        <span class="material-symbols-outlined fs-6 me-1">auto_awesome</span>
        Legendary Coder
      </span>`;
    } else {
      return `<span class="badge" style="background: linear-gradient(135deg, #FFD700 0%, #FFAA00 100%);
                color: #000; font-weight: 600; border: none;
                box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);">
        <span class="material-symbols-outlined fs-6 me-1">military_tech</span>
        Top 1%
      </span>`;
    }
  }

  // Plain text version for search
  function getBadgeText(count) {
    if (count < 10) return "New Challenger";
    if (count < 30) return "Bronze Achiever";
    if (count < 70) return "Silver Champion";
    if (count < 120) return "Gold Prodigy";
    if (count < 200) return "Legendary Coder";
    return "Top 1%";
  }

  // Rank color logic
  function getRankColor(rank) {
    if (rank === 1) {
      return { color: "color: #f9bc06;", nameStyle: "color: #f9bc06; font-weight: 400;" };
    } else if (rank === 2) {
      return { color: "color: #c0c0c0;", nameStyle: "color: #c0c0c0; font-weight: 400;" };
    } else if (rank === 3) {
      return { color: "color: #a03a3a;", nameStyle: "color: #a03a3a; font-weight: 400;" };
    } else {
      return { color: "", nameStyle: "" };
    }
  }
  function getAccuracyClass(accuracy) {
  const value = parseFloat(accuracy);
  if (value < 25) return 'bg-danger-subtle text-danger';
  if (value < 50) return 'bg-warning-subtle text-warning';
  return 'bg-success-subtle text-success';
}


  // Initial render
  paginateAndRender();
});

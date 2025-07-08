let currentPage = 1;
const rowsPerPage = 5;
let filteredQuestions = [];
let originalQuestions = [];

document.addEventListener("DOMContentLoaded", function () {
  fetch("question.json")
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch JSON");
      return response.json();
    })
    .then(data => {
      const treesTopic = data.topics.find(topic => topic.name === "Trees");
      const mediumLevel = treesTopic?.difficultyLevels.find(level => level.level === "Medium");

      if (!mediumLevel) throw new Error("Medium level not found in Trees topic");

      const stored = JSON.parse(localStorage.getItem('trees_medium_questions'));

      if (!stored || stored.length !== mediumLevel.questions.length) {
        localStorage.setItem('trees_medium_questions', JSON.stringify(mediumLevel.questions));
        originalQuestions = mediumLevel.questions;
      } else {
        originalQuestions = stored;
      }

      filteredQuestions = originalQuestions.map((q, idx) => ({ ...q, originalIndex: idx }));

      renderTable();
      setupPagination();
      initializeTableFunctionality();
      updateCompletedCount();
      updatePieChart();
    })
    .catch(err => console.error("Error loading medium questions:", err));
});


function renderTable() {
  const tbody = document.querySelector('.table tbody');
  tbody.innerHTML = '';

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const questionsToShow = filteredQuestions.slice(start, end);

  questionsToShow.forEach((question, index) => {
    const originalIndex = question.originalIndex;
    const row = document.createElement('tr');
    if (index % 2 === 1) row.style.backgroundColor = 'rgba(0,0,0,0.05)';

    let companiesHtml = '';
    (question.companies || []).forEach(company => {
      companiesHtml += `
        <div class="avatar avatar-xs">
          <img class="avatar-img" src="${company}" alt="${company.split('.')[0]}">
        </div>`;
    });

    const statusOptions = ["Unattempted", "Attempted", "Completed"];
    const optionsHtml = statusOptions.map(opt => {
      const selected = question.status === opt ? 'selected' : '';
      return `<option value="${opt}" class="text-${getStatusColor(opt)}" ${selected}>${opt}</option>`;
    }).join('');

    row.innerHTML = `
      <td>${question.title}</td>
      <td>
        <div class="avatar avatar-xs">
          <a href="${question.practiceLink}" target="_blank">
            <img src="${question.practiceSite}" style="height: 23px;">
          </a>
        </div>
      </td>
      <td>
        <select class="form-select form-select-sm status-select text-${getStatusColor(question.status)}" data-index="${originalIndex}">
          ${optionsHtml}
        </select>
      </td>
      <td><div class="avatar-group">${companiesHtml}</div></td>
    `;

    tbody.appendChild(row);
  });

  updatePaginationInfo();
}

function initializeTableFunctionality() {
  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('status-select')) {
      const select = e.target;
      const index = parseInt(select.getAttribute('data-index'));
      const newStatus = select.value;

      if (!isNaN(index) && originalQuestions[index]) {
        originalQuestions[index].status = newStatus;
         if (newStatus === "Completed" && !originalQuestions[index].completedOn) {
    originalQuestions[index].completedOn = new Date().toISOString().split('T')[0];
  }
        localStorage.setItem('trees_medium_questions', JSON.stringify(originalQuestions));

        const search = document.getElementById('questionSearch').value.toLowerCase();
        filteredQuestions = originalQuestions
          .map((q, idx) => ({ ...q, originalIndex: idx }))
          .filter(q =>
            q.title.toLowerCase().includes(search) ||
            q.status.toLowerCase().includes(search)
          );

        select.className = `form-select form-select-sm status-select text-${getStatusColor(newStatus)}`;
        renderTable();
        updateCompletedCount();
        updatePieChart();
      }
    }
  });

  document.getElementById('questionSearch').addEventListener('input', function () {
    const search = this.value.toLowerCase();
    filteredQuestions = originalQuestions
      .map((q, idx) => ({ ...q, originalIndex: idx }))
      .filter(q =>
        q.title.toLowerCase().includes(search) ||
        q.status.toLowerCase().includes(search)
      );
    currentPage = 1;
    renderTable();
    setupPagination();
    updatePieChart();
  });
}

function getStatusColor(status) {
  if (status === 'Unattempted') return 'danger';
  if (status === 'Attempted') return 'warning';
  if (status === 'Completed') return 'success';
  return 'secondary';
}

function updatePieChart() {
  const pie = document.querySelector('.pieID.pie');
  if (!pie) return;

  const counts = {
    Unattempted: 0,
    Attempted: 0,
    Completed: 0
  };

  originalQuestions.forEach(q => {
    if (counts.hasOwnProperty(q.status)) counts[q.status]++;
  });

  const total = originalQuestions.length;
  if (total === 0) return;

  pie.innerHTML = '';
  const colors = {
    Unattempted: 'red',
    Attempted: 'rgb(255, 193, 7)',
    Completed: 'rgb(12, 155, 25)'
  };

  let startAngle = 0;
  Object.entries(counts).forEach(([status, count]) => {
    if (count === 0) return;
    const sliceDeg = (count / total) * 360;

    let remaining = sliceDeg;
    while (remaining > 0) {
      const currentSlice = Math.min(180, remaining);
      const slice = document.createElement('div');
      slice.className = `slice s-${status.toLowerCase()}`;
      slice.style.transform = `rotate(${startAngle}deg)`;

      const span = document.createElement('span');
      span.style.backgroundColor = colors[status];
      span.style.transform = `rotate(${currentSlice}deg)`;

      slice.appendChild(span);
      pie.appendChild(slice);

      startAngle += currentSlice;
      remaining -= currentSlice;
    }
  });

  document.querySelectorAll('.pieID.legend li').forEach(li => {
    const status = li.querySelector('em').textContent.trim();
    li.querySelector('span').textContent = counts[status] || 0;
    li.style.borderColor = colors[status];
  });
}

function updateCompletedCount() {
  const completed = originalQuestions.filter(q => q.status === 'Completed').length;
  document.getElementById('completedCount').textContent =
    `${completed} out of ${originalQuestions.length} programs completed`;
}

function setupPagination() {
  const totalPages = Math.ceil(filteredQuestions.length / rowsPerPage);
  const paginationContainer = document.getElementById('pagination');
  const existing = paginationContainer.querySelectorAll('.page-item:not(.prev-page):not(.next-page)');
  existing.forEach(btn => btn.remove());

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = 'page-item' + (i === currentPage ? ' active' : '');
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = i;
    a.addEventListener('click', function (e) {
      e.preventDefault();
      currentPage = i;
      renderTable();
      updatePaginationControls();
    });
    li.appendChild(a);
    paginationContainer.insertBefore(li, document.querySelector('.next-page'));
  }

  paginationContainer.querySelector('.prev-page .page-link').onclick = (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      updatePaginationControls();
    }
  };

  paginationContainer.querySelector('.next-page .page-link').onclick = (e) => {
    e.preventDefault();
    const totalPages = Math.ceil(filteredQuestions.length / rowsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
      updatePaginationControls();
    }
  };

  updatePaginationControls();
}

function updatePaginationControls() {
  const totalPages = Math.ceil(filteredQuestions.length / rowsPerPage);
  document.querySelector('.prev-page').classList.toggle('disabled', currentPage === 1);
  document.querySelector('.next-page').classList.toggle('disabled', currentPage >= totalPages);

  document.querySelectorAll('.page-item').forEach(item => {
    item.classList.remove('active');
    if (item.textContent == currentPage) item.classList.add('active');
  });
}

function updatePaginationInfo() {
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, filteredQuestions.length);
  document.querySelector('.text-body-secondary').textContent =
    `${start} – ${end} of ${filteredQuestions.length}`;
}


document.addEventListener('DOMContentLoaded', function() {
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

  if (loggedInUser) {
    const userImage = document.getElementById('userDropdownImage');
    const userName = document.getElementById('userDropdownName');

    if (userImage) userImage.src = loggedInUser.image || 'default.jpg'; // fallback DP
    if (userName) userName.textContent = loggedInUser.fullname || 'Guest User'; // fallback name
  } else {
    // Not logged in — force redirect to login page
    window.location.href = 'index.html';
  }

  // Logout functionality
  const logoutBtn = document.getElementById('signOutButton');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('loggedInUser');
      window.location.href = 'index.html';
    });
  }
});

// Prevent accessing this page after logout via back button
window.addEventListener('pageshow', function(event) {
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (!loggedInUser) {
    window.location.href = 'index.html';
  }
});
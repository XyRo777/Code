let currentPageNumber = 1;
const rowsPerPage = 5;
let filteredQuestions = [];
let originalQuestions = [];

document.addEventListener("DOMContentLoaded", function () {
  const pageConfig = [
    { page: "projects.html", topic: "Arrays", level: "Easy", storageKey: "array_easy_questions" },
    { page: "project.html", topic: "Arrays", level: "Medium", storageKey: "array_medium_questions" },
    { page: "project-new.html", topic: "Arrays", level: "Hard", storageKey: "array_hard_questions" },
    
    { page: "string1.html", topic: "Strings", level: "Easy", storageKey: "string_easy_questions" },
    { page: "string2.html", topic: "Strings", level: "Medium", storageKey: "string_medium_questions" },
    { page: "string3.html", topic: "Strings", level: "Hard", storageKey: "string_hard_questions" },

    { page: "ll1.html", topic: "Linked List", level: "Easy", storageKey: "linkedlist_easy_questions" },
    { page: "ll2.html", topic: "Linked List", level: "Medium", storageKey: "linkedlist_medium_questions" },
    { page: "ll3.html", topic: "Linked List", level: "Hard", storageKey: "linkedlist_hard_questions" },
    
    { page: "graph1.html", topic: "Graphs", level: "Easy", storageKey: "graphs_easy_questions" },
    { page: "graph2.html", topic: "Graphs", level: "Medium", storageKey: "graphs_medium_questions" },
    { page: "graph3.html", topic: "Graphs", level: "Hard", storageKey: "graphs_hard_questions" },
    
    { page: "trees1.html", topic: "Trees", level: "Easy", storageKey: "trees_easy_questions" },
    { page: "trees2.html", topic: "Trees", level: "Medium", storageKey: "trees_medium_questions" },
    { page: "trees3.html", topic: "Trees", level: "Hard", storageKey: "trees_hard_questions" },
    
    { page: "DP1.html", topic: "Dynamic Programming", level: "Easy", storageKey: "dp_easy_questions" },
    { page: "DP2.html", topic: "Dynamic Programming", level: "Medium", storageKey: "dp_medium_questions" },
    { page: "DP3.html", topic: "Dynamic Programming", level: "Hard", storageKey: "dp_hard_questions" }
    
    // Add more pages as needed
  ];

  const currentPage = window.location.pathname.split("/").pop();
  const config = pageConfig.find(cfg => cfg.page === currentPage);

  if (!config) {
    console.error("No configuration found for this page:", currentPage);
    return;
  }

  fetch("question.json")
  .then(response => {
    if (!response.ok) throw new Error("Failed to fetch JSON");
    return response.json();
  })
  .then(data => {
    // Store all questions into originalQuestions
    originalQuestions = [];

    data.topics.forEach(topic => {
      topic.difficultyLevels.forEach(level => {
        level.questions.forEach(q => {
          originalQuestions.push({
            ...q,
            topic: topic.name,
            level: level.level,
            status: q.status || "Unattempted" // default if status missing
          });
        });
      });
    });

    // Filter for current topic and level
    filteredQuestions = originalQuestions
      .map((q, idx) => ({ ...q, originalIndex: idx }))
      .filter(q => q.topic === config.topic && q.level === config.level);

    renderTable();
    setupPagination();
    initializeTableFunctionality(config.storageKey);
    updateCompletedCount();
    updatePieChart();
  })

    .catch(err => console.error("Error loading questions:", err));

  // Auth check
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (loggedInUser) {
    const userImage = document.getElementById('userDropdownImage');
    const userName = document.getElementById('userDropdownName');
    if (userImage) userImage.src = loggedInUser.image || 'default.jpg';
    if (userName) userName.textContent = loggedInUser.fullname || 'Guest User';
  } else {
    window.location.href = 'index.html';
  }

  const logoutBtn = document.getElementById('signOutButton');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('loggedInUser');
      window.location.href = 'index.html';
    });
  }
});

window.addEventListener('pageshow', function () {
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (!loggedInUser) window.location.href = 'index.html';
});

function renderTable() {
  const tbody = document.querySelector('.table tbody');
  tbody.innerHTML = '';

  const start = (currentPageNumber - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const questionsToShow = filteredQuestions.slice(start, end);

  questionsToShow.forEach((question, index) => {
    const originalIndex = question.originalIndex;
    const row = document.createElement('tr');
    if (index % 2 === 1) row.style.backgroundColor = 'rgba(0,0,0,0.05)';

    const companiesHtml = (question.companies || []).map(company => `
      <div class="avatar avatar-xs">
        <img class="avatar-img" src="${company}" alt="${company.split('.')[0]}">
      </div>`).join('');

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

function initializeTableFunctionality(storageKey) {
  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('status-select')) {
      const select = e.target;
      const index = parseInt(select.getAttribute('data-index'));
      const newStatus = select.value;

      if (!isNaN(index) && originalQuestions[index]) {
        originalQuestions[index].status = newStatus;
        localStorage.setItem(storageKey, JSON.stringify(originalQuestions));

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
    currentPageNumber = 1;
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

  const counts = { Unattempted: 0, Attempted: 0, Completed: 0 };
  originalQuestions.forEach(q => {
    if (counts[q.status] !== undefined) counts[q.status]++;
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
    let sliceDeg = (count / total) * 360;
    while (sliceDeg > 0) {
      const currentSlice = Math.min(180, sliceDeg);
      const slice = document.createElement('div');
      slice.className = `slice s-${status.toLowerCase()}`;
      slice.style.transform = `rotate(${startAngle}deg)`;

      const span = document.createElement('span');
      span.style.backgroundColor = colors[status];
      span.style.transform = `rotate(${currentSlice}deg)`;

      slice.appendChild(span);
      pie.appendChild(slice);

      startAngle += currentSlice;
      sliceDeg -= currentSlice;
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
    li.className = 'page-item' + (i === currentPageNumber ? ' active' : '');
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = i;
    a.addEventListener('click', function (e) {
      e.preventDefault();
      currentPageNumber = i;
      renderTable();
      updatePaginationControls();
    });
    li.appendChild(a);
    paginationContainer.insertBefore(li, document.querySelector('.next-page'));
  }

  paginationContainer.querySelector('.prev-page .page-link').onclick = (e) => {
    e.preventDefault();
    if (currentPageNumber > 1) {
      currentPageNumber--;
      renderTable();
      updatePaginationControls();
    }
  };

  paginationContainer.querySelector('.next-page .page-link').onclick = (e) => {
    e.preventDefault();
    if (currentPageNumber < totalPages) {
      currentPageNumber++;
      renderTable();
      updatePaginationControls();
    }
  };

  updatePaginationControls();
}

function updatePaginationControls() {
  const totalPages = Math.ceil(filteredQuestions.length / rowsPerPage);
  document.querySelector('.prev-page').classList.toggle('disabled', currentPageNumber === 1);
  document.querySelector('.next-page').classList.toggle('disabled', currentPageNumber >= totalPages);

  document.querySelectorAll('.page-item').forEach(item => {
    item.classList.remove('active');
    if (item.textContent == currentPageNumber) item.classList.add('active');
  });
}

function updatePaginationInfo() {
  const start = (currentPageNumber - 1) * rowsPerPage + 1;
  const end = Math.min(currentPageNumber * rowsPerPage, filteredQuestions.length);
  document.querySelector('.text-body-secondary').textContent =
    `${start} – ${end} of ${filteredQuestions.length}`;
}

// ==================== USER INFO LOAD ====================
// Global reference for console access


document.addEventListener("DOMContentLoaded", function() {
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
   window.users = JSON.parse(localStorage.getItem('users')) || [];



  if (loggedInUser) {
    const userNameSpan = document.getElementById('userDropdownName');
    const userImage = document.getElementById('userDropdownImage');

    if (userNameSpan) userNameSpan.textContent = loggedInUser.fullname;
    if (userImage && loggedInUser.image) userImage.src = loggedInUser.image;
  } else {
    console.warn("No logged in user found in localStorage.");
  }
});

// ==================== USER INFO LOAD END ====================

var currentPageNumber = 1;
var rowsPerPage = 5;
var filteredQuestions = [];
var originalQuestions = [];

const pageTopicMap = [
  { page: "projects.html", topic: "Arrays", level: "Easy" },
  { page: "project.html", topic: "Arrays", level: "Medium" },
  { page: "project-new.html", topic: "Arrays", level: "Hard" },
  { page: "string1.html", topic: "Strings", level: "Easy" },
  { page: "string2.html", topic: "Strings", level: "Medium" },
  { page: "string3.html", topic: "Strings", level: "Hard" },
  { page: "ll1.html", topic: "Linked List", level: "Easy" },
  { page: "ll2.html", topic: "Linked List", level: "Medium" },
  { page: "ll3.html", topic: "Linked List", level: "Hard" },
  { page: "graph1.html", topic: "Graphs", level: "Easy" },
  { page: "graph2.html", topic: "Graphs", level: "Medium" },
  { page: "graph3.html", topic: "Graphs", level: "Hard" },
  { page: "trees1.html", topic: "Trees", level: "Easy" },
  { page: "trees2.html", topic: "Trees", level: "Medium" },
  { page: "trees3.html", topic: "Trees", level: "Hard" },
  { page: "DP1.html", topic: "Dynamic Programming", level: "Easy" },
  { page: "DP2.html", topic: "Dynamic Programming", level: "Medium" },
  { page: "DP3.html", topic: "Dynamic Programming", level: "Hard" }
];

const currentPage = window.location.pathname.split("/").pop();
const pageConfig = pageTopicMap.find(p => p.page === currentPage);

if (!pageConfig) {
  console.error("No config found for this page:", currentPage);
} else {
  document.addEventListener("DOMContentLoaded", function () {
    fetch("question.json")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch questions");
        return res.json();
      })
      .then(data => {
        originalQuestions = [];
        data.topics.forEach(topic => {
          topic.difficultyLevels.forEach(level => {
            level.questions.forEach(q => {
              originalQuestions.push({
                ...q,
                topic: topic.name,
                level: level.level
              });
            });
          });
        });

        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (loggedInUser) {
          if (!loggedInUser.QuestionsUnAttempted || loggedInUser.QuestionsUnAttempted.length === 0) {
          loggedInUser.QuestionsUnAttempted = originalQuestions.map(q => q.id);
          localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));

          // ✅ Update users array as well
          const users = JSON.parse(localStorage.getItem('users')) || [];
          const index = users.findIndex(u => u.id === loggedInUser.id);
          if (index !== -1) {
            users[index].QuestionsUnAttempted = [...loggedInUser.QuestionsUnAttempted];
            localStorage.setItem('users', JSON.stringify(users));
          }
        }

          originalQuestions.forEach(q => {
            if (loggedInUser.QuestionsCompleted?.some(item => parseInt(item[0]) === q.id)) {
              q.status = "Completed";
            } else if (loggedInUser.QuestionsAttempted?.some(item => parseInt(item[0]) === q.id)) {
              q.status = "Attempted";
            } else if (loggedInUser.QuestionsUnAttempted?.includes(q.id)) {
              q.status = "Unattempted";
            } else {
              q.status = "Unattempted";
            }
          });

          // ==================== Calculate Completed Counts Per Topic ====================
          const topicCounts = {
            Arrays: 0,
            Strings: 0,
            "Linked List": 0,
            Trees: 0,
            Graphs: 0,
            "Dynamic Programming": 0
          };

          originalQuestions.forEach(q => {
            if (q.status === "Completed" && topicCounts.hasOwnProperty(q.topic)) {
              topicCounts[q.topic]++;
            }
          });

          const arrayCompletedCount = topicCounts["Arrays"];
          const stringCompletedCount = topicCounts["Strings"];
          const linkedListCompletedCount = topicCounts["Linked List"];
          const treesCompletedCount = topicCounts["Trees"];
          const graphsCompletedCount = topicCounts["Graphs"];
          const dpCompletedCount = topicCounts["Dynamic Programming"];

          localStorage.setItem("completed_array_count", arrayCompletedCount);
          localStorage.setItem("completed_string_count", stringCompletedCount);
          localStorage.setItem("completed_linkedlist_count", linkedListCompletedCount);
          localStorage.setItem("completed_trees_count", treesCompletedCount);
          localStorage.setItem("completed_graphs_count", graphsCompletedCount);
          localStorage.setItem("completed_dp_count", dpCompletedCount);
        }

        filteredQuestions = originalQuestions.filter(q => 
          q.topic === pageConfig.topic && q.level === pageConfig.level
        );

        renderTable();
        setupPagination();
        initializeTableFunctionality();
        updateCompletedCount();
        updatePieChart();
      })
      .catch(err => console.error("Error:", err));
  });
}


function initializeTableFunctionality() {
  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('status-select')) {
      const qid = parseInt(e.target.getAttribute('data-id'));
      const newStatus = e.target.value;

      const question = filteredQuestions.find(q => q.id === qid);
      if (question) question.status = newStatus;

      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const userIndex = users.findIndex(u => u.id === loggedInUser.id);

      loggedInUser.QuestionsCompleted = (loggedInUser.QuestionsCompleted || []).filter(item => parseInt(item[0]) !== qid);
      loggedInUser.QuestionsAttempted = (loggedInUser.QuestionsAttempted || []).filter(item => parseInt(item[0]) !== qid);
      loggedInUser.QuestionsUnAttempted = (loggedInUser.QuestionsUnAttempted || []).filter(id => id !== qid);

      if (newStatus === "Completed") {
        loggedInUser.QuestionsCompleted.push([qid.toString(), getFormattedTimestamp()]);
      } else if (newStatus === "Attempted") {
        loggedInUser.QuestionsAttempted.push([qid.toString(), getFormattedTimestamp()]);
      } else if (newStatus === "Unattempted") {
        loggedInUser.QuestionsUnAttempted.push(qid);
      }
      
      // === Update TotalPoints and Accuracy ===
      const attemptedCount = loggedInUser.QuestionsAttempted.length;
      const completedCount = loggedInUser.QuestionsCompleted.length;

      // TotalPoints: 10 points for every completed question
      loggedInUser.TotalPoints = completedCount * 10;

      // Accuracy: Completed / (Completed + Attempted) * 100
      if (completedCount + attemptedCount === 0) {
    loggedInUser.Accuracy = 0;
      } else {
          loggedInUser.Accuracy = ((completedCount) / (completedCount + attemptedCount)) * 100;
      }


    localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
      if (userIndex !== -1) {
    users[userIndex] = loggedInUser;
    localStorage.setItem('users', JSON.stringify(users));
    }

// ✅ This keeps your 'users' variable LIVE in console:
    window.users = JSON.parse(localStorage.getItem('users')); ////


      e.target.className = `form-select form-select-sm status-select text-${getStatusColor(newStatus)}`;

      updateCompletedCount();
      updatePieChart();
    }
  });
}

function getFormattedTimestamp() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

// other functions remain unchanged (renderTable, updatePieChart, updateCompletedCount, setupPagination, etc.)

function renderTable() {
  const tbody = document.querySelector('.table tbody');
  tbody.innerHTML = '';

  const start = (currentPageNumber - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const questionsToShow = filteredQuestions.slice(start, end);

  questionsToShow.forEach((question, index) => {
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
      <td><div class="avatar avatar-xs"><a href="${question.practiceLink}" target="_blank"><img src="${question.practiceSite}" style="height: 23px;"></a></div></td>
      <td><select class="form-select form-select-sm status-select text-${getStatusColor(question.status)}" data-id="${question.id}">${optionsHtml}</select></td>
      <td><div class="avatar-group">${companiesHtml}</div></td>`;

    tbody.appendChild(row);
  });

  updatePaginationInfo();
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
  filteredQuestions.forEach(q => {
    const status = q.status || "Unattempted";
    counts[status]++;
  });

  const total = filteredQuestions.length;
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
  const completed = filteredQuestions.filter(q => q.status === 'Completed').length;
  const counter = document.getElementById('completedCount');
  if (counter) counter.textContent = `${completed} out of ${filteredQuestions.length} programs completed`;
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
    paginationContainer.insertBefore(li, paginationContainer.querySelector('.next-page'));
  }

  paginationContainer.querySelector('.prev-page .page-link').onclick = function (e) {
    e.preventDefault();
    if (currentPageNumber > 1) {
      currentPageNumber--;
      renderTable();
      updatePaginationControls();
    }
  };

  paginationContainer.querySelector('.next-page .page-link').onclick = function (e) {
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
  document.querySelector('.text-body-secondary').textContent = `${start} – ${end} of ${filteredQuestions.length}`;
}

//for logout
document.addEventListener("DOMContentLoaded", function() {
  const signOutBtn = document.getElementById('signOutButton');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('loggedInUser');
      sessionStorage.clear();
      window.location.href = 'index.html';
    });
  }
});

//Topic-wise progress and chart update


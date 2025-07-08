// ==================== USER INFO LOAD ====================
document.addEventListener("DOMContentLoaded", function () {
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  window.users = JSON.parse(localStorage.getItem('users')) || [];
  window.loggedInUser = loggedInUser || [];

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

const currentPage = window.location.pathname.split("/").pop().split("?")[0];
const pageConfig = pageTopicMap.find(p => p.page === currentPage);

if (pageConfig) {
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

          localStorage.setItem("completed_array_count", topicCounts["Arrays"]);
          localStorage.setItem("completed_string_count", topicCounts["Strings"]);
          localStorage.setItem("completed_linkedlist_count", topicCounts["Linked List"]);
          localStorage.setItem("completed_trees_count", topicCounts["Trees"]);
          localStorage.setItem("completed_graphs_count", topicCounts["Graphs"]);
          localStorage.setItem("completed_dp_count", topicCounts["Dynamic Programming"]);

          // ✅ Weekly Chart
          generateWeeklyChart(loggedInUser, window.users, originalQuestions, pageConfig);
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
} else {
  console.error("No config found for this page:", currentPage);
}

function generateWeeklyChart(loggedInUser, users, originalQuestions, pageConfig) {
  if (!document.getElementById("dateWiseSubmissionsChart")) return;

  const { last7Days, userDailyCounts, communityDailyCounts } =
    getDailyUserAndCommunityStats(loggedInUser, users, originalQuestions, pageConfig);

  const labels = last7Days.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });

  const userData = last7Days.map(d => userDailyCounts[d]);
  const communityData = last7Days.map(d => communityDailyCounts[d]);

  const ctx = document.getElementById("dateWiseSubmissionsChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Your Submissions",
          data: userData,
          borderColor: "#4e73df",
          backgroundColor: "rgba(78, 115, 223, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 5
        },
        {
          label: "Community Avg (per user)",
          data: communityData,
          borderColor: "#858796",
          backgroundColor: "rgba(133, 135, 150, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || "";
              return `${label}: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Problems Solved"
          }
        }
      }
    }
  });
}

function getLast7Days() {
  const today = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    result.push(iso);
  }
  return result;
}

function getDailyUserAndCommunityStats(loggedInUser, users, originalQuestions, pageConfig) {
  const last7Days = getLast7Days();
  const relevantQuestionIds = originalQuestions
    .filter(q => q.topic === pageConfig.topic && q.level === pageConfig.level)
    .map(q => q.id);

  const userDailyCounts = {};
  const communityDailyAverages = {};

  last7Days.forEach(date => {
    userDailyCounts[date] = 0;
    communityDailyAverages[date] = [];
  });

  (loggedInUser.QuestionsCompleted || []).forEach(([qid, timestamp]) => {
    const [dd, mm, yyyy] = timestamp.split(" ")[0].split("-");
    const iso = `${yyyy}-${mm}-${dd}`;
    if (last7Days.includes(iso) && relevantQuestionIds.includes(parseInt(qid))) {
      userDailyCounts[iso]++;
    }
  });

  users.forEach(user => {
    if (user.id === loggedInUser.id) return;

    const dailyTempCounts = {};
    last7Days.forEach(d => dailyTempCounts[d] = 0);

    (user.QuestionsCompleted || []).forEach(([qid, timestamp]) => {
      const [dd, mm, yyyy] = timestamp.split(" ")[0].split("-");
      const iso = `${yyyy}-${mm}-${dd}`;
      if (last7Days.includes(iso) && relevantQuestionIds.includes(parseInt(qid))) {
        dailyTempCounts[iso]++;
      }
    });

    last7Days.forEach(date => {
      communityDailyAverages[date].push(dailyTempCounts[date]);
    });
  });

  const finalCommunityAverage = {};
  last7Days.forEach(date => {
    const arr = communityDailyAverages[date];
    const sum = arr.reduce((a, b) => a + b, 0);
    finalCommunityAverage[date] = arr.length > 0 ? +(sum / arr.length).toFixed(2) : 0;
  });

  return { last7Days, userDailyCounts, communityDailyCounts: finalCommunityAverage };
}

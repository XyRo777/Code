document.addEventListener("DOMContentLoaded", function () {
  const currentPage = window.location.pathname.split("/").pop();
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
  const pageConfig = pageTopicMap.find(p => p.page === currentPage);

  fetch("question.json")
    .then(res => res.json())
    .then(data => {
      let originalQuestions = [];
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

      const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
      if (!loggedInUser) return;

      const isNewUser = !(
        loggedInUser.QuestionsCompleted ||
        loggedInUser.QuestionsAttempted ||
        loggedInUser.QuestionsUnAttempted
      );

      if (isNewUser) {
        loggedInUser.QuestionsCompleted = [];
        loggedInUser.QuestionsAttempted = [];
        loggedInUser.QuestionsUnAttempted = originalQuestions.map(q => q.id);
        localStorage.setItem("loggedInUser", JSON.stringify(loggedInUser));
      }

      originalQuestions.forEach(q => {
        if (loggedInUser.QuestionsCompleted?.some(item => parseInt(item[0]) === q.id)) {
          q.status = "Completed";
        } else if (loggedInUser.QuestionsAttempted?.some(item => parseInt(item[0]) === q.id)) {
          q.status = "Attempted";
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

      // Store topic-wise counts in localStorage
      localStorage.setItem("completed_array_count", topicCounts["Arrays"]);
      localStorage.setItem("completed_string_count", topicCounts["Strings"]);
      localStorage.setItem("completed_linkedlist_count", topicCounts["Linked List"]);
      localStorage.setItem("completed_trees_count", topicCounts["Trees"]);
      localStorage.setItem("completed_graphs_count", topicCounts["Graphs"]);
      localStorage.setItem("completed_dp_count", topicCounts["Dynamic Programming"]);

      renderTopicChart(); // Render the bar chart
    })
    .catch(err => console.error("Error loading questions:", err));
});

function renderTopicChart() {
  const chartCanvas = document.getElementById('topicWiseQuestionsSolvedChart');
  if (!chartCanvas) return;

  const topicLabels = ['Arrays', 'Strings', 'Linked List', 'Trees', 'Graphs', 'Dynamic Programming'];
  const topicKeyMap = {
    'Arrays': 'completed_array_count',
    'Strings': 'completed_string_count',
    'Linked List': 'completed_linkedlist_count',
    'Trees': 'completed_trees_count',
    'Graphs': 'completed_graphs_count',
    'Dynamic Programming': 'completed_dp_count'
  };

  const topicSolvedData = topicLabels.map(label => {
    return parseInt(localStorage.getItem(topicKeyMap[label]) || '0');
  });

  const backgroundColors = [
    '#4e73df', '#1cc88a', '#36b9cc',
    '#f6c23e', '#e74a3b', '#858796'
  ];

  new Chart(chartCanvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: topicLabels,
      datasets: [{
        label: 'Problems Solved',
        data: topicSolvedData,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.parsed.x + ' problems';
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: 'Number of Problems Solved' }
        },
        y: {
          title: { display: true, text: 'Topics' }
        }
      }
    }
  });
}

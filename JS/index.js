document.addEventListener("DOMContentLoaded", function () {
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (!loggedInUser || !loggedInUser.id) {
    console.warn("User not logged in.");
    return;
  }

   fetch("json/question.json")
    .then(res => res.json())
    .then(data => {
      const allQuestions = [];

      // Flatten all questions with topic and level info
      data.topics.forEach(topic => {
        topic.difficultyLevels.forEach(level => {
          level.questions.forEach(q => {
            allQuestions.push({
              ...q,
              topic: topic.name,
              level: level.level
            });
          });
        });
      });

      // Initialize question statuses if user is new
      const isNewUser = !(
        loggedInUser.QuestionsCompleted ||
        loggedInUser.QuestionsAttempted ||
        loggedInUser.QuestionsUnAttempted
      );

      if (isNewUser) {
        loggedInUser.QuestionsCompleted = [];
        loggedInUser.QuestionsAttempted = [];
        loggedInUser.QuestionsUnAttempted = allQuestions.map(q => q.id);
        localStorage.setItem("loggedInUser", JSON.stringify(loggedInUser));
      }

      // Apply statuses to questions
      allQuestions.forEach(q => {
        if (loggedInUser.QuestionsCompleted?.some(item => parseInt(item[0]) === q.id)) {
          q.status = "Completed";
        } else if (loggedInUser.QuestionsAttempted?.some(item => parseInt(item[0]) === q.id)) {
          q.status = "Attempted";
        } else {
          q.status = "Unattempted";
        }
      });

      // ==========================
      // 1. Topic-Wise Bar Chart
      // ==========================
      const topicCounts = {
        Arrays: 0,
        Strings: 0,
        "Linked List": 0,
        Trees: 0,
        Graphs: 0,
        "Dynamic Programming": 0
      };

      allQuestions.forEach(q => {
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

      renderTopicChart();

      // ==========================
      // 2. Recently Solved (Last 6)
      // ==========================
      const completedMap = loggedInUser.QuestionsCompleted.map(entry => ({
        id: parseInt(entry[0]),
        timestamp: entry[1]
      }));

      const completedQuestions = completedMap.map(item => {
        const question = allQuestions.find(q => q.id === item.id);
        return question ? { ...question, completedAt: item.timestamp } : null;
      }).filter(Boolean);

      completedQuestions.sort((a, b) => parseTimestamp(b.completedAt) - parseTimestamp(a.completedAt));
      const latestSix = completedQuestions.slice(0, 6);

      const tableBody = document.querySelector(".table.table-flush tbody");
      if (tableBody) {
        tableBody.innerHTML = "";
        latestSix.forEach(q => {
          const companyHTML = (q.companies || []).map(company => `
            <div class="avatar avatar-xs">
              <img class="avatar-img" src="${company}" alt="company">
            </div>
          `).join('');

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>
              <div class="d-flex align-items-center">
                <div class="ms-4">
                  <div>${q.title}</div>
                  <div class="fs-sm text-body-secondary">Updated on ${formatDate(q.completedAt)}</div>
                </div>
              </div>
            </td>


            <td>
              <div class="avatar-group">${companyHTML}</div>
            </td>
          `;
          tableBody.appendChild(row);
        });
      }

      // ==========================
      // 3. Weekly Progress Chart
      // ==========================
      const today = new Date();
      const last14Days = getLastNDaysFrom(today, 14);
      const lastWeekDates = last14Days.slice(0, 7);
      const thisWeekDates = last14Days.slice(7);

      const dateCounts = {};
      last14Days.forEach(date => dateCounts[date] = 0);

      loggedInUser.QuestionsCompleted.forEach(([qid, timestamp]) => {
        const datePart = timestamp.split(' ')[0]; // dd-mm-yyyy
        const [dd, mm, yyyy] = datePart.split('-');
        const isoDate = `${yyyy}-${mm}-${dd}`;
        if (dateCounts.hasOwnProperty(isoDate)) {
          dateCounts[isoDate]++;
        }
      });

      const thisWeekData = thisWeekDates.map(date => ({
        day: getDayShort(date),
        solved: dateCounts[date] || 0
      }));

      const lastWeekData = lastWeekDates.map(date => ({
        day: getDayShort(date),
        solved: dateCounts[date] || 0
      }));

      const labels = thisWeekData.map(item => item.day);
      const thisWeekCounts = thisWeekData.map(item => item.solved);
      const lastWeekCounts = lastWeekData.map(item => item.solved);

      const options = {
        series: [
          { name: 'This Week', data: thisWeekCounts },
          { name: 'Last Week', data: lastWeekCounts }
        ],
        chart: {
          type: 'bar',
          height: 350,
          background: 'transparent',
          foreColor: '#CCC',
          toolbar: { show: false }
        },
        colors: ['#007bff', '#555'],
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '40%',
            borderRadius: 4
          }
        },
        dataLabels: { enabled: true },
        xaxis: {
          categories: labels,
          axisBorder: { show: true },
          axisTicks: { show: false }
        },
        yaxis: {
          min: 0,
          tickAmount: 4,
          title: { text: 'Problems Solved' }
        },
        legend: {
          position: 'top',
          markers: { width: 12, height: 12, radius: 12 }
        },
        tooltip: {
          y: {
            formatter: val => `${val} problems`
          }
        }
      };

      const chartDiv = document.querySelector("#chart4");
      if (chartDiv) {
        chartDiv.innerHTML = "";
        const chart = new ApexCharts(chartDiv, options);
chart.render();

// === Weekly Growth Calculation ===
const totalThisWeek = thisWeekCounts.reduce((sum, val) => sum + val, 0);
const totalLastWeek = lastWeekCounts.reduce((sum, val) => sum + val, 0);

let growthPercentage = 0;

if (totalLastWeek > 0) {
  growthPercentage = ((totalThisWeek - totalLastWeek) / totalLastWeek) * 100;
} else if (totalThisWeek > 0) {
  growthPercentage = 100;
} else {
  growthPercentage = 0;
}

growthPercentage = growthPercentage.toFixed(1);

const growthElement = document.getElementById("weekly-growth");
if (growthElement) {
  const isPositive = parseFloat(growthPercentage) >= 0;
  const arrow = isPositive ? "🔺" : "🔻";
  growthElement.innerHTML = `${arrow} ${growthPercentage}%`;
  growthElement.style.color = isPositive ? "green" : "red";
}
      }

    })
    .catch(err => console.error("Error loading questions:", err));
});

// ========== Helpers ==========

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

function parseTimestamp(ts) {
  const [datePart, timePart] = ts.split(" ");
  const [day, month, year] = datePart.split("-");
  const [hour, minute, second] = timePart.split(":");
  return new Date(year, month - 1, day, hour, minute, second);
}

function formatDate(ts) {
  const dateParts = ts.split(" ")[0].split("-");
  const formattedDate = new Date(`${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`);
  return formattedDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getLastNDaysFrom(referenceDate, n) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

function getDayShort(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

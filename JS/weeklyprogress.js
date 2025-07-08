document.addEventListener("DOMContentLoaded", updateWeeklyProgressAndChart);

function updateWeeklyProgressAndChart() {
  const topicLabels = ['Arrays', 'Strings', 'Linked List', 'Trees', 'Graphs', 'Dynamic Programming'];
  const topicKeys = ['array', 'string', 'linkedlist', 'trees', 'graphs', 'dp'];

  let globalTotalCompleted = 0;
  let globalTotalQuestions = 0;

  topicKeys.forEach((key, index) => {
    const completed = parseInt(localStorage.getItem(`completed_${key}_count`)) || 0;
    const total = parseInt(localStorage.getItem(`total_${key}_count`)) || 0;

    globalTotalCompleted += completed;
    globalTotalQuestions += total;

    const topicElement = document.getElementById(`${key}TotalProgress`);
    if (topicElement) {
      topicElement.textContent = `${topicLabels[index]} Total: ${completed} / ${total}`;
    }
  });

  console.log(`✅ Total Overall Progress: ${globalTotalCompleted} / ${globalTotalQuestions}`);

  renderTopicWiseChart();
}

function getAllQuestionStats(keys) {
  const stats = {};

  keys.forEach(key => {
    const stored = JSON.parse(localStorage.getItem(key)) || [];
    const completed = stored.filter(q => q.status === 'Completed').length;

    stats[key] = {
      total: stored.length,
      completed: completed
    };

    // Store in localStorage
    localStorage.setItem(`completed_${key}_count`, completed.toString());
    localStorage.setItem(`total_${key}_count`, stored.length.toString());
  });

  return stats;
}

function updateStatDisplay(key, elementId, stats) {
  const el = document.getElementById(elementId);
  if (el && stats[key]) {
    el.textContent = `${key.replace(/_/g, ' ')}: ${stats[key].completed} / ${stats[key].total}`;
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderTopicWiseChart() {
  const ctx = document.getElementById('topicWiseQuestionsSolvedChart');
  if (!ctx) return;

  const questionsSolvedCtx = ctx.getContext('2d');

  if (window.topicChartInstance) {
    window.topicChartInstance.destroy();
  }

  const topicData = [
    parseInt(localStorage.getItem('completed_array_count')) || 0,
    parseInt(localStorage.getItem('completed_string_count')) || 0,
    parseInt(localStorage.getItem('completed_linkedlist_count')) || 0,
    parseInt(localStorage.getItem('completed_trees_count')) || 0,
    parseInt(localStorage.getItem('completed_graphs_count')) || 0,
    parseInt(localStorage.getItem('completed_dp_count')) || 0
  ];

  window.topicChartInstance = new Chart(questionsSolvedCtx, {
    type: 'bar',
    data: {
      labels: ['Arrays', 'Strings', 'Linked List', 'Trees', 'Graphs', 'Dynamic Programming'],
      datasets: [{
        label: 'Problems Solved',
        data: topicData,
        backgroundColor: [
          '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e',
          '#e74a3b', '#858796'
        ],
        borderColor: [
          '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e',
          '#e74a3b', '#858796'
        ],
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
          max: 20,
          title: {
            display: true,
            text: 'Number of Problems Solved'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Topics'
          }
        }
      }
    }
  });
}


// Expose for global usage after status change
window.updateWeeklyProgressAndChart = updateWeeklyProgressAndChart;

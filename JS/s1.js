// ==================== USER INFO LOAD ====================
// Global reference for console access

// ==================== USER INFO LOAD ====================
document.addEventListener("DOMContentLoaded", function () {
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  window.users = JSON.parse(localStorage.getItem('users')) || [];
  window.loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')) || [];

  if (loggedInUser) {
    const userNameSpan = document.getElementById('userDropdownName');
    const userImage = document.getElementById('userDropdownImage');

    if (userNameSpan) userNameSpan.textContent = loggedInUser.fullname;
    if (userImage && loggedInUser.image) userImage.src = loggedInUser.image;

    // ==================== DAILY TRACKING LOGIC ====================
    const today = new Date().toISOString().split('T')[0];
    const completed = loggedInUser.QuestionsCompleted || [];
    const attempted = loggedInUser.QuestionsAttempted || [];

    let dailyCompletedCount = 0;
    let dailyAttemptedCount = 0;

    completed.forEach(([qid, timestamp]) => {
      const [dateStr] = timestamp.split(" ");
      const [dd, mm, yyyy] = dateStr.split("-");
      const isoDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      if (isoDate === today) {
        dailyCompletedCount++;
      }
    });

    attempted.forEach(([qid, timestamp]) => {
      const [dateStr] = timestamp.split(" ");
      const [dd, mm, yyyy] = dateStr.split("-");
      const isoDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      if (isoDate === today) {
        dailyAttemptedCount++;
      }
    });

     fetch("json/question.json")
      .then(response => response.json())
      .then(data => {
        let totalQuestions = 0;
        data.topics.forEach(topic => {
          topic.difficultyLevels.forEach(level => {
            totalQuestions += level.questions.length;
          });
        });

        const denominator = dailyCompletedCount + dailyAttemptedCount;
        const accuracy = denominator > 0
          ? ((dailyCompletedCount / denominator) * 100).toFixed(2)
          : "0.00";

        const statsKey = `user_stats_${loggedInUser.id}`;
        let allStats = JSON.parse(localStorage.getItem(statsKey)) || {};

        // Ensure past 7 days exist with default 0 values
        const last7Dates = getLastNDays(7);
        last7Dates.forEach(date => {
          if (!allStats[date]) {
            allStats[date] = {
              solved: 0,
              total: totalQuestions,
              accuracy: "0.00"
            };
          }
        });

        allStats[today].solved = dailyCompletedCount;
        allStats[today].total = totalQuestions;
        allStats[today].accuracy = accuracy;

        localStorage.setItem(statsKey, JSON.stringify(allStats));

        console.log(`📋 ${today} | User: ${loggedInUser.username} | Solved: ${dailyCompletedCount} | Attempted: ${dailyAttemptedCount} | Accuracy: ${accuracy}%`);

        renderWeeklyPerformanceChart();
      });
    // ==================== END TRACKING ====================
  } else {
    console.warn("No logged in user found in localStorage.");
  }

  // LOGOUT HANDLER
  const signOutBtn = document.getElementById('signOutButton');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('loggedInUser');
      sessionStorage.clear();
      window.location.href = '/index.html';
    });
  }
});

// ==================== HELPER FUNCTION ====================
function getLastNDays(n) {
  const result = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}


function renderWeeklyPerformanceChart() {
  const loggedInUser = window.loggedInUser;
  if (!loggedInUser || !loggedInUser.id) return;

  const statsKey = `user_stats_${loggedInUser.id}`;
  const allStats = JSON.parse(localStorage.getItem(statsKey)) || {};
  const last7Dates = getLastNDays(7);
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const problemsSolved = [];
  const accuracyPercentages = [];
  const xLabels = [];

  last7Dates.forEach(date => {
    const stat = allStats[date] || { solved: 0, accuracy: "0.00" };
    problemsSolved.push(stat.solved || 0);
    accuracyPercentages.push(parseFloat(stat.accuracy) || 0);

    const day = new Date(date).getDay();
    xLabels.push(weekdayNames[day]);
  });

  const options = {
    series: [
      { name: 'Problems Solved', type: 'column', data: problemsSolved },
      { name: 'Accuracy (%)', type: 'line', data: accuracyPercentages }
    ],
    chart: {
      height: 350,
      type: 'line',
      background: 'transparent',
      foreColor: '#CCCCCC',
      toolbar: { show: false }
    },
    colors: ['#3B82F6', '#10B981'],
    stroke: { width: [0, 3], curve: 'smooth' },
    plotOptions: {
      bar: { columnWidth: '60%', borderRadius: 4 }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return this.seriesIndex === 1 ? val + '%' : val;
      },
      style: { colors: ['#FFF', '#10B981'] }
    },
    xaxis: {
      categories: xLabels,
      axisBorder: { show: true },
      axisTicks: { show: false }
    },
    yaxis: [
      {
        seriesName: 'Problems Solved',
        min: 0,
        max: 50,
        tickAmount: 2,
        title: { text: 'Problems Solved' },
        labels: { formatter: (val) => Math.round(val) }
      },
      {
        seriesName: 'Accuracy (%)',
        opposite: true,
        min: 0,
        max: 100,
        tickAmount: 5,
        title: { text: 'Accuracy (%)' },
        labels: { formatter: (val) => Math.round(val) + '%' }
      }
    ],
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (val, { seriesIndex }) {
          return seriesIndex === 1 ? val + '%' : val;
        }
      }
    },
    grid: { show: false },
    legend: {
      position: 'top',
      markers: { radius: 12, width: 12, height: 12 }
    }
  };

  const chartEl = document.querySelector("#chart1");
  if (chartEl) {
    chartEl.innerHTML = "";
    const chart = new ApexCharts(chartEl, options);
    chart.render();
  }
}

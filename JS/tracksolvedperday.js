// TRACKING + CHARTING FUNCTION
fetch('question.json')
  .then(response => response.json())
  .then(data => {
    let totalQuestions = 0;
    let totalCompletedAllTime = 0;  // Count of all questions marked completed regardless of date

    data.topics.forEach(topic => {
      topic.difficultyLevels.forEach(level => {
        totalQuestions += level.questions.length;
      });
    });

    const questionKeys = [
      'array_easy_questions', 'array_medium_questions', 'array_hard_questions',
      'string_easy_questions', 'string_medium_questions', 'string_hard_questions',
      'linkedlist_easy_questions', 'linkedlist_medium_questions', 'linkedlist_hard_questions',
      'trees_easy_questions', 'trees_medium_questions', 'trees_hard_questions',
      'graphs_easy_questions', 'graphs_medium_questions', 'graphs_hard_questions',
      'dp_easy_questions', 'dp_medium_questions', 'dp_hard_questions'
    ];

    const today = new Date().toISOString().split('T')[0];
    let dailyCompletedCount = 0;

    questionKeys.forEach(key => {
      let stored = JSON.parse(localStorage.getItem(key)) || [];

      stored.forEach(q => {
        if (q.status === 'Completed') {
          // Set completedOn today if missing
          if (!q.completedOn) {
            q.completedOn = today;
          }

          totalCompletedAllTime++; // Count every completed question, all time

          if (q.completedOn === today) {
            dailyCompletedCount++;
          }
        } else {
          // Clear completedOn if not completed now
          if (q.completedOn) {
            q.completedOn = null;
          }
        }
      });

      localStorage.setItem(key, JSON.stringify(stored));
    });

    // Save daily stats
    localStorage.setItem(`daily_solved_${today}`, dailyCompletedCount.toString());
    localStorage.setItem(`daily_total_${today}`, totalQuestions.toString());

    // Calculate accuracy using total completed all time, divided by total questions dynamically
    const accuracy = totalQuestions > 0 ? ((totalCompletedAllTime / totalQuestions) * 100).toFixed(2) : "0.00";
    localStorage.setItem(`daily_accuracy_${today}`, accuracy);

    console.log(`🗓️ ${today}: Daily Solved = ${dailyCompletedCount}, Total = ${totalQuestions}, Accuracy = ${accuracy}%`);

    renderWeeklyPerformanceChart();
  });

// RENDER CHART FUNCTION
function renderWeeklyPerformanceChart() {
  const getLastNDays = (n) => {
    const result = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      result.push(d.toISOString().split('T')[0]);
    }
    return result;
  };

  const last7Dates = getLastNDays(7);
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const problemsSolved = [];
  const accuracyPercentages = [];
  const xLabels = [];

  last7Dates.forEach(date => {
    const solved = parseInt(localStorage.getItem(`daily_solved_${date}`)) || 0;
    const accuracy = parseFloat(localStorage.getItem(`daily_accuracy_${date}`)) || 0;

    problemsSolved.push(solved);
    accuracyPercentages.push(accuracy);

    const day = new Date(date).getDay();
    xLabels.push(weekdayNames[day]);
  });

  const options = {
    series: [
      {
        name: 'Problems Solved',
        type: 'column',
        data: problemsSolved
      },
      {
        name: 'Accuracy (%)',
        type: 'line',
        data: accuracyPercentages
      }
    ],
    chart: {
      height: 350,
      type: 'line',
      background: 'transparent',
      foreColor: '#CCCCCC',
      toolbar: { show: false }
    },
    colors: ['#3B82F6', '#10B981'],
    stroke: {
      width: [0, 3],
      curve: 'smooth'
    },
    plotOptions: {
      bar: {
        columnWidth: '60%',
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return this.seriesIndex === 1 ? val + '%' : val;
      },
      style: {
        colors: ['#FFF', '#10B981']
      }
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
        tickAmount: 2,  // 0, 15, 30 (2 intervals create 3 ticks)
        title: {
          text: 'Problems Solved'
        },
        labels: {
          formatter: (val) => Math.round(val)
        }
      },
      {
        seriesName: 'Accuracy (%)',
        opposite: true,
        min: 0,
        max: 100,
        tickAmount: 5,
        title: {
          text: 'Accuracy (%)'
        },
        labels: {
          formatter: (val) => Math.round(val) + '%'
        }
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
    grid: {
      show: false
    },
    legend: {
      position: 'top',
      markers: {
        radius: 12,
        width: 12,
        height: 12
      }
    }
  };

  const chartEl = document.querySelector("#chart1");
  if (chartEl) {
    chartEl.innerHTML = ""; // Clear previous chart if rerendering
    const chart = new ApexCharts(chartEl, options);
    chart.render();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (!loggedInUser || !loggedInUser.id) {
    console.warn("User not logged in.");
    return;
  }

  // === Step 1: Get Last 14 Dates (as YYYY-MM-DD) ===
  const today = new Date();
  const last14Days = getLastNDaysFrom(today, 14);
  const lastWeekDates = last14Days.slice(0, 7);  // 8 to 14 days ago
  const thisWeekDates = last14Days.slice(7);     // 0 to 6 days ago

  // === Step 2: Count Completed Questions Per Day ===
  const completed = loggedInUser.QuestionsCompleted || [];

  const dateCounts = {}; // { 'yyyy-mm-dd': count }
  last14Days.forEach(date => dateCounts[date] = 0);

  completed.forEach(([qid, timestamp]) => {
    const datePart = timestamp.split(' ')[0]; // format: dd-mm-yyyy
    const [dd, mm, yyyy] = datePart.split('-');
    const isoDate = `${yyyy}-${mm}-${dd}`;
    if (dateCounts.hasOwnProperty(isoDate)) {
      dateCounts[isoDate]++;
    }
  });

  // === Step 3: Prepare Weekly Arrays ===
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

  // === Step 4: Chart Configuration ===
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
  }
});

// ✅ Helper: return last N dates (ISO format yyyy-mm-dd)
function getLastNDaysFrom(referenceDate, n) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

// ✅ Helper: convert ISO date to weekday name
function getDayShort(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue"
}

document.addEventListener("DOMContentLoaded", () => {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser || !loggedInUser.QuestionsCompleted) return;

  fetch("question.json")
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

      // Create completed list with timestamps
      const completedMap = loggedInUser.QuestionsCompleted.map(entry => ({
        id: parseInt(entry[0]),
        timestamp: entry[1]
      }));

      // Attach question info and sort
      const completedQuestions = completedMap.map(item => {
        const question = allQuestions.find(q => q.id === item.id);
        return question ? { ...question, completedAt: item.timestamp } : null;
      }).filter(Boolean);

      // ✅ Sort: latest first
      completedQuestions.sort((a, b) => parseTimestamp(b.completedAt) - parseTimestamp(a.completedAt));


      const latestSix = completedQuestions.slice(0, 6); // Display only top 6

      const tableBody = document.querySelector(".table.table-flush tbody");
      if (!tableBody) return;

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
            <div class="avatar-group">
              <div class="avatar avatar-xs">
                <img class="avatar-img" src="${q.languageIcon}" alt="language">
              </div>
            </div>
          </td>
          <td>
            <div class="avatar-group">${companyHTML}</div>
          </td>
        `;
        tableBody.appendChild(row);
      });
    })
    .catch(err => console.error("Failed to render recent solved problems:", err));
});
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

const fs = require('fs');
const fetch = require('node-fetch');

const USERNAME = 'jaydeep-pro';
const README_PATH = './README.md';

// IST is UTC+5:30, so 9:00 AM IST = 3:30 AM UTC
const START_DATE = new Date(Date.UTC(2024, 0, 10, 3, 30, 0));

async function fetchGitHubStats() {
  const headers = { 'User-Agent': 'node.js' };

  const reposResponse = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100`, { headers });
  const repos = await reposResponse.json();
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);

  const eventsResponse = await fetch(`https://api.github.com/users/${USERNAME}/events`, { headers });
  const events = await eventsResponse.json();
  const contributions = events.filter(e => e.type === 'PushEvent').length * 10;

  const languages = {};
  for (const repo of repos) {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
  }
  const topLanguage = Object.keys(languages).sort((a, b) => languages[b] - languages[a])[0] || 'N/A';

  return { totalStars, contributions, topLanguage };
}

function getExperience(startDate) {
  const now = new Date();

  let years = now.getFullYear() - startDate.getFullYear();
  let months = now.getMonth() - startDate.getMonth();
  let days = now.getDate() - startDate.getDate();
  let hours = now.getHours() - startDate.getHours();
  let minutes = now.getMinutes() - startDate.getMinutes();

  if (minutes < 0) {
    minutes += 60;
    hours--;
  }
  if (hours < 0) {
    hours += 24;
    days--;
  }
  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if (months < 0) {
    months += 12;
    years--;
  }

  return { years, months, days, hours, minutes };
}

async function updateReadme() {
  const { totalStars, contributions, topLanguage } = await fetchGitHubStats();

  const experience = getExperience(START_DATE);
  let readme = fs.readFileSync(README_PATH, 'utf8');

  readme = readme.replace(
    /(<!--START_STATS-->)([\s\S]*?)(<!--END_STATS-->)/,
    `<!--START_STATS-->
- 🎯 **2025 Contributions**: ${contributions} (auto-updated)
- 🌟 **Stars Earned**: ${totalStars}
- 💻 **Top Language**: ${topLanguage}
<!--END_STATS-->`
  );

  readme = readme.replace(
    /(<!--START_EXPERIENCE-->)([\s\S]*?)(<!--END_EXPERIENCE-->)/,
    `<!--START_EXPERIENCE-->
# **Total Experience:** ${experience.years} years, ${experience.months} months, ${experience.days} days, ${experience.hours} hours, ${experience.minutes} minutes
<!--END_EXPERIENCE-->`
  );

  fs.writeFileSync(README_PATH, readme);

  console.log('README updated with latest stats and experience!');
}

updateReadme();

const fs = require('fs');
const fetch = require('node-fetch');

const USERNAME = 'jaydeep-pro';
const README_PATH = './README.md';

// IST is UTC+5:30, so 9:00 AM IST = 3:30 AM UTC
const START_DATE = new Date(Date.UTC(2024, 0, 10, 3, 30, 0));

/**
 * Fetch GitHub statistics (stars, contributions, top language)
 */
async function fetchGitHubStats() {
  const headers = { 'User-Agent': 'node.js' };
  let totalStars = 0;
  let contributions = 0;
  let topLanguage = 'N/A';

  try {
    const reposResponse = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100`, { headers });
    const repos = await reposResponse.json();

    if (Array.isArray(repos)) {
      totalStars = repos.reduce((acc, repo) => acc + (repo?.stargazers_count || 0), 0);

      const languages = {};
      for (const repo of repos) {
        if (repo?.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
      }
      topLanguage = Object.keys(languages).sort((a, b) => languages[b] - languages[a])[0] || 'N/A';
    } else {
      console.error('Error fetching repos:', repos?.message || repos);
    }
  } catch (err) {
    console.error('Failed to fetch repos:', err.message);
  }

  try {
    const eventsResponse = await fetch(`https://api.github.com/users/${USERNAME}/events`, { headers });
    const events = await eventsResponse.json();
    if (Array.isArray(events)) {
      contributions = events.filter(e => e?.type === 'PushEvent').length * 10;
    } else {
      console.error('Error fetching events:', events?.message || events);
    }
  } catch (err) {
    console.error('Failed to fetch events:', err.message);
  }

  return { totalStars, contributions, topLanguage };
}

/**
 * Calculate experience from start date to now
 */
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

/**
 * Update README.md with latest stats and experience
 */
async function updateReadme() {
  let stats = { totalStars: 0, contributions: 0, topLanguage: 'N/A' };

  try {
    stats = await fetchGitHubStats();
  } catch (err) {
    console.error('Error fetching GitHub stats:', err.message);
  }

  const experience = getExperience(START_DATE);
  let readme = '';

  try {
    readme = fs.readFileSync(README_PATH, 'utf8');
  } catch (err) {
    console.error('Failed to read README.md:', err.message);
    return;
  }

  readme = readme
    .replace(
      /(<!--START_STATS-->)([\s\S]*?)(<!--END_STATS-->)/,
      `<!--START_STATS-->
- 🎯 **2025 Contributions**: ${stats.contributions}
- 🌟 **Stars Earned**: ${stats.totalStars}
- 💻 **Top Language**: ${stats.topLanguage}
<!--END_STATS-->`
    )
    .replace(
      /(<!--START_EXPERIENCE-->)([\s\S]*?)(<!--END_EXPERIENCE-->)/,
      `<!--START_EXPERIENCE-->
# **Total Experience:** ${experience.years} years, ${experience.months} months, ${experience.days} days, ${experience.hours} hours, ${experience.minutes} minutes
<!--END_EXPERIENCE-->`
    );

  try {
    fs.writeFileSync(README_PATH, readme);
    console.log('README updated with latest stats and experience!');
  } catch (err) {
    console.error('Failed to write README.md:', err.message);
  }
}

updateReadme();


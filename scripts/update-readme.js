const fs = require('fs');
const fetch = require('node-fetch');

const USERNAME = 'jaydeep-pro';
const README_PATH = './README.md';

async function fetchGitHubStats() {
  const headers = { 'User-Agent': 'node.js' };

  // Fetch repositories
  const reposResponse = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100`, { headers });
  const repos = await reposResponse.json();
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);

  // Estimate contributions from events
  const eventsResponse = await fetch(`https://api.github.com/users/${USERNAME}/events`, { headers });
  const events = await eventsResponse.json();
  const contributions = events.filter(e => e.type === 'PushEvent').length * 10;

  // Determine top language
  const languages = {};
  for (const repo of repos) {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
  }
  const topLanguage = Object.keys(languages).sort((a, b) => languages[b] - languages[a])[0] || 'N/A';

  return { totalStars, contributions, topLanguage };
}

async function updateReadme() {
  const { totalStars, contributions, topLanguage } = await fetchGitHubStats();
  let readme = fs.readFileSync(README_PATH, 'utf8');

  readme = readme.replace(
    /(<!--START_STATS-->)([\s\S]*?)(<!--END_STATS-->)/,
    `<!--START_STATS-->
- 🎯 **2025 Contributions**: ${contributions} (auto-updated)
- 🌟 **Stars Earned**: ${totalStars}
- 💻 **Top Language**: ${topLanguage}
<!--END_STATS-->`
  );

  fs.writeFileSync(README_PATH, readme);
  console.log('README updated with latest stats!');
}

updateReadme();

import fxparser from "fast-xml-parser";

const QUESTIONS_KEY = "questions";
const FEED_URL = `https://stackoverflow.com/feeds/tag/${TAG}`;
const parser = new fxparser.XMLParser();

addEventListener("scheduled", event => {
  event.waitUntil(handleScheduled());
});

async function handleScheduled() {
  // Fetch StackOverflow feed
  const feed = await (await fetch(FEED_URL)).text();
  // Parse feed and keep most recent questions
  const entries = parser
    .parse(feed)
    .feed.entry.map(({ id }) => id)
    .slice(0, 5);
  const questions = await STACKOVERFLOW.get(QUESTIONS_KEY);
  // But only questions we haven't seen yet
  const seen = new Set(questions ? JSON.parse(questions) : []);
  const newQuestions = entries.filter(entry => !seen.has(entry));

  // Post to discord
  await Promise.all(newQuestions.map(q => postToDiscord(q)));

  // Save last questions to KV store
  await STACKOVERFLOW.put(QUESTIONS_KEY, JSON.stringify(entries));

  return new Response(JSON.stringify({ newQuestions }), {
    headers: { "content-type": "text/plain" }
  });
}

function postToDiscord(content) {
  const baseURL = `https://discordapp.com/api/channels/${CHANNEL}/messages`;
  const headers = {
    Authorization: `Bot ${TOKEN}`,
    "User-Agent": "SolidStack",
    "Content-Type": "application/json"
  };
  return fetch(baseURL, {
    method: "POST",
    headers,
    body: JSON.stringify({ content })
  });
}

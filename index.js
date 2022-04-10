import fxparser from "fast-xml-parser";

const QUESTIONS_KEY = "questions";
const FEED_URL = `https://stackoverflow.com/feeds/tag/${process.env.TAG}`;
const parser = new fxparser.XMLParser();

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  // Fetch StackOverflow feed
  const feed = await (await fetch(FEED_URL)).text();
  // Parse feed and keep most recent questions
  const entries = parser
    .parse(feed)
    .feed.entry.map(({ id }) => id)
    .slice(0, 20);
  const questions = await STACKOVERFLOW.get(QUESTIONS_KEY);
  // But only questions we haven't seen yet
  const seen = new Set(questions ? JSON.parse(questions) : []);
  const newQuestions = entries.filter(entry => !seen.has(entry));

  // Save last questions to KV store
  await STACKOVERFLOW.put(QUESTIONS_KEY, JSON.stringify(entries));

  return new Response(
    JSON.stringify({
      entries,
      questions,
      newQuestions
    }),
    {
      headers: { "content-type": "text/plain" }
    }
  );
}

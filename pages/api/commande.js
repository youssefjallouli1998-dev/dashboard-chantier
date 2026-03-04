export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { cmd, chantiers } = req.body;

  const ctx = chantiers.map(c => `- ${c.nom}: ${c.ds}`).join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: `Bases Notion:\n${ctx}\n\nCommande: "${cmd}"\nExécute et confirme en une phrase.` }],
      mcp_servers: [{
        type: "url",
        url: "https://mcp.notion.com/mcp",
        name: "notion",
        authorization_token: process.env.NOTION_TOKEN
      }],
    }),
  });

  const data = await response.json();
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
  res.json({ result: text.slice(0, 300) });
}

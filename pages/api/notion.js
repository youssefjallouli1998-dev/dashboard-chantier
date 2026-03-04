export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { ds } = req.body;

  const prompt = `Via MCP Notion, récupère TOUTES les pages de la base ${ds}.
Pour chaque page retourne: titre ("Travaux à faire "), état ("État"), chiffrage ("Chiffrage "), entreprise ("Entreprises"), date début.
Réponds UNIQUEMENT en JSON valide, rien d'autre:
{"taches":[{"nom":"...","etat":"Pas commencé|En cours|Terminé","chiff":"...","ent":"...","date":"YYYY-MM-DD"}]}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
      mcp_servers: [{ type: "url", url: "https://mcp.notion.com/mcp", name: "notion" }],
    }),
  });

  const data = await response.json();
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "{}";
  try {
    const clean = text.replace(/```json\n?|```/g, "").trim();
    res.json(JSON.parse(clean));
  } catch {
    res.json({ taches: [] });
  }
}

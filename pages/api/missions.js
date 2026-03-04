export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { ctx, date } = req.body;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 1000,
      messages: [{ role: "user", content: `Tu es un assistant pilotage chantiers HEGP/Vaugirard. Date: ${date}.\n${ctx}\n\nDonne les 5 prochaines missions prioritaires. Réponds UNIQUEMENT en JSON valide, rien d'autre:\n{"missions":[{"prio":1,"chantier":"...","type":"action|visite|bdc|decision","titre":"action concrète","raison":"pourquoi urgent","site":"HEGP|VGR"}]}` }],
    }),
  });

  const data = await response.json();
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "{}";
  try {
    const clean = text.replace(/```json\n?|```/g, "").trim();
    res.json(JSON.parse(clean));
  } catch {
    res.json({ missions: [], error: text });
  }
}

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
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: `Assistant pilotage chantiers HEGP/Vaugirard. ${date}.\n${ctx}\n\nDonne les 5 prochaines missions prioritaires. JSON uniquement:\n{"missions":[{"prio":1,"chantier":"...","type":"action|visite|bdc|decision","titre":"action concrète","raison":"pourquoi urgent","site":"HEGP|VGR"}]}` }],
    }),
  });

  const data = await response.json();
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "{}";
  try {
    res.json(JSON.parse(text.replace(/```json\n?|```/g, "").trim()));
  } catch {
    res.json({ missions: [] });
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { ctx, date } = req.body;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.GROQ_API_KEY,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      messages: [
        { role: "system", content: "Tu es un assistant pilotage chantiers. Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après." },
        { role: "user", content: `Date: ${date}.\n${ctx}\n\nDonne les 5 prochaines missions prioritaires en JSON:\n{"missions":[{"prio":1,"chantier":"...","type":"action|visite|bdc|decision","titre":"action concrète","raison":"pourquoi urgent","site":"HEGP|VGR"}]}` }
      ],
    }),
  });

  const data = await response.json();
  if (data.error) return res.json({ missions: [], debug: data.error });

  const text = data.choices?.[0]?.message?.content || "";
  if (!text) return res.json({ missions: [], debug: data });

  try {
    const clean = text.replace(/```json\n?|```/g, "").trim();
    res.json(JSON.parse(clean));
  } catch {
    res.json({ missions: [], debug: text });
  }
}

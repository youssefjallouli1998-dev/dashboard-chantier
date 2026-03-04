export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { ds } = req.body;
  const response = await fetch(`https://api.notion.com/v1/databases/${ds}/query`, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.NOTION_TOKEN,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 100 }),
  });
  const data = await response.json();
  if (!data.results) return res.json({ taches: [], debug: data });
  const taches = data.results.map(p => ({
    nom:   p.properties["Travaux à faire "]?.title?.[0]?.plain_text || p.properties["Travaux à faire"]?.title?.[0]?.plain_text || "",
    etat:  p.properties["État"]?.status?.name || "",
    chiff: p.properties["Chiffrage "]?.select?.name || p.properties["Chiffrage"]?.select?.name || "",
    ent:   p.properties["Entreprises"]?.select?.name || p.properties["Entreprises "]?.select?.name || "",
    date:  p.properties["Date début "]?.date?.start || p.properties["Date début"]?.date?.start || p.properties["Date"]?.date?.start || "",
  })).filter(t => t.nom.trim() !== "");
  res.json({ taches });
}

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

  function getProp(props, ...keys) {
    for (const key of keys) {
      if (props[key] !== undefined) return props[key];
    }
    return undefined;
  }

  const taches = data.results.map(p => {
    const props = p.properties;

    const nomProp = getProp(props, "Travaux à faire ", "Travaux à faire");
    const nom = nomProp?.title?.[0]?.plain_text || "";

    const etatProp = getProp(props, "État", "Etat");
    const etat = etatProp?.status?.name || "";

    const chiffProp = getProp(props, "Chiffrage ", "Chiffrage");
    const chiff = chiffProp?.select?.name || "";

    const entProp = getProp(props, "Entreprises", "Entreprise");
    const ent = entProp?.select?.name || "";

    const dateProp = getProp(props, "Date début ", "Date début", "Date");
    const date = dateProp?.date?.start || "";

    return { nom, etat, chiff, ent, date };
  });

  res.json({ taches });
}

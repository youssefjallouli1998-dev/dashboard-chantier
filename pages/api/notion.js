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

  function getTitle(props) {
    for (const key of Object.keys(props)) {
      if (props[key].type === "title") {
        return props[key].title?.[0]?.plain_text || "";
      }
    }
    return "";
  }

  function getSelect(props, ...keys) {
    for (const key of keys) {
      if (props[key]?.select?.name) return props[key].select.name;
    }
    return "";
  }

  function getStatus(props, ...keys) {
    for (const key of keys) {
      if (props[key]?.status?.name) return props[key].status.name;
    }
    return "";
  }

  function getDate(props, ...keys) {
    for (const key of keys) {
      if (props[key]?.date?.start) return props[key].date.start;
    }
    return "";
  }

  const taches = data.results.map(p => {
    const props = p.properties;
    return {
      nom:   getTitle(props),
      etat:  getStatus(props, "État", "Etat"),
      chiff: getSelect(props, "Chiffrage ", "Chiffrage"),
      ent:   getSelect(props, "Entreprises", "Entreprises ", "Entreprise"),
      date:  getDate(props, "Date début ", "Date début", "Date"),
    };
  }).filter(t => t.nom.trim() !== "");

  res.json({ taches });
}

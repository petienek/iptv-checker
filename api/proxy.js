module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { url } = req.query;
  if (!url) return res.status(400).send('Chybí url');
  try {
    const r = await fetch(decodeURIComponent(url), {
      headers: { 'User-Agent': 'VLC/3.0.0' }
    });
    const text = await r.text();
    res.status(200).send(text);
  } catch(e) {
    res.status(500).send(e.message);
  }
};

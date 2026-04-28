export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET’);

const { url } = req.query;
if (!url) return res.status(400).json({ error: ‘Chybí parametr url’ });

try {
const response = await fetch(decodeURIComponent(url), {
headers: { ‘User-Agent’: ‘VLC/3.0.0 LibVLC/3.0.0’ }
});
const text = await response.text();
res.status(200).send(text);
} catch(e) {
res.status(500).json({ error: e.message });
}
}

const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public')); // Zde bude tvůj web

// Endpoint pro analýzu playlistu
app.get('/analyze', async (req, res) => {
    const m3uUrl = req.query.url;
    if (!m3uUrl) return res.status(400).send('Chybí URL');

    try {
        const response = await axios.get(m3uUrl);
        const lines = response.data.split('\n');
        const tasks = [];
        
        let currentInf = "";
        let results = ["#EXTM3U"];

        console.log("Startuji analýzu...");

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith("#EXTINF")) {
                currentInf = line;
            } else if (line.startsWith("http")) {
                const streamUrl = line;
                const infCapture = currentInf;

                // Vytvoříme testovací úlohu pro každý stream
                tasks.push(
                    axios.head(streamUrl, { timeout: 3000 })
                        .then(() => {
                            return infCapture + "\n" + streamUrl;
                        })
                        .catch(() => null) // Pokud stream nejede, vrátí null
                );
            }
        }

        // Počkáme na všechny testy (paralelně pro rychlost)
        const checkedStreams = await Promise.all(tasks);
        results.push(...checkedStreams.filter(s => s !== null));

        res.send(results.join('\n'));
    } catch (error) {
        res.status(500).send('Chyba při stahování nebo zpracování playlistu.');
    }
});

app.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));

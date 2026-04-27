const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/analyze', async (req, res) => {
    const m3uUrl = req.query.url;
    if (!m3uUrl) return res.status(400).send('Chybí URL');

    try {
        const response = await axios.get(m3uUrl, { timeout: 10000 });
        const lines = response.data.split('\n');
        let currentInf = "";
        let testPromises = [];

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith("#EXTINF")) {
                currentInf = line;
            } else if (line.startsWith("http")) {
                const urlToTest = line;
                const metadata = currentInf;

                // Vytvoříme test pro každý stream
                const test = axios.get(urlToTest, { 
                    timeout: 4000, 
                    headers: { 'User-Agent': 'VLC/3.0.18' },
                    responseType: 'stream' 
                })
                .then(() => metadata + "\n" + urlToTest)
                .catch(() => null);

                testPromises.push(test);
            }
        }

        const checkedResults = await Promise.all(testPromises);
        const finalPlaylist = ["#EXTM3U", ...checkedResults.filter(item => item !== null)];
        
        res.setHeader('Content-Type', 'text/plain');
        res.send(finalPlaylist.join('\n'));

    } catch (error) {
        res.status(500).send('Chyba: Nepodařilo se načíst M3U soubor.');
    }
});

app.listen(PORT, () => console.log(`Server běží na ${PORT}`));

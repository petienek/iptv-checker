const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/analyze', async (req, res) => {
    const m3uUrl = req.query.url;
    if (!m3uUrl) return res.status(400).send('Chybí URL');

    console.log(`--- Startuji analýzu playlistu: ${m3uUrl} ---`);

    try {
        const response = await axios.get(m3uUrl, { timeout: 15000 });
        const lines = response.data.split('\n');
        let currentInf = "";
        let workingPlaylist = ["#EXTM3U"];
        let testedCount = 0;

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith("#EXTINF")) {
                currentInf = line;
            } else if (line.startsWith("http")) {
                testedCount++;
                const urlToTest = line;
                const metadata = currentInf;

                console.log(`Testuji (${testedCount}): ${urlToTest.substring(0, 50)}...`);

                try {
                    // Použijeme metodu HEAD - je nejrychlejší a stahuje jen hlavičku
                    await axios.head(urlToTest, { 
                        timeout: 3000, 
                        headers: { 'User-Agent': 'VLC/3.0.18' }
                    });
                    
                    console.log("  ✅ FUNGUJE");
                    workingPlaylist.push(metadata);
                    workingPlaylist.push(urlToTest);
                } catch (e) {
                    // Pokud HEAD selže, zkusíme GET (některé servery HEAD blokují)
                    try {
                        await axios.get(urlToTest, { 
                            timeout: 3000, 
                            headers: { 'User-Agent': 'VLC/3.0.18' },
                            responseType: 'stream' 
                        });
                        console.log("  ✅ FUNGUJE (přes GET)");
                        workingPlaylist.push(metadata);
                        workingPlaylist.push(urlToTest);
                    } catch (e2) {
                        console.log("  ❌ NEFUNGUJE");
                    }
                }
            }
        }

        console.log(`--- Analýza dokončena. Nalezeno ${workingPlaylist.length / 2} funkčních streamů ---`);
        res.setHeader('Content-Type', 'text/plain');
        res.send(workingPlaylist.join('\n'));

    } catch (error) {
        console.error("KRITICKÁ CHYBA:", error.message);
        res.status(500).send('Chyba: Nepodařilo se načíst nebo zpracovat M3U soubor.');
    }
});

app.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) {
        res.status(400).json({ error: "Missing URL parameter" });
        return;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            res.status(response.status).json({ error: "Error fetching URL" });
            return;
        }
        const data = await response.text();
        // Return the fetched content with proper CORS header
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.status(200).send(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

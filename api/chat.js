export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        console.error('GROQ_API_KEY is not set in environment variables');
        return res.status(500).json({ error: { message: 'Server configuration error: Missing API Key' } });
    }

    try {
        const { messages, model } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: 'Invalid request: messages array is required' } });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages,
                model: model || 'llama-3.3-70b-versatile'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Groq API error:', response.status, data);
            return res.status(response.status).json({
                error: {
                    message: data.error?.message || `Groq API error (${response.status})`
                }
            });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Groq API Error:', error);
        return res.status(500).json({
            error: {
                message: error.message || 'Internal Server Error'
            }
        });
    }
}

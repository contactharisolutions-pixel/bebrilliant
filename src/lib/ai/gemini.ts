const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function generateQuestions(prompt: string) {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        })
    });

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function analyzeImage(prompt: string, base64Image: string, mimeType: string = 'image/jpeg') {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: mimeType, data: base64Image } }
                ]
            }],
            generationConfig: {
                temperature: 0,
                response_mime_type: "application/json"
            }
        })
    });

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

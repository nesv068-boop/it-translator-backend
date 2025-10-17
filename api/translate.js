export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, mode, apiKey } = req.body;

    if (!text || !apiKey) {
      return res.status(400).json({ error: 'Text và API Key là bắt buộc' });
    }

    const sourceLang = mode === 'vie-jpn' ? 'Vietnamese' : 'Japanese';
    const targetLang = mode === 'vie-jpn' ? 'Japanese' : 'Vietnamese';

    const prompt = `You are an expert IT translator specializing in ${sourceLang} to ${targetLang} translation. 
Your task is to translate the following IT/technical text accurately while:
1. Maintaining technical accuracy and industry-standard terminology
2. Preserving code snippets, variable names, and technical terms as they are
3. Using appropriate technical vocabulary in the target language
4. Keeping the same tone and structure as the original
5. Ensuring the translation is clear and understandable for IT professionals

Text to translate:
${text}

Provide only the translated text without any explanations or notes.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert IT translator specializing in ${sourceLang} to ${targetLang} translation.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error?.message || 'Lỗi từ OpenAI API';
      return res.status(response.status).json({ error: errorMsg });
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content;

    res.status(200).json({ success: true, translatedText });
  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ error: error.message });
  }
}

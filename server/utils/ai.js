const fs = require('fs');
let ai = null;

try {
  const { GoogleGenAI } = require('@google/genai');
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.log('Google GenAI SDK not found or failed to initialize.', e.message);
}

async function verifyDocumentWithAI(filePath, blockchainMetadata) {
  if (!ai) {
    console.warn('⚠️ GEMINI_API_KEY not found in environment variables. Simulating AI Document Verification for MVP.');
    // Simulated delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      isValid: true,
      confidenceScore: 0.95,
      extractedData: {
        name: blockchainMetadata.name || 'Unknown',
        type: blockchainMetadata.type || 'Unknown',
      },
      message: 'Simulated MVP check: Document data aligns with blockchain records.'
    };
  }

  try {
    const fileBytes = fs.readFileSync(filePath);
    const mimeType = filePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: fileBytes.toString("base64"),
                mimeType
              }
            },
            {
              text: `You are an expert Document Verification AI. Extract the key entities from this document image/PDF (like Name of the person, Document Type, Issuer). Compare them with this provided metadata: ${JSON.stringify(blockchainMetadata)}. Return a JSON containing: isValid (boolean, true if they align), confidenceScore (number 0-1), extractedData (object with the extracted fields), and message (short string explaining). ONLY return valid JSON without markdown formatting.`
            }
          ]
        }
      ]
    });

    const outputText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    let parsed = {};
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch(e) {}
    }
    
    return {
      isValid: parsed.isValid || false,
      confidenceScore: parsed.confidenceScore || 0,
      extractedData: parsed.extractedData || {},
      message: parsed.message || 'AI processing completed without explicit message.',
      rawOutput: outputText
    };
  } catch (error) {
    console.error('Error in AI Verification:', error);
    return {
      isValid: false,
      confidenceScore: 0,
      extractedData: null,
      message: 'AI Service Error: ' + error.message
    };
  }
}

module.exports = { verifyDocumentWithAI };

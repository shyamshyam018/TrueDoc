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

async function verifyDocumentWithAI(filePath, blockchainMetadata, engine = 'gemini') {
  if (!ai || !process.env.GEMINI_API_KEY) {
    return { isValid: false, message: 'Google Gemini AI Service is offline or missing API Key.' };
  }

  try {
    const fileBytes = fs.readFileSync(filePath);
    const mimeType = filePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    
    const systemPrompt = `You are an expert Document Verification AI. Compare the uploaded document against this metadata: ${JSON.stringify(blockchainMetadata)}. 
    CRITICAL RULES:
    1. DO NOT strictly enforce the 'type' of the document. If the metadata says 'Bike_License' but the image looks like an 'Aadhaar Card' or anything else, DO NOT FAIL IT.
    2. DO NOT require 'individualAadhar' or 'individualPan' numbers to be physically printed on this document type.
    3. The ONLY strict requirement is that the 'individualName' from the metadata (${blockchainMetadata.individualName || 'Unspecified'}) MUST physically appear on the document image.
    If the exact name matches or heavily overlaps, return isValid: true immediately regardless of stylistic differences or document types!
    Return ONLY a raw JSON strictly formatted as: {"isValid": true/false, "confidenceScore": 0-1, "extractedData": {}, "message": "reasoning"}`;

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
              text: systemPrompt
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
    console.error('Error in AI Verification:', error.message);
    return {
      isValid: false,
      confidenceScore: 0,
      extractedData: null,
      message: 'AI Service Error: ' + error.message
    };
  }
}

async function verifyIdentityDocumentWithAI(filePath, docType) {
  if (!ai || !process.env.GEMINI_API_KEY) {
    return { isValid: false, message: 'Google Gemini AI Service is offline or missing API Key.' };
  }

  try {
    const fileBytes = fs.readFileSync(filePath);
    const mimeType = filePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { data: fileBytes.toString("base64"), mimeType } },
          { text: `You are an expert Identity Extraction AI. Analyze this scan of a user's ${docType} card. Extract the exact printed 'name' and the specific alphanumeric '${docType} Number ' ('idNumber'). Also verify if the visual context is genuinely a legitimate ${docType}. Return ONLY JSON: { "isValid": boolean, "name": "extracted name", "idNumber": "extracted ID number", "message": "short 1-sentence reasoning" }.` }
        ]
      }]
    });

    const outputText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    let parsed = {};
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch(e) {}
    }
    
    return {
      isValid: typeof parsed.isValid !== 'undefined' ? parsed.isValid : true,
      name: parsed.name || 'Unknown Name',
      idNumber: parsed.idNumber || 'Unknown ID',
      message: parsed.message || 'AI identity extraction completed.'
    };
  } catch (error) {
    console.error('Error in Identity AI:', error.message);
    return { isValid: false, message: 'AI Service Error: ' + error.message };
  }
}

module.exports = { verifyDocumentWithAI, verifyIdentityDocumentWithAI };

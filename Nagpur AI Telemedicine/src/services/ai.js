import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key provided by user
const API_KEY = "AIzaSyDb9JjZ061K-fKCIA8RqEh8FlYpIupRUUs";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

/**
 * Enhanced Symptom Analysis with deeper personalization
 */
export const analyzeSymptoms = async (symptoms, language = 'English', user = null) => {
  try {
    const personalizationContext = user
      ? `
        PATIENT PROFILE:
        - Name: ${user.name}
        - Role: ${user.role}
        - Health Focus: Needs clear, actionable guidance ${user.role === 'patient' ? 'as a local Nagpur resident' : 'as a medical professional'}.
        `
      : "The user is an anonymous resident of Nagpur.";

    const prompt = `
      Act as "HealthBridge AI", a highly specialized medical assistant for the Nagpur Health Network.
      
      CONTEXT:
      ${personalizationContext}
      Language for response: ${language}
      User Input: "${symptoms}"
      
      GUIDELINES:
      - Be empathetic, professional, and culturally sensitive to Nagpur's urban and rural context.
      - Use the user's name (${user?.name || 'there'}) naturally in the greeting.
      - If symptoms are critical (chest pain, severe bleeding, difficulty breathing), emphasize calling 108 immediately.
      
      STRUCTURED OUTPUT (Required):
      1. **Personalized Assessment**: Acknowledge the user and summarize their symptoms.
      2. **Potential Insight**: Identify 2-3 likely medical directions (disclaim: non-diagnostic).
      3. **Urgency Score**: (Low | Medium | High | Critical) - highlight this clearly.
      4. **Local Action Plan**: Provide specific home-care tips or nearby Nagpur-specific hospital recommendations (GMC, Mayo, Kingsway).
      5. **Next Step**: Specifically advise whether to book a teleconsultation or visit a PHC.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to my medical intelligence database. Please consult a doctor at the nearest PHC if your symptoms persist.";
  }
};

/**
 * Lab Interpretation with trend awareness (context can be added later)
 */
export const analyzeLabResults = async (metrics, language = 'English') => {
  try {
    const prompt = `
      Act as a Nagpur-based lab diagnostic assistant. Interpret these metrics:
      ${JSON.stringify(metrics)}
      
      Response Format (${language}):
      - A concise summary of the findings.
      - 1-2 practical lifestyle tips tailored for residents of Nagpur (e.g., local dietary habits, seasonal weather adjustments).
      - A strong medical disclaimer.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Lab Analysis Error:", error);
    return "Could not analyze lab data at this time.";
  }
};

/**
 * Simplify Prescriptions for rural/urban patients
 */
export const explainPrescription = async (prescription, language = 'English') => {
  try {
    const prompt = `
      Act as a helpful community health worker in Nagpur. Explain this prescription:
      Diagnosis: ${prescription.diagnosis}
      Medicines: ${JSON.stringify(prescription.medicines)}
      
      Goal: Explain IN SIMPLEST TERMS in ${language}:
      - What the condition means for their daily life.
      - Why they are taking these specific medicines.
      - 3 actionable tips for recovery.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Explanation Error:", error);
    return "Could not generate explanation at this time.";
  }
};

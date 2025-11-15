const FALLBACK_RESPONSE = "Desculpe, ocorreu um erro ao processar a resposta.";

function formatOpenAIResponse(raw) {
  try {
    const extracted = raw?.data?.[0]?.content?.[0]?.text;
    if (typeof extracted === "string" && extracted.trim().length > 0) {
      return { message: extracted.trim() };
    }
    if (Array.isArray(extracted)) {
      const joined = extracted.filter((item) => typeof item === "string").join(" ").trim();
      if (joined.length > 0) {
        return { message: joined };
      }
    }
  } catch (error) {
    // Intentionally swallowing the error to return the fallback structure.
  }
  return { message: FALLBACK_RESPONSE };
}

module.exports = { formatOpenAIResponse };

// controllers/chatController.js
require("dotenv").config();

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

    // If an OpenRouter API key exists → use real LLM
    if (OPENROUTER_KEY) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "mistralai/mistral-small-3.1-24b-instruct:free",
            messages: [{ role: "user", content: message }]
          })
        });

        const data = await response.json();

        if (response.ok) {
          return res.json({
            success: true,
            message: data.choices[0].message.content
          });
        } else {
          console.log("OpenRouter error:", data);
        }
      } catch (err) {
        console.log("OpenRouter request failed:", err.message);
      }
    }

    // No API key OR OpenRouter failed → fallback mock reply
    return res.json({
      success: true,
      message: `Mock reply: you said "${message}"`
    });

  } catch (error) {
    console.error("Chat Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

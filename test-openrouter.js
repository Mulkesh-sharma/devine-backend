require("dotenv").config();

async function test() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost",
        "X-Title": "Local Test",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          { role: "user", content: "Hello" }
        ]
      })
    });

    const data = await response.json();
    console.log("STATUS:", response.status);
    console.log("RESPONSE:", data);
  } catch (error) {
    console.error("ERROR:", error);
  }
}

test();

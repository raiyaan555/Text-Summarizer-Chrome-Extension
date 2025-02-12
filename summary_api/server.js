const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY; // Ensure you set this in your .env file
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

app.post("/summarize", async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No text provided for summarization." });
    }

    try {
        const response = await axios.post(API_URL, {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: `Read through the text and summarize in 5-7 lines ONLY easy to understand : \n\n${text}` }
                    ]
                }
            ]
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        const summary = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!summary) throw new Error("Invalid Gemini API response");

        res.json({ summary });
    } catch (error) {
        console.error("Gemini API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to generate summary. Try again later." });
    }
});

const PORT = 10000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

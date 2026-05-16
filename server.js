const express = require('express');
const Groq = require("groq-sdk");
const app = express();

app.use(express.json());

// Aapka Phone ID aur Verify Token
const PHONE_NUMBER_ID = "1106763835856433"; 
const VERIFY_TOKEN = "ecom_agent_123"; 

// Keys ab Render se aayengi (Secure Tareeka)
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groq = new Groq({ apiKey: GROQ_API_KEY });

// Webhook Verification (Jaisa tha waisa hi)
app.get('/webhook', (req, res) => {
    res.status(200).send(req.query["hub.challenge"]);
});

// Message Receive aur Reply karne wala main code
app.post('/webhook', async (req, res) => {
    let body = req.body;

    if (body.object === 'whatsapp_business_account') {
        try {
            if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
                let from = body.entry[0].changes[0].value.messages[0].from;
                let userMsg = body.entry[0].changes[0].value.messages[0].text.body;
                console.log(`👤 User: ${userMsg}`);

                // 1. AI se reply banwana
                const result = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are a smart AI assistant. You help users with RTO, ecommerce, and general queries." },
                        { role: "user", content: userMsg }
                    ],
                    model: "llama-3.3-70b-versatile",
                });

                const aiReply = result.choices[0].message.content;
                console.log(`🤖 AI: ${aiReply}`);

                // 2. WhatsApp par reply bhejna (Naya Error Check wala code)
                const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: from,
                        text: { body: aiReply }
                    })
                });
                
                // Meta ka asli jawaab padhna
                const metaResult = await response.json();
                console.log("📝 Meta ki Asli Report:", JSON.stringify(metaResult));
                console.log("✅ Reply bhejne ka try kiya!");
            }
        } catch (err) {
            console.log("❌ Error:", err.message);
        }
    }
    res.sendStatus(200);
});

// Server Start karna
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
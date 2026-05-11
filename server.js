const express = require('express');
const Groq = require("groq-sdk");
const app = express();
app.use(express.json());

const WHATSAPP_TOKEN = "EAAOKe6ONLJQBRaZA7CK59y7k8UTvdxA7eZCuIGit8mqNDtoAECPWNDifSxQwBZC2gz8FiLQPgCpy0orTPbMaIILdCaCTqIhFPbiyT2oN5x8b1SLU7LvePGKpTpMZCoJE5RgOLBUOSPzKTjE5TFtrWu7OcKWk8jZAZCaPIySZCiA7BZCrZCVZAUy4D2Dc3mv5TQ0wg9A4xkEuVf3HyHjRCCM08kBUVJxQ5DuJaZB2mhy9gavocHV2vGrh18EVBU0ZASHY3B8E9nnUmRi956TeNEo10SZCMvyFZC";
const PHONE_NUMBER_ID = "1106763835856433";
const GROQ_API_KEY = "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";
const VERIFY_TOKEN = "ecom_agent_123";

const groq = new Groq({ apiKey: GROQ_API_KEY });

app.get('/webhook', (req, res) => {
    res.status(200).send(req.query["hub.challenge"]);
});

app.post('/webhook', async (req, res) => {
    console.log("📨 Request aayi:", JSON.stringify(req.body, null, 2));
    let body = req.body;
    if (body.object === 'whatsapp_business_account') {
        try {
            if (body.entry[0].changes[0].value.messages) {
                let from = body.entry[0].changes[0].value.messages[0].from;
                let userMsg = body.entry[0].changes[0].value.messages[0].text.body;
                console.log(`📩 User: ${userMsg}`);

                const result = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are a smart AI assistant for an Indian business. You help with 3 things: 1) RTO & Vehicle - driving license, RC, challan, vehicle registration, insurance, pollution certificate 2) Ecommerce & Orders - order tracking, returns, refunds, complaints, product queries, delivery issues 3) General Questions - koi bhi sawaal jo customer pooche. Always reply in Hinglish (mix of Hindi and English) in a friendly, helpful tone. Keep replies short and to the point. If customer has order return/refund issue, ask for Order ID and reason. Example style: 'Bilkul! Aapka return process karne ke liye Order ID aur return reason batao...' or 'Driving license renew karne ke liye in documents ki zarurat hogi...' or 'Haan bilkul, main aapki help kar sakta hoon!'" },
                        { role: "user", content: userMsg }
                    ],
                    model: "llama-3.3-70b-versatile",
                });
                const aiReply = result.choices[0].message.content;
                console.log(`🤖 AI: ${aiReply}`);

                await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
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
                console.log("✅ Reply bhej diya!");
            }
        } catch (err) {
            console.log("❌ Error:", err.message);
        }
    }
    res.sendStatus(200);
});

app.listen(3000, () => console.log("🚀 RTO Agent Ready!"));
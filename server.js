const express = require('express');
const Groq = require("groq-sdk");
const app = express();

app.use(express.json());

const PHONE_NUMBER_ID = "1106763835856433"; 
const VERIFY_TOKEN = "ecom_agent_123"; 

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groq = new Groq({ apiKey: GROQ_API_KEY });

app.get('/webhook', (req, res) => {
    res.status(200).send(req.query["hub.challenge"]);
});

app.post('/webhook', async (req, res) => {
    let body = req.body;

    if (body.object === 'whatsapp_business_account') {
        try {
            if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
                let from = body.entry[0].changes[0].value.messages[0].from;
                let userMsg = body.entry[0].changes[0].value.messages[0].text.body;
                console.log(`👤 User: ${userMsg}`);

                const result = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are a smart AI assistant. You help users with RTO, ecommerce, and general queries." },
                        { role: "user", content: userMsg }
                    ],
                    model: "llama-3.3-70b-versatile",
                });

                const aiReply = result.choices[0].message.content;
                console.log(`🤖 AI: ${aiReply}`);

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

// New Order Confirmation Endpoint (Aapka Naya Code)
app.post('/new-order', async (req, res) => {
    try {
        const { customerPhone, customerName, address, orderId, amount } = req.body;
        
        const message = `Namaste ${customerName}! 🛍️\n\nAapka order place hua hai!\n\n📦 Order ID: ${orderId}\n💰 Amount: ₹${amount}\n📍 Delivery Address: ${address}\n\nKya ye address sahi hai?\nReply karo:\n1 - Haan, address sahi hai ✅\n2 - Nahi, address change karna hai ❌`;

        const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: customerPhone,
                text: { body: message }
            })
        });
        
        const metaResult = await response.json();
        console.log("📦 Order Confirmation Bheja:", JSON.stringify(metaResult));
        res.json({ success: true, message: "Order confirmation sent!", meta_response: metaResult });

    } catch (err) {
        console.log("❌ Error:", err.message);
        res.json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
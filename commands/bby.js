const axios = require('axios');

const baseApiUrl = async () => "https://noobs-api.top/dipto";

module.exports = {
  name: "bby",
  aliases: ["baby", "sam", "babu", "babe", "janu", "bot", "বেবি", "বেবী", "বট"],
  author: "ArYAN",
  version: "0.0.3",
  role: 0,
  description: "Chat with baby bot",
  category: "CHAT",
  noPrefix: true,

  zayn: async function ({ sock, msg, sender, zaynReply, removeReply }) {
    const jid = msg.key.remoteJid;
    const rawText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const text = rawText.trim().toLowerCase();
    const uid = sender;
    const apiUrl = `${await baseApiUrl()}/baby`;

    // ✅ Updated triggerWords
    const triggerWords = ["bby", "baby", "sam", "babu", "babe", "janu", "bot", "বেবী", "বেবি", "বট"];

    // ✅ Match anywhere, not just start
    const isTrigger = triggerWords.some(word => text.includes(word));
    if (!isTrigger) return;

    // Remove trigger word from text
    const query = text.split(" ").filter(w => !triggerWords.includes(w)).join(" ") || "";

    const sendAndListen = async (inputText, quoteMsg, retryCount = 0) => {
      try {
        const res = await axios.get(`${apiUrl}?text=${encodeURIComponent(inputText)}&senderID=${uid}&font=1`);
        const replyText = res?.data?.reply || "🤖 I'm here!";
        const sentMsg = await sock.sendMessage(jid, { text: replyText }, { quoted: quoteMsg });

        zaynReply(sentMsg.key.id, async (replyEvent) => {
          const replyText = replyEvent.message?.conversation || replyEvent.message?.extendedTextMessage?.text || "";
          if (!replyText) return;
          await sendAndListen(replyText, replyEvent);
        });

      } catch (err) {
        if (retryCount < 2) {
          await sendAndListen(inputText, quoteMsg, retryCount + 1); // Retry up to 2 times
        } else {
          await sock.sendMessage(jid, { text: `❌ Error: Couldn't connect.` }, { quoted: quoteMsg });
        }
      }
    };

    if (!query) {
      const ran = ["Yes 😁, I am here", "Bolo jaan 😘", "Kemon acho?", "Baby ready 😎"];
      const fallbackMsg = ran[Math.floor(Math.random() * ran.length)];
      const sentMsg = await sock.sendMessage(jid, { text: fallbackMsg }, { quoted: msg });

      zaynReply(sentMsg.key.id, async (replyEvent) => {
        const replyText = replyEvent.message?.conversation || replyEvent.message?.extendedTextMessage?.text || "";
        if (!replyText) return;
        await sendAndListen(replyText, replyEvent);
      });
    } else {
      await sendAndListen(query, msg);
    }
  }
};

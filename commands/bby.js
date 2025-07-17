const axios = require('axios');

const baseApiUrl = async () => "https://noobs-api.top/dipto";

module.exports = {
  name: "bby",
  aliases: ["baby", "sam", "babu", "babe", "janu"],
  author: "ArYAN",
  version: "0.0.2",
  role: 0,
  description: "Chat with baby bot",
  category: "CHAT",
  noPrefix: true,

  zayn: async function ({
    sock,
    msg,
    sender,
    zaynReply,
    removeReply
  }) {
    const jid = msg.key.remoteJid;
    const rawText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

    const text = rawText.trim().toLowerCase();
    const uid = sender;
    const apiUrl = `${await baseApiUrl()}/baby`;

    const triggerWords = ["bby", "baby", "sam", "babu", "babe", "janu"];
    const isTrigger = triggerWords.some(word => text.startsWith(word));

    if (!isTrigger) return;

    const query = text.split(" ").slice(1).join(" ");

    const sendAndListen = async (inputText, quoteMsg) => {
      try {
        const res = await axios.get(`${apiUrl}?text=${encodeURIComponent(inputText)}&senderID=${uid}&font=1`);
        const sentMsg = await sock.sendMessage(jid, { text: res.data.reply }, { quoted: quoteMsg });

        zaynReply(sentMsg.key.id, async (replyEvent) => {
          const replyText = replyEvent.message?.conversation || replyEvent.message?.extendedTextMessage?.text || "";
          if (!replyText) return;
          await sendAndListen(replyText, replyEvent);
        });

      } catch (err) {
        await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: quoteMsg });
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

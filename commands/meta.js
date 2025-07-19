const axios = require("axios");

module.exports = {
  name: "meta",
  aliases: ["askmeta", "ai"],
  author: "ArYAN",
  version: "1.0.0",
  description: "Ask Meta AI",
  category: "AI",
  role: 0,

  zayn: async function ({ sock, msg, args }) {
    const jid = msg.key.remoteJid;
    const prompt = args.join(" ");

    if (!prompt) {
      return await sock.sendMessage(jid, {
        text: "❗ Please provide a prompt.\n\n📌 Example: *meta what is AI?*"
      }, { quoted: msg });
    }

    await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });

    try {
      const apiUrl = `https://aryan-meta-ai.vercel.app/meta-ai?prompt=${encodeURIComponent(prompt)}`;
      const res = await axios.get(apiUrl);

      if (!res.data || !res.data.response) {
        throw new Error("Empty response from Meta AI.");
      }

      await sock.sendMessage(jid, {
        text: `${res.data.response}`
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

    } catch (err) {
      await sock.sendMessage(jid, {
        text: `❌ Error: ${err.message}`
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
    }
  }
};

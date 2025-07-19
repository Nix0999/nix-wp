const axios = require("axios");

module.exports = {
  name: "flux",
  aliases: [],
  version: "0.0.1",
  author: "ArYAN",
  role: 0,
  description: "Generate AI image using Flux",
  category: "AI",

  zayn: async function ({ sock, msg, args }) {
    const jid = msg.key.remoteJid;
    const prompt = args.join(" ");

    if (!prompt) {
      return await sock.sendMessage(jid, {
        text: "⚠️ Please provide a prompt.\n\nExample: *flux cyberpunk city*"
      }, { quoted: msg });
    }

    await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });

    const url = `https://aryan-xyz-flux-sigma.vercel.app/flux?prompt=${encodeURIComponent(prompt)}`;

    try {
      const res = await axios.get(url, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(res.data);

      await sock.sendMessage(jid, {
        image: imageBuffer,
        caption: `🎨 Flux AI Image\n🖋 Prompt: *${prompt}*`
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

    } catch (err) {
      console.error("Flux API Error:", err.message);
      await sock.sendMessage(jid, {
        text: `❌ Failed to generate image. Please try again later.`
      }, { quoted: msg });
      await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
    }
  }
};

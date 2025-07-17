module.exports = {
  name: "listbox",
  version: "1.0.0",
  author: "ArYAN",
  role: 3,
  description: "List all groups the bot is in",
  category: "SYSTEM",
  noPrefix: false,

  zayn: async function ({ sock, msg }) {
    const jid = msg.key.remoteJid;

    try {
      const groups = await sock.groupFetchAllParticipating();
      const groupArray = Object.values(groups);

      if (!groupArray.length) {
        return await sock.sendMessage(jid, { text: "🤖 Bot is not in any groups!" }, { quoted: msg });
      }

      const listText = groupArray.map((group, index) => {
        return `🔹 *${index + 1}. ${group.subject}*\n🆔 ${group.id}`;
      }).join("\n\n");

      const fullText = `📦 *List of Groups I'm In:*\n━━━━━━━━━━━━━━━\n${listText}`;

      await sock.sendMessage(jid, { text: fullText }, { quoted: msg });
    } catch (err) {
      console.error("Listbox Error:", err.message);
      await sock.sendMessage(jid, { text: `❌ Failed to list groups: ${err.message}` }, { quoted: msg });
    }
  }
};

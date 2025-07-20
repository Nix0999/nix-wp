const fs = require("fs");
const path = require("path");

module.exports = {
  name: "de",
  version: "1.0.0",
  author: "ArYAN",
  description: "Delete any command file from commands folder",
  category: "developer",
  prefix: true,
  role: 1, // Only admins/devs

  zayn: async function ({ sock, msg, args }) {
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!args[0]) {
      return sock.sendMessage(jid, {
        text: `❌ Please specify the command name to delete.\n\nExample: *.deletecmd whois*`,
      }, { quoted: msg });
    }

    const fileName = args[0].toLowerCase();
    const filePath = path.join(__dirname, `${fileName}.js`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return sock.sendMessage(jid, {
        text: `⚠️ Command *${fileName}* not found in /commands.\nMake sure the name is correct.`,
      }, { quoted: msg });
    }

    // Try to delete
    try {
      fs.unlinkSync(filePath);
      await sock.sendMessage(jid, {
        text: `✅ Successfully deleted command: *${fileName}.js* from /commands`,
        mentions: [sender],
      }, { quoted: msg });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {
        text: `❌ Failed to delete *${fileName}.js*\nError: ${err.message}`,
      }, { quoted: msg });
    }
  }
};

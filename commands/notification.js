const notificationDB = {};

module.exports = {
  name: "notification",
  aliases: ["noti"],
  version: "1.0.0",
  author: "ArYAN",
  role: 0, // Will be custom checked below
  description: "Send notification to all groups and get replies in one group",
  category: "ADMIN",
  guide: "notification <your message>",

  zayn: async function ({ sock, msg, args, sender }) {
    const hardcodedAdminUID = "267705848475899@lid";
    const notifyGroup = "120363400030502109@g.us";

    if (sender !== hardcodedAdminUID) {
      return await sock.sendMessage(msg.key.remoteJid, { text: "❌ Only admins can use this command." }, { quoted: msg });
    }

    const message = args.join(" ");
    if (!message) {
      return await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Please provide a message to send." }, { quoted: msg });
    }

    const chats = await sock.groupFetchAllParticipating();
    const groupIds = Object.keys(chats);

    let success = 0;
    for (const jid of groupIds) {
      try {
        const sent = await sock.sendMessage(jid, {
          text: `📢 *Notification from Admin*\n\n${message}\n\n📝 _Reply to this message to respond._`,
        }, { quoted: msg });

        notificationDB[sent.key.id] = {
          from: sender,
          group: jid,
        };

        success++;
      } catch (err) {
        console.log(`❌ Failed to send to group ${jid}: ${err.message}`);
      }
    }

    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Notification sent to ${success} groups.` }, { quoted: msg });
  },

  onReply: async function ({ sock, msg }) {
    const replyToId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
    const senderId = msg.key.participant || msg.key.remoteJid;
    const groupId = msg.key.remoteJid;
    const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    const notifyGroup = "120363400030502109@g.us";

    if (notificationDB[replyToId]) {
      try {
        const groupInfo = await sock.groupMetadata(groupId);
        const senderName = msg.pushName || senderId.split("@")[0];

        const notifyText = `💬 *Notification Reply Received*\n\n👤 From: @${senderId.split("@")[0]} (${senderName})\n📍 Group: ${groupInfo.subject}\n🆔 tid: ${groupId}\n\n🗣 Message:\n${content}`;

        await sock.sendMessage(notifyGroup, {
          text: notifyText,
          mentions: [senderId],
        });

        delete notificationDB[replyToId];
      } catch (err) {
        console.log("Failed to forward notification reply:", err.message);
      }
    }
  }
};

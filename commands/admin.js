const { readFile, writeFile } = require("fs-extra");
const path = require("path");

const CONFIG_PATH = path.resolve(__dirname, "../config.json");

let botConfig = global.BotConfig || null;

module.exports = {
  name: "admin",
  aliases: ["adm"],
  author: "TawsiN",
  version: "1.6",
  description: "Manage bot admins (role 2) with instant updates",
  noPrefix: false,
  category: "DEVELOPER",

  zayn: async function ({ sock, msg, args, sender, zaynReply, removeReply }) {
    const jid = msg.key.remoteJid;

    const allowedAdmins = [
      "01894253289@s.whatsapp.net",
      "+8801894253289@s.whatsapp.net"
    ];

    if (!allowedAdmins.includes(sender)) {
      await sock.sendMessage(jid, {
        text: '❌ Only the bot\'s admins and devs can use this command "admin"',
        mentions: [sender],
      });
      return;
    }

    if (!botConfig) {
      try {
        const data = await readFile(CONFIG_PATH, "utf8");
        botConfig = JSON.parse(data);
        global.BotConfig = botConfig;
        if (!botConfig.roles || !botConfig.roles["2"]) botConfig.roles = { "2": [] };
      } catch (error) {
        await sock.sendMessage(jid, {
          text: "⚠️ Error: Failed to load configuration. Contact the developer.",
          mentions: [sender],
        });
        return;
      }
    }

    const config = botConfig;

    const saveConfig = async () => {
      try {
        await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
        global.BotConfig = config;
      } catch (error) {
        await sock.sendMessage(jid, {
          text: "⚠️ Error: Failed to save changes. They may not persist.",
          mentions: [sender],
        });
      }
    };

    if (!config.roles["2"].includes("01894253289@s.whatsapp.net")) {
      config.roles["2"].push("01894253289@s.whatsapp.net");
      await saveConfig();
    }

    const getName = async (uid) => {
      try {
        const contact = await sock.getContactById(uid);
        return contact?.pushName || uid.split("@")[0];
      } catch {
        return uid.split("@")[0];
      }
    };

    const isValidJID = (uid) => {
      if (!uid || typeof uid !== "string") return false;
      const jidPattern = /^\d+@(s\.whatsapp\.net|lid)$/;
      if (jidPattern.test(uid)) return true;
      const [number] = uid.split("@");
      return !isNaN(number) && number.length > 6;
    };

    const normalizeJID = (uid) => {
      if (!uid) return null;
      if (isValidJID(uid) && uid.includes("@")) return uid;
      const [number] = uid.split("@");
      if (!isNaN(number) && number.length > 6) return `${number}@s.whatsapp.net`;
      return null;
    };

    const extractUIDs = async () => {
      let uids = [];

      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      if (mentionedJid && Array.isArray(mentionedJid)) {
        uids = mentionedJid.filter(isValidJID);
      }

      if (!uids.length && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const contextInfo = msg.message.extendedTextMessage.contextInfo;
        let quotedJid = contextInfo.participant || contextInfo.remoteJid || null;
        if (!quotedJid && msg.key?.participant) {
          quotedJid = msg.key.participant;
        }
        if (quotedJid && isValidJID(quotedJid)) {
          uids.push(quotedJid);
        }
      }

      if (!uids.length && args.length > 1) {
        uids = args.slice(1).map(normalizeJID).filter((uid) => uid);
      }

      return uids.length > 0 ? uids : null;
    };

    switch (args[0]?.toLowerCase()) {
      case "add":
      case "-a": {
        const uids = await extractUIDs();
        if (!uids) {
          await sock.sendMessage(jid, {
            text: "⚠️ Error: Please tag a user, reply to a message, or provide a UID (e.g., 123456789).",
            mentions: [sender],
          });
          return;
        }

        const notAdminIds = [];
        const adminIds = [];
        for (const uid of uids) {
          if (config.roles["2"].includes(uid)) {
            adminIds.push(uid);
          } else {
            notAdminIds.push(uid);
          }
        }

        if (notAdminIds.length > 0) {
          config.roles["2"].push(...notAdminIds);
          await saveConfig();
        }

        const getNames = await Promise.all(
          uids.map(async (uid) => ({
            uid,
            name: await getName(uid),
          }))
        );

        const responseText = [
          notAdminIds.length > 0
            ? `✅ Added ${notAdminIds.length} admin(s):\n${getNames
                .filter((u) => notAdminIds.includes(u.uid))
                .map((u) => `- @${u.name} (${u.uid})`)
                .join("\n")}`
            : "",
          adminIds.length > 0
            ? `\n⚠️ ${adminIds.length} user(s) already admin:\n${getNames
                .filter((u) => adminIds.includes(u.uid))
                .map((u) => `- @${u.name} (${u.uid})`)
                .join("\n")}`
            : "",
        ].filter(Boolean).join("\n");

        const mentions = [sender, ...uids];
        const responseMsg = await sock.sendMessage(jid, {
          text: responseText || "⚠️ No changes made.",
          mentions,
        });

        zaynReply(responseMsg.key.id, async (reactionMsg) => {
          const emoji = reactionMsg.message?.reactionMessage?.text;
          if (emoji === "👍") {
            await sock.sendMessage(jid, {
              text: "✔️ Admin update confirmed.",
              mentions: [sender],
            });
            removeReply(responseMsg.key.id);
          }
        });

        break;
      }

      case "remove":
      case "-r": {
        const uids = await extractUIDs();
        if (!uids) {
          await sock.sendMessage(jid, {
            text: "⚠️ Error: Please tag a user, reply to a message, or provide a UID (e.g., 123456789).",
            mentions: [sender],
          });
          return;
        }

        const notAdminIds = [];
        const adminIds = [];
        for (const uid of uids) {
          if (config.roles["2"].includes(uid)) {
            adminIds.push(uid);
          } else {
            notAdminIds.push(uid);
          }
        }

        if (adminIds.length > 0) {
          config.roles["2"] = config.roles["2"].filter((uid) => !adminIds.includes(uid));
          await saveConfig();
        }

        const getNames = await Promise.all(
          uids.map(async (uid) => ({
            uid,
            name: await getName(uid),
          }))
        );

        const responseText = [
          adminIds.length > 0
            ? `✅ Removed ${adminIds.length} admin(s):\n${getNames
                .filter((u) => adminIds.includes(u.uid))
                .map((u) => `- @${u.name} (${u.uid})`)
                .join("\n")}`
            : "",
          notAdminIds.length > 0
            ? `\n⚠️ ${notAdminIds.length} user(s) not admin:\n${getNames
                .filter((u) => notAdminIds.includes(u.uid))
                .map((u) => `- @${u.name} (${u.uid})`)
                .join("\n")}`
            : "",
        ].filter(Boolean).join("\n");

        const mentions = [sender, ...uids];
        const responseMsg = await sock.sendMessage(jid, {
          text: responseText || "⚠️ No changes made.",
          mentions,
        });

        zaynReply(responseMsg.key.id, async (reactionMsg) => {
          const emoji = reactionMsg.message?.reactionMessage?.text;
          if (emoji === "👍") {
            await sock.sendMessage(jid, {
              text: "✔️ Admin removal confirmed.",
              mentions: [sender],
            });
            removeReply(responseMsg.key.id);
          }
        });

        break;
      }

      case "list":
      case "-l": {
        if (config.roles["2"].length === 0) {
          await sock.sendMessage(jid, {
            text: "👑 No admins found.",
            mentions: [sender],
          });
          return;
        }

        const getNames = await Promise.all(
          config.roles["2"].map(async (uid) => ({
            uid,
            name: await getName(uid),
          }))
        );

        const responseText = `👑 Admin list:\n${getNames
          .map((u) => `- @${u.name}`)
          .join("\n")}`;
        const mentions = [sender, ...config.roles["2"]];

        const responseMsg = await sock.sendMessage(jid, {
          text: responseText,
          mentions,
        });

        zaynReply(responseMsg.key.id, async (reactionMsg) => {
          const emoji = reactionMsg.message?.reactionMessage?.text;
          if (emoji === "👍") {
            await sock.sendMessage(jid, {
              text: "✔️ Admin list view confirmed.",
              mentions: [sender],
            });
            removeReply(responseMsg.key.id);
          }
        });

        break;
      }

      default: {
        const errorMsg = await sock.sendMessage(jid, {
          text: "⚠️ Error: Invalid command.\nUse: /admin add <@tag | reply | uid>, /admin remove <@tag | uid>, or /admin list",
          mentions: [sender],
        });

        zaynReply(errorMsg.key.id, async (replyMsg) => {
          const text = replyMsg.message?.conversation || replyMsg.message?.extendedTextMessage?.text || "";
          if (text.toLowerCase().includes("help")) {
            await sock.sendMessage(jid, {
              text: "Commands:\n- /admin add <@tag | reply | uid> to add admin\n- /admin remove <@tag | uid> to remove admin\n- /admin list to view admins",
              mentions: [sender],
            });
            removeReply(errorMsg.key.id);
          }
        });

        break;
      }
    }
  }
};

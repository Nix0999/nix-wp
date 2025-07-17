const axios = require("axios");
const fs = require("fs");

const removeHomeDir = (str) => {
  if (typeof str !== "string") return str;
  const homeDir = process.env.HOME || process.env.USERPROFILE || "/home";
  return str.replace(new RegExp(homeDir, "g"), "~");
};

const langs = {
  en: {
    error: "❌ An error occurred:",
    invalidCode: "⚠️ Please provide code to execute.",
    restricted: "🔒 This command is restricted to developers.",
    timeout: "⏰ Code execution timed out after 5 seconds."
  }
};

module.exports = {
  name: "eval",
  aliases: ["ev"],
  role: 3,
  author: "TawsiN | JARiF",
  version: "4.1",
  category: "DEVELOPER",
  noPrefix: false,

  zayn: async ({
    sock, msg, message, args,
    api, sender, config, commands,
    addReply, zaynReply, removeReply,
    userMoney, userData, prefixesData,
    groupSettings, SaveData, GetData
  }) => {
    const getLang = (key) => {
      const lang = config?.lang || "en";
      return langs[lang][key] || langs.en[key];
    };

    const code = args.join(" ");
    if (!code) return await message.reply(getLang("invalidCode"));

    const devs = config.roles?.["3"] || [];
    if (!devs.includes(sender)) {
      return await message.reply(getLang("restricted"));
    }

    const out = async (output) => {
      if (typeof output === "object") return;
      return await message.reply(String(output));
    };

    try {
      const evalFunc = new Function(
        "axios", "fs", "sock", "msg", "message", "args", "api", "sender",
        "config", "commands", "addReply", "zaynReply", "removeReply",
        "userMoney", "userData", "prefixesData", "groupSettings", "SaveData", "GetData", "out",
        `return (async () => {
          try {
            return ${code};
          } catch (innerErr) {
            throw innerErr;
          }
        })();`
      );

      const evalResult = await Promise.race([
        evalFunc(
          axios, fs, sock, msg, message, args, api, sender,
          config, commands, addReply, zaynReply, removeReply,
          userMoney, userData, prefixesData, groupSettings, SaveData, GetData, out
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error("⏰ Execution timed out")), 5000))
      ]);

      await out(evalResult);
    } catch (err) {
      const errorMessage = `${getLang("error")}\n${removeHomeDir(err.stack || err.toString())}`;
      await message.reply(errorMessage);

      try {
        await SaveData("eval_errors", {
          timestamp: new Date().toISOString(),
          sender,
          code,
          error: err.toString(),
          stack: removeHomeDir(err.stack || "No stack")
        });
      } catch (saveErr) {
        console.error("⚠️ Could not save eval error:", saveErr);
      }
    }
  }
};

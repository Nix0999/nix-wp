const axios = require("axios");
const { DateTime } = require("luxon");

const countryTimezones = {
  bangladesh: "Asia/Dhaka",
  india: "Asia/Kolkata",
  usa: "America/New_York",
  uk: "Europe/London",
  japan: "Asia/Tokyo",
  canada: "America/Toronto",
  australia: "Australia/Sydney",
  brazil: "America/Sao_Paulo",
  germany: "Europe/Berlin",
  russia: "Europe/Moscow",
  china: "Asia/Shanghai",
  malaysia: "Asia/Kuala_Lumpur",
  saudi: "Asia/Riyadh",
  egypt: "Africa/Cairo",
  france: "Europe/Paris",
  italy: "Europe/Rome",
  spain: "Europe/Madrid",
  turkey: "Europe/Istanbul"
};

module.exports = {
  name: "time",
  aliases: ["timezone", "worldtime"],
  category: "TOOLS",
  description: "Get current time of any country",
  usage: "time <country>",
  role: 0,
  author: "ArYAN",
  version: "0.0.1",
  cooldown: 3,

  zayn: async ({ sock, msg, args }) => {
    if (!args[0]) {
      return await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Please provide a country name.\nExample: time Bangladesh" },
        { quoted: msg }
      );
    }

    const country = args.join(" ").toLowerCase();
    const timezone = countryTimezones[country];

    if (!timezone) {
      return await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `❌ Country "${country}" not supported or not found.\n\nSupported countries:\n${Object.keys(countryTimezones).map(c => `- ${c}`).join("\n")}`
        },
        { quoted: msg }
      );
    }

    try {
      const now = DateTime.now().setZone(timezone);
      const formatted = `🕒 Time in ${country.charAt(0).toUpperCase() + country.slice(1)}\n📅 Date: ${now.toFormat("cccc, LLLL dd, yyyy")}\n⏰ Time: ${now.toFormat("hh:mm a")}\n🌍 Timezone: ${timezone}`;
      await sock.sendMessage(msg.key.remoteJid, { text: formatted }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Failed to fetch time. Please try again later." },
        { quoted: msg }
      );
    }
  }
};

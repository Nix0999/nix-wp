const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");

module.exports = {
  name: "video",
  aliases: ["vid", "yt"],
  version: "1.5.0",
  author: "ArYAN",
  role: 0,
  description: "Download YouTube audio/video by name or URL",
  category: "MUSIC",
  noPrefix: false,

  zayn: async function ({ sock, msg, args }) {
    const jid = msg.key.remoteJid;
    const apiKey = "itzaryan";
    let type = "video";
    let videoId, topResult;

    await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });

    try {
      const mode = args[0];
      const inputArg = args[1];

      // Handle by URL or command
      if ((mode === "-v" || mode === "-a") && inputArg) {
        type = mode === "-a" ? "audio" : "video";
        const urlObj = new URL(inputArg);
        if (urlObj.hostname === "youtu.be") {
          videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes("youtube.com")) {
          const urlParams = new URLSearchParams(urlObj.search);
          videoId = urlParams.get("v");
        }
        if (!videoId) throw new Error("Invalid YouTube URL");
        const searchResults = await ytSearch(videoId);
        if (!searchResults || !searchResults.videos.length) throw new Error("No video found");
        topResult = searchResults.videos[0];
      } else {
        const query = args.join(" ");
        if (!query) {
          return await sock.sendMessage(jid, { text: "❗ Use: video song-name or video -v/-a URL" }, { quoted: msg });
        }
        const searchResults = await ytSearch(query);
        if (!searchResults || !searchResults.videos.length) throw new Error("No results found");
        topResult = searchResults.videos[0];
        videoId = topResult.videoId;
      }

      const duration = topResult.timestamp;
      const timeParts = duration.split(":").map(Number);
      const totalSeconds = timeParts.length === 3
        ? timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]
        : timeParts[0] * 60 + timeParts[1];
      if (totalSeconds > 600) throw new Error("Only videos under 10 minutes supported");

      const apiUrl = `https://xyz-nix.vercel.app/aryan/youtube?id=${videoId}&type=${type}&apikey=${apiKey}`;
      const dlRes = await axios.get(apiUrl, { timeout: 25000 });
      const dlUrl = dlRes.data.downloadUrl;

      const fileRes = await axios.get(dlUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(fileRes.data);
      const ext = type === "audio" ? "mp3" : "mp4";
      const safeTitle = topResult.title.replace(/[\\/:*?"<>|]/g, "").substring(0, 50);
      const filename = `${safeTitle}.${ext}`;
      const filepath = path.join(__dirname, filename);
      fs.writeFileSync(filepath, buffer);

      await sock.sendMessage(jid, {
        [type]: fs.readFileSync(filepath),
        mimetype: type === "audio" ? "audio/mpeg" : "video/mp4",
        caption:
          `${type === "audio" ? "🎵 AUDIO" : "🎬 VIDEO"} INFO\n` +
          `━━━━━━━━━━━━━━━\n` +
          `📌 Title: ${topResult.title}\n` +
          `📺 Channel: ${topResult.author.name}\n` +
          `👁 Views: ${topResult.views.toLocaleString()}\n` +
          `📅 Uploaded: ${topResult.ago}\n` +
          `📽 Duration: ${topResult.timestamp}`
      }, { quoted: msg });

      fs.unlinkSync(filepath);
      await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

    } catch (err) {
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: msg });
      await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
    }
  }
};

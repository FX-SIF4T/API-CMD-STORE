
const axios = require("axios");

module.exports = {
  config: {
    name: "song",
    aliases:["sing","ms","music"],
    version: "1.0.0",
    author: "SIFAT",
    countDown: 5,
    role: 0,
    shortDescription: "Download songs",
    longDescription: "Search and download music",
    category: "music",
    guide: "{pn} <song name>"
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");

    if (!query) return;

    const react = (emoji) => {
      api.setMessageReaction(
        emoji,
        event.messageID,
        () => {},
        true
      );
    };

    try {
      react("🪖☁️😈🔎😈☁️🪖");

      const url = `https://fxs-music-apis.onrender.com/api/song?q=${encodeURIComponent(query)}`;

      const response = await axios.get(url, {
        responseType: "stream",
        timeout: 120000
      });

      const contentType = response.headers["content-type"] || "";

      if (!contentType.includes("audio")) {
        response.data.destroy();
        throw new Error("Invalid audio response");
      }

      react("🚂🫠☁️⏳☁️🫠💨");

      api.sendMessage(
        {
          attachment: response.data
        },
        event.threadID,
        (err) => {
          if (err) {
            react("❌❌❌😅❌❌❌");
          } else {
            react("🫦✨☠️🎵☠️✨🫦");
          }
        },
        event.messageID
      );

    } catch (error) {
      console.error("SONG ERROR:", error);
      react("❌❌❌😅❌❌❌");
    }
  }
};

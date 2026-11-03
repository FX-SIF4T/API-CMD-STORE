
module.exports = {
  config: {
    name: "ss",
    version: "1.0.0",
    author: "SIFAT",
    countDown: 5,
    role: 0,
    shortDescription: "Website Screenshot",
    longDescription: "Take screenshot of any website",
    category: "utility",
    guide: "{pn} [url]"
  },

  onStart: async function ({ api, event, args }) {
    const axios = require("axios");

    let url = args.join(" ").trim();

    if (!url && event.messageReply) {
      const text = event.messageReply.body || "";
      const match = text.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i);
      url = match ? match[0] : "";
    }

    if (!url) {
      return api.sendMessage(
        "Please provide a website URL or reply to a link.\nExample: .ss google.com",
        event.threadID,
        event.messageID
      );
    }

    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    try {
      new URL(url);

      const res = await axios.get(
        `https://fxswebssapi.vercel.app/api/ss?q=${encodeURIComponent(url)}`
      );

      if (!res.data.status || !res.data.screenshot) {
        return api.sendMessage(
          "Screenshot could not be generated.",
          event.threadID,
          event.messageID
        );
      }

      const image = await axios.get(res.data.screenshot, {
        responseType: "stream"
      });

      return api.sendMessage({
        body: `Website Screenshot\nURL: ${res.data.screenshot}\nAuthor: SIFAT`,
        attachment: image.data
      }, event.threadID, event.messageID);

    } catch (error) {
      return api.sendMessage(
        "Invalid URL or screenshot generation failed.",
        event.threadID,
        event.messageID
      );
    }
  }
};

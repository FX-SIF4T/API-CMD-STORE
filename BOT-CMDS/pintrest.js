const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API = "https://fxspinterestapi.vercel.app";
const KEY = "sifatx404";
const CACHE = path.join(__dirname, "cache", "pintrest");
const MAX_MB = 24; 

if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE, { recursive: true });

const UA = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36" };

async function toFile(url, ext, timeout = 60000, params) {
  const file = path.join(CACHE, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`);
  const res = await axios.get(url, { params, responseType: "arraybuffer", timeout, headers: UA, maxContentLength: MAX_MB * 1024 * 1024 });
  if (!res.data || res.data.byteLength < 500) throw new Error("empty file");
  fs.writeFileSync(file, Buffer.from(res.data));
  return file;
}


async function imageFile(url) {
  try { return await toFile(url, "jpg", 30000); }
  catch { return await toFile(`${API}/api/image`, "jpg", 30000, { url, key: KEY }); }
}

function clean(files) {
  for (const f of files) fs.unlink(f, () => {});
}

function short(t, n = 60) {
  t = (t || "").replace(/\s+/g, " ").trim() || "ɴᴏ ᴛɪᴛʟᴇ";
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

function errMsg(e) {
  const s = e?.response?.status;
  if (s === 401 || s === 403) return "ᴀᴘɪ ᴋᴇʏ ɪɴᴠᴀʟɪᴅ!";
  if (s === 404) return "ᴀᴘɪ ɴᴏᴛ ꜰᴏᴜɴᴅ (404)!";
  if (s === 413) return "ᴠɪᴅᴇᴏ ᴛᴏᴏ ʟᴀʀɢᴇ!";
  if (e?.code === "ECONNABORTED") return "ᴀᴘɪ ᴛɪᴍᴇᴏᴜᴛ, ᴛʀʏ ᴀɢᴀɪɴ!";
  return "ᴘɪɴᴛʀᴇꜱᴛ ᴀᴘɪ ᴇʀʀᴏʀ!";
}

module.exports = {
  config: {
    name: "pintrest",
    aliases: ["pin", "pinterest"],
    version: "1.0.0",
    author: "SIFAT",
    countDown: 10,
    role: 0,
    shortDescription: "ᴘɪɴᴛʀᴇꜱᴛ ꜱᴇᴀʀᴄʜ",
    longDescription: "ꜱᴇᴀʀᴄʜ ᴀɴᴅ ᴅᴏᴡɴʟᴏᴀᴅ ᴘɪɴᴛʀᴇꜱᴛ ɪᴍᴀɢᴇꜱ ᴀɴᴅ ᴠɪᴅᴇᴏꜱ",
    category: "media",
    guide: "{pn} <query> [-limit]  → ɪᴍᴀɢᴇꜱ\n{pn} -v <query> [-limit]  → ᴠɪᴅᴇᴏꜱ, ʀᴇᴘʟʏ ɴᴜᴍʙᴇʀ ᴛᴏ ᴅᴏᴡɴʟᴏᴀᴅ"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    let input = args.join(" ").trim();
    const isVideo = /(?:^|\s)-v(?:\s|$)/i.test(input);
    input = input.replace(/(?:^|\s)-v(?=\s|$)/i, " ").trim();

    const m = input.match(/(?:^|\s)-(\d+)\s*$/);
    const limit = m ? Math.min(Math.max(parseInt(m[1]), 1), isVideo ? 10 : 30) : (isVideo ? 6 : 10);
    if (m) input = input.replace(/(?:^|\s)-(\d+)\s*$/, "").trim();

    if (!input) return api.sendMessage("ᴘʟᴇᴀꜱᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ꜱᴇᴀʀᴄʜ ᴋᴇʏᴡᴏʀᴅ.\nᴇx: pin cat -5 | pin -v cat -5", threadID, messageID);

    api.setMessageReaction?.("⏳💨👀🦖🐊😊🫩👌👉👈🚂👺", messageID, () => {}, true);
    const files = [];
    try {
      const res = await axios.get(`${API}${isVideo ? "/api/video/search" : "/api/search"}`, {
        params: { q: input, limit, key: KEY },
        timeout: 90000
      });
      const results = (res.data?.results || []).slice(0, limit);
      if (!results.length) {
        api.setMessageReaction?.("❌", messageID, () => {}, true);
        return api.sendMessage("ɴᴏ ᴘɪɴᴛʀᴇꜱᴛ ʀᴇꜱᴜʟᴛꜱ ꜰᴏᴜɴᴅ!", threadID, messageID);
      }

      if (isVideo) {
        const videos = results
          .map(v => ({ title: v.title, hls: v.hls_url, download: v.download_url, cover: v.cover_url, pin: v.pin_url }))
          .filter(v => v.hls || v.download);
        if (!videos.length) return api.sendMessage("ᴠɪᴅᴇᴏ ɴᴏᴛ ꜰᴏᴜɴᴅ!", threadID, messageID);

    
        const covers = await Promise.all(videos.map(v => v.cover ? imageFile(v.cover).catch(() => null) : null));
        covers.forEach(f => f && files.push(f));

        let body = `🎬 ᴘɪɴᴛʀᴇꜱᴛ ᴠɪᴅᴇᴏ: ${input}\n\n`;
        videos.forEach((v, i) => { body += `${i + 1}. ${short(v.title)}\n`; });
        body += `\n↪ ʀᴇᴘʟʏ 1-${videos.length} ᴛᴏ ᴅᴏᴡɴʟᴏᴀᴅ`;

        return api.sendMessage(
          { body, attachment: files.map(f => fs.createReadStream(f)) },
          threadID,
          (err, info) => {
            clean(files);
            if (err || !info) return;
            global.GoatBot.onReply.set(info.messageID, {
              commandName: module.exports.config.name,
              messageID: info.messageID,
              author: event.senderID,
              videos
            });
            api.setMessageReaction?.("🫪😶😞😚✅👌🫠🙃🥳", messageID, () => {}, true);
          },
          messageID
        );
      }

      
      const imgs = (await Promise.all(results.map(r => r.image_url ? imageFile(r.image_url).catch(() => null) : null))).filter(Boolean);
      files.push(...imgs);
      if (!imgs.length) return api.sendMessage("ɪᴍᴀɢᴇ ʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ!", threadID, messageID);

      for (let i = 0; i < imgs.length; i += 10) {
        await new Promise(r => api.sendMessage({
          body: i === 0 ? `🖼 ᴘɪɴᴛʀᴇꜱᴛ: ${input} (${imgs.length})` : "",
          attachment: imgs.slice(i, i + 10).map(f => fs.createReadStream(f))
        }, threadID, () => r(), i === 0 ? messageID : undefined));
      }
      clean(files);
      api.setMessageReaction?.("💖😍🥰😘✅💖😂👀💨", messageID, () => {}, true);
    } catch (e) {
      clean(files);
      api.setMessageReaction?.("❌🫥😞😕🫤🙁☹️😢😥😥😟", messageID, () => {}, true);
      return api.sendMessage(errMsg(e), threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID } = event;
    if (event.senderID !== Reply.author) return;
    const choice = (event.body || "").trim();
    if (!/^\d+$/.test(choice)) return;

    const v = Reply.videos[parseInt(choice) - 1];
    if (!v) return api.sendMessage(`ɪɴᴠᴀʟɪᴅ ɴᴜᴍʙᴇʀ! (1-${Reply.videos.length})`, threadID, messageID);

    api.setMessageReaction?.("⏳☹️😤😮‍💨🙄🧐🤫🥶😩", messageID, () => {}, true);
    let file;
    try {
      
      file = v.download
        ? await toFile(v.download, "mp4", 180000)
        : await toFile(`${API}/api/video/download`, "mp4", 180000, { url: v.hls, key: KEY });

      api.sendMessage({
        body: `🎬 ᴘɪɴᴛʀᴇꜱᴛ ᴠɪᴅᴇᴏ\nᴛɪᴛʟᴇ: ${short(v.title, 100)}`,
        attachment: fs.createReadStream(file)
      }, threadID, (err) => {
        clean([file]);
        api.setMessageReaction?.(err ? "❌😤😮‍💨🙄🧐🤫🥶" : "😤😮‍💨🙄🧐🤫🥶✅", messageID, () => {}, true);
        if (err) api.sendMessage("ᴠɪᴅᴇᴏ ꜱᴇɴᴅ ꜰᴀɪʟᴇᴅ (ᴍᴀʏʙᴇ ᴛᴏᴏ ʟᴀʀɢᴇ)!", threadID, messageID);
      }, messageID);
    } catch (e) {
      if (file) clean([file]);
      api.setMessageReaction?.("😤😮‍💨🙄🧐🥶❌🙄🧐🤫🥶", messageID, () => {}, true);
      return api.sendMessage(errMsg(e) === "ᴘɪɴᴛʀᴇꜱᴛ ᴀᴘɪ ᴇʀʀᴏʀ!" ? "ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ!" : errMsg(e), threadID, messageID);
    }
  }
};

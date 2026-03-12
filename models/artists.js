const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    img: { 
      type: String, 
      required: true, 
      validate: {
        validator: function(value) {
          return /^https?:\/\/.*$/.test(value) || /^\/uploads\/.*$/.test(value);
        },
        message: "Invalid image URL or file path",
      }
    },
    text: { type: String, default: "" },
    para1: { type: String, default: "" },
    para2: { type: String, default: "" },
    para3: { type: String, default: "" },
    hitSong: { type: String, default: "" },
    charity: { type: String, default: "" },
    aboutCharity: { type: String, default: "" },
    fanClubCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Celebritieschema.index({ name: 1 });

module.exports = mongoose.model("Artist", artistSchema);






























// platforms: {
//   spotify: { type: String, match: /^https?:\/\/.*/, default: "" },
//   soundCloud: { type: String, match: /^https?:\/\/.*/, default: "" },
//   youtube: { type: String, match: /^https?:\/\/.*/, default: "" },
//   instagram: { type: String, match: /^https?:\/\/.*/, default: "" },
//   appleMusic: { type: String, match: /^https?:\/\/.*/, default: "" },
//   beatport: { type: String, match: /^https?:\/\/.*/, default: "" },
//   bandcamp: { type: String, match: /^https?:\/\/.*/, default: "" },
//   twitter: { type: String, match: /^https?:\/\/.*/, default: "" },
//   deezer: { type: String, match: /^https?:\/\/.*/, default: "" },
//   audiomack: { type: String, match: /^https?:\/\/.*/, default: "" },
//   twitch: { type: String, match: /^https?:\/\/.*/, default: "" },
// },
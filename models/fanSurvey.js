const mongoose = require("mongoose");

const fanSurveySchema = new mongoose.Schema(
  {
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },
    artistName: { type: String, required: true },

    // Step 1 — Personal Info
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true },
    location: { type: String, required: true },

    // Step 2 — Survey Questions
    q1_howLongFan: { type: String, required: true },
    q2_attendedShow: { type: String, required: true },
    q3_careerAdvice: { type: String, required: true },
    q4_wantConversation: {
      type: String,
      enum: ["yes", "no"],
      required: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FanSurvey", fanSurveySchema);

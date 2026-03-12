const express = require("express");
const mongoose = require("mongoose");
const Artist = require("../models/artists.js");
const FanSurvey = require("../models/fanSurvey.js");
const Joi = require("joi");
const router = express.Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const surveySchema = Joi.object({
  // Step 1
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  location: Joi.string().required(),
  // Step 2
  q1_howLongFan: Joi.string().required(),
  q2_attendedShow: Joi.string().required(),
  q3_careerAdvice: Joi.string().required(),
  q4_wantConversation: Joi.string().valid("yes", "no").required(),
});

// ─── Middleware ────────────────────────────────────────────────────────────────

const validateArtistId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.artistId)) {
    return res.status(400).json({ message: "Invalid artist ID" });
  }
  next();
};

// ─── Public Routes ─────────────────────────────────────────────────────────────

/**
 * POST /api/fan-club/join/:artistId
 * Submit the full 2-step fan survey and join the artist's fan club.
 * Increments the artist's fanClubCount on success.
 */
router.post("/fan-club/join/:artistId", validateArtistId, async (req, res) => {
  const { error } = surveySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { artistId } = req.params;
  const {
    name,
    email,
    phone,
    location,
    q1_howLongFan,
    q2_attendedShow,
    q3_careerAdvice,
    q4_wantConversation,
  } = req.body;

  try {
    // Find the artist
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    // Check for duplicate email per artist (prevent double-joining)
    const existingEntry = await FanSurvey.findOne({ artistId, email: email.toLowerCase() });
    if (existingEntry) {
      return res.status(409).json({
        message: "You have already joined this fan club with this email address.",
      });
    }

    // Save the survey
    const survey = new FanSurvey({
      artistId,
      artistName: artist.name,
      name,
      email,
      phone,
      location,
      q1_howLongFan,
      q2_attendedShow,
      q3_careerAdvice,
      q4_wantConversation: q4_wantConversation.toLowerCase(),
    });

    await survey.save();

    // Increment artist fan club count
    await Artist.findByIdAndUpdate(artistId, { $inc: { fanClubCount: 1 } });

    // Response — include a flag so the frontend knows the Q4 answer
    const responseMessage =
      q4_wantConversation.toLowerCase() === "no"
        ? "Thank you for participating in the survey!"
        : "Welcome to the fan club! We'll be in touch.";

    return res.status(201).json({
      success: true,
      message: responseMessage,
      wantsConversation: q4_wantConversation.toLowerCase() === "yes",
      data: survey,
    });
  } catch (err) {
    console.error("Error joining fan club:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

/**
 * GET /api/fan-club/:artistId
 * Returns the fan club member count for a specific artist.
 */
router.get("/fan-club/:artistId", validateArtistId, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.artistId).select("name fanClubCount");
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }
    return res.status(200).json({
      success: true,
      artistName: artist.name,
      fanClubCount: artist.fanClubCount,
    });
  } catch (err) {
    console.error("Error fetching fan club count:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// ─── Admin Routes ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/fan-club
 * Returns ALL fan survey submissions (paginated, newest first).
 * Query params: ?page=1&limit=20
 */
router.get("/admin/fan-club", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      FanSurvey.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FanSurvey.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: submissions,
    });
  } catch (err) {
    console.error("Error fetching all fan surveys (admin):", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

/**
 * GET /api/admin/fan-club/:artistId
 * Returns ALL fan survey submissions for a specific artist (admin).
 * Query params: ?page=1&limit=20
 */
router.get("/admin/fan-club/:artistId", validateArtistId, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { artistId } = req.params;

    // Verify artist exists
    const artist = await Artist.findById(artistId).select("name fanClubCount");
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    const [submissions, total] = await Promise.all([
      FanSurvey.find({ artistId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FanSurvey.countDocuments({ artistId }),
    ]);

    return res.status(200).json({
      success: true,
      artistName: artist.name,
      fanClubCount: artist.fanClubCount,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: submissions,
    });
  } catch (err) {
    console.error("Error fetching fan surveys for artist (admin):", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

module.exports = router;

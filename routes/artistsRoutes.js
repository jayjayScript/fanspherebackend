const express = require("express");
const mongoose = require("mongoose");
const Artist = require("../models/artists.js"); // Corrected typo
const router = express.Router();

const validateArtist = (data) => {
  const requiredFields = ["name", "img"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return `${field} is required`;
    }
  }
  return null;
};

// Handle an array of artist objects
router.post("/artists", async (req, res) => {

  const validationError = validateArtist(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const artist = {
      name: req.body.name,
      img: req.body.img, // The image URL
      para1: req.body.para1 || '',
      para2: req.body.para2 || '',
      para3: req.body.para3 || '',
      hitSong: req.body.hitSong || '',
      platforms: req.body.platforms || {},
      text: req.body.text || '',
    };

    // Save the artist
    const newArtist = await Artist.create(artist);
    res.status(201).json(newArtist);
  } catch (error) {
    console.error('Error adding artist:', error);

    if (error.code === 11000) {
      res.status(400).json({ message: "Duplicate artist", error:  error.keyValue });
    } else {
      res.status(500).json({ message: "Error adding artist", error:  error.keyValue });
    }
  }
});

router.get("/artists", async (req, res) => {
  try {
    const artists = await Artist.find();
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get an artist by ID
router.get("/artists/:id", async (req, res) => {
  // Changed from "/api/artists/:id" to "/artists/:id"
  const { id } = req.params; // Extract the ID from the request parameters

  try {
    // Validate the ID as a MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid artist ID" });
    }

    // Query the database to find the artist by ID
    const artist = await Artist.findById(id);

    // Handle case where artist is not found
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    // Return the artist data
    res.status(200).json(artist);
  } catch (error) {
    // Handle unexpected server errors
    console.error("Error fetching artist:", error);
    res
      .status(500)
      .json({ message: "Error fetching artist", error: error.message });
  }
});

// Update an artist by ID
router.patch("/artists/:id", async (req, res) => {
  try {
    const artist = await Artist.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }
    res.status(200).json(artist);
  } catch (error) {
    res.status(400).json({ message: "Error updating artist", error });
  }
});

// Delete an artist by ID
router.delete("/artists/:id", async (req, res) => {
  try {
    const artist = await Artist.findByIdAndDelete(req.params.id);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }
    res.status(200).json(artist);
  } catch (error) {
    res.status(500).json({ message: "Error deleting artist", error });
  }
});

module.exports = router;

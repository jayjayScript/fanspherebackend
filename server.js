require("dotenv").config(); // This loads the .env file

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
// const multer = require("multer");
// const cloudinary = require("cloudinary")
// const path = require("path");

const artistRoutes = require("./routes/artistsRoutes");

const app = express();

// CORS configuration - Allow all origins for now (adjust as needed for security)
const allowedOrigins = [
  "https://artistphere.onrender.com", // Production frontend
  "http://localhost:3000",           // Development frontend
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS")); // Block the request
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
};
app.use(express.json()); // Ensure this line is present to parse JSON request bodies
app.use(cors(corsOptions));

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not defined in the environment variables");
}

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

app.use("/api", artistRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to Artists API");
});

// listen to port
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

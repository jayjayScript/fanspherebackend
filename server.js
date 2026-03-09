require("dotenv").config(); // Load environment variables
const cloudinary = require("cloudinary").v2;
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const artistRoutes = require("./routes/artistsRoutes");
const helmet = require("helmet");
const { OAuth2Client } = require('google-auth-library');

const app = express();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Define allowed origins
const allowedOrigins = [
  // "https://artistphere.onrender.com", // No trailing slash
  "https://fansphere.network",
  "https://www.fansphere.network",
  "http://localhost:3000",
];

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    console.log("Origin:", origin); // Log the origin for debugging
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS")); // Block the request
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Allow cookies and credentials
};


// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(helmet());
app.use(cors(corsOptions)); // Apply CORS middleware
app.options('*', cors(corsOptions)); // Enable pre-flight request for all routes

// Google OAuth 2.0 Client
const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.BACKEND_URL}/api/auth/google/callback`,
});

// Google OAuth 2.0 Routes
app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    res.status(200).json({
      message: "User verified",
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      },
    });
  } catch (error) {
    console.error("Google Authentication Error:", error);
    res.status(401).json({ message: "Invalid authentication" });
  }
});

// MongoDB connection
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not defined in the environment variables");
}

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log("✅ MongoDB already connected");
    return;
  }
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error(err); // Log full error details
  }
};


// Call this in your API routes before handling requests
(async () => {
  await connectDB();
})();

// Routes
app.use("/api", artistRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to Celebrities API");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  if (err.message === "Not allowed by CORS") {
    res.status(403).json({ message: "CORS Error: Access Denied" });
  } else {
    res.status(500).json({ message: "An unexpected error occurred" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

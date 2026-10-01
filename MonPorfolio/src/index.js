// src/index.js
import express from "express";  // ou const express = require("express") si CommonJS

const app = express();

// Route simple pour tester
app.get("/", (req, res) => {
  res.send("🚀 Docker fonctionne !");
});

// Écoute sur 0.0.0.0 pour que Docker puisse exposer le port
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});

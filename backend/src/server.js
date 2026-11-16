require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");

const prisma = require("./config/prisma");
const { storageName } = require("./utils/storage");
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const userRoutes = require("./routes/userRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const folderRoutes = require("./routes/folderRoutes");
const messageRoutes = require("./routes/messageRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const integrationRoutes = require("./routes/integrationRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();
const httpServer = http.createServer(app);

// Render (comme la plupart des hébergeurs) place un relais devant l'application : sans ce réglage,
// tous les visiteurs auraient la même adresse IP et partageraient la même limite de requêtes.
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api", limiter);

// Stockage local (développement) : les documents archivés ne sont JAMAIS servis en accès libre,
// uniquement via /api/documents/:id/fichier avec un lien signé. Seules les captures de paiement
// restent servies statiquement (affichées dans l'espace super-admin).
app.use("/uploads/documents", (req, res) => res.status(404).json({ message: "Ressource introuvable." }));
app.use("/uploads", express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "archivix-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/abonnement", subscriptionRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/activite", activityRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Ressource introuvable." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Fichier trop volumineux (limite multer)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Fichier trop volumineux : 20 Mo maximum par fichier." });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? "Erreur serveur interne." : err.message });
});

// --- Socket.io : discussion instantanée + notifications en temps réel ---
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || "*", credentials: true },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentification requise."));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return next(new Error("Utilisateur introuvable."));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Jeton invalide."));
  }
});

io.on("connection", (socket) => {
  // Salle personnelle pour recevoir ses notifications en temps réel
  socket.join(`user:${socket.user.id}`);

  socket.on("rejoindre_document", (documentId) => {
    socket.join(`document:${documentId}`);
  });
  socket.on("quitter_document", (documentId) => {
    socket.leave(`document:${documentId}`);
  });
});

app.set("io", io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`[Archivix] API + Socket.io démarrés sur le port ${PORT}`);
  console.log(`[Archivix] Base de données PostgreSQL via Prisma`);
  console.log(`[Archivix] Stockage des fichiers : ${storageName()}`);
});

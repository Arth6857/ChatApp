import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app)

// Initialize socket.io server
export const io = new Server(server, {
    cors: {origin: "*"}
})

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Socket.io connection handler
io.on("connection", (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId) userSocketMap[userId] = socket.id;
    
    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", ()=>{
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

// Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors());


// Routes setup
app.use("/api/status", (req, res)=> res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)


// Connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log("🚀 Server is running on PORT:", PORT);
});

// Export server for Vervel
export default server;












// import express from "express";
// import "dotenv/config";
// import cors from "cors";
// import http from "http";
// import { connectDB } from "./lib/db.js";
// import userRouter from "./routes/userRoutes.js";
// import messageRouter from "./routes/messageRoutes.js";
// import { Server } from "socket.io";

// const app = express();
// const server = http.createServer(app);

// export const io = new Server(server, {
//   cors: { origin: "*" }
// });

// // Online users map
// export const userSocketMap = {};

// // ⛔ Moved everything inside connectDB() SUCCESS
// const startServer = async () => {
//   try {
//     await connectDB();  // ⭐ Connect BEFORE anything else
//     console.log("MongoDB connected successfully!");

//     // ---------------- SOCKET.IO ----------------
//     io.on("connection", (socket) => {
//       const userId = socket.handshake.query.userId;
//       console.log("User Connected:", userId);

//       if (userId) userSocketMap[userId] = socket.id;

//       io.emit("getOnlineUsers", Object.keys(userSocketMap));

//       socket.on("disconnect", () => {
//         console.log("User Disconnected:", userId);
//         delete userSocketMap[userId];
//         io.emit("getOnlineUsers", Object.keys(userSocketMap));
//       });
//     });

//     // ---------------- MIDDLEWARE ----------------
//     app.use(express.json({ limit: "4mb" }));
//     app.use(cors());

//     // ---------------- ROUTES ----------------
//     app.use("/api/status", (req, res) => res.send("Server is live"));
//     app.use("/api/auth", userRouter);
//     app.use("/api/messages", messageRouter);

//     // ---------------- START SERVER ----------------
//     const PORT = process.env.PORT || 5001;
//     server.listen(PORT, () => {
//       console.log(`Server running on PORT ${PORT}`);
//     });

//   } catch (err) {
//     console.error("❌ Failed to start server:", err);
//   }
// };

// startServer();

// // Export server for Vercel
// export default server;
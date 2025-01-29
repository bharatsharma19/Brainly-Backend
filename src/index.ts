require("dotenv").config();

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { random } from "./utils";
import { ContentModel, LinkModel, UserModel } from "./db";
import { userMiddleware } from "./middleware";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req: any, res: any) => {
  res.json({ message: "Welcome to Brainly" });
});

app.post("/api/v1/signup", async (req: any, res: any) => {
  const { username, name, email, password } = req.body;

  if (!username || !password || !name || !email) {
    return res.status(400).json({ message: "Please provide all details" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({ username, name, email, password: hashedPassword });

    // Return a token
    const token = jwt.sign({ username }, process.env.JWT_PASSWORD || "Secret");

    res.json({ token });
  } catch (error) {
    res.status(409).json({ message: "User already exists" });
  }
});

app.post("/api/v1/signin", async (req: any, res: any) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please provide all details" });
  }

  const existingUser = await UserModel.findOne({ username });

  if (!existingUser || !existingUser.password) {
    return res.status(403).json({ message: "Incorrect credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);

  if (!isPasswordValid) {
    return res.status(403).json({ message: "Incorrect credentials" });
  }

  const token = jwt.sign(
    { id: existingUser._id },
    process.env.JWT_PASSWORD || "Secret"
  );
  res.json({ token });
});

app.post("/api/v1/content", userMiddleware, async (req: any, res: any) => {
  const { link, type, title } = req.body;

  await ContentModel.create({
    link,
    type,
    title,
    userId: req.userId,
    tags: [],
  });

  res.json({ message: "Content added" });
});

app.get("/api/v1/content", userMiddleware, async (req: any, res: any) => {
  const content = await ContentModel.find({ userId: req.userId }).populate(
    "userId",
    "username"
  );
  res.json({ content });
});

app.delete("/api/v1/content", userMiddleware, async (req: any, res: any) => {
  const { contentId } = req.body;

  if (!contentId) {
    return res.status(400).json({ message: "Content ID is required" });
  }

  await ContentModel.deleteOne({ _id: contentId, userId: req.userId });

  res.json({ message: "Content deleted" });
});

app.post("/api/v1/brain/share", userMiddleware, async (req: any, res: any) => {
  const { share } = req.body;

  if (share) {
    const existingLink = await LinkModel.findOne({ userId: req.userId });

    if (existingLink) {
      return res.json({ hash: existingLink.hash });
    }

    const hash = random(10);
    await LinkModel.create({ userId: req.userId, hash });

    return res.json({ hash });
  }

  await LinkModel.deleteOne({ userId: req.userId });

  res.json({ message: "Share link removed" });
});

app.get("/api/v1/brain/:shareLink", async (req: any, res: any) => {
  const { shareLink } = req.params;

  const link = await LinkModel.findOne({ hash: shareLink });

  if (!link) {
    return res.status(400).json({ message: "Invalid share link" });
  }

  const [content, user] = await Promise.all([
    ContentModel.find({ userId: link.userId }),
    UserModel.findById(link.userId),
  ]);

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  res.json({ username: user.username, content });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

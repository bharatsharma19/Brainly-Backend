const request = require("supertest");
const jwt = require("jsonwebtoken");
const { app } = require("../src/index");
const { UserModel, ContentModel, LinkModel } = require("../src/db");

describe("API Tests", () => {
  let token;
  let userId;
  let contentId;
  let shareLink;
  let createdUser;

  // Create a test user by signing up before all tests
  beforeAll(async () => {
    // Ensure no existing user exists to avoid conflicts
    const existingUser = await UserModel.findOne({ username: "testuser" });

    if (existingUser) {
      // If user exists, use that user
      userId = existingUser._id;
      token = jwt.sign({ id: userId }, process.env.JWT_PASSWORD || "Secret");
      createdUser = { _id: userId, username: "testuser" };
    } else {
      // Create the user if not exists
      const response = await request(app).post("/api/v1/signup").send({
        username: "testuser",
        name: "Test User",
        email: "testuser@example.com",
        password: "password",
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      token = response.body.token;
      userId = jwt.decode(token).id;
      createdUser = { _id: userId, username: "testuser" };
    }
  });

  // Clean up after tests
  afterAll(async () => {
    await ContentModel.deleteMany({ userId: createdUser._id });
    await LinkModel.deleteMany({ userId: createdUser._id });
    await UserModel.deleteOne({ _id: createdUser._id });
  });

  test("GET / should return welcome message", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Welcome to Brainly");
  });

  test("POST /api/v1/signup should sign up a new user", async () => {
    const response = await request(app).post("/api/v1/signup").send({
      username: "newuser",
      name: "New User",
      email: "newuser@example.com",
      password: "password",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  test("POST /api/v1/signup should return 409 if user exists", async () => {
    const response = await request(app).post("/api/v1/signup").send({
      username: "testuser",
      name: "Test User",
      email: "testuser@example.com",
      password: "password",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("User already exists");
  });

  test("POST /api/v1/signin should sign in an existing user", async () => {
    const response = await request(app)
      .post("/api/v1/signin")
      .send({ username: "testuser", password: "password" });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  test("POST /api/v1/signin should return 403 for invalid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/signin")
      .send({ username: "testuser", password: "wrongpassword" });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Incorrect password");
  });

  test("POST /api/v1/content should create content (Authenticated)", async () => {
    const response = await request(app)
      .post("/api/v1/content")
      .set("Authorization", `${token}`)
      .send({
        link: "http://example.com",
        type: "article",
        title: "Test Content",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Content added");

    const content = await ContentModel.findOne({ userId });
    contentId = content._id;
  });

  test("GET /api/v1/content should get all content (Authenticated)", async () => {
    const response = await request(app)
      .get("/api/v1/content")
      .set("Authorization", `${token}`);

    expect(response.status).toBe(200);
    expect(response.body.content).toBeInstanceOf(Array);
  });

  test("DELETE /api/v1/content should delete content (Authenticated)", async () => {
    const response = await request(app)
      .delete("/api/v1/content")
      .set("Authorization", `${token}`)
      .send({ contentId });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Content deleted");
  });

  test("POST /api/v1/brain/share should generate a share link (Authenticated)", async () => {
    const response = await request(app)
      .post("/api/v1/brain/share")
      .set("Authorization", `${token}`)
      .send({ share: true });

    expect(response.status).toBe(200);
    expect(response.body.hash).toBeDefined();

    shareLink = response.body.hash;
  });

  test("GET /api/v1/brain/:shareLink should get shared content", async () => {
    const response = await request(app).get(`/api/v1/brain/${shareLink}`);
    expect(response.status).toBe(200);
    expect(response.body.username).toBeDefined();
    expect(response.body.content).toBeInstanceOf(Array);
  });

  test("GET /api/v1/brain/:shareLink should return 400 for invalid link", async () => {
    const response = await request(app).get("/api/v1/brain/invalidlink");
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid share link");
  });

  test("POST /api/v1/brain/share should remove share link (Authenticated)", async () => {
    const response = await request(app)
      .post("/api/v1/brain/share")
      .set("Authorization", `${token}`)
      .send({ share: false });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Share link removed");
  });
});

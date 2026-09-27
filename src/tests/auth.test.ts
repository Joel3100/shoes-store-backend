import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "../generated/prisma/client";
import { cleanupTestData } from "./helpers/cleanup";
import app from "../app";

const prisma = new PrismaClient();

describe("Auth", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("creates a new user and never returns the password hash", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "alice@test.local",
        password: "password123",
        fullName: "Alice Test",
      });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe("alice@test.local");
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it("rejects a duplicate email with 409", async () => {
      await request(app).post("/api/auth/register").send({
        email: "bob@test.local",
        password: "password123",
        fullName: "Bob Test",
      });

      const response = await request(app).post("/api/auth/register").send({
        email: "bob@test.local",
        password: "password123",
        fullName: "Bob Again",
      });

      expect(response.status).toBe(409);
    });

    it("rejects a password shorter than 8 characters", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "carol@test.local",
        password: "short",
        fullName: "Carol Test",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/auth/login and GET /api/auth/me", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        email: "dave@test.local",
        password: "password123",
        fullName: "Dave Test",
      });
    });

    it("logs in with correct credentials and sets a cookie", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "dave@test.local",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("rejects an incorrect password with the same message as a nonexistent email", async () => {
      const wrongPassword = await request(app).post("/api/auth/login").send({
        email: "dave@test.local",
        password: "wrongpassword",
      });
      const noSuchUser = await request(app).post("/api/auth/login").send({
        email: "nobody@test.local",
        password: "whatever123",
      });

      expect(wrongPassword.status).toBe(401);
      expect(noSuchUser.status).toBe(401);
      expect(wrongPassword.body.error).toBe(noSuchUser.body.error);
    });

    it("allows access to /me with a valid session, and rejects without one", async () => {
      const agent = request.agent(app);

      await agent.post("/api/auth/login").send({
        email: "dave@test.local",
        password: "password123",
      });

      const authed = await agent.get("/api/auth/me");
      expect(authed.status).toBe(200);
      expect(authed.body.user.email).toBe("dave@test.local");

      const unauthed = await request(app).get("/api/auth/me");
      expect(unauthed.status).toBe(401);
    });
  });
});
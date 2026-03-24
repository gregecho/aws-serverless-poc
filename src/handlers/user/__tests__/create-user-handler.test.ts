import { Errors } from "@@utils/errors";
import { UserService } from "@@services/user/userService";
import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  createUserHandler,
  deleteUserHandler,
  getUserByIdHandler,
  listUsersHandler,
  updateUserHandler,
} from "..";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("User handler", () => {
  describe("createUser handler", () => {
    // Mock UserService.create
    const mockCreate = vi.fn();

    vi.spyOn(UserService.prototype, "create").mockImplementation(mockCreate);

    test("should return 200 when user created", async () => {
      const name = faker.person.firstName();
      const email = faker.internet.email();
      // Type-safe mocking
      mockCreate.mockResolvedValue({
        id: faker.string.uuid(),
        name: name,
        email: email,
        createdAt: faker.date.anytime().toDateString(),
      });

      const userData = {
        name: name,
        email: email,
      };

      const event = {
        body: JSON.stringify(userData),
        headers: {
          "Content-Type": "application/json",
        },
      } as any;

      const response = await createUserHandler(event, {} as any);
      expect(mockCreate).toHaveBeenCalledWith({ name, email });
      expect(response).toBeDefined();
      expect(response!.statusCode).toBe(200);

      const body = JSON.parse(response!.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        name,
        email,
      });
    });

    test("should return 400 when email is invalid", async () => {
      const userData = {
        name: faker.person.firstName(),
        email: "invalid-email-format",
      };

      const event = {
        body: JSON.stringify(userData),
        headers: {
          "Content-Type": "application/json",
        },
      } as any;

      const response = await createUserHandler(event, {} as any);

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("Validation failed");
      expect(body.error.details[0].path).toEqual(["email"]);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("getUserById handler", () => {
    const mockGetById = vi.fn();

    vi.spyOn(UserService.prototype, "getById").mockImplementation(mockGetById);

    test("should return 200 when user exists", async () => {
      const name = faker.person.firstName();
      const email = faker.internet.email();
      const userId = faker.string.uuid();
      // Type-safe mocking
      mockGetById.mockResolvedValue({
        id: userId,
        name,
        email,
        createdAt: faker.date.anytime().toDateString(),
      });

      const event = {
        pathParameters: { id: userId },
        body: "{}",
        headers: {
          "Content-Type": "application/json",
        },
      } as any;

      const response = await getUserByIdHandler(event, {} as any);
      console.log("DEBUG getUserById response after body:null", response);

      expect(mockGetById).toHaveBeenCalledWith(userId);
      expect(response).toBeDefined();
      expect(response!.statusCode).toBe(200);

      const body = JSON.parse(response!.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: userId,
        name,
        email,
      });
    });

    test("should return 404 when user does not exist", async () => {
      const userId = faker.string.uuid();
      mockGetById.mockRejectedValue(Errors.NOT_FOUND("user"));

      const event = {
        pathParameters: { id: userId },
        body: "{}",
        headers: {
          "Content-Type": "application/json",
        },
      } as any;

      const response = await getUserByIdHandler(event, {} as any);

      expect(mockGetById).toHaveBeenCalledWith(userId);
      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    });
  });

  describe("listUsers handler", () => {
    const mockList = vi.fn();
    vi.spyOn(UserService.prototype, "list").mockImplementation(mockList);

    test("should return 200 with list of users", async () => {
      const users = Array.from({ length: 3 }, () => ({
        id: faker.string.uuid(),
        name: faker.person.firstName(),
        email: faker.internet.email(),
        createdAt: new Date().toISOString(),
      }));
      mockList.mockResolvedValue(users);

      const event = {
        queryStringParameters: null,
        body: null,
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await listUsersHandler(event, {} as any);
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(3);
    });

    test("should return 200 with empty list", async () => {
      mockList.mockResolvedValue([]);

      const event = {
        queryStringParameters: null,
        body: null,
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await listUsersHandler(event, {} as any);
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
    });
  });

  describe("updateUser handler", () => {
    const mockUpdate = vi.fn();
    vi.spyOn(UserService.prototype, "update").mockImplementation(mockUpdate);

    test("should return 200 with updated user", async () => {
      const userId = faker.string.uuid();
      const updated = {
        id: userId,
        name: "Updated Name",
        email: faker.internet.email(),
        createdAt: new Date().toISOString(),
      };
      mockUpdate.mockResolvedValue(updated);

      const event = {
        pathParameters: { id: userId },
        body: JSON.stringify({ name: "Updated Name" }),
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await updateUserHandler(event, {} as any);
      expect(mockUpdate).toHaveBeenCalledWith(userId, { name: "Updated Name" });
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.name).toBe("Updated Name");
    });

    test("should return 404 when user does not exist", async () => {
      const userId = faker.string.uuid();
      mockUpdate.mockRejectedValue(Errors.NOT_FOUND("user"));

      const event = {
        pathParameters: { id: userId },
        body: JSON.stringify({ name: "New Name" }),
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await updateUserHandler(event, {} as any);
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    });
  });

  describe("deleteUser handler", () => {
    const mockDelete = vi.fn();
    vi.spyOn(UserService.prototype, "delete").mockImplementation(mockDelete);

    test("should return 200 when user deleted", async () => {
      const userId = faker.string.uuid();
      mockDelete.mockResolvedValue(undefined);

      const event = {
        pathParameters: { id: userId },
        body: null,
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await deleteUserHandler(event, {} as any);
      expect(mockDelete).toHaveBeenCalledWith(userId);
      expect(response.statusCode).toBe(200);
    });

    test("should return 404 when user does not exist", async () => {
      const userId = faker.string.uuid();
      mockDelete.mockRejectedValue(Errors.NOT_FOUND("user"));

      const event = {
        pathParameters: { id: userId },
        body: null,
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await deleteUserHandler(event, {} as any);
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    });
  });
});

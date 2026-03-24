import {
  createUserHandler,
  deleteUserHandler,
  getUserByIdHandler,
  listUsersHandler,
  updateUserHandler,
} from "@@handlers/user";
import { UserService } from "@@services/user/userService";
import { Errors } from "@@utils/errors";
import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@@clients/dynamoClient", () => ({
  dynamo: { send: vi.fn().mockResolvedValue({}) },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const makeUser = () => ({
  id: faker.string.uuid(),
  name: faker.person.firstName(),
  email: faker.internet.email(),
  createdAt: new Date().toISOString(),
});

describe("User API (integration)", () => {
  describe("createUser API (integration)", () => {
    const mockCreate = vi.fn();
    beforeEach(() => {
      vi.spyOn(UserService.prototype, "create").mockImplementation(mockCreate);
    });

    test("should return 200 when request is valid", async () => {
      const user = makeUser();
      mockCreate.mockResolvedValue(user);

      const response = await createUserHandler(
        {
          body: JSON.stringify({ name: user.name, email: user.email }),
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({ name: user.name, email: user.email });
      expect(mockCreate).toHaveBeenCalledWith({
        name: user.name,
        email: user.email,
      });
    });

    test("should return 400 when email invalid", async () => {
      const response = await createUserHandler(
        {
          body: JSON.stringify({
            name: faker.person.firstName(),
            email: "invalid-email",
          }),
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error.code).toBe("VALIDATION_ERROR");
      expect(mockCreate).not.toHaveBeenCalled();
    });

    test("should return 400 when body is invalid JSON", async () => {
      const response = await createUserHandler(
        {
          body: "{ invalid json }",
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error.code).toBe("INVALID_JSON");
    });

    test("should return 500 when service throws", async () => {
      mockCreate.mockRejectedValue(new Error("DB down"));

      const response = await createUserHandler(
        {
          body: JSON.stringify({
            name: faker.person.firstName(),
            email: faker.internet.email(),
          }),
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("getUserById API (integration)", () => {
    const mockGetById = vi.fn();
    beforeEach(() => {
      vi.spyOn(UserService.prototype, "getById").mockImplementation(
        mockGetById,
      );
    });

    test("should return 200 with user data", async () => {
      const user = makeUser();
      mockGetById.mockResolvedValue(user);

      const response = await getUserByIdHandler(
        {
          pathParameters: { id: user.id },
          body: null,
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({ id: user.id, name: user.name });
    });

    test("should return 404 when user not found", async () => {
      mockGetById.mockRejectedValue(Errors.NOT_FOUND("user"));

      const response = await getUserByIdHandler(
        {
          pathParameters: { id: faker.string.uuid() },
          body: null,
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body).error.code).toBe("RESOURCE_NOT_FOUND");
    });

    test("should return 400 when id is not a valid UUID", async () => {
      const response = await getUserByIdHandler(
        {
          pathParameters: { id: "not-a-uuid" },
          body: null,
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error.code).toBe("VALIDATION_ERROR");
      expect(mockGetById).not.toHaveBeenCalled();
    });
  });

  describe("listUsers API (integration)", () => {
    const mockList = vi.fn();
    beforeEach(() => {
      vi.spyOn(UserService.prototype, "list").mockImplementation(mockList);
    });

    test("should return 200 with list of users", async () => {
      const users = [makeUser(), makeUser()];
      mockList.mockResolvedValue(users);

      const response = await listUsersHandler(
        {
          queryStringParameters: null,
          body: null,
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
    });

    test("should return 400 when query param is invalid", async () => {
      const response = await listUsersHandler(
        {
          queryStringParameters: { page: "abc" },
          body: null,
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error.code).toBe("VALIDATION_ERROR");
      expect(mockList).not.toHaveBeenCalled();
    });

    test("should return 500 when service throws", async () => {
      mockList.mockRejectedValue(new Error("DB error"));

      const response = await listUsersHandler(
        {
          queryStringParameters: null,
          body: null,
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("updateUser API (integration)", () => {
    const mockUpdate = vi.fn();
    beforeEach(() => {
      vi.spyOn(UserService.prototype, "update").mockImplementation(mockUpdate);
    });

    test("should return 200 with updated user", async () => {
      const user = makeUser();
      mockUpdate.mockResolvedValue(user);

      const response = await updateUserHandler(
        {
          pathParameters: { id: user.id },
          body: JSON.stringify({ name: user.name }),
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({ id: user.id });
    });

    test("should return 404 when user not found", async () => {
      mockUpdate.mockRejectedValue(Errors.NOT_FOUND("user"));

      const response = await updateUserHandler(
        {
          pathParameters: { id: faker.string.uuid() },
          body: JSON.stringify({ name: "New Name" }),
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body).error.code).toBe("RESOURCE_NOT_FOUND");
    });

    test("should return 400 when body fails validation", async () => {
      const response = await updateUserHandler(
        {
          pathParameters: { id: faker.string.uuid() },
          body: JSON.stringify({ email: "not-an-email" }),
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error.code).toBe("VALIDATION_ERROR");
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("deleteUser API (integration)", () => {
    const mockDelete = vi.fn();
    beforeEach(() => {
      vi.spyOn(UserService.prototype, "delete").mockImplementation(mockDelete);
    });

    test("should return 200 when user deleted", async () => {
      const id = faker.string.uuid();
      mockDelete.mockResolvedValue(undefined);

      const response = await deleteUserHandler(
        {
          pathParameters: { id },
          body: null,
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(200);
      expect(mockDelete).toHaveBeenCalledWith(id);
    });

    test("should return 404 when user not found", async () => {
      mockDelete.mockRejectedValue(Errors.NOT_FOUND("user"));

      const response = await deleteUserHandler(
        {
          pathParameters: { id: faker.string.uuid() },
          body: null,
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body).error.code).toBe("RESOURCE_NOT_FOUND");
    });

    test("should return 400 when id is not a valid UUID", async () => {
      const response = await deleteUserHandler(
        {
          pathParameters: { id: "bad-id" },
          body: null,
          headers: { "Content-Type": "application/json" },
        } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(400);
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});

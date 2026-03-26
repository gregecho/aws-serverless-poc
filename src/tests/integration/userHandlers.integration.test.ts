import {
  createUserHandler,
  deleteUserHandler,
  getUserByIdHandler,
  listUsersHandler,
  updateUserHandler,
} from "@@handlers/user";
import { UserServiceImpl } from "@@services/user/userServiceImpl";
import { Errors } from "@@utils/errors";
import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@@clients/aws.client", () => ({
  dynamo: { send: vi.fn().mockResolvedValue({}) },
  s3Client: {},
  sns: { send: vi.fn().mockResolvedValue({}) },
  bedrock: {},
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

const event = {
  body: (data: unknown) => JSON.stringify(data),
  path: (id: string) => ({ pathParameters: { id }, body: null, headers: { "Content-Type": "application/json" } } as any),
  query: (params: Record<string, string> | null) => ({ queryStringParameters: params, body: null, headers: { "Content-Type": "application/json" } } as any),
  post: (data: unknown) => ({ body: JSON.stringify(data), headers: { "Content-Type": "application/json" } } as any),
};

describe("User API (integration)", () => {
  describe("createUser", () => {
    const mockCreate = vi.spyOn(UserServiceImpl.prototype, "create");

    test("should return 200 when request is valid", async () => {
      const user = makeUser();
      mockCreate.mockResolvedValue(user);

      const response = await createUserHandler(event.post({ name: user.name, email: user.email }), {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({ name: user.name, email: user.email });
      expect(mockCreate).toHaveBeenCalledWith({ name: user.name, email: user.email });
    });

    test("should return 400 when email is invalid", async () => {
      const response = await createUserHandler(event.post({ name: faker.person.firstName(), email: "invalid-email" }), {} as any);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error.code).toBe("VALIDATION_ERROR");
      expect(mockCreate).not.toHaveBeenCalled();
    });

    test("should return 400 when body is invalid JSON", async () => {
      const response = await createUserHandler(
        { body: "{ invalid json }", headers: { "Content-Type": "application/json" } } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error.code).toBe("INVALID_JSON");
    });

    test("should return 500 when service throws", async () => {
      mockCreate.mockRejectedValue(new Error("DB down"));

      const response = await createUserHandler(event.post({ name: faker.person.firstName(), email: faker.internet.email() }), {} as any);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("getUserById", () => {
    const mockGetById = vi.spyOn(UserServiceImpl.prototype, "getById");

    test("should return 200 with user data", async () => {
      const user = makeUser();
      mockGetById.mockResolvedValue(user);

      const response = await getUserByIdHandler(event.path(user.id), {} as any);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).data).toMatchObject({ id: user.id, name: user.name });
    });

    test("should return 404 when user not found", async () => {
      mockGetById.mockRejectedValue(Errors.NOT_FOUND("user"));

      const response = await getUserByIdHandler(event.path(faker.string.uuid()), {} as any);

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body).error.code).toBe("RESOURCE_NOT_FOUND");
    });

    test("should return 400 when id is not a valid UUID", async () => {
      const response = await getUserByIdHandler(event.path("not-a-uuid"), {} as any);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error.code).toBe("VALIDATION_ERROR");
      expect(mockGetById).not.toHaveBeenCalled();
    });
  });

  describe("listUsers", () => {
    const mockList = vi.spyOn(UserServiceImpl.prototype, "list");

    test("should return 200 with list of users", async () => {
      const users = [makeUser(), makeUser()];
      mockList.mockResolvedValue(users);

      const response = await listUsersHandler(event.query(null), {} as any);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).data).toHaveLength(2);
    });

    test("should return 400 when query param is invalid", async () => {
      const response = await listUsersHandler(event.query({ page: "abc" }), {} as any);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error.code).toBe("VALIDATION_ERROR");
      expect(mockList).not.toHaveBeenCalled();
    });

    test("should return 500 when service throws", async () => {
      mockList.mockRejectedValue(new Error("DB error"));

      const response = await listUsersHandler(event.query(null), {} as any);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("updateUser", () => {
    const mockUpdate = vi.spyOn(UserServiceImpl.prototype, "update");

    test("should return 200 with updated user", async () => {
      const user = makeUser();
      mockUpdate.mockResolvedValue(user);

      const response = await updateUserHandler(
        { pathParameters: { id: user.id }, body: JSON.stringify({ name: user.name }), headers: { "Content-Type": "application/json" } } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).data).toMatchObject({ id: user.id });
      expect(mockUpdate).toHaveBeenCalledWith(user.id, { name: user.name });
    });

    test("should return 404 when user not found", async () => {
      mockUpdate.mockRejectedValue(Errors.NOT_FOUND("user"));

      const response = await updateUserHandler(
        { pathParameters: { id: faker.string.uuid() }, body: JSON.stringify({ name: "New Name" }), headers: { "Content-Type": "application/json" } } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body).error.code).toBe("RESOURCE_NOT_FOUND");
    });

    test("should return 400 when body fails validation", async () => {
      const response = await updateUserHandler(
        { pathParameters: { id: faker.string.uuid() }, body: JSON.stringify({ email: "not-an-email" }), headers: { "Content-Type": "application/json" } } as any,
        {} as any,
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error.code).toBe("VALIDATION_ERROR");
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("deleteUser", () => {
    const mockDelete = vi.spyOn(UserServiceImpl.prototype, "delete");

    test("should return 200 when user deleted", async () => {
      const id = faker.string.uuid();
      mockDelete.mockResolvedValue(undefined);

      const response = await deleteUserHandler(event.path(id), {} as any);

      expect(response.statusCode).toBe(200);
      expect(mockDelete).toHaveBeenCalledWith(id);
    });

    test("should return 404 when user not found", async () => {
      mockDelete.mockRejectedValue(Errors.NOT_FOUND("user"));

      const response = await deleteUserHandler(event.path(faker.string.uuid()), {} as any);

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body).error.code).toBe("RESOURCE_NOT_FOUND");
    });

    test("should return 400 when id is not a valid UUID", async () => {
      const response = await deleteUserHandler(event.path("bad-id"), {} as any);

      expect(response.statusCode).toBe(400);
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});

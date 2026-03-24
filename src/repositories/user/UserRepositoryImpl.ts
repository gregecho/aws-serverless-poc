import { dynamo } from "@@clients/dynamoClient";
import {
  UserBody,
  UserResponse,
  userResponseSchema,
} from "@@schemas/user/userSchema";
import { Errors } from "@@utils/errors";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { UserRepository } from "./UserRepository";

const TABLE = process.env.USERS_TABLE;

const PK = (id: string) => `USER#${id}`;
const SK = "PROFILE";

class UserRepositoryImpl implements UserRepository {
  async getById(userId: string): Promise<UserResponse> {
    const { Item } = await dynamo.send(
      new GetCommand({
        TableName: TABLE,
        Key: { PK: PK(userId), SK },
      }),
    );

    if (!Item) {
      throw Errors.NOT_FOUND("user");
    }

    return userResponseSchema.parse(Item);
  }

  async save(user: UserBody): Promise<UserResponse> {
    const userId = randomUUID();

    const item = {
      PK: PK(userId),
      SK,
      id: userId,
      ...user,
      createdAt: new Date().toISOString(),
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLE,
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)", // prevent overwrite
      }),
    );

    return userResponseSchema.parse(item);
  }

  async update(userId: string, user: Partial<UserBody>): Promise<UserResponse> {
    // Build UpdateExpression dynamically from partial fields
    const entries = Object.entries(user);
    if (entries.length === 0) {
      return this.getById(userId);
    }

    const UpdateExpression =
      "SET " + entries.map((_, i) => `#k${i} = :v${i}`).join(", ");

    const ExpressionAttributeNames = Object.fromEntries(
      entries.map(([k], i) => [`#k${i}`, k]),
    );

    const ExpressionAttributeValues = Object.fromEntries(
      entries.map(([, v], i) => [`:v${i}`, v]),
    );

    const { Attributes } = await dynamo.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: PK(userId), SK },
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ConditionExpression: "attribute_exists(PK)", // ensure exists
        ReturnValues: "ALL_NEW",
      }),
    );

    if (!Attributes) {
      throw Errors.NOT_FOUND("user");
    }

    return userResponseSchema.parse(Attributes);
  }

  async delete(userId: string): Promise<void> {
    await dynamo.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { PK: PK(userId), SK },
        ConditionExpression: "attribute_exists(PK)", // ensure exists
      }),
    );
  }

  async list(
    _query?: Record<string, string | undefined>,
  ): Promise<UserResponse[]> {
    const { Items = [] } = await dynamo.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: "SK = :sk",
        ExpressionAttributeValues: { ":sk": SK },
      }),
    );

    return Items.map((item) => userResponseSchema.parse(item));
  }
}

export function createUserRepository(): UserRepository {
  return new UserRepositoryImpl();
}

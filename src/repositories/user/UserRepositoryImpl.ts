import { dynamo } from '@@clients/dynamoClient';
import {
  UserBody,
  UserResponse,
  userResponseSchema,
} from '@@schemas/user/userSchema';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { UserRepository } from './UserRepository';

class UserRepositoryImpl implements UserRepository {
  private readonly TABLE = process.env.USERS_TABLE;
  private readonly PK_PREFIX = 'USER';
  private readonly USER_PROFILE_SK = 'PROFILE';

  async get(userId: string): Promise<UserResponse> {
    const user = await dynamo.send(
      new GetCommand({
        TableName: this.TABLE,
        Key: {
          PK: `${this.PK_PREFIX}#${userId}`,
          SK: this.USER_PROFILE_SK,
        },
      }),
    );
    return userResponseSchema.parse(user);
  }

  async save(user: UserBody): Promise<UserResponse> {
    const userId = randomUUID();

    const item = {
      PK: `${this.PK_PREFIX}#${userId}`,
      SK: this.USER_PROFILE_SK,
      id: userId,
      ...user,
      createdAt: new Date().toISOString(),
    };

    await dynamo.send(
      new PutCommand({
        TableName: this.TABLE,
        Item: item,
      }),
    );
    return userResponseSchema.parse(item);
  }
}

export function createUserRepository() {
  return new UserRepositoryImpl();
}

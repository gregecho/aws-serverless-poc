import { dynamo } from '@@clients/dynamoClient';
import type { UserBody, UserResponse } from '@@schemas/user/userSchema';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

export async function createUser(user: UserBody): Promise<UserResponse> {
  const TABLE = process.env.USERS_TABLE;

  const item: UserResponse = {
    id: randomUUID(),
    ...user,
    createdAt: new Date().toISOString(),
  };

  await dynamo.send(
    new PutCommand({
      TableName: TABLE,
      Item: item,
    }),
  );

  return item;
}

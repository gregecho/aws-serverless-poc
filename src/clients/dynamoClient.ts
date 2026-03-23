import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.IS_OFFLINE === 'true';

console.log('DYNAMODB_ENDPOINT:', process.env.DYNAMODB_ENDPOINT);
console.log('IS_OFFLINE:', process.env.IS_OFFLINE);

const client = new DynamoDBClient(
  isLocal // enable local dynamoDB for local dev
    ? {
        region: 'us-east-1',
        endpoint: process.env.DYNAMODB_ENDPOINT,
        credentials: {
          accessKeyId: 'local',
          secretAccessKey: 'local',
        },
      }
    : {}, // defalut to AWS
);

export const dynamo = DynamoDBDocumentClient.from(client);

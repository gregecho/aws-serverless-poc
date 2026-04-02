import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { KinesisClient } from "@aws-sdk/client-kinesis";
import { FirehoseClient } from "@aws-sdk/client-firehose";

const isLocal = process.env.IS_OFFLINE;
const region = process.env.AWS_REGION ?? "us-east-1";

// DynamoDB
export const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region }),
);

// S3
export const s3Client = new S3Client({ region });

// SNS — mock for local dev
const snsReal = new SNSClient({ region });

export const sns = {
  send: async (command: PublishCommand) => {
    if (isLocal) {
      const input = command.input;
      console.log("[SNS MOCK] publish:", {
        TopicArn: input.TopicArn,
        Message: input.Message,
        Subject: input.Subject,
      });
      return { MessageId: `mock-${Date.now()}` };
    }
    return snsReal.send(command);
  },
};

// Bedrock — mock
const bedrockReal = new BedrockRuntimeClient({ region });

export const bedrock = {
  send: async (command: InvokeModelCommand) => {
    if (isLocal) {
      console.log("[BEDROCK MOCK] invoke:", {
        modelId: command.input.modelId,
      });
      const mockResponse = {
        role: "assistant",
        content: [{ type: "text", text: "mock bedrock response" }],
      };
      return {
        body: new TextEncoder().encode(JSON.stringify(mockResponse)),
      };
    }
    return bedrockReal.send(command);
  },
};

// Kinesis Client
export const kinesis = new KinesisClient({});

// Firehose Client
export const firehose = new FirehoseClient({ region });

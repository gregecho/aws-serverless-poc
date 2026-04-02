import { kinesisFunctions } from "@@handlers/kinesis/kinesis.serverless";
import { userFunctions } from "@@handlers/user/user.serverless";
import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  service: "aws-serverless-infrastructure",
  useDotenv: true,
  frameworkVersion: "4",

  provider: {
    name: "aws",
    runtime: "nodejs22.x",
    region: "us-east-1",

    tracing: {
      lambda: true,
      apiGateway: true,
    },

    environment: {
      // DO NOT hardcode any resource
      //aws-serverless-infrastructure-users-dev
      USERS_TABLE: "${self:service}-users-${sls:stage}",
      IS_OFFLINE: '${env:IS_OFFLINE, "false"}',
      DYNAMODB_ENDPOINT: '${env:DYNAMODB_ENDPOINT, ""}',
      PORTRAITS_BUCKET: "${self:service}-portraits-${sls:stage}",
      VERIFICATION_TOPIC_ARN: { Ref: "VerificationTopic" },
      WEATHER_STREAM_NAME: { Ref: "WeatherStream" },
      WEATHER_FIREHOSE_NAME: { Ref: "WeatherFirehose" },
    },

    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
            Resource: "*",
          },
          {
            Effect: "Allow",
            Action: [
              "dynamodb:PutItem",
              "dynamodb:GetItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
              "dynamodb:Query",
              "dynamodb:Scan",
            ],
            Resource: [
              { "Fn::GetAtt": ["UsersTable", "Arn"] },
              // Permission for index
              {
                "Fn::Join": [
                  "/",
                  [{ "Fn::GetAtt": ["UsersTable", "Arn"] }, "index/*"],
                ],
              },
            ],
          },
          {
            Effect: "Allow",
            Action: ["s3:PutObject"],
            Resource: {
              "Fn::Join": [
                "",
                [
                  "arn:aws:s3:::",
                  "${self:service}-portraits-${sls:stage}",
                  "/*",
                ],
              ],
            },
          },
          {
            Effect: "Allow",
            Action: ["sns:Publish"],
            Resource: { Ref: "VerificationTopic" },
          },
          {
            Effect: "Allow",
            Action: ["bedrock:InvokeModel"],
            Resource:
              "arn:aws:bedrock:${self:provider.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
          },
          {
            Effect: "Allow",
            Action: [
              "kinesis:PutRecord",
              "kinesis:GetRecords",
              "kinesis:GetShardIterator",
              "kinesis:DescribeStream",
              "kinesis:ListShards",
            ],
            Resource: { "Fn::GetAtt": ["WeatherStream", "Arn"] },
          },
        ],
      },
    },
  },

  plugins: ["serverless-offline"],

  build: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["@aws-sdk/*"],
    },
  },

  functions: {
    ...userFunctions,
    ...kinesisFunctions,
  },

  resources: {
    Resources: {
      UsersTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "${self:provider.environment.USERS_TABLE}",
          BillingMode: "PAY_PER_REQUEST",
          AttributeDefinitions: [
            {
              AttributeName: "PK",
              AttributeType: "S",
            },
            {
              AttributeName: "SK",
              AttributeType: "S",
            },
            { AttributeName: "Email", AttributeType: "S" },
          ],
          KeySchema: [
            {
              AttributeName: "PK",
              KeyType: "HASH",
            },
            {
              AttributeName: "SK",
              KeyType: "RANGE",
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "EmailIndex",
              KeySchema: [{ AttributeName: "Email", KeyType: "HASH" }],
              Projection: { ProjectionType: "ALL" },
            },
          ],
        },
      },
      DocsBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:service}-docs-${sls:stage}",
          WebsiteConfiguration: {
            IndexDocument: "index.html",
          },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: false,
            BlockPublicPolicy: false,
            IgnorePublicAcls: false,
            RestrictPublicBuckets: false,
          },
        },
      },
      DocsBucketPolicy: {
        Type: "AWS::S3::BucketPolicy",
        Properties: {
          Bucket: { Ref: "DocsBucket" },
          PolicyDocument: {
            Statement: [
              {
                Effect: "Allow",
                Principal: "*",
                Action: "s3:GetObject",
                Resource: {
                  "Fn::Join": [
                    "",
                    [{ "Fn::GetAtt": ["DocsBucket", "Arn"] }, "/*"],
                  ],
                },
              },
            ],
          },
        },
      },
      PortraitsBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:service}-portraits-${sls:stage}",
        },
      },
      VerificationTopic: {
        Type: "AWS::SNS::Topic",
        Properties: {
          TopicName: "${self:service}-verification-${sls:stage}",
        },
      },
      WeatherStream: {
        Type: "AWS::Kinesis::Stream",
        Properties: {
          Name: "${self:service}-weather-${sls:stage}",
          ShardCount: 1,
        },
      },
      WeatherDataBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:service}-weather-data-${sls:stage}",
        },
      },
      FirehoseRole: {
        Type: "AWS::IAM::Role",
        Properties: {
          RoleName: "${self:service}-firehose-role-${sls:stage}",
          AssumeRolePolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: { Service: "firehose.amazonaws.com" },
                Action: "sts:AssumeRole",
              },
            ],
          },
          Policies: [
            {
              PolicyName: "FirehosePolicy",
              PolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                  {
                    Effect: "Allow",
                    Action: [
                      "kinesis:GetRecords",
                      "kinesis:GetShardIterator",
                      "kinesis:DescribeStream",
                      "kinesis:ListShards",
                    ],
                    Resource: { "Fn::GetAtt": ["WeatherStream", "Arn"] },
                  },
                  {
                    Effect: "Allow",
                    Action: ["s3:PutObject"],
                    Resource: {
                      "Fn::Join": [
                        "",
                        [{ "Fn::GetAtt": ["WeatherDataBucket", "Arn"] }, "/*"],
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      WeatherFirehose: {
        Type: "AWS::KinesisFirehose::DeliveryStream",
        Properties: {
          DeliveryStreamName: "${self:service}-weather-firehose-${sls:stage}",
          DeliveryStreamType: "KinesisStreamAsSource",
          KinesisStreamSourceConfiguration: {
            KinesisStreamARN: { "Fn::GetAtt": ["WeatherStream", "Arn"] },
            RoleARN: { "Fn::GetAtt": ["FirehoseRole", "Arn"] },
          },
          ExtendedS3DestinationConfiguration: {
            BucketARN: { "Fn::GetAtt": ["WeatherDataBucket", "Arn"] },
            RoleARN: { "Fn::GetAtt": ["FirehoseRole", "Arn"] },
            Prefix:
              "weather/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/",
            ErrorOutputPrefix: "errors/",
            BufferingHints: { IntervalInSeconds: 60, SizeInMBs: 5 },
            CompressionFormat: "GZIP",
          },
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;

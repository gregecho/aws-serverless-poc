import { userFunctions } from '@@handlers/user/user.serverless';
import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'aws-serverless-poc',

  frameworkVersion: '4',

  provider: {
    name: 'aws',
    runtime: 'nodejs22.x',
    region: 'us-east-1',

    environment: {
      USERS_TABLE: 'users-table',
    },

    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:PutItem', 'dynamodb:GetItem'],
            Resource: ['arn:aws:dynamodb:*:*:table/users-table'],
          },
        ],
      },
    },
  },

  plugins: ['serverless-offline', 'serverless-dynamodb'],

  functions: {
    ...userFunctions,
  },

  resources: {
    Resources: {
      UsersTable: {
        Type: 'AWS::DynamoDB::Table',

        Properties: {
          TableName: 'users-table',

          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            },
          ],

          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH',
            },
          ],

          BillingMode: 'PAY_PER_REQUEST',
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;

import { userFunctions } from '@@handlers/user/user.serverless';
import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'aws-serverless-infrastructure',

  frameworkVersion: '4',

  provider: {
    name: 'aws',
    runtime: 'nodejs22.x',
    region: 'us-east-1',

    environment: {
      // DO NOT hardcode any resource
      //aws-serverless-infrastructure-users-table-dev
      USERS_TABLE: '${self:service}-users-table-${sls:stage}',
    },

    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
            ],
            Resource: [
              { 'Fn::GetAtt': ['UsersTable', 'Arn'] },
              // Permission for index
              {
                'Fn::Join': [
                  '/',
                  [{ 'Fn::GetAtt': ['UsersTable', 'Arn'] }, 'index/*'],
                ],
              },
            ],
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
          TableName: '${self:provider.environment.USERS_TABLE}',
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'PK',
              AttributeType: 'S',
            },
            {
              AttributeName: 'SK',
              AttributeType: 'S',
            },
            { AttributeName: 'Email', AttributeType: 'S' },
          ],
          KeySchema: [
            {
              AttributeName: 'PK',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'SK',
              KeyType: 'RANGE',
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: 'EmailIndex',
              KeySchema: [{ AttributeName: 'Email', KeyType: 'HASH' }],
              Projection: { ProjectionType: 'ALL' },
            },
          ],
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;

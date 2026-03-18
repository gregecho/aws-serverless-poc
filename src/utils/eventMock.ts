import { APIGatewayProxyEvent } from 'aws-lambda';
import { apiGatewayMockEvent } from './apigw-event';

/**
 * Generates an APIGatewayProxyEvent based on the Zod schema
 */
export function getMockApiGatewayProxyEvent(
  payload?: unknown,
): APIGatewayProxyEvent {
  const mock = structuredClone(apiGatewayMockEvent);
  mock.requestContext.messageId = undefined;
  // Request schemas that extend from APIGatewayProxyEventSchema should have a JSONStringified body.
  // If this is the case, we want to avoid mock.body = "{\"body\":{\"author\":\""..." and
  // instead have mock.body = "{\"author\":\""..." without the preceeding "body".
  mock.body =
    payload && typeof payload === 'object' && 'body' in payload
      ? JSON.stringify(payload.body)
      : payload
        ? JSON.stringify(payload)
        : JSON.stringify(mock.body);
  return mock as APIGatewayProxyEvent;
}

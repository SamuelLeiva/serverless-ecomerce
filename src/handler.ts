import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

export const hello: APIGatewayProxyHandlerV2 = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Serverless Framework v4 + TypeScript!',
      path: event.requestContext.http.path,
    }),
  };
};

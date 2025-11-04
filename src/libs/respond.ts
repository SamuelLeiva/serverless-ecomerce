import { APIGatewayProxyResultV2 } from "aws-lambda";

export function respond<T>(
  statusCode: number,
  body: T
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

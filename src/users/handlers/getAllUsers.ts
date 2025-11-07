import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { respond } from "../../libs/respond";
import { dbClient } from "../../libs/dynamo";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export const main: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // consultar al cliente sobre los elementos de la tabla users
    const result = await dbClient.send(
      new ScanCommand({
        TableName: process.env.USERS_TABLE,
      })
    );

    // Convertir cada item del formato DynamoDB a objeto JS
    const users =
      result.Items?.map((item) => unmarshall(item)) ?? [];

    return respond(200, users);

    // responder la lista de users
  } catch (error) {
    console.error("❌ Lambda Error:", error);
    return respond(500, {
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};

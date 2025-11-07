import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { respond } from "../../libs/respond";
import { dbClient } from "../../libs/dynamo";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export const main: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // extraer el id (path parameter)
    const userId = event.pathParameters?.id;

    // 🔍 Validar ID
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      return respond(400, { message: "Invalid or missing user ID" });
    }

    // 🔎 Buscar el usuario en DynamoDB
    const result = await dbClient.send(
      new GetItemCommand({
        TableName: process.env.USERS_TABLE,
        Key: { id: { S: userId } },
      })
    );

    // 🚫 Si no existe
    if (!result.Item) {
      return respond(404, { message: `User with ID ${userId} not found` });
    }

    // ✅ Parsear el item
    const user = unmarshall(result.Item);

    return respond(200, user);

    // responder la lista de users
  } catch (error) {
    console.error("❌ Lambda Error:", error);
    return respond(500, {
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};

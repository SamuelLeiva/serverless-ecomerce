import { GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { respond } from "../../libs/respond";
import { dbClient } from "../../libs/dynamo";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export const main: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const userId = event.pathParameters?.id;

    // 🔍 Validar ID
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      return respond(400, { message: "Invalid or missing user ID" });
    }

    if (!event.body) return respond(400, { message: "Missing body" });
    const { name, email } = JSON.parse(event.body);

    // 🔎 Buscar el usuario en DynamoDB
    const existingUserResult = await dbClient.send(
      new GetItemCommand({
        TableName: process.env.USERS_TABLE,
        Key: { id: { S: userId } },
      })
    );

    // 🚫 Si no existe
    if (!existingUserResult.Item) {
      return respond(404, { message: `User with ID ${userId} not found` });
    }

    const errors: string[] = [];

    //validar name y email
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      errors.push("Invalid name. Must be at least 2 characters.");
    }

    if (
      !email ||
      typeof email !== "string" ||
      !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)
    ) {
      errors.push("Invalid email format.");
    }

    if (errors.length > 0) return respond(400, { errors });

    // 🧩 Construir expresión de actualización dinámica
    const updateExpressionParts: string[] = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};

    if (name !== undefined) {
      updateExpressionParts.push("#name = :name");
      expressionNames["#name"] = "name";
      expressionValues[":name"] = { S: name };
    }

    if (email !== undefined) {
      updateExpressionParts.push("#email = :email");
      expressionNames["#email"] = "email";
      expressionValues[":email"] = { S: email };
    }

    const updateExpression = `SET ${updateExpressionParts.join(", ")}`;

    // 📝 Ejecutar UpdateItem
    const result = await dbClient.send(
      new UpdateItemCommand({
        TableName: process.env.USERS_TABLE,
        Key: { id: { S: userId } },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: "ALL_NEW",
      })
    );

    const updatedUser = unmarshall(result.Attributes ?? {});

    return respond(200, {
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Lambda Error:", error);
    return respond(500, {
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};

import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { respond } from "../../libs/respond";
import { User } from "../../shared/types";
import { dbClient } from "../../libs/dynamo";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";

export const main: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) return respond(400, { message: "Missing body" });
  //extraer data
  const { name, email } = JSON.parse(event.body) as Omit<User, "id">;
  const errors = [];

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

  if (errors.length > 0)
    return respond(400, { errors: errors.map((err) => err) });

  console.log(process.env.USERS_TABLE);

  //generar uuid y guardar en la tabla
  const userId = uuidv4();
  await dbClient.send(
    new PutItemCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        id: { S: userId },
        name: { S: name },
        email: { S: email },
      },
    })
  );

  //respuesta exitosa
  return respond(201, { message: "User created", userId });
};

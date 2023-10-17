import { DynamoDB } from "aws-sdk";

const dynamodb = new DynamoDB.DocumentClient();

export const handler = async (event: any) => {
  const { continentCode } = event.pathParameters;

  try {
    const result = await dynamodb
      .get({
        TableName: "Expenses",
        Key: { continentCode },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (dbError) {
    console.error(`DynamoDB Error: ${dbError}`);

    return {
      statusCode: 500,
      body: "Failed to fetch data",
    };
  }
};

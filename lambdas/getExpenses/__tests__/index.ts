import { handler } from "../index";
import { DynamoDB } from "aws-sdk";

const mockResult = {
  Item: {
    continentCode: "AS",
    totalExpenses: 2000,
    averageExpenses: 1000,
  },
};

jest.mock("aws-sdk", () => {
  return {
    S3: jest.fn().mockImplementation(() => ({
      getObject: jest.fn().mockImplementationOnce(() => {
        return {
          promise: () => Promise.resolve({ something: "something" }),
        };
      }),
    })),
    DynamoDB: {
      DocumentClient: jest.fn().mockImplementation(() => ({
        get: jest.fn().mockImplementationOnce(() => {
          return {
            promise: () => Promise.resolve(mockResult),
          };
        }),
        promise: jest.fn(),
      })),
    },
  };
});

describe("GetExpenses Lambda", () => {
  let mockEvent;
  let dynamoDb;

  beforeEach(() => {
    dynamoDb = new DynamoDB.DocumentClient();
    mockEvent = {
      pathParameters: {
        continentCode: "AS",
      },
    };
  });

  it("returns a successful response", async () => {
    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockResult.Item);
  });

  it("returns a 500 error if DynamoDB query fails", async () => {
    dynamoDb.promise.mockRejectedValueOnce(new Error("An error occurred"));

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe("Failed to fetch data");
  });
});

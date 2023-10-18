import { handler } from "../index";
import { DynamoDB } from "aws-sdk";
import { ExpensesResultObject } from "../types/expensesResultObject";

const mockResult: Omit<ExpensesResultObject, "id"> = {
  averageExpenses: [],
  totalExpenses: [],
  continent: {
    code: "AS",
    name: "Asia",
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
        scan: jest.fn().mockImplementationOnce(() => {
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

    const { averageExpenses, totalExpenses, continent } = JSON.parse(
      response.body
    );

    expect(response.statusCode).toBe(200);
    expect(continent).toStrictEqual(mockResult.continent);
    expect(averageExpenses).toStrictEqual(mockResult.averageExpenses);
    expect(totalExpenses).toStrictEqual(mockResult.totalExpenses);
  });

  it("returns a 500 error if DynamoDB query fails", async () => {
    dynamoDb.promise.mockRejectedValueOnce(new Error("An error occurred"));

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe("Failed to fetch data");
  });
});

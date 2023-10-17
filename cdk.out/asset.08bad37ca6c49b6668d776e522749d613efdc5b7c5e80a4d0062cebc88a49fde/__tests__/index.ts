import { handler } from "../index";
import { DynamoDB } from "aws-sdk";

jest.mock("aws-sdk", () => {
  return {
    S3: jest.fn().mockImplementation(() => ({
      getObject: jest.fn().mockReturnThis(),
      putObject: jest.fn().mockImplementationOnce(() => {
        return {
          promise: () => Promise.resolve({ something: "something" }),
        };
      }),
      createReadStream: jest.fn().mockReturnValue({
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === "line") {
            callback("Asia,2000,400");
          } else if (event === "close") {
            callback();
          }
        }),
      }),
    })),
    DynamoDB: {
      DocumentClient: jest.fn().mockImplementation(() => ({
        get: jest.fn().mockReturnThis(),
        promise: jest.fn(),
      })),
    },
  };
});

const sampleCsvBase64 = Buffer.from("year,expense\n2022,1000").toString(
  "base64"
);

describe("GetExpenses Lambda", () => {
  let mockEvent;
  let dynamoDb;

  beforeEach(() => {
    dynamoDb = new DynamoDB.DocumentClient();
    mockEvent = {
      body: sampleCsvBase64,
    };
  });

  it("returns a successful response", async () => {
    const mockResult = {
      Item: {
        continentCode: "AS",
        totalExpenses: 2000,
        averageExpenses: 1000,
      },
    };

    dynamoDb.promise.mockResolvedValueOnce(mockResult);

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual("File uploaded successfully");
  });

  it("returns a 500 error if DynamoDB query fails", async () => {
    dynamoDb.promise.mockRejectedValueOnce(new Error("An error occurred"));

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe("Failed to upload file");
  });
});

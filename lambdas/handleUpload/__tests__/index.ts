import { handler } from "../index"; // Replace with the actual path of your lambda
import { S3, DynamoDB } from "aws-sdk";
import { EventEmitter } from "events";
import { getContinentCode } from "../utils"; // Replace with the actual path of your utils

jest.mock("../utils", () => ({
  getContinentCode: jest.fn((continent: string) => `CODE_${continent}`),
}));

jest.mock("aws-sdk", () => {
  const mockEventEmitter = new EventEmitter();
  return {
    S3: jest.fn().mockImplementation(() => ({
      getObject: jest.fn().mockReturnThis(),
      createReadStream: jest.fn().mockReturnValue(mockEventEmitter),
    })),
    DynamoDB: {
      DocumentClient: jest.fn().mockImplementation(() => ({
        put: jest.fn().mockImplementationOnce(() => {
          return {
            promise: () => Promise.resolve(),
          };
        }),
        promise: jest.fn(),
      })),
    },
    mockEventEmitter, // Exporting this for manual triggering of events in the test
  };
});

describe("CSV Processor Lambda", () => {
  let mockEvent;
  let dynamoDb;
  let { mockEventEmitter } = require("aws-sdk");

  beforeEach(() => {
    dynamoDb = new DynamoDB.DocumentClient();
    mockEvent = {
      Records: [
        {
          s3: {
            bucket: {
              name: "fake-bucket",
            },
            object: {
              key: "fake-key",
            },
          },
        },
      ],
    };
  });

  it("should process a CSV from S3 and insert records into DynamoDB", async () => {
    const handlerPromise = handler(mockEvent); // Don't await yet

    // Manually trigger the "line" and "close" events
    mockEventEmitter.emit("line", "Asia,2000,400");
    mockEventEmitter.emit("close");

    await handlerPromise; // Now await the handler

    expect(dynamoDb.put).toHaveBeenCalled();
    expect(dynamoDb.put).toHaveBeenCalledWith({
      TableName: expect.any(String),
      Item: {
        continentCode: "CODE_Asia",
        totalExpenses: "2000",
        averageExpenses: "400",
      },
    });
  });
});

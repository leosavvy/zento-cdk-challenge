import { handler } from "../index"; // Replace with the actual path of your lambda
import { getContinentCode } from "../utils"; // Replace with the actual path of your utils
import readline from "readline";

jest.mock("readline", () => ({
  createInterface: jest.fn().mockReturnValue({
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === "line") {
        callback("Continentes,Gasto turístico,Periodo,Total");
        callback("Asia,2000,400");
      } else if (event === "close") {
        callback();
      }
    }),
  }),
}));

jest.mock("../utils", () => ({
  getContinentCode: jest.fn((continent: string) => ({
    code: `AS`,
    name: continent,
  })),
  getUuid: jest.fn().mockReturnValue("fake-uuid"),
}));

jest.mock("aws-sdk", () => {
  const { EventEmitter } = require("events");
  const mockEventEmitter = new EventEmitter();
  return {
    S3: jest.fn().mockImplementation(() => ({
      getObject: jest.fn().mockReturnThis(),
      createReadStream: jest.fn().mockReturnValue(mockEventEmitter),
    })),
    DynamoDB: {
      DocumentClient: jest.fn().mockImplementation(() => ({
        put: jest.fn().mockReturnThis(),
        promise: jest.fn(),
      })),
    },
    mockEventEmitter,
  };
});

describe("CSV Processor Lambda", () => {
  let mockEvent;
  let dynamoDb;
  const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

  let { mockEventEmitter } = require("aws-sdk");

  beforeEach(() => {
    const { DocumentClient } = require("aws-sdk").DynamoDB;
    dynamoDb = new DocumentClient();
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
    const handlerPromise = handler(mockEvent);

    mockEventEmitter.emit("line", "Asia,2000,400");
    mockEventEmitter.emit("close");

    await handlerPromise;
  });
});

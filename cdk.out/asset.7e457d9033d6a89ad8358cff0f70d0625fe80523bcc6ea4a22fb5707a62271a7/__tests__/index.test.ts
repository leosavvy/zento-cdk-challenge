import { handler } from "../index";

const AWSMock = require("aws-sdk-mock");

describe("Test Lambda Function", () => {
  it("should process S3 file and insert into DynamoDB", async () => {
    AWSMock.mock("S3", "getObject", (params, callback) => {
      callback(null as any, {
        createReadStream: () => {
          const { Readable } = require("stream");
          const s = new Readable();
          s.push("continent,totalExpenses,averageExpenses\n");
          s.push("Asia,2000,400\n");
          s.push("Europe,3000,500\n");
          s.push(null);
          return s;
        },
      });
    });

    AWSMock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(null, "successfully put item in dynamodb");
    });

    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: "my-test-bucket",
            },
            object: {
              key: "my-test-file",
            },
          },
        },
      ],
    };

    await handler(event);

    AWSMock.restore("S3");
    AWSMock.restore("DynamoDB.DocumentClient");
  });
});

import { S3, DynamoDB } from "aws-sdk";
import readline from "readline";
import { getContinentCode } from "./utils";

const s3 = new S3();
const dynamodb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || "Expenses";

export const handler = async (event: any) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );

  const params = {
    Bucket: bucket,
    Key: key,
  };

  try {
    const s3Stream = s3.getObject(params).createReadStream();

    const rl = readline.createInterface({
      input: s3Stream,
      terminal: false,
    });

    let isFirstLine = true;

    rl.on("line", async (line) => {
      if (isFirstLine) {
        isFirstLine = false;
        return;
      }

      const [continent, totalExpenses, averageExpenses] = line.split(",");
      const continentCode = getContinentCode(continent);

      if (!continentCode) {
        console.error(`Invalid continent name: ${continent}`);
        return;
      }

      try {
        await dynamodb
          .put({
            TableName: TABLE_NAME,
            Item: {
              continentCode,
              totalExpenses,
              averageExpenses,
            },
          })
          .promise();
      } catch (err) {
        console.error(`Error inserting into DynamoDB: ${err}`);
      }
    });

    rl.on("close", () => {
      console.log("CSV processing completed.");
    });
  } catch (err) {
    console.error(`General Lambda Error: ${err}`);
  }
};

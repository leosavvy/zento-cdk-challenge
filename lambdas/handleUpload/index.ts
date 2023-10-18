import { S3, DynamoDB } from "aws-sdk";
import * as readline from "readline";
import { getContinentCode } from "./utils";
import { ContinentCode } from "./types/continentCode";
import { ExpenseReport } from "./types/expenseReport";

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
        console.log(`Skipping first line: ${line}`);
        isFirstLine = false;
        return;
      }

      const [continent, reason, period, expenseTotal] = line.split(",");
      const continentObject: ContinentCode | null = getContinentCode(continent);

      if (!continentObject) {
        console.error(`Invalid continent name: ${continent}`);
        return;
      }

      const expenseObject: ExpenseReport = {
        continent: continentObject.name,
        period: parseInt(period),
        expenseTotal: parseInt(expenseTotal),
      };

      try {
        console.log(`Inserting record for ${continent}`);
        await dynamodb
          .put({
            TableName: TABLE_NAME,
            Item: {
              ...expenseObject,
            },
          })
          .promise();
        console.log(`Successfully inserted record for ${continent}`);
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

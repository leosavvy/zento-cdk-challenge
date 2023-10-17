import { S3, DynamoDB } from "aws-sdk";
import csv from "csv-parser";
import { getContinentCode } from "./utils";

const s3 = new S3();
const dynamodb = new DynamoDB.DocumentClient();

exports.handler = async (event: any) => {
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

    s3Stream
      .pipe(csv())
      .on("data", async (data) => {
        try {
          const { continent, totalExpenses, averageExpenses } = data;
          const continentCode = getContinentCode(continent);

          if (!continentCode) {
            console.error(`Invalid continent name: ${continent}`);
            return;
          }

          await dynamodb
            .put({
              TableName: "Expenses",
              Item: {
                continentCode,
                totalExpenses,
                averageExpenses,
              },
            })
            .promise();
        } catch (dbError) {
          console.error(`Error inserting into DynamoDB: ${dbError}`);
        }
      })
      .on("end", () => {
        console.log("CSV processing completed.");
      })
      .on("error", (streamError) => {
        console.error(`Error in S3 Stream: ${streamError}`);
      });
  } catch (err) {
    console.error(`General Lambda Error: ${err}`);
  }
};

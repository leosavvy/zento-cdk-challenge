import { S3 } from "aws-sdk";

const s3 = new S3();

export const handler = async (event: any) => {
  const content = Buffer.from(event.body, "base64");

  try {
    await s3
      .putObject({
        Bucket: "AnnualExpenses",
        Key: new Date().getFullYear().toString() + ".csv",
        Body: content,
      })
      .promise();

    return {
      statusCode: 200,
      body: "File uploaded successfully",
    };
  } catch (s3Error) {
    console.error(`S3 Upload Error: ${s3Error}`);

    return {
      statusCode: 500,
      body: "Failed to upload file",
    };
  }
};

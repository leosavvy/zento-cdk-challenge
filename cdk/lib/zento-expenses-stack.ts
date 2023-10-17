import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as path from "path";

export class ZentoExpensesStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "AnnualExpenses", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const table = new dynamodb.Table(this, "Expenses", {
      partitionKey: {
        name: "continentCode",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const handleUploadFunction = new lambda.Function(this, "HandleUpload", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "..", "..", "lambdas", "handleUpload")
      ),
    });

    const getExpensesFunction = new lambda.Function(this, "GetExpenses", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "..", "..", "lambdas", "getExpenses")
      ), // Replace with your path
    });

    const uploadCsvFunction = new lambda.Function(this, "UploadCsv", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "..", "..", "lambdas", "uploadCsv")
      ), // Replace with your path
    });

    const api = new apigateway.RestApi(this, "ExpensesApi", {
      deployOptions: {
        stageName: "v1",
      },
    });

    const uploadCsv = api.root.addResource("uploadCsv");
    const uploadCsvIntegration = new apigateway.LambdaIntegration(
      uploadCsvFunction
    );
    uploadCsv.addMethod("POST", uploadCsvIntegration);

    const expenses = api.root
      .addResource("api")
      .addResource("v1")
      .addResource("expenses");
    const continentResource = expenses.addResource("{continentCode}");
    const getExpensesIntegration = new apigateway.LambdaIntegration(
      getExpensesFunction
    );
    continentResource.addMethod("GET", getExpensesIntegration);

    bucket.grantPut(uploadCsvFunction);
    bucket.grantRead(handleUploadFunction);
    table.grantReadWriteData(handleUploadFunction);
    table.grantReadWriteData(getExpensesFunction);
  }
}

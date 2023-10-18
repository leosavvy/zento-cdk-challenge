import { DynamoDB } from "aws-sdk";
import { ExpensesResultObject } from "./types/expensesResultObject";
import { getContinentObjectFromCode, getUuid } from "../handleUpload/utils";

const dynamodb = new DynamoDB.DocumentClient();

export const handler = async (event: any) => {
  const { continentCode } = event.pathParameters;
  const continentObject = getContinentObjectFromCode(continentCode);

  if (!continentObject) {
    return {
      statusCode: 400,
      body: "Invalid continent code",
    };
  }

  try {
    const expenses = await dynamodb
      .scan({
        TableName: "Expenses",
        ScanFilter: {
          continentCode: {
            ComparisonOperator: "EQ",
            AttributeValueList: [continentCode],
          },
        },
      })
      .promise();

    const expensesResultObject: ExpensesResultObject = {
      id: getUuid().toString(),
      continent: continentObject,
      averageExpenses: [],
      totalExpenses: [],
    };

    if (!expenses.Items) {
      return {
        statusCode: 200,
        body: JSON.stringify(expensesResultObject),
      };
    }

    const expensesByYear = expenses.Items.reduce((acc, expense) => {
      if (!acc[expense.period]) {
        acc[expense.period] = {
          total: 0,
          count: 0,
        };
      }

      acc[expense.period].total += expense.expenseTotal;
      acc[expense.period].count += 1;

      return acc;
    }, {});

    const result = Object.entries(expensesByYear).reduce(
      (acc, [year, { total, count }]) => {
        acc.averageExpenses.push({
          year,
          value: total / count,
        });

        acc.totalExpenses.push({
          year,
          value: total,
        });

        return acc;
      },
      expensesResultObject
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (dbError) {
    console.error(`DynamoDB Error: ${dbError}`);

    return {
      statusCode: 500,
      body: "Failed to fetch data",
    };
  }
};

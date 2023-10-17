import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { ZentoExpensesStack } from "../lib/zento-expenses-stack";

const app = new cdk.App();
new ZentoExpensesStack(app, "ZentoExpensesStack");

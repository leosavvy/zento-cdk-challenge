import { ContinentCode } from "./continentCode";

export type ExpenseReport = {
  continent: ContinentCode["name"];
  period: number;
  expenseTotal: number;
};

import { ContinentCode } from "../../handleUpload/types/continentCode";

export type ExpensesResultObject = {
  id: string;
  continent: ContinentCode;
  totalExpenses: Array<Average>;
  averageExpenses: Array<Total>;
};

export type Average = {
  year: string;
  value: number;
};

export type Total = {
  year: string;
  value: number;
};

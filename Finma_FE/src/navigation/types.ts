export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  ReportFlow: undefined;
  TransactionFlow: undefined;
  Search: undefined;
  Profile: undefined;
};

export type ReportStackParamList = {
  Report: undefined;
  Calendar: undefined;
};

export type TransactionStackParamList = {
  TransactionList: undefined;
  TransactionDetail: { id: number };
  AddExpense: { mode?: 'EXPENSE' | 'INCOME' };
};

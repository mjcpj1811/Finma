import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LaunchScreen } from '../screens/welcome/LaunchScreen';
import { WelcomeOneScreen } from '../screens/welcome/WelcomeOneScreen';
import { WelcomeTwoScreen } from '../screens/welcome/WelcomeTwoScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { VerifyResetCodeScreen } from '../screens/auth/VerifyResetCodeScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { ResetPasswordSuccessScreen } from '../screens/auth/ResetPasswordSuccessScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { CategoriesScreen } from '../screens/category/CategoriesScreen';
import { SavingsScreen } from '../screens/category/SavingsScreen';
import { DebtsScreen } from '../screens/category/DebtsScreen';
import { RecurringTransactionsScreen } from '../screens/category/RecurringTransactionsScreen';
import { ManageSourcesScreen } from '../screens/home/ManageSourcesScreen';
import { SourceTransactionsScreen } from '../screens/home/SourceTransactionsScreen';
import { NotificationScreen } from '../screens/home/NotificationScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { AiAssistantScreen } from '../screens/profile/AiAssistantScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsDeleteAccountScreen } from '../screens/profile/SettingsDeleteAccountScreen';
import { SettingsNotificationsScreen } from '../screens/profile/SettingsNotificationsScreen';
import { SettingsPasswordScreen } from '../screens/profile/SettingsPasswordScreen';
import { SettingsPasswordSuccessScreen } from '../screens/profile/SettingsPasswordSuccessScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { ReportScreen } from '../screens/report/ReportScreen';
import { SearchScreen } from '../screens/report/SearchScreen';
import { ReportCalendarScreen } from '../screens/report/ReportCalendarScreen';
import { TransactionScreen } from '../screens/transaction/TransactionScreen';
import { AddTransactionScreen } from '../screens/transaction/AddTransactionScreen';

const TransactionDetailScreen =
  require('../screens/transaction/TransactionDetailScreen').TransactionDetailScreen;

const CategoryTransactionsScreen =
  require('../screens/category/CategoryTransactionsScreen').CategoryTransactionsScreen;

export type RootStackParamList = {
  Launch: undefined;
  WelcomeOne: undefined;
  WelcomeTwo: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyResetCode: { email: string };
  ResetPassword: { email: string; code: string };
  ResetPasswordSuccess: undefined;
  Home: undefined;
  Categories: undefined;
  CategoryTransactions: {
    categoryName: string;
    categoryGroup: 'financial' | 'expense' | 'income';
    categoryIconKey: string;
  };
  Savings: { savingId?: string } | undefined;
  Debts: { debtId?: string } | undefined;
  Recurring: undefined;
  Profile: undefined;
  AIAssistant: undefined;
  EditProfile: undefined;
  Settings: undefined;
  SettingsNotifications: undefined;
  SettingsPassword: undefined;
  SettingsPasswordSuccess: undefined;
  SettingsDeleteAccount: undefined;
  ManageSources: undefined;
  SourceTransactions: { sourceId: string };
  Report: undefined;
  ReportSearch: undefined;
  ReportCalendar: undefined;
  Transactions: undefined;
  AddTransaction:
    | {
        transactionId?: string;
        presetType?: 'income' | 'expense';
        presetCategoryId?: string;
        presetTitle?: string;
      }
    | undefined;
  TransactionDetail: { transactionId: string };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Launch"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Launch" component={LaunchScreen} />
        <Stack.Screen name="WelcomeOne" component={WelcomeOneScreen} />
        <Stack.Screen name="WelcomeTwo" component={WelcomeTwoScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyResetCode" component={VerifyResetCodeScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="ResetPasswordSuccess" component={ResetPasswordSuccessScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="CategoryTransactions" component={CategoryTransactionsScreen} />
        <Stack.Screen name="Savings" component={SavingsScreen} />
        <Stack.Screen name="Debts" component={DebtsScreen} />
        <Stack.Screen name="Recurring" component={RecurringTransactionsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AIAssistant" component={AiAssistantScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="SettingsNotifications" component={SettingsNotificationsScreen} />
        <Stack.Screen name="SettingsPassword" component={SettingsPasswordScreen} />
        <Stack.Screen name="SettingsPasswordSuccess" component={SettingsPasswordSuccessScreen} />
        <Stack.Screen name="SettingsDeleteAccount" component={SettingsDeleteAccountScreen} />
        <Stack.Screen name="ManageSources" component={ManageSourcesScreen} />
        <Stack.Screen name="SourceTransactions" component={SourceTransactionsScreen} />
        <Stack.Screen name="Report" component={ReportScreen} />
        <Stack.Screen name="ReportSearch" component={SearchScreen} />
        <Stack.Screen name="ReportCalendar" component={ReportCalendarScreen} />
        <Stack.Screen name="Transactions" component={TransactionScreen} />
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
        <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

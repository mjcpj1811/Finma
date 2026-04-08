/**
 * Maps category icon names from backend to MaterialIcons names
 * Backend may return icon names that don't exist in MaterialIcons,
 * so we need to map them to valid alternates.
 */
export const mapIconName = (iconName: string | null | undefined): string => {
  if (!iconName) return 'wallet';

  const iconMap: Record<string, string> = {
    // Finance
    'piggy-bank': 'savings',
    'calendar-sync': 'date-range',
    'debt': 'trending-down',

    // Expense
    'grocery': 'shopping-cart',
    'restaurant': 'restaurant',
    'gift': 'card-giftcard',
    'medical': 'local-hospital',
    'entertainment': 'movie',
    'transport': 'directions-car',

    // Income
    'salary': 'account-balance-wallet',
    'subsidy': 'card-giftcard',

    // Savings/Goals
    'laptop': 'laptop',
    'travel': 'flight-takeoff',
    'shield': 'security',
    'education': 'school',
    'motorcycle': 'two-wheeler',
    'globe': 'public',

    // Accounts
    'wallet': 'wallet',
    'bank': 'account-balance',
    'mobile': 'payment',
    'e-wallet': 'payment',
  };

  return iconMap[iconName.toLowerCase()] || 'wallet';
};

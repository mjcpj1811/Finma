const CATEGORY_ICON_NAME_MAP: Record<string, string> = {
  savings: 'savings',
  schedule: 'schedule',
  payments: 'payments',
  shopping: 'shopping-bag',
  restaurant: 'restaurant',
  card_giftcard: 'card-giftcard',
  healing: 'healing',
  movie: 'movie',
  directions_bus: 'directions-bus',
  attach_money: 'attach-money',
  account_balance_wallet: 'account-balance-wallet',
  local_grocery_store: 'local-grocery-store',
  directions_car: 'directions-car',
  home: 'home',
  school: 'school',
  fitness_center: 'fitness-center',
  pets: 'pets',
  phone_iphone: 'phone-iphone',
  book: 'book',
  music_note: 'music-note',
  local_cafe: 'local-cafe',
  work: 'work',
  child_care: 'child-care',
  checkroom: 'checkroom',
  salary: 'attach-money',
  food: 'restaurant',
  rent: 'home',
  transport: 'directions-bus',
  other: 'shopping-bag',
};

export const resolveTransactionIconName = (
  iconKey?: string,
  kind: 'income' | 'expense' | 'saving' | 'finance' = 'expense',
): string => {
  const fallback = kind === 'income' ? 'attach-money' : kind === 'saving' || kind === 'finance' ? 'savings' : 'shopping-bag';

  if (!iconKey) {
    return fallback;
  }

  const normalized = iconKey.trim().toLowerCase().replace(/-/g, '_');
  if (!normalized) {
    return fallback;
  }

  return CATEGORY_ICON_NAME_MAP[normalized] ?? fallback;
};

export const resolveTransactionIconBg = (kind: 'income' | 'expense' | 'saving' | 'finance' = 'expense'): string => {
  if (kind === 'income') {
    return '#6AA8FF';
  }
  if (kind === 'saving' || kind === 'finance') {
    return '#60A5FA';
  }
  return '#4D9EFF';
};

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { categoryApi } from '../../api/categoryApi';
import { type CategoryDashboard, type CategoryItem } from '../../types/category';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetCategories'>;

const iconMeta: Record<CategoryItem['iconKey'], { name: keyof typeof MaterialIcons.glyphMap }> = {
  savings: { name: 'savings' },
  schedule: { name: 'schedule' },
  payments: { name: 'payments' },
  shopping: { name: 'shopping-bag' },
  restaurant: { name: 'restaurant' },
  card_giftcard: { name: 'card-giftcard' },
  healing: { name: 'healing' },
  movie: { name: 'movie' },
  directions_bus: { name: 'directions-bus' },
  attach_money: { name: 'attach-money' },
  account_balance_wallet: { name: 'account-balance-wallet' },
  local_grocery_store: { name: 'local-grocery-store' },
  directions_car: { name: 'directions-car' },
  home: { name: 'home' },
  school: { name: 'school' },
  fitness_center: { name: 'fitness-center' },
  pets: { name: 'pets' },
  phone_iphone: { name: 'phone-iphone' },
  book: { name: 'book' },
  music_note: { name: 'music-note' },
  local_cafe: { name: 'local-cafe' },
  work: { name: 'work' },
  child_care: { name: 'child-care' },
  checkroom: { name: 'checkroom' },
};

export const BudgetCategoryListScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<CategoryDashboard | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const response = await categoryApi.getDashboard();
        setDashboard(response);
      } catch {
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };

    void loadCategories();
  }, []);

  const expenseCategories = useMemo(() => dashboard?.groups.expense ?? [], [dashboard]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải danh mục chi tiêu...</Text>
        </View>
        <ScreenBottomNavigation activeTab="layers" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Danh Mục Chi Tiêu"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
      />

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Chi Tiêu</Text>
          <View style={styles.grid}>
            {expenseCategories.map((item) => {
              const icon = iconMeta[item.iconKey] ?? iconMeta.shopping;
              return (
                <View key={item.id} style={styles.cardWrap}>
                  <Pressable
                style={styles.categoryCard}
                onPress={() =>
                  navigation.navigate('BudgetCreate', {
                    categoryId: item.id,
                    categoryName: item.name,
                  })
                }
              >
                    <MaterialIcons name={icon.name} size={34} color={colors.primary} />
              </Pressable>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
      <ScreenBottomNavigation activeTab="layers" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  mainPanel: {
    flex: 1,
    marginTop: 16,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 150,
  },
  sectionTitle: {
    textAlign: 'center',
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 18,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 16,
  },
  cardWrap: {
    width: '33.3333%',
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 8,
  },
  categoryCard: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: '#F1FFF3',
    borderWidth: 1,
    borderColor: '#D5E9DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
    textAlign: 'center',
    width: '100%',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    color: colors.white,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
});

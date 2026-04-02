import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  totalBalance: number;
  totalExpense: number;
  budgetUsedPercent: number;
  budgetLimit: number;
};

const formatCurrency = (value: number) => Math.round(value).toLocaleString('vi-VN');

export const BalanceSummaryCard = ({ totalBalance, totalExpense, budgetUsedPercent, budgetLimit }: Props) => {
  return (
    <View>
      <View style={styles.topRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Tổng dư</Text>
          <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {formatCurrency(totalBalance)}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Tổng chi</Text>
          <Text style={styles.expenseValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            -{formatCurrency(totalExpense)}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, budgetUsedPercent)}%` }]} />
        <Text style={styles.progressPercent}>{budgetUsedPercent}%</Text>
        <Text style={styles.progressLimit} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {formatCurrency(budgetLimit)}
        </Text>
      </View>

      <Text style={styles.progressText}>{budgetUsedPercent}% Ngân sách chi tiêu</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statBlock: {
    flex: 1,
  },
  separator: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  statLabel: {
    color: colors.text,
    fontSize: 12,
    fontFamily: typography.poppins.regular,
    marginBottom: 4,
  },
  balanceValue: {
    color: colors.text,
    fontSize: 25,
    lineHeight: 30,
    fontFamily: typography.poppins.bold,
  },
  expenseValue: {
    color: colors.blueDark,
    fontSize: 25,
    lineHeight: 30,
    fontFamily: typography.poppins.bold,
    textAlign: 'right',
  },
  progressTrack: {
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.bgCard,
    marginTop: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.black,
    borderRadius: 999,
  },
  progressPercent: {
    marginLeft: 14,
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 12,
  },
  progressLimit: {
    position: 'absolute',
    right: 14,
    color: colors.black,
    fontFamily: typography.poppins.semibold,
    fontSize: 12,
  },
  progressText: {
    marginTop: 12,
    color: colors.text,
    fontSize: 13,
    fontFamily: typography.poppins.medium,
  },
});

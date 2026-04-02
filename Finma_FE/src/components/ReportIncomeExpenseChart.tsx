import { StyleSheet, Text, View } from 'react-native';
import { type ReportChartPoint } from '../types/report';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  data: ReportChartPoint[];
  showValueLabels?: boolean;
  chartHeight?: number;
  maxValue?: number;
};

const formatValue = (value: number) => {
  if (value >= 1000) {
    return `${Math.round((value / 1000) * 10) / 10}k`;
  }

  return `${value}`;
};

export const ReportIncomeExpenseChart = ({
  data,
  showValueLabels = false,
  chartHeight = 124,
  maxValue,
}: Props) => {
  const safeMax = Math.max(maxValue ?? Math.max(...data.map((item) => Math.max(item.income, item.expense)), 1), 1);
  const tickValues = [safeMax, safeMax * 0.66, safeMax * 0.33, 0];

  return (
    <View style={styles.wrapper}>
      <View style={styles.bodyRow}>
        <View style={[styles.yAxis, { height: chartHeight + 34 }]}> 
          {tickValues.map((value, idx) => (
            <Text key={`tick-${idx}`} style={styles.yAxisText}>
              {formatValue(Math.round(value))}
            </Text>
          ))}
        </View>

        <View style={styles.columnsRow}>
          {data.map((item) => {
            const incomeHeight = Math.max(8, (item.income / safeMax) * chartHeight);
            const expenseHeight = Math.max(8, (item.expense / safeMax) * chartHeight);

            return (
              <View key={item.id} style={styles.columnWrap}>
                {showValueLabels ? (
                  <Text style={styles.valueText}>{`${formatValue(item.income)}/${formatValue(item.expense)}`}</Text>
                ) : null}

                <View style={[styles.barPair, { height: chartHeight }]}> 
                  <View style={[styles.incomeBar, { height: incomeHeight }]} />
                  <View style={[styles.expenseBar, { height: expenseHeight }]} />
                </View>

                <Text style={styles.dayText}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendIncome]} />
          <Text style={styles.legendText}>Thu nhập</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendExpense]} />
          <Text style={styles.legendText}>Chi tiêu</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  yAxis: {
    width: 34,
    justifyContent: 'space-between',
    paddingBottom: 18,
  },
  yAxisText: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 10,
  },
  columnsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  columnWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  valueText: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.medium,
    fontSize: 9,
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  incomeBar: {
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  expenseBar: {
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.blueDark,
  },
  dayText: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendIncome: {
    backgroundColor: colors.primary,
  },
  legendExpense: {
    backgroundColor: colors.blueDark,
  },
  legendText: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
});
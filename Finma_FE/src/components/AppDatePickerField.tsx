import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type AppDatePickerFieldProps = {
  valueIso: string;
  onChangeIso: (nextIso: string) => void;
  onOpen?: () => void;
  formatDisplayValue?: (valueIso: string) => string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  locale?: string;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  cancelLabel?: string;
  confirmLabel?: string;
  fieldStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  pickerWrapStyle?: StyleProp<ViewStyle>;
  pickerActionsStyle?: StyleProp<ViewStyle>;
  cancelButtonStyle?: StyleProp<ViewStyle>;
  cancelTextStyle?: StyleProp<TextStyle>;
  confirmButtonStyle?: StyleProp<ViewStyle>;
  confirmTextStyle?: StyleProp<TextStyle>;
};

const toSafeDate = (valueIso: string) => {
  const parsed = new Date(valueIso);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return new Date();
};

const defaultFormatDisplay = (valueIso: string) => {
  return toSafeDate(valueIso).toLocaleDateString('vi-VN');
};

export const AppDatePickerField = ({
  valueIso,
  onChangeIso,
  onOpen,
  formatDisplayValue,
  iconName = 'calendar-month',
  iconColor = colors.primary,
  locale = 'vi-VN',
  disabled,
  minimumDate,
  maximumDate,
  cancelLabel = 'Hủy',
  confirmLabel = 'Chọn',
  fieldStyle,
  textStyle,
  pickerWrapStyle,
  pickerActionsStyle,
  cancelButtonStyle,
  cancelTextStyle,
  confirmButtonStyle,
  confirmTextStyle,
}: AppDatePickerFieldProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [draftDate, setDraftDate] = useState(() => toSafeDate(valueIso));

  const selectedDate = useMemo(() => toSafeDate(valueIso), [valueIso]);
  const displayValue = useMemo(() => {
    if (formatDisplayValue) {
      return formatDisplayValue(valueIso);
    }
    return defaultFormatDisplay(valueIso);
  }, [formatDisplayValue, valueIso]);

  const applyDate = (nextDate: Date) => {
    onChangeIso(nextDate.toISOString());
  };

  const openPicker = () => {
    if (disabled) {
      return;
    }

    onOpen?.();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: 'date',
        is24Hour: true,
        minimumDate,
        maximumDate,
        onChange: (event, nextDate) => {
          if (event.type === 'set' && nextDate) {
            applyDate(nextDate);
          }
        },
      });
      return;
    }

    setDraftDate(selectedDate);
    setShowPicker(true);
  };

  return (
    <>
      <Pressable style={fieldStyle} onPress={openPicker} disabled={disabled}>
        <Text style={textStyle}>{displayValue}</Text>
        <MaterialIcons name={iconName} size={18} color={iconColor} />
      </Pressable>

      {showPicker ? (
        <Modal transparent animationType="fade" visible={showPicker} onRequestClose={() => setShowPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerCard, pickerWrapStyle]}>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                locale={locale}
                textColor="#111111"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={(_, nextDate) => {
                  if (Platform.OS === 'ios') {
                    if (nextDate) {
                      setDraftDate(nextDate);
                    }
                    return;
                  }

                  setShowPicker(false);
                  if (nextDate) {
                    applyDate(nextDate);
                  }
                }}
              />

              {Platform.OS === 'ios' ? (
                <View style={[styles.pickerActions, pickerActionsStyle]}>
                  <Pressable style={cancelButtonStyle} onPress={() => setShowPicker(false)}>
                    <Text style={cancelTextStyle}>{cancelLabel}</Text>
                  </Pressable>

                  <Pressable
                    style={confirmButtonStyle}
                    onPress={() => {
                      applyDate(draftDate);
                      setShowPicker(false);
                    }}
                  >
                    <Text style={confirmTextStyle}>{confirmLabel}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pickerCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4EFE8',
    backgroundColor: '#DFF7E2',
    overflow: 'hidden',
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});

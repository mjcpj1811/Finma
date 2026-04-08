import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import IconNotificationSvg from '../../assets/icons/Icon-Notification.svg';
import { colors } from '../theme/colors';

type Props = {
  onPress?: () => void;
  showBadge?: boolean;
  size?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
};

export const NotificationBellButton = ({
  onPress,
  showBadge = false,
  size = 30,
  iconSize,
  style,
}: Props) => {
  const resolvedIconSize = iconSize ?? size;

  const containerStyle = [
    styles.container,
    { width: size, height: size, borderRadius: size / 2 },
    style,
  ];

  const content = (
    <>
      <IconNotificationSvg width={resolvedIconSize} height={resolvedIconSize} />
      {showBadge ? <View style={styles.badgeDot} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={containerStyle}>
        {content}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    right: 7,
    top: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.white,
    backgroundColor: '#FF4545',
  },
});
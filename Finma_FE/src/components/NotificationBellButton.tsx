import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

const ICON_BELL = require('../../assets/icons/Icon-Notification.png');

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
      <Image source={ICON_BELL} style={{ width: resolvedIconSize, height: resolvedIconSize }} resizeMode="contain" />
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
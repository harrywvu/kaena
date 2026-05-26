import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text } from "react-native";
import { palette } from "../theme/palette";
import { typography } from "../theme/typography";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export function KaenaButton({ label, onPress, variant = "primary", disabled }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(variant === "primary" && !disabled ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(glow, {
      toValue: variant === "primary" && !disabled ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [disabled, glow, variant]);

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      speed: 30,
      bounciness: 0,
      useNativeDriver: false,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      speed: 24,
      bounciness: 8,
      useNativeDriver: false,
    }).start();
  }

  return (
    <Animated.View
      style={[
        styles.shell,
        variant === "primary"
          ? {
              shadowOpacity: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.26],
              }),
            }
          : null,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.base, variant === "primary" ? styles.primary : styles.secondary, disabled ? styles.disabled : null]}
      >
        <Text style={[styles.label, variant === "primary" ? styles.primaryLabel : styles.secondaryLabel]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 18,
    shadowColor: palette.accent,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 12,
    },
  },
  base: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: palette.accent,
  },
  secondary: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: 17,
    letterSpacing: 0.1,
  },
  primaryLabel: {
    color: palette.background,
  },
  secondaryLabel: {
    color: palette.textPrimary,
  },
  disabled: {
    opacity: 0.45,
  },
});

import { useEffect, useRef } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "../theme/palette";
import { typography } from "../theme/typography";

type Props = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  selected: boolean;
  onPress: () => void;
};

export function OptionCard({ label, icon, selected, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(glow, {
      toValue: selected ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [glow, selected]);

  function handlePressIn() {
    flash.setValue(0.85);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.96,
        speed: 28,
        bounciness: 0,
        useNativeDriver: false,
      }),
      Animated.timing(flash, {
        toValue: 0.2,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }

  function handlePressOut() {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        speed: 20,
        bounciness: 7,
        useNativeDriver: false,
      }),
      Animated.timing(flash, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }

  return (
    <Animated.View
      style={[
        styles.option,
        {
          transform: [{ scale }],
          shadowOpacity: glow.interpolate({
            inputRange: [0, 1],
            outputRange: [0.04, 0.22],
          }),
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Animated.View
          style={[
            styles.square,
            selected ? styles.squareSelected : null,
            {
              borderColor: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [palette.border, palette.accent],
              }),
            },
          ]}
        >
          <Animated.View style={[styles.flashOverlay, { opacity: flash }]} />
          <Animated.View
            style={{
              transform: [
                {
                  scale: glow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                },
              ],
            }}
          >
            <MaterialCommunityIcons
              name={icon}
              size={34}
              color={selected ? palette.accent : palette.textSecondary}
            />
          </Animated.View>
        </Animated.View>
        <Text style={[styles.label, selected ? styles.labelSelected : null]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  option: {
    width: 108,
    shadowColor: palette.accent,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },
  pressable: {
    alignItems: "center",
  },
  square: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  squareSelected: {
    backgroundColor: palette.accentSoft,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(240, 160, 48, 0.24)",
  },
  label: {
    marginTop: 12,
    color: palette.textMuted,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    textAlign: "center",
  },
  labelSelected: {
    color: palette.textPrimary,
  },
});

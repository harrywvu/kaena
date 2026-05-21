import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "../theme/palette";
import { typography } from "../theme/typography";

type Props = {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
};

export function OptionCard({ title, subtitle, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected ? styles.selected : null]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {selected ? <View style={styles.dot} /> : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  selected: {
    borderColor: palette.accent,
    shadowColor: palette.accent,
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: palette.textPrimary,
    fontFamily: typography.bodyMedium,
    fontSize: 17,
    textTransform: "capitalize",
  },
  subtitle: {
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
});

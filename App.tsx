import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import {
  CormorantGaramond_600SemiBold,
  useFonts as useCormorantFonts,
} from "@expo-google-fonts/cormorant-garamond";
import { DMSans_400Regular, DMSans_500Medium, useFonts as useDmSansFonts } from "@expo-google-fonts/dm-sans";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KaenaFlowScreen } from "./screens/KaenaFlowScreen";
import { palette } from "./theme/palette";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.background,
    card: palette.surface,
    text: palette.textPrimary,
    primary: palette.accent,
    border: palette.border,
  },
};

export default function App() {
  const [serifLoaded] = useCormorantFonts({
    CormorantGaramond_600SemiBold,
  });
  const [sansLoaded] = useDmSansFonts({
    DMSans_400Regular,
    DMSans_500Medium,
  });

  if (!serifLoaded || !sansLoaded) {
    return (
      <View style={styles.boot}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="KaenaFlow" component={KaenaFlowScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: "center",
    justifyContent: "center",
  },
});

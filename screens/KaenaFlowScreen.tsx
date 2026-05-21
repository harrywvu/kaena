import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KaenaButton } from "../components/KaenaButton";
import { MapPreview } from "../components/MapPreview";
import { OptionCard } from "../components/OptionCard";
import { useKaenaFlow } from "../hooks/useKaenaFlow";
import { palette } from "../theme/palette";
import { typography } from "../theme/typography";
import { BudgetConcern, GroupSize, LoadingFailure, Vibe } from "../types";

const groupOptions: Array<{ value: GroupSize; subtitle: string }> = [
  { value: "solo", subtitle: "Quick and personal." },
  { value: "pair", subtitle: "Balanced for two people." },
  { value: "group", subtitle: "Built for 3 or more." },
];

const vibeOptions: Array<{ value: Vibe; subtitle: string }> = [
  { value: "speed", subtitle: "Close, fast, minimal friction." },
  { value: "comfort", subtitle: "Calm, reliable, easy to settle into." },
  { value: "fun", subtitle: "Popular, lively, full of motion." },
  { value: "luxury", subtitle: "Higher-end and worth the splurge." },
];

const budgetOptions: Array<{ value: BudgetConcern; subtitle: string }> = [
  { value: "yes", subtitle: "Price should matter." },
  { value: "no", subtitle: "Best fit matters more than cost." },
];

export function KaenaFlowScreen() {
  const { flowState, permissionGranted, locationCoords, preferences, questionStep, result, llmUsed, failure, answers, actions } =
    useKaenaFlow();
  const canChooseForMe = questionStep === 2 && answers.budgetConcern !== null && preferences !== null;

  if (!permissionGranted) {
    return (
      <ScreenFrame>
        <Eyebrow>Location Required</Eyebrow>
        <HeroTitle>Kaena needs your location before it can decide dinner.</HeroTitle>
        <BodyText>
          Nearby recommendations depend on live GPS. Without it, the app stays locked.
        </BodyText>
        <View style={styles.ctaBlock}>
          <KaenaButton label="Allow location access" onPress={() => void actions.requestPermission()} />
        </View>
      </ScreenFrame>
    );
  }

  if (flowState === "questionnaire") {
    return (
      <ScreenFrame>
        <Eyebrow>Kaena</Eyebrow>
        <HeroTitle>Here&apos;s how tonight should feel.</HeroTitle>
        <BodyText>Three signals. One question at a time.</BodyText>

        <Text style={styles.stepIndicator}>Step {questionStep + 1} of 3</Text>

        <ScrollView contentContainerStyle={styles.questionnaire}>
          {questionStep === 0 ? (
            <QuestionSection title="1. Group size">
              {groupOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  title={option.value === "group" ? "group (3+)" : option.value}
                  subtitle={option.subtitle}
                  selected={answers.groupSize === option.value}
                  onPress={() => actions.selectGroupSize(option.value)}
                />
              ))}
            </QuestionSection>
          ) : null}

          {questionStep === 1 ? (
            <QuestionSection title="2. Vibe">
              {vibeOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  title={option.value}
                  subtitle={option.subtitle}
                  selected={answers.vibe === option.value}
                  onPress={() => actions.selectVibe(option.value)}
                />
              ))}
            </QuestionSection>
          ) : null}

          {questionStep === 2 ? (
            <QuestionSection title="3. Budget concern">
              {budgetOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  title={option.value}
                  subtitle={option.subtitle}
                  selected={answers.budgetConcern === option.value}
                  onPress={() => actions.selectBudgetConcern(option.value)}
                />
              ))}
            </QuestionSection>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {questionStep > 0 ? (
            <>
              <KaenaButton label="Back" onPress={actions.goBackQuestion} variant="secondary" />
              <View style={styles.spacer} />
            </>
          ) : null}
          <KaenaButton label="Choose for me" onPress={() => void actions.handleRecommend()} disabled={!canChooseForMe} />
        </View>
      </ScreenFrame>
    );
  }

  if (flowState === "loading") {
    return (
      <ScreenFrame>
        <Eyebrow>Searching Nearby</Eyebrow>
        <HeroTitle>The table isn&apos;t booked yet, but the answer is getting close.</HeroTitle>
        {failure ? (
          <>
            <BodyText>{failureMessage(failure)}</BodyText>
            <View style={styles.ctaBlock}>
              <KaenaButton label="Try again" onPress={() => void actions.handleRecommend()} />
              <View style={styles.spacer} />
              <KaenaButton label="Adjust answers" onPress={actions.resetQuestionnaire} variant="secondary" />
            </View>
          </>
        ) : (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={palette.accent} />
            <Text style={styles.loadingText}>Fetching nearby places, scoring candidates, and validating the best fit.</Text>
          </View>
        )}
      </ScreenFrame>
    );
  }

  if (!result || !locationCoords) {
    return null;
  }

  return (
    <ScreenFrame scrollable>
      <Eyebrow>{llmUsed ? "AI Final Pick" : "Deterministic Final Pick"}</Eyebrow>
      <HeroTitle>Here&apos;s where you&apos;re eating tonight.</HeroTitle>
      <BodyText>{result.explanation}</BodyText>

      {result.photos?.[0] ? <Image source={{ uri: result.photos[0] }} style={styles.heroImage} /> : <FallbackImageCard />}

      <View style={styles.resultCard}>
        <Text style={styles.resultName}>{result.name}</Text>
        <Text style={styles.resultMeta}>
          {result.rating.toFixed(1)} rating
          {result.distanceFromUser != null ? ` • ${result.distanceFromUser.toFixed(2)} km away` : ""}
          {result.priceLevel != null ? ` • price ${result.priceLevel}` : ""}
        </Text>
      </View>

      <MapPreview
        userLocation={locationCoords}
        destination={{ lat: result.lat, lng: result.lng, name: result.name }}
      />

      <View style={styles.footer}>
        <KaenaButton label="Pick again" onPress={actions.resetQuestionnaire} variant="secondary" />
      </View>
    </ScreenFrame>
  );
}

function ScreenFrame({ children, scrollable = false }: { children: ReactNode; scrollable?: boolean }) {
  const content = <View style={styles.screenInner}>{children}</View>;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      {scrollable ? <ScrollView contentContainerStyle={styles.scrollContainer}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

function HeroTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.heroTitle}>{children}</Text>;
}

function BodyText({ children }: { children: ReactNode }) {
  return <Text style={styles.bodyText}>{children}</Text>;
}

function QuestionSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.options}>{children}</View>
    </View>
  );
}

function FallbackImageCard() {
  return (
    <View style={styles.imageFallback}>
      <Text style={styles.imageFallbackTitle}>No photo available</Text>
      <Text style={styles.imageFallbackText}>Kaena can still route you there based on live place data.</Text>
    </View>
  );
}

function failureMessage(failure: LoadingFailure) {
  switch (failure) {
    case "no-results":
      return "No restaurant candidates came back nearby. Try again or move to a denser area.";
    case "ranking-error":
      return "Nearby places were found, but ranking failed before a valid choice was made.";
    case "places-error":
    default:
      return "The live search failed. Check API access, then retry.";
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  screenInner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
  },
  scrollContainer: {
    paddingBottom: 32,
  },
  backgroundGlowTop: {
    position: "absolute",
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(240, 160, 48, 0.08)",
  },
  backgroundGlowBottom: {
    position: "absolute",
    bottom: -120,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(240, 160, 48, 0.05)",
  },
  eyebrow: {
    color: palette.accent,
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 2.2,
    marginBottom: 18,
  },
  heroTitle: {
    color: palette.textPrimary,
    fontFamily: typography.display,
    fontSize: 44,
    lineHeight: 46,
    marginBottom: 12,
  },
  bodyText: {
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  questionnaire: {
    paddingTop: 24,
    gap: 18,
  },
  stepIndicator: {
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 14,
    marginTop: 18,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontFamily: typography.bodyMedium,
    fontSize: 16,
  },
  options: {
    gap: 12,
  },
  footer: {
    marginTop: 24,
  },
  ctaBlock: {
    marginTop: 28,
  },
  loadingBlock: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 18,
  },
  loadingText: {
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
  },
  spacer: {
    height: 12,
  },
  heroImage: {
    height: 240,
    borderRadius: 24,
    marginTop: 28,
    marginBottom: 18,
  },
  imageFallback: {
    height: 240,
    borderRadius: 24,
    marginTop: 28,
    marginBottom: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  imageFallbackTitle: {
    color: palette.textPrimary,
    fontFamily: typography.bodyMedium,
    fontSize: 18,
    marginBottom: 8,
  },
  imageFallbackText: {
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  resultCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
    marginBottom: 18,
  },
  resultName: {
    color: palette.textPrimary,
    fontFamily: typography.display,
    fontSize: 34,
    lineHeight: 36,
    marginBottom: 8,
  },
  resultMeta: {
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
});

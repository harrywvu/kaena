import { useEffect, useMemo, useRef } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ImageBackground,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
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

const groupOptions: Array<{ value: GroupSize; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }> = [
  { value: "solo", label: "Solo", icon: "account-outline" },
  { value: "pair", label: "Two", icon: "account-multiple-outline" },
  { value: "group", label: "3+", icon: "account-group-outline" },
];

const vibeOptions: Array<{ value: Vibe; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }> = [
  { value: "speed", label: "Fast", icon: "lightning-bolt-outline" },
  { value: "comfort", label: "Easy", icon: "sofa-outline" },
  { value: "fun", label: "Fun", icon: "party-popper" },
  { value: "luxury", label: "Fancy", icon: "glass-cocktail" },
];

const budgetOptions: Array<{ value: BudgetConcern; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }> = [
  { value: "yes", label: "Budget", icon: "cash-multiple" },
  { value: "no", label: "Open", icon: "star-four-points-outline" },
];

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function KaenaFlowScreen() {
  const {
    flowState,
    permissionGranted,
    locationCoords,
    locationLabel,
    lastRecommendation,
    preferences,
    questionStep,
    result,
    llmUsed,
    failure,
    hasUnlockedResultActions,
    showBackToHomeOnly,
    answers,
    actions,
  } = useKaenaFlow();
  const canChooseForMe = questionStep === 2 && answers.budgetConcern !== null && preferences !== null;
  const prompt =
    questionStep === 0
      ? "Who are you with?"
      : questionStep === 1
        ? "What feels right?"
        : "Price or fit?";
  const progress = questionStep + 1;

  if (flowState === "booting") {
    return null;
  }

  if (!permissionGranted) {
    return (
      <ScreenFrame>
        <TopBar />
        <HeaderPill>Location Required</HeaderPill>
        <HeroTitle>Kaena needs your location before it makes the call.</HeroTitle>
        <BodyText>
          Nearby recommendations only work if the app knows where dinner starts.
        </BodyText>
        <EditorialPanel
          title="Why location matters"
          body="Distance, travel friction, and live place availability are part of the recommendation. Without location, Kaena has no judgment."
        />
        <View style={styles.bottomBar}>
          <KaenaButton label="Allow location access" onPress={() => void actions.requestPermission()} />
        </View>
      </ScreenFrame>
    );
  }

  if (flowState === "home") {
    return (
      <ScreenFrame decorated={false}>
        <HomeLobby
          locationLabel={locationLabel}
          lastRecommendation={lastRecommendation}
          onStart={actions.startFromHome}
        />
      </ScreenFrame>
    );
  }

  if (flowState === "questionnaire") {
    return (
      <ScreenFrame>
        <TopBar />
        <HeaderPill>Kaena</HeaderPill>
        <AnimatedHero prompt={prompt} step={questionStep} centered />
        <StepRail currentStep={progress} />
        <View style={styles.questionnaireStage}>
          {questionStep === 0 ? (
            <AnimatedQuestionSection step={questionStep}>
              {groupOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  selected={answers.groupSize === option.value}
                  onPress={() => actions.selectGroupSize(option.value)}
                />
              ))}
            </AnimatedQuestionSection>
          ) : null}

          {questionStep === 1 ? (
            <AnimatedQuestionSection step={questionStep}>
              {vibeOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  selected={answers.vibe === option.value}
                  onPress={() => actions.selectVibe(option.value)}
                />
              ))}
            </AnimatedQuestionSection>
          ) : null}

          {questionStep === 2 ? (
            <AnimatedQuestionSection step={questionStep}>
              {budgetOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  selected={answers.budgetConcern === option.value}
                  onPress={() => actions.selectBudgetConcern(option.value)}
                />
              ))}
            </AnimatedQuestionSection>
          ) : null}
        </View>

        <View style={styles.bottomBar}>
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
        <TopBar />
        <HeaderPill>Choosing</HeaderPill>
        <HeroTitle>Kaena is looking for the one place worth saying yes to.</HeroTitle>
        {failure ? (
          <>
            <BodyText>{failureMessage(failure)}</BodyText>
            <View style={styles.bottomBar}>
              <KaenaButton label="Try again" onPress={() => void actions.handleRecommend()} />
              <View style={styles.spacer} />
              <KaenaButton label="Adjust answers" onPress={actions.resetQuestionnaire} variant="secondary" />
            </View>
          </>
        ) : (
          <LoadingCard />
        )}
      </ScreenFrame>
    );
  }

  if (!result || !locationCoords) {
    return null;
  }

  return (
    <ScreenFrame scrollable>
      <TopBar />
      <HeaderPill>{llmUsed ? "AI Final Pick" : "Final Pick"}</HeaderPill>
      <AnimatedHero prompt="Here&apos;s where you&apos;re eating tonight." body={result.explanation} step={2} centered />
      <AnimatedResultPhoto imageUri={result.photos?.[0]} />

      <View style={styles.resultMetaBlock} accessible accessibilityLabel={`Recommended restaurant: ${result.name}`}>
        <Text style={styles.resultName}>{result.name}</Text>
        <View style={styles.statRow}>
          <StatChip label={`${result.rating.toFixed(1)} rating`} />
          {result.distanceFromUser != null ? <StatChip label={`${result.distanceFromUser.toFixed(2)} km away`} /> : null}
          {result.priceLevel != null ? <StatChip label={`Price ${result.priceLevel}`} /> : null}
        </View>
      </View>

      <MapPreview
        userLocation={locationCoords}
        destination={{ lat: result.lat, lng: result.lng, name: result.name }}
      />

      <View style={styles.bottomBar}>
        {showBackToHomeOnly ? (
          <KaenaButton label="Back to home" onPress={actions.goHome} />
        ) : hasUnlockedResultActions ? (
          <>
            <KaenaButton label="Pick again" onPress={actions.pickAgain} variant="secondary" />
            <View style={styles.spacer} />
            <KaenaButton label="Redecide" onPress={() => void actions.redecideCurrent()} />
          </>
        ) : (
          <KaenaButton label="Back to home" onPress={actions.goHome} />
        )}
      </View>
    </ScreenFrame>
  );
}

function AnimatedHero({ prompt, body, step, centered = false }: { prompt: string; body?: string; step: number; centered?: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [opacity, translateY, step]);

  return (
    <Animated.View style={[styles.heroBlock, centered ? styles.heroBlockCentered : null, { opacity, transform: [{ translateY }] }]}>
      <HeroTitle centered={centered}>{prompt}</HeroTitle>
      {body ? <BodyText centered={centered}>{body}</BodyText> : null}
    </Animated.View>
  );
}

function AnimatedQuestionSection({ children, step }: { children: ReactNode; step: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    opacity.setValue(0);
    translateY.setValue(28);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [opacity, step, translateY]);

  return (
    <Animated.View style={[styles.gridWrap, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.options}>{children}</View>
    </Animated.View>
  );
}

function AnimatedResultPhoto({ imageUri }: { imageUri?: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 20,
        bounciness: 6,
        useNativeDriver: false,
      }),
    ]).start();
  }, [imageUri, opacity, scale]);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.heroImage} /> : <FallbackImageCard />}
    </Animated.View>
  );
}

function HomeLobby({
  locationLabel,
  lastRecommendation,
  onStart,
}: {
  locationLabel: string;
  lastRecommendation: { name: string; photo?: string } | null;
  onStart: () => void;
}) {
  const shellOpacity = useRef(new Animated.Value(0)).current;
  const shellScale = useRef(new Animated.Value(0.98)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkY = useRef(new Animated.Value(16)).current;
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const pillY = useRef(new Animated.Value(16)).current;
  const contextOpacity = useRef(new Animated.Value(0)).current;
  const contextY = useRef(new Animated.Value(16)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(16)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonY = useRef(new Animated.Value(16)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(16)).current;
  const pillPulse = useRef(new Animated.Value(1)).current;
  const isExiting = useRef(false);
  const contextualLine = getContextualLine();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(shellOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(shellScale, {
        toValue: 1,
        duration: 280,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    const entries = [
      { opacity: wordmarkOpacity, translateY: wordmarkY, delay: 0 },
      { opacity: pillOpacity, translateY: pillY, delay: 80 },
      { opacity: contextOpacity, translateY: contextY, delay: 160 },
      { opacity: heroOpacity, translateY: heroY, delay: 240 },
      { opacity: buttonOpacity, translateY: buttonY, delay: 320 },
    ];

    entries.forEach(({ opacity, translateY, delay }) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    });

    Animated.sequence([
      Animated.delay(220),
      Animated.timing(pillPulse, {
        toValue: 0.6,
        duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(pillPulse, {
        toValue: 1,
        duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();

    if (lastRecommendation) {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 300,
          delay: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(cardY, {
          toValue: 0,
          duration: 300,
          delay: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [
    buttonOpacity,
    buttonY,
    cardOpacity,
    cardY,
    contextOpacity,
    contextY,
    heroOpacity,
    heroY,
    lastRecommendation,
    pillOpacity,
    pillPulse,
    pillY,
    shellOpacity,
    shellScale,
    wordmarkOpacity,
    wordmarkY,
  ]);

  function handleStart() {
    if (isExiting.current) {
      return;
    }

    isExiting.current = true;
    Animated.parallel([
      Animated.timing(shellOpacity, {
        toValue: 0,
        duration: 280,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(shellScale, {
        toValue: 0.98,
        duration: 280,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onStart();
      } else {
        isExiting.current = false;
      }
    });
  }

  return (
    <Animated.View style={[styles.homeScreen, { opacity: shellOpacity, transform: [{ scale: shellScale }] }]}>
      <HomeAmbientBackground photoUri={lastRecommendation?.photo} />

      <Animated.View style={[styles.homeTop, { opacity: wordmarkOpacity, transform: [{ translateY: wordmarkY }] }]}>
        <Text style={styles.homeWordmark}>kaena</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.locationPillWrap,
          {
            opacity: Animated.multiply(pillOpacity, pillPulse),
            transform: [{ translateY: pillY }],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => {}}
          style={({ pressed }) => [styles.locationPill, pressed ? styles.locationPillPressed : null]}
        >
          <Text style={styles.locationPillText}>📍 {locationLabel}</Text>
        </Pressable>
      </Animated.View>

      {lastRecommendation ? (
        <Animated.View style={[styles.lastPickCardWrap, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <LastRecommendationCard recommendation={lastRecommendation} />
        </Animated.View>
      ) : null}

      <View style={styles.homeHeroBlock}>
        <Animated.View style={{ opacity: contextOpacity, transform: [{ translateY: contextY }] }}>
          <Text style={styles.homeContextLine}>{contextualLine}</Text>
        </Animated.View>
        <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroY }] }}>
          <HeroTitle centered>Where are you eating tonight?</HeroTitle>
        </Animated.View>
      </View>

      <Animated.View style={[styles.homeAction, { opacity: buttonOpacity, transform: [{ translateY: buttonY }] }]}>
        <KaenaButton label="Decide for me" onPress={handleStart} />
      </Animated.View>
    </Animated.View>
  );
}

function HomeAmbientBackground({ photoUri }: { photoUri?: string }) {
  if (photoUri) {
    return (
      <View style={styles.homeAmbient}>
        <ImageBackground source={{ uri: photoUri }} style={styles.homeAmbientImage} imageStyle={styles.homeAmbientImage} blurRadius={24}>
          <View style={styles.homeAmbientOverlay} />
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.homeAmbient}>
      <View style={styles.homeGradientBase} />
      <View style={styles.homeGradientGlowLarge} />
      <View style={styles.homeGradientGlowSmall} />
    </View>
  );
}

function LastRecommendationCard({ recommendation }: { recommendation: { name: string; photo?: string } }) {
  return (
    <View style={styles.lastPickCard}>
      {recommendation.photo ? (
        <>
          <Image source={{ uri: recommendation.photo }} style={styles.lastPickImage} blurRadius={18} />
          <View style={styles.lastPickImageOverlay} />
        </>
      ) : (
        <View style={styles.lastPickFallback} />
      )}
      <View style={styles.lastPickCopy}>
        <Text style={styles.lastPickLabel}>Last pick</Text>
        <Text style={styles.lastPickName}>{recommendation.name}</Text>
      </View>
    </View>
  );
}

function getContextualLine() {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 11) {
    return "Good morning. Breakfast won't pick itself.";
  }
  if (hour >= 11 && hour < 14) {
    return "Lunchtime. Let's not overthink this.";
  }
  if (hour >= 14 && hour < 17) {
    return "Merienda hour. You know what to do.";
  }
  if (hour >= 17 && hour < 22) {
    return "Good evening. Dinner's on us.";
  }

  return "Late night hunger? We got you.";
}

function LoadingCard() {
  const pulse = useRef(new Animated.Value(0)).current;
  const dots = useMemo(() => [0, 1, 2].map(() => new Animated.Value(0.4)), []);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );

    const dotLoops = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(dot, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(dot, {
            toValue: 0.35,
            duration: 380,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      ),
    );

    pulseLoop.start();
    dotLoops.forEach((loop) => loop.start());

    return () => {
      pulseLoop.stop();
      dotLoops.forEach((loop) => loop.stop());
    };
  }, [dots, pulse]);

  return (
    <Animated.View
      style={[
        styles.loadingCard,
        {
          borderColor: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [palette.border, palette.accent],
          }),
          shadowOpacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [0.04, 0.18],
          }),
        },
      ]}
    >
      <ActivityIndicator size="large" color={palette.accent} />
      <Text style={styles.loadingTitle}>Searching nearby restaurants</Text>
      <Text style={styles.loadingText}>Checking distance, rating, price, and mood until one answer stands above the rest.</Text>
      <View style={styles.loadingDots}>
        {dots.map((dot, index) => (
          <Animated.View
            key={index}
            style={[
              styles.loadingDot,
              {
                opacity: dot,
                transform: [
                  {
                    translateY: dot.interpolate({
                      inputRange: [0.35, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function ScreenFrame({
  children,
  scrollable = false,
  decorated = true,
}: {
  children: ReactNode;
  scrollable?: boolean;
  decorated?: boolean;
}) {
  const content = <View style={styles.screenInner}>{children}</View>;

  return (
    <SafeAreaView style={styles.screen}>
      {decorated ? <View style={styles.backgroundGlowTop} /> : null}
      {decorated ? <View style={styles.backgroundGlowBottom} /> : null}
      {scrollable ? <ScrollView contentContainerStyle={styles.scrollContainer}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

function TopBar() {
  return (
    <View style={styles.topBar}>
      <Text style={styles.wordmark}>Kaena</Text>
      <View style={styles.topBadge}>
        <Text style={styles.topBadgeText}>Nearby only</Text>
      </View>
    </View>
  );
}

function HeaderPill({ children }: { children: ReactNode }) {
  return <Text style={styles.headerPill}>{children}</Text>;
}

function HeroTitle({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return <Text style={[styles.heroTitle, centered ? styles.heroTitleCentered : null]}>{children}</Text>;
}

function BodyText({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return <Text style={[styles.bodyText, centered ? styles.bodyTextCentered : null]}>{children}</Text>;
}

function StepRail({ currentStep }: { currentStep: number }) {
  const progress = useRef(new Animated.Value(currentStep)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: currentStep,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentStep, progress]);

  return (
    <View style={styles.stepRail}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepRailItem}>
          <Animated.View
            style={[
              styles.stepDot,
              {
                backgroundColor: progress.interpolate({
                  inputRange: [step - 0.2, step],
                  outputRange: [palette.border, palette.accent],
                  extrapolate: "clamp",
                }),
                transform: [
                  {
                    scale: progress.interpolate({
                      inputRange: [step - 0.2, step],
                      outputRange: [1, 1.18],
                      extrapolate: "clamp",
                    }),
                  },
                ],
              },
            ]}
          />
          {step < 3 ? (
            <Animated.View
              style={[
                styles.stepLine,
                {
                  backgroundColor: progress.interpolate({
                    inputRange: [step, step + 0.8],
                    outputRange: [palette.border, palette.accent],
                    extrapolate: "clamp",
                  }),
                },
              ]}
            />
          ) : null}
        </View>
      ))}
      <Text style={styles.stepText}>Step {currentStep} of 3</Text>
    </View>
  );
}

function EditorialPanel({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.editorialPanel}>
      <Text style={styles.editorialTitle}>{title}</Text>
      <Text style={styles.editorialBody}>{body}</Text>
    </View>
  );
}

function FallbackImageCard() {
  return (
    <View style={styles.imageFallback}>
      <Text style={styles.imageFallbackTitle}>No photo available</Text>
      <Text style={styles.imageFallbackText}>Kaena can still route you there using live place data and the map below.</Text>
    </View>
  );
}

function StatChip({ label }: { label: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statChipLabel}>{label}</Text>
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
    paddingTop: 10,
    paddingBottom: 24,
  },
  homeScreen: {
    flex: 1,
  },
  homeTop: {
    alignItems: "center",
    paddingTop: 4,
    zIndex: 2,
  },
  homeWordmark: {
    color: palette.textPrimary,
    fontFamily: typography.bodyMedium,
    fontSize: 16,
    textTransform: "lowercase",
    marginBottom: 14,
  },
  locationPillWrap: {
    alignItems: "center",
    zIndex: 2,
  },
  locationPill: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  locationPillPressed: {
    opacity: 0.84,
  },
  locationPillText: {
    color: palette.textSecondary,
    fontFamily: typography.body,
    fontSize: 13,
  },
  lastPickCardWrap: {
    alignItems: "center",
    marginTop: 18,
    zIndex: 2,
  },
  lastPickCard: {
    width: "100%",
    maxWidth: 320,
    minHeight: 96,
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "flex-end",
    borderWidth: 1,
    borderColor: palette.separator,
    backgroundColor: palette.surface,
  },
  lastPickImage: {
    ...StyleSheet.absoluteFillObject,
  },
  lastPickImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14, 10, 7, 0.55)",
  },
  lastPickFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.surfaceMuted,
  },
  lastPickCopy: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  lastPickLabel: {
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 12,
    marginBottom: 4,
  },
  lastPickName: {
    color: palette.textPrimary,
    fontFamily: typography.bodyMedium,
    fontSize: 18,
    lineHeight: 22,
  },
  homeHeroBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  homeContextLine: {
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  homeAction: {
    width: "100%",
    paddingBottom: 8,
    zIndex: 2,
  },
  homeAmbient: {
    ...StyleSheet.absoluteFillObject,
  },
  homeAmbientImage: {
    flex: 1,
  },
  homeAmbientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14, 10, 7, 0.85)",
  },
  homeGradientBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.background,
  },
  homeGradientGlowLarge: {
    position: "absolute",
    top: "22%",
    left: "50%",
    width: 420,
    height: 420,
    marginLeft: -210,
    marginTop: -210,
    borderRadius: 999,
    backgroundColor: "rgba(240, 160, 48, 0.08)",
  },
  homeGradientGlowSmall: {
    position: "absolute",
    top: "36%",
    left: "50%",
    width: 220,
    height: 220,
    marginLeft: -110,
    marginTop: -110,
    borderRadius: 999,
    backgroundColor: "rgba(244, 236, 218, 0.05)",
  },
  scrollContainer: {
    paddingBottom: 32,
  },
  backgroundGlowTop: {
    position: "absolute",
    top: -72,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(240, 160, 48, 0.08)",
  },
  backgroundGlowBottom: {
    position: "absolute",
    bottom: -100,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(240, 160, 48, 0.05)",
  },
  topBar: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  wordmark: {
    color: palette.textPrimary,
    fontFamily: typography.display,
    fontSize: 28,
    lineHeight: 30,
  },
  topBadge: {
    minHeight: 32,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  topBadgeText: {
    color: palette.textMuted,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  headerPill: {
    alignSelf: "center",
    color: palette.accent,
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    backgroundColor: palette.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  heroTitle: {
    color: palette.textPrimary,
    fontFamily: typography.display,
    fontSize: 42,
    lineHeight: 44,
    marginBottom: 12,
  },
  heroTitleCentered: {
    textAlign: "center",
  },
  bodyText: {
    color: palette.textSecondary,
    fontFamily: typography.body,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 330,
    marginBottom: 20,
  },
  bodyTextCentered: {
    textAlign: "center",
    alignSelf: "center",
  },
  heroBlock: {
    alignSelf: "stretch",
  },
  heroBlockCentered: {
    alignItems: "center",
  },
  stepRail: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 22,
  },
  stepRailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: palette.border,
  },
  stepDotActive: {
    backgroundColor: palette.accent,
  },
  stepLine: {
    width: 28,
    height: 1,
    marginHorizontal: 8,
    backgroundColor: palette.border,
  },
  stepLineActive: {
    backgroundColor: palette.accent,
  },
  stepText: {
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 14,
    marginLeft: 8,
  },
  questionnaireStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
  },
  gridWrap: {
    width: "100%",
    alignItems: "center",
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    maxWidth: 240,
    justifyContent: "center",
  },
  editorialPanel: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
  },
  editorialTitle: {
    color: palette.textPrimary,
    fontFamily: typography.bodyMedium,
    fontSize: 16,
    marginBottom: 8,
  },
  editorialBody: {
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 21,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
    paddingTop: 18,
  },
  spacer: {
    width: 12,
  },
  loadingCard: {
    marginTop: 20,
    padding: 28,
    borderRadius: 24,
    backgroundColor: palette.surface,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.accent,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 12,
    },
  },
  loadingTitle: {
    color: palette.textPrimary,
    fontFamily: typography.bodyMedium,
    fontSize: 18,
  },
  loadingText: {
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  loadingDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  heroImage: {
    width: "100%",
    height: 240,
    borderRadius: 24,
    marginBottom: 16,
  },
  resultMetaBlock: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  resultName: {
    color: palette.textPrimary,
    fontFamily: typography.display,
    fontSize: 34,
    lineHeight: 36,
    marginBottom: 12,
    textAlign: "center",
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  statChip: {
    backgroundColor: palette.backgroundElevated,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.separator,
  },
  statChipLabel: {
    color: palette.textSecondary,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  imageFallback: {
    width: "100%",
    height: 240,
    borderRadius: 24,
    marginBottom: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
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
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
});

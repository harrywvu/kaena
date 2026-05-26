---
name: apple-hig-native-ui
description: Design, build, or review Apple-platform interfaces that follow Human Interface Guidelines, with adaptive iOS/iPadOS layouts, accessibility, motion, typography, haptics, and semantic color.
---

## When to use this skill

Use this skill when the task involves any of the following:

- Building or reviewing iOS, iPadOS, macOS, or Apple Watch UI
- Translating product ideas into Apple-native interface patterns
- Auditing a screen, flow, or component against Apple Human Interface Guidelines
- Improving accessibility, motion behavior, typography, spacing, or contrast for Apple platforms
- Choosing between iPhone, iPad, and shared layouts
- Designing haptics, Live Activities, Dynamic Island content, App Clips, or App Intents

## Core objective

Produce interfaces that feel native to Apple platforms: clear, content-first, accessible, adaptable, and restrained.

## Design principles to enforce

### 1) Prioritize clarity, deference, and depth
- Keep text legible at all sizes.
- Remove decorative clutter that competes with content.
- Let the interface frame the content instead of dominating it.
- Use spatial layering and motion only when they improve understanding.

### 2) Respect platform ergonomics
- Treat iPhone as a handheld, reachability-constrained environment.
- Treat iPad as a larger, multitasking, more desktop-like environment.
- Do not force the same navigation structure onto both form factors.
- Prefer bottom-weighted controls on iPhone.
- Prefer sidebars and multi-column layouts on iPad when space allows.

### 3) Use adaptive layout systems
- Build with safe areas, layout guides, and responsive containers.
- Keep spacing aligned to an 8 pt rhythm when possible.
- Preserve concentricity in nested rounded containers.
- Prevent clipping during window resizing or localization.
- Mirror layouts for right-to-left languages.

### 4) Use Apple-style typography and semantic color
- Prefer system fonts and native text styles.
- Support Dynamic Type from the start.
- Favor regular, medium, semibold, or bold weights.
- Avoid thin or ultralight text for essential content.
- Use semantic colors instead of hardcoded hex values.
- Ensure contrast remains readable in both light and dark modes.

### 5) Make touch and gesture behavior predictable
- Ensure all primary actions have clear buttons, not gesture-only interactions.
- Keep interactive targets at least 44x44 pt.
- Separate controls enough to avoid accidental taps.
- Reserve complex gestures for shortcuts, not core workflows.
- Use standard system behaviors for tap, swipe, hold, drag, and double-tap.

### 6) Treat motion and haptics as functional feedback
- Use motion to clarify hierarchy, transitions, and state changes.
- Reduce motion when the system accessibility setting is enabled.
- Replace elaborate transitions with fades when needed.
- Use haptics to reinforce key actions, success, warnings, and state change.
- Keep tactile feedback subtle and meaningful, not decorative.

### 7) Support Apple system features naturally
- Consider Live Activities, Dynamic Island, App Clips, and App Intents when the use case fits.
- Keep Live Activity content glanceable, concise, and private by default.
- Keep App Clips narrowly scoped to a single task.
- Expose useful actions through App Intents when system integration helps the user.

### 8) Design accessibility as a baseline
- Write copy in plain language.
- Use direct, action-oriented labels.
- Avoid color alone to communicate state.
- Provide accessibility labels for interactive elements.
- Preserve logical reading order for VoiceOver.
- Support captions, subtitles, transcripts, and audio descriptions where media is involved.

## Platform-specific guidance

### iPhone
- Favor bottom navigation and thumb-friendly controls.
- Keep the primary hierarchy shallow.
- Optimize for one-handed use and short interaction cycles.
- Use full-screen, sheet, and stack-based patterns that work well on a small viewport.

### iPad
- Favor sidebars, split panes, and adaptable multi-column layouts.
- Preserve persistent selection state across panes.
- Set sensible minimum and maximum pane sizes.
- Design for touch, keyboard, pencil, trackpad, and external display input.

## Implementation checklist

Before finishing a task, verify:

- Text scales correctly with Dynamic Type
- Contrast remains readable in light and dark appearance
- Buttons and touch targets are large enough
- VoiceOver labels describe actions clearly
- Motion respects Reduce Motion
- Layout adapts cleanly to iPhone and iPad
- Localized text does not truncate critical content
- RTL layouts mirror correctly
- Haptics are intentional and restrained
- Any Live Activity or App Clip content stays focused and privacy-safe

## Output expectations

When asked to create or revise Apple-platform UI, return:
- A concise recommendation
- A platform-specific layout decision if relevant
- Accessibility notes
- Any needed implementation details for SwiftUI, UIKit, or related Apple frameworks

## Refusal boundary

Do not invent Apple platform behavior or cite exact system rules unless the task needs it. When unsure, prefer the current platform documentation and native component defaults.
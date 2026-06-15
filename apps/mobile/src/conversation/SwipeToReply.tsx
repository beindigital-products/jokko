import { useEffect, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { theme } from "@jokko/tokens";

const TRIGGER_DISTANCE = 64;
const MAX_TRANSLATION = 96;

type Props = {
    direction: "left" | "right";
    onTrigger: () => void;
    children: ReactNode;
};

/**
 * Swipe-to-reply container. Horizontally pans the child bubble.
 *
 * - direction "right": inbound bubbles swipe rightwards (revealing reply icon on left).
 * - direction "left": outbound bubbles swipe leftwards (icon on right).
 *
 * When the gesture crosses TRIGGER_DISTANCE we fire a haptic and lock the
 * trigger so it doesn't repeat while the user continues to drag.
 */
export function SwipeToReply({ direction, onTrigger, children }: Props) {
    const translateX = useSharedValue(0);
    const hasTriggered = useSharedValue(false);

    const handleHaptic = () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const triggerOnJS = () => {
        onTrigger();
    };

    useEffect(() => {
        return () => {
            translateX.value = 0;
            hasTriggered.value = false;
        };
    }, [hasTriggered, translateX]);

    const sign = direction === "right" ? 1 : -1;

    const pan = Gesture.Pan()
        .activeOffsetX(direction === "right" ? [10, 9999] : [-9999, -10])
        .failOffsetY([-15, 15])
        .onUpdate((event) => {
            const raw = event.translationX * sign;
            const clamped = Math.max(0, Math.min(raw, MAX_TRANSLATION));
            translateX.value = clamped * sign;

            if (!hasTriggered.value && clamped >= TRIGGER_DISTANCE) {
                hasTriggered.value = true;
                runOnJS(handleHaptic)();
            }
        })
        .onEnd(() => {
            if (hasTriggered.value) {
                runOnJS(triggerOnJS)();
            }
            translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
            hasTriggered.value = false;
        });

    const bubbleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const iconStyle = useAnimatedStyle(() => {
        const distance = Math.abs(translateX.value);
        const opacity = interpolate(distance, [0, TRIGGER_DISTANCE], [0, 1], "clamp");
        const scale = interpolate(distance, [0, TRIGGER_DISTANCE], [0.6, 1], "clamp");
        return { opacity, transform: [{ scale }] };
    });

    return (
        <View style={styles.root}>
            <Animated.View
                style={[
                    styles.iconContainer,
                    direction === "right" ? styles.iconLeft : styles.iconRight,
                    iconStyle,
                ]}
                pointerEvents="none"
            >
                <Ionicons name="arrow-undo" size={18} color={theme.accent.primary} />
            </Animated.View>
            <GestureDetector gesture={pan}>
                <Animated.View style={bubbleStyle}>{children}</Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { position: "relative" },
    iconContainer: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    iconLeft: { left: -8 },
    iconRight: { right: -8 },
});

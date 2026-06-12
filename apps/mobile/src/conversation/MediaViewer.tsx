import { Image, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import { Icon } from "@jokko/ui-mobile";
import type { ConversationMessage } from "./MessageBubble";

type Props = {
    message: ConversationMessage | null;
    onClose: () => void;
};

/**
 * Full-screen, in-app viewer for photos (pinch / double-tap zoom + pan) and
 * videos (expo-video). Keeps media inside the app instead of bouncing out to
 * Safari via Linking.
 */
export function MediaViewer({ message, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const isVideo = message?.type === "VIDEO";
    const uri = message?.mediaUrl ?? null;

    return (
        <Modal visible={message !== null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.root}>
                {message && uri ? (
                    isVideo ? (
                        <VideoScreen key={message.id} uri={uri} />
                    ) : (
                        <ZoomImage key={message.id} uri={uri} onClose={onClose} />
                    )
                ) : null}

                <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
                    <Pressable accessibilityLabel="Fermer" onPress={onClose} hitSlop={10} style={styles.iconBtn}>
                        <Icon name="chevron-left" size={22} color="#fff" strokeWidth={2} />
                    </Pressable>
                    {uri ? (
                        <Pressable
                            accessibilityLabel="Ouvrir en plein écran système"
                            onPress={() => void WebBrowser.openBrowserAsync(uri).catch(() => undefined)}
                            hitSlop={10}
                            style={styles.iconBtn}
                        >
                            <Icon name="arrow-up-right" size={20} color="#fff" strokeWidth={2} />
                        </Pressable>
                    ) : null}
                </View>

                {message?.content ? (
                    <View style={[styles.caption, { paddingBottom: insets.bottom + 16 }]} pointerEvents="none">
                        <Text style={styles.captionText}>{message.content}</Text>
                    </View>
                ) : null}
            </View>
        </Modal>
    );
}

function VideoScreen({ uri }: { uri: string }) {
    const player = useVideoPlayer(uri, (instance) => {
        instance.loop = false;
        instance.play();
    });
    return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls allowsFullscreen />;
}

function ZoomImage({ uri, onClose }: { uri: string; onClose: () => void }) {
    const { width, height } = useWindowDimensions();
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const savedTx = useSharedValue(0);
    const savedTy = useSharedValue(0);

    const pinch = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = Math.max(1, savedScale.value * event.scale);
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            if (scale.value <= 1.01) {
                scale.value = withTiming(1);
                savedScale.value = 1;
                tx.value = withTiming(0);
                ty.value = withTiming(0);
                savedTx.value = 0;
                savedTy.value = 0;
            }
        });

    const pan = Gesture.Pan()
        .onUpdate((event) => {
            if (scale.value > 1) {
                tx.value = savedTx.value + event.translationX;
                ty.value = savedTy.value + event.translationY;
            }
        })
        .onEnd(() => {
            savedTx.value = tx.value;
            savedTy.value = ty.value;
        });

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (scale.value > 1) {
                scale.value = withTiming(1);
                savedScale.value = 1;
                tx.value = withTiming(0);
                ty.value = withTiming(0);
                savedTx.value = 0;
                savedTy.value = 0;
            } else {
                scale.value = withTiming(2.5);
                savedScale.value = 2.5;
            }
        });

    const composed = Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));

    const imageStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
    }));

    return (
        <GestureDetector gesture={composed}>
            <Animated.View style={styles.imageWrap}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <Animated.Image source={{ uri }} style={[{ width, height }, imageStyle]} resizeMode="contain" />
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#000" },
    imageWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    topBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 14,
        paddingBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)" },
    caption: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 16 },
    captionText: { color: "#fff", fontSize: 15, lineHeight: 21, textAlign: "center" },
});

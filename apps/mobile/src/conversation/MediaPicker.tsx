import { useState } from "react";
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { theme } from "@jokko/tokens";
import {
    buildMediaSendArgs,
    validatePickedAsset,
    type MediaSendArgs,
    type PickedAsset,
} from "../lib/media-pick";

type PickPayload = MediaSendArgs & { uri: string };

type Props = {
    disabled?: boolean;
    onPicked: (payload: PickPayload) => void;
};

type PickerKind = PickedAsset["kind"];

const KIND_LABELS: Record<PickerKind, string> = {
    image: "Photo",
    video: "Vidéo",
    document: "Document",
};

const KIND_ICONS: Record<PickerKind, React.ComponentProps<typeof Ionicons>["name"]> = {
    image: "image-outline",
    video: "videocam-outline",
    document: "document-text-outline",
};

async function pickImageOrVideo(kind: "image" | "video"): Promise<PickedAsset | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        Alert.alert(
            "Accès médias refusé",
            "Active l'accès à la photothèque dans Réglages pour partager un média.",
        );
        return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: kind === "image" ? ["images"] : ["videos"],
        allowsMultipleSelection: false,
        quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) return null;

    const asset = result.assets[0];
    return {
        kind,
        uri: asset.uri,
        mimeType: asset.mimeType ?? null,
        fileName: asset.fileName ?? null,
        fileSize: typeof asset.fileSize === "number" ? asset.fileSize : null,
    };
}

async function pickDocument(): Promise<PickedAsset | null> {
    const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
    });
    if (result.canceled || result.assets.length === 0) return null;
    const asset = result.assets[0];
    return {
        kind: "document",
        uri: asset.uri,
        mimeType: asset.mimeType ?? null,
        fileName: asset.name ?? null,
        fileSize: typeof asset.size === "number" ? asset.size : null,
    };
}

function explainValidation(reason: "missing_uri" | "too_large") {
    if (reason === "too_large") {
        return "Le fichier est trop volumineux (limite WhatsApp).";
    }
    return "Impossible de lire le fichier sélectionné.";
}

export function MediaPicker({ disabled, onPicked }: Props) {
    const [showAndroidSheet, setShowAndroidSheet] = useState(false);

    const handle = async (kind: PickerKind) => {
        try {
            const asset =
                kind === "document" ? await pickDocument() : await pickImageOrVideo(kind);
            if (!asset) return;

            const validation = validatePickedAsset(asset);
            if (!validation.ok) {
                Alert.alert("Impossible d'envoyer", explainValidation(validation.reason));
                return;
            }

            const args = buildMediaSendArgs(asset);
            onPicked({ ...args, uri: asset.uri });
        } catch (pickError) {
            const message =
                pickError instanceof Error ? pickError.message : "Erreur lors de la sélection";
            Alert.alert("Pièce jointe", message);
        }
    };

    const openMenu = () => {
        if (disabled) return;
        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ["Annuler", KIND_LABELS.image, KIND_LABELS.video, KIND_LABELS.document],
                    cancelButtonIndex: 0,
                },
                (index) => {
                    if (index === 1) void handle("image");
                    if (index === 2) void handle("video");
                    if (index === 3) void handle("document");
                },
            );
            return;
        }
        setShowAndroidSheet(true);
    };

    return (
        <>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Joindre un média"
                disabled={disabled}
                onPress={openMenu}
                hitSlop={8}
                style={({ pressed }) => [
                    styles.attachButton,
                    disabled && styles.disabled,
                    pressed && !disabled && styles.pressed,
                ]}
            >
                <Ionicons name="add" size={24} color={theme.ink[900]} />
            </Pressable>

            {showAndroidSheet ? (
                <View style={styles.androidSheet}>
                    {(["image", "video", "document"] as const).map((kind) => (
                        <Pressable
                            key={kind}
                            accessibilityRole="button"
                            onPress={() => {
                                setShowAndroidSheet(false);
                                void handle(kind);
                            }}
                            style={({ pressed }) => [styles.sheetRow, pressed && styles.pressed]}
                        >
                            <Ionicons name={KIND_ICONS[kind]} size={20} color={theme.ink[900]} />
                            <Text style={styles.sheetLabel}>{KIND_LABELS[kind]}</Text>
                        </Pressable>
                    ))}
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => setShowAndroidSheet(false)}
                        style={({ pressed }) => [styles.sheetRow, pressed && styles.pressed]}
                    >
                        <Ionicons name="close" size={20} color={theme.ink[500]} />
                        <Text style={[styles.sheetLabel, styles.cancelLabel]}>Annuler</Text>
                    </Pressable>
                </View>
            ) : null}
        </>
    );
}

const styles = StyleSheet.create({
    attachButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    androidSheet: {
        position: "absolute",
        bottom: 72,
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        backgroundColor: theme.surface.default,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.ink[300],
        overflow: "hidden",
    },
    sheetRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.ink[300],
    },
    sheetLabel: {
        fontSize: 15,
        fontWeight: "700",
        color: theme.ink[900],
    },
    cancelLabel: {
        color: theme.ink[500],
    },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.7 },
});

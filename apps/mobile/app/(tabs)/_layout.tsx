import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@jokko/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

const tabs: Record<string, { title: string; icon: IconName; activeIcon: IconName }> = {
    inbox: { title: "Inbox", icon: "chatbubble-outline", activeIcon: "chatbubble" },
    contacts: { title: "Contacts", icon: "people-outline", activeIcon: "people" },
    notifications: { title: "Notifs", icon: "notifications-outline", activeIcon: "notifications" },
    hub: { title: "Hub", icon: "grid-outline", activeIcon: "grid" },
    settings: { title: "Plus", icon: "settings-outline", activeIcon: "settings" },
};

export default function TabsLayout() {
    return (
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.surface.default }}>
        <Tabs
            screenOptions={({ route }) => {
                const item = tabs[route.name] ?? tabs.inbox;

                return {
                    headerShown: false,
                    tabBarLabel: item.title,
                    tabBarActiveTintColor: theme.accent.primary,
                    tabBarInactiveTintColor: theme.ink[500],
                    tabBarStyle: {
                        minHeight: 72,
                        paddingTop: 8,
                        paddingBottom: 10,
                        borderTopWidth: 1,
                        borderTopColor: theme.ink[300],
                        backgroundColor: theme.surface.raised,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: "800",
                    },
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? item.activeIcon : item.icon} size={21} color={color} />
                    ),
                };
            }}
        >
            <Tabs.Screen name="inbox" />
            <Tabs.Screen name="contacts" />
            <Tabs.Screen name="notifications" />
            <Tabs.Screen name="hub" />
            <Tabs.Screen name="settings" />
        </Tabs>
        </SafeAreaView>
    );
}

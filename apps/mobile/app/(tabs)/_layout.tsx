import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "@jokko/ui-mobile";
import { theme } from "@jokko/tokens";

// v2 design nav icons (stroke-based, drawn by the Icon kit from the exact design
// paths). Active = accent tint + thicker stroke; inactive = muted + thin stroke.
// Assigned explicitly per screen (a route.name lookup mismatched and fell back
// to one icon/label for every tab).
function tabIcon(name: IconName) {
    return ({ color, focused }: { color: string; focused: boolean }) => (
        <Icon name={name} size={23} color={color} strokeWidth={focused ? 2 : 1.6} />
    );
}

export default function TabsLayout() {
    return (
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.surface.default }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
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
                        fontWeight: "600",
                    },
                }}
            >
                <Tabs.Screen name="inbox/index" options={{ title: "Inbox", tabBarIcon: tabIcon("inbox") }} />
                <Tabs.Screen name="contacts/index" options={{ title: "Contacts", tabBarIcon: tabIcon("users") }} />
                <Tabs.Screen name="notifications/index" options={{ title: "Activité", tabBarIcon: tabIcon("bell") }} />
                <Tabs.Screen name="hub/index" options={{ title: "Hub", tabBarIcon: tabIcon("hub") }} />
                <Tabs.Screen name="settings/index" options={{ title: "Réglages", tabBarIcon: tabIcon("cog") }} />
            </Tabs>
        </SafeAreaView>
    );
}

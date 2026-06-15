/**
 *  _                            _   
 * | |    __ _ _   _  ___  _   _| |_ 
 * | |   / _` | | | |/ _ \| | | | __|
 * | |__| (_| | |_| | (_) | |_| | |_ 
 * |_____\__,_|\__, |\___/ \__,_|\__|
 *             |___/                 
 *
 * EMAIL LAYOUT COMPONENT
 *
 * Common layout wrapper for all system emails.
 * Includes:
 * - HTML structure
 * - Tailwind configuration
 * - Preview text
 * - Standard container styling
 * - Footer with copyright
 */

import {
    Body,
    Container,
    Head,
    Html,
    Preview,
    Section,
    Tailwind,
    Text,
    Link,
    Img,
} from "@react-email/components";
import * as React from "react";

// Le logo de marque vit toujours sur le domaine marketing, quel que soit
// l'environnement d'envoi (asset servi sans auth-gate, cf. proxy.ts) — on fige
// l'URL plutôt que de dépendre d'un SITE_URL/APP_URL parfois pointé sur le dev.
const LOGO_URL = "https://www.jokko.co/logo.png";

interface LayoutProps {
    preview: string;
    children: React.ReactNode;
}

export function Layout({ preview, children }: LayoutProps) {
    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Tailwind>
                <Body className="bg-slate-100 font-sans">
                    <Container className="mx-auto py-10 px-4">
                        <Section className="bg-white rounded-xl p-10 shadow-sm">
                            <Img
                                src={LOGO_URL}
                                alt="Jokko"
                                width="132"
                                height="35"
                                className="mx-auto mb-8"
                            />
                            {children}
                        </Section>
                        <Footer />
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}

function Footer() {
    return (
        <Section className="text-center mt-8">
            <Text className="text-slate-400 text-xs">
                © {new Date().getFullYear()} Jokko. Tous droits réservés.
            </Text>
        </Section>
    );
}

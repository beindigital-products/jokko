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

// Emails need an absolute, publicly-reachable image URL (relative paths and
// auth-gated assets break in mail clients). The Next app serves /logo.png on
// the marketing domain; SITE_URL overrides it per environment.
const SITE_URL = process.env.SITE_URL || "https://www.jokko.co";

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
                                src={`${SITE_URL}/logo.png`}
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

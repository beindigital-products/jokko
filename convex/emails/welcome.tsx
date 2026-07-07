/**
 * WELCOME EMAIL TEMPLATE
 *
 * Sent once, right after a user completes onboarding. Greets them and points to
 * the three first-run steps (connect a number, invite the team, first campaign).
 */

import { Heading, Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "./components/layout";
import { Button } from "./components/button";

interface WelcomeEmailProps {
    userName: string;
    dashboardUrl: string;
}

export function WelcomeEmail({ userName, dashboardUrl }: WelcomeEmailProps) {
    return (
        <Layout preview="Bienvenue sur Jokko — centralisez vos conversations WhatsApp">
            <Heading className="text-2xl font-bold text-slate-900 m-0 mb-6">
                Bienvenue{userName ? `, ${userName}` : ""} 👋
            </Heading>

            <Text className="text-slate-600 leading-relaxed m-0 mb-4">
                Votre compte Jokko est prêt. Vous pouvez dès maintenant centraliser vos numéros
                WhatsApp Business dans une seule boîte de réception partagée avec votre équipe.
            </Text>

            <Text className="text-slate-600 leading-relaxed m-0 mb-2">
                Pour bien démarrer :
            </Text>
            <Text className="text-slate-600 leading-relaxed m-0 mb-1">
                1. Connectez votre premier numéro WhatsApp.
            </Text>
            <Text className="text-slate-600 leading-relaxed m-0 mb-1">
                2. Invitez vos coéquipiers.
            </Text>
            <Text className="text-slate-600 leading-relaxed m-0 mb-8">
                3. Créez un modèle et lancez votre première campagne.
            </Text>

            <Section className="text-center mb-8">
                <Button href={dashboardUrl}>Ouvrir mon tableau de bord</Button>
            </Section>

            <Text className="text-slate-400 text-xs m-0">
                Besoin d&apos;aide pour démarrer ? Répondez simplement à cet email.
            </Text>
        </Layout>
    );
}

export default WelcomeEmail;

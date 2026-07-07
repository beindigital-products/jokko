/**
 * TRIAL REMINDER EMAIL TEMPLATE
 *
 * Sent once by the daily lifecycle cron when an org's trial is ending soon and
 * no plan has been chosen yet. Nudges the owner to pick a plan before the trial
 * expires (features lock afterwards).
 */

import { Heading, Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "./components/layout";
import { Button } from "./components/button";

interface TrialReminderEmailProps {
    userName: string;
    daysLeft: number;
    billingUrl: string;
}

export function TrialReminderEmail({ userName, daysLeft, billingUrl }: TrialReminderEmailProps) {
    const when = daysLeft <= 1 ? "aujourd'hui" : `dans ${daysLeft} jours`;

    return (
        <Layout preview={`Votre essai Jokko se termine ${when}`}>
            <Heading className="text-2xl font-bold text-slate-900 m-0 mb-6">
                Votre essai se termine {when}
            </Heading>

            <Text className="text-slate-600 leading-relaxed m-0 mb-4">
                {userName ? `${userName}, ` : ""}votre période d&apos;essai Jokko arrive à échéance.
                Pour continuer à recevoir et envoyer vos messages WhatsApp sans interruption,
                choisissez un plan avant la fin de l&apos;essai.
            </Text>

            <Text className="text-slate-600 leading-relaxed m-0 mb-8">
                Vos numéros, conversations et modèles restent en place — il suffit d&apos;activer
                votre abonnement.
            </Text>

            <Section className="text-center mb-8">
                <Button href={billingUrl}>Choisir mon plan</Button>
            </Section>

            <Text className="text-slate-400 text-xs m-0">
                Une question sur les plans ? Répondez à cet email, on vous aide.
            </Text>
        </Layout>
    );
}

export default TrialReminderEmail;

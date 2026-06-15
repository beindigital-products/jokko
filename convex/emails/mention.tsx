/**
 * MENTION EMAIL TEMPLATE
 *
 * Sent when a teammate @mentions a user in an internal note on a conversation.
 * Contains: author name, where (contact/conversation), the note excerpt, and a
 * deep link to open the conversation.
 */

import { Heading, Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "./components/layout";
import { Button } from "./components/button";

interface MentionEmailProps {
    authorName: string;
    where: string;
    excerpt: string;
    url: string;
}

export function MentionEmail({ authorName, where, excerpt, url }: MentionEmailProps) {
    return (
        <Layout preview={`${authorName} vous a mentionné sur Jokko`}>
            <Heading className="text-2xl font-bold text-slate-900 m-0 mb-6">
                {authorName} vous a mentionné
            </Heading>

            <Text className="text-slate-600 leading-relaxed m-0 mb-4">
                <strong>{authorName}</strong> vous a mentionné dans une note interne
                sur <strong>{where}</strong>.
            </Text>

            <Section className="bg-slate-50 rounded-lg p-4 mb-8">
                <Text className="text-slate-700 italic m-0">« {excerpt} »</Text>
            </Section>

            <Section className="text-center mb-8">
                <Button href={url}>Ouvrir la conversation</Button>
            </Section>

            <Text className="text-slate-400 text-sm leading-relaxed m-0">
                Vous recevez cet email car un coéquipier vous a mentionné dans Jokko.
            </Text>
        </Layout>
    );
}

export type CsvContact = {
    phone: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    company?: string;
    jobTitle?: string;
    city?: string;
};

/** Tokenize CSV text into rows of fields, honouring quoted fields with commas. */
export function parseCsvRows(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === "," || ch === ";" || ch === "\t") {
            row.push(field);
            field = "";
        } else if (ch === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else if (ch !== "\r") {
            field += ch;
        }
    }
    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

const PATTERNS: { key: keyof Omit<CsvContact, never>; re: RegExp }[] = [
    { key: "firstName", re: /^(pr[ée]nom|first ?name)$/i },
    { key: "lastName", re: /^(nom de famille|last ?name|surname)$/i },
    { key: "phone", re: /(phone|t[ée]l[ée]phone|^tel$|mobile|num[ée]ro|whatsapp|gsm)/i },
    { key: "email", re: /(e-?mail|courriel)/i },
    { key: "company", re: /(company|soci[ée]t[ée]|entreprise|organisation|org)/i },
    { key: "jobTitle", re: /(poste|fonction|job ?title|^title$|^titre$)/i },
    { key: "city", re: /(ville|^city$)/i },
    { key: "name", re: /^(nom complet|full ?name|^name$|^nom$|contact)$/i },
];

function clean(value: string | undefined): string {
    return (value ?? "").trim();
}

/**
 * Parse a CSV export into importable contacts. Auto-maps common French/English
 * headers; falls back to "first column = phone" for header-less files. Rows
 * without any digits in the phone column are dropped.
 */
export function parseContactsCsv(text: string): CsvContact[] {
    const rows = parseCsvRows(text);
    if (rows.length === 0) return [];

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const cols: Partial<Record<keyof CsvContact, number>> = {};
    header.forEach((cell, index) => {
        for (const { key, re } of PATTERNS) {
            if (cols[key] === undefined && re.test(cell)) {
                cols[key] = index;
                break;
            }
        }
    });

    const hasHeader = cols.phone !== undefined || cols.name !== undefined || cols.email !== undefined;
    const dataRows = hasHeader ? rows.slice(1) : rows;
    const phoneCol = cols.phone ?? 0;

    const out: CsvContact[] = [];
    for (const row of dataRows) {
        const phone = clean(row[phoneCol]);
        if (!phone || !/\d/.test(phone)) continue;
        const contact: CsvContact = { phone };
        const assign = (key: keyof CsvContact) => {
            const col = cols[key];
            if (col !== undefined && col !== phoneCol) {
                const value = clean(row[col]);
                if (value) contact[key] = value;
            }
        };
        assign("name");
        assign("firstName");
        assign("lastName");
        assign("email");
        assign("company");
        assign("jobTitle");
        assign("city");
        if (!contact.name && (contact.firstName || contact.lastName)) {
            contact.name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
        }
        out.push(contact);
    }
    return out;
}

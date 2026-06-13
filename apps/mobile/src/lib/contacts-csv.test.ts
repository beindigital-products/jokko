import { describe, expect, it } from "vitest";
import { parseContactsCsv, parseCsvRows } from "./contacts-csv";

describe("parseCsvRows", () => {
    it("honours quoted fields with commas", () => {
        const rows = parseCsvRows('name,company\n"Diop, Awa","Atelier, Dakar"');
        expect(rows).toEqual([
            ["name", "company"],
            ["Diop, Awa", "Atelier, Dakar"],
        ]);
    });

    it("supports semicolon + tab delimiters and skips blank lines", () => {
        expect(parseCsvRows("a;b\n\n1;2")).toEqual([
            ["a", "b"],
            ["1", "2"],
        ]);
    });
});

describe("parseContactsCsv", () => {
    it("maps French headers", () => {
        const csv = "Nom,Téléphone,E-mail,Entreprise\nAwa Diallo,+221770000000,awa@x.sn,Atelier";
        expect(parseContactsCsv(csv)).toEqual([
            { phone: "+221770000000", name: "Awa Diallo", email: "awa@x.sn", company: "Atelier" },
        ]);
    });

    it("maps English headers", () => {
        const csv = "phone,name,email\n+33612345678,Léa,lea@x.fr";
        expect(parseContactsCsv(csv)).toEqual([{ phone: "+33612345678", name: "Léa", email: "lea@x.fr" }]);
    });

    it("composes name from first/last name", () => {
        const csv = "Prénom,Nom de famille,Téléphone\nMehdi,Sané,+221770000001";
        const [c] = parseContactsCsv(csv);
        expect(c).toMatchObject({ phone: "+221770000001", firstName: "Mehdi", lastName: "Sané", name: "Mehdi Sané" });
    });

    it("treats a header-less file as first column = phone", () => {
        expect(parseContactsCsv("+221770000002\n+221770000003")).toEqual([
            { phone: "+221770000002" },
            { phone: "+221770000003" },
        ]);
    });

    it("drops rows whose phone has no digits", () => {
        const csv = "phone,name\n,Sans Numéro\n+221770000004,Avec Numéro";
        expect(parseContactsCsv(csv)).toEqual([{ phone: "+221770000004", name: "Avec Numéro" }]);
    });
});

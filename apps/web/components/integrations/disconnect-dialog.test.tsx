import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DisconnectDialog } from "./disconnect-dialog";

afterEach(() => {
    cleanup();
});

describe("DisconnectDialog", () => {
    function renderDialog(overrides: Partial<React.ComponentProps<typeof DisconnectDialog>> = {}) {
        const props = {
            open: true,
            providerLabel: "HubSpot",
            onCancel: vi.fn(),
            onConfirm: vi.fn(),
            busy: false,
            ...overrides,
        };
        const view = render(<DisconnectDialog {...props} />);
        return { ...view, props };
    }

    it("renders the provider label in the title + subtitle", () => {
        renderDialog();
        expect(screen.getByText(/Déconnecter HubSpot/)).toBeInTheDocument();
        expect(screen.getByText(/s.arrête immédiatement/i)).toBeInTheDocument();
    });

    it("confirms immediately — no acknowledgment gate", async () => {
        const onConfirm = vi.fn().mockResolvedValue(undefined);
        renderDialog({ onConfirm });
        const confirmBtn = screen.getByRole("button", { name: /^Déconnecter$/i });
        expect(confirmBtn).not.toBeDisabled();
        fireEvent.click(confirmBtn);
        await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());
    });

    it("lists the actions that stop (category scopes)", () => {
        renderDialog({ category: "CRM" });
        expect(screen.getByText(/Lire et écrire vos contacts/i)).toBeInTheDocument();
    });

    it("shows loading copy and disables confirm when busy", () => {
        renderDialog({ busy: true });
        expect(screen.getByRole("button", { name: /Déconnexion/i })).toBeDisabled();
    });

    it("invokes onCancel when Annuler is clicked", () => {
        const onCancel = vi.fn();
        renderDialog({ onCancel });
        fireEvent.click(screen.getByRole("button", { name: /Annuler/i }));
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it("reassures that already-synced data is kept", () => {
        renderDialog();
        expect(screen.getByText(/données déjà synchronisées sont conservées/i)).toBeInTheDocument();
    });

    it("warns to revoke manually when remote revoke is not supported", () => {
        renderDialog({ providerLabel: "HubSpot", supportsRemoteRevoke: false });
        expect(screen.getByText(/révoquer l.accès dans les paramètres de HubSpot/i)).toBeInTheDocument();
    });

    it("omits the manual-revoke note when remote revoke is supported", () => {
        renderDialog({ providerLabel: "Salesforce", supportsRemoteRevoke: true });
        expect(screen.queryByText(/révoquer l.accès dans les paramètres/i)).not.toBeInTheDocument();
    });
});

/**
 * Contact-domain shared type.
 *
 * The legacy pre-v3 `ContactList` component (~1.1k LOC) was removed — the live
 * contacts UI is `app/dashboard/contacts/_components/ContactsView.tsx`. Only the
 * `Tag` type outlived it (still imported by the contacts page + ContactsView),
 * so this module now holds just that type.
 */
export interface Tag {
    id: string
    name: string
    color: string
    contactCount: number
}

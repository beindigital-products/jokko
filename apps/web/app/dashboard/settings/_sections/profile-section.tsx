"use client"

import { useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { Briefcase, Loader2, Mail, Upload, User } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/contacts/PhoneInput"
import { Field, SaveButton, SettingsCard } from "../_components/settings-card"

export function ProfileSection() {
    const user = useQuery(api.users.me)
    const role = useQuery(api.users.currentUserRole)
    const updateProfile = useMutation(api.users.updateProfile)
    const generateUploadUrl = useMutation(api.users.generateUploadUrl)

    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [initialized, setInitialized] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    if (user && !initialized) {
        setName(user.name || "")
        setPhone(user.phone || "")
        setInitialized(true)
    }

    if (!user) {
        return (
            <div className="h-48 animate-pulse rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)]" />
        )
    }

    const save = async () => {
        try {
            setSaving(true)
            await updateProfile({ name, phone })
            toast.success("Profil mis à jour")
        } catch {
            toast.error("Impossible de mettre à jour le profil.")
        } finally {
            setSaving(false)
        }
    }

    const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            setUploading(true)
            const postUrl = await generateUploadUrl()
            const res = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            })
            const { storageId } = await res.json()
            await updateProfile({ imageStorageId: storageId })
            toast.success("Photo de profil mise à jour")
        } catch {
            toast.error("L'upload de l'image a échoué.")
        } finally {
            setUploading(false)
        }
    }

    return (
        <SettingsCard
            icon={User}
            title="Profil professionnel"
            description="Informations visibles par votre équipe"
            footer={<SaveButton onClick={save} loading={saving} />}
        >
            <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                    <div className="group relative">
                        <Avatar className="h-20 w-20 border border-[var(--ink-200)]">
                            <AvatarImage src={user.image} alt={user.name ?? ""} className="object-cover" />
                            <AvatarFallback className="bg-[var(--accent-muted)] text-xl font-semibold text-[var(--accent)]">
                                {user.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="Changer la photo"
                        >
                            <Upload className="h-5 w-5 text-white" />
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
                        {uploading ? (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[var(--paper-white)]/80">
                                <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
                            </div>
                        ) : null}
                    </div>
                    <div className="text-center sm:text-left">
                        <h4 className="text-[13px] font-semibold text-[var(--ink-900)]">Photo de profil</h4>
                        <p className="text-[11px] text-[var(--ink-soft)]">JPG, GIF ou PNG. 1 Mo max.</p>
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="mt-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)] disabled:opacity-50"
                        >
                            {uploading ? "Upload en cours…" : "Changer la photo"}
                        </button>
                    </div>
                </div>

                <div className="h-px bg-[var(--ink-100)]" />

                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Nom complet" htmlFor="name">
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom complet" className="h-9" />
                    </Field>
                    <Field label="Email professionnel" htmlFor="email" hint="Pour changer votre email, contactez votre administrateur.">
                        <div className="flex">
                            <span className="inline-flex items-center rounded-l-md border border-r-0 border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 text-[var(--ink-soft)]">
                                <Mail className="h-3.5 w-3.5" />
                            </span>
                            <Input id="email" defaultValue={user.email} disabled className="h-9 rounded-l-none bg-[var(--paper-warm)] text-[var(--ink-500)]" />
                        </div>
                    </Field>
                    <Field label="Téléphone" htmlFor="phone">
                        <PhoneInput id="phone" value={phone} onChange={setPhone} placeholder="+33 6 12 34 56 78" />
                    </Field>
                    <Field label="Rôle / Fonction" htmlFor="role">
                        <div className="flex">
                            <span className="inline-flex items-center rounded-l-md border border-r-0 border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 text-[var(--ink-soft)]">
                                <Briefcase className="h-3.5 w-3.5" />
                            </span>
                            <Input id="role" defaultValue={role || "Membre"} disabled className="h-9 rounded-l-none bg-[var(--paper-warm)] capitalize text-[var(--ink-500)]" />
                        </div>
                    </Field>
                </div>
            </div>
        </SettingsCard>
    )
}

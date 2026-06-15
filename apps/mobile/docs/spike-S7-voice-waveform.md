# Spike S7 — Voice notes waveform POC

> **Statut** : Termine cote code. Mesure iPhone SE3 a capturer sur device.
> **Date** : 2026-05-01
> **Objectif** : valider qu'une note vocale mobile peut alimenter une waveform Skia en temps reel via metering audio, sans stocker de PCM brut ni surcharger le thread JS.

---

## 1. Objectif du spike

S7 adresse le risque voice notes identifie dans `architecture.md §17.2` :

- les notes vocales v1.0 doivent afficher une waveform live, pas uniquement un timer ;
- le polling audio ne doit pas degrader l'UX sur petit iPhone ;
- en cas de limitation native, le produit doit garder un fallback waveform statique acceptable.

Le spike livre donc :

1. un ecran Expo/Skia branche dans le menu de spike ;
2. un recorder `expo-audio` avec metering active ;
3. une couche pure testee pour normaliser les niveaux, capper le buffer et calculer les stats FPS p95 ;
4. une instrumentation runtime pour mesurer le p95 FPS directement sur device.

---

## 2. Implementation livree

### 2.1 Recorder natif

Fichier : `apps/mobile/src/VoiceWaveform.tsx`

Le POC utilise `expo-audio` parce que l'app est sur Expo SDK 54 et que l'API expose :

- `useAudioRecorder(...)` ;
- `useAudioRecorderState(recorder, interval)` ;
- `RecorderState.metering` quand `isMeteringEnabled` est actif.

Parametres verrouilles :

- preset `RecordingPresets.LOW_QUALITY` pour rester adapte aux messages vocaux ;
- `isMeteringEnabled: true` ;
- polling toutes les `50 ms` ;
- `setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })` au demarrage ;
- retour a `allowsRecording: false` a l'arret.

### 2.2 Waveform Skia

Fichier : `apps/mobile/src/lib/voice-waveform.ts`

La waveform est rendue par `@shopify/react-native-skia` sous forme de barres arrondies :

- `meteringDbToAmplitude()` transforme les dB natifs en amplitude `0..1` ;
- `appendMeteringSample()` maintient un ring buffer immutable cappe a 48 barres ;
- `buildWaveformRects()` calcule une geometrie stable, centree verticalement ;
- `createIdleWaveform()` fournit une preview/fallback quand le recorder n'est pas actif.

Le POC ne conserve pas les frames PCM et ne loggue aucun contenu audio.

### 2.3 Instrumentation FPS p95

Fichiers :

- `apps/mobile/src/VoiceWaveform.tsx`
- `apps/mobile/src/lib/voice-waveform.ts`

`useFrameStats()` mesure les deltas `requestAnimationFrame` et affiche le p95 FPS dans l'ecran.

Interpretation retenue pour la validation device :

- `>= 55 fps p95` : acceptable pour v1.0 ;
- `< 55 fps p95` : degrader vers waveform moins dense ou statique ;
- `< 45 fps p95` : bloquer L4b voice notes avant optimisation.

### 2.4 Permissions

Fichier : `apps/mobile/app.json`

Ajout du plugin `expo-audio` avec `NSMicrophoneUsageDescription` :

```json
[
  "expo-audio",
  {
    "microphonePermission": "Jokko utilise le microphone pour enregistrer et envoyer des notes vocales.",
    "recordAudioAndroid": true
  }
]
```

Pas de background recording active pour v1.0.

---

## 3. Limite restante

La mesure iPhone SE3 n'a pas ete executee dans ce workspace.

Checklist device a faire avant de considerer S7 ferme a 100% :

1. Lancer `pnpm --filter @jokko/mobile start`.
2. Ouvrir `Spike S7 · Voice Waveform` sur iPhone SE3 ou device equivalent bas de gamme.
3. Enregistrer une note vocale de 30 secondes.
4. Relever le `p95` affiche pendant l'enregistrement.
5. Capturer une video courte ou screenshot avec `p95 >= 55 fps`.

Si le p95 est insuffisant, appliquer dans cet ordre :

1. descendre `VOICE_WAVEFORM_BAR_COUNT` de 48 a 32 ;
2. augmenter `VOICE_POLL_INTERVAL_MS` de 50 ms a 80 ms ;
3. fallback waveform statique pour v1.0.

---

## 4. Verification

Commandes executees :

```bash
pnpm exec vitest run apps/mobile/src/lib/voice-waveform.test.ts
pnpm --filter @jokko/mobile lint
pnpm --filter @jokko/mobile typecheck
pnpm exec vitest run
pnpm -r typecheck
pnpm exec tsc -p convex/tsconfig.json --noEmit --pretty false
```

Resultat :

- Tests waveform cibles : 7 tests passants.
- Suite Vitest complete : 258 tests passants.
- Lint mobile : OK.
- Typecheck mobile : OK.
- Typecheck workspace : OK.
- Typecheck Convex : OK.

---

## 5. Decisions ajoutees

| # | Decision | Impact |
|---|---|---|
| 91 | Voice notes v1.0 utilisent `expo-audio`, pas `expo-av`, pour rester aligne Expo SDK 54. | L4b |
| 92 | Metering recorder poll toutes les 50 ms avec `RecordingPresets.LOW_QUALITY + isMeteringEnabled`. | L4b |
| 93 | Waveform live = Skia bars depuis un buffer cappe a 48 amplitudes, sans stockage PCM brut. | Perf + privacy |
| 94 | L'ecran voice expose un p95 FPS runtime via `requestAnimationFrame`; validation SE3 requise avant L4b. | Perf gate |
| 95 | Si p95 SE3 < 55 fps, degradation autorisee : 32 bars, poll 80 ms, puis waveform statique. | Fallback |
| 96 | Micro permission source de verite = plugin `expo-audio` dans `app.json`; pas de background recording v1.0. | App Store |

---

## 6. Conclusion

✅ **Spike S7 reussi cote code** — recorder natif, metering, waveform Skia, instrumentation p95 et tests purs sont en place.

⚠️ **Action restante** — capturer la mesure p95 sur iPhone SE3 avant de declarer S7 completement valide.

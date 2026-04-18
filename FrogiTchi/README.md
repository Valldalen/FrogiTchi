# 🐸 FrogiTchi

> Un Tamagotchi grenouille pour Amazfit GTR 3 — gardez-la en vie avec vos pas !

![Zepp OS](https://img.shields.io/badge/Zepp%20OS-1.0-brightgreen)
![Amazfit GTR 3](https://img.shields.io/badge/Amazfit-GTR%203-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Présentation

FrogiTchi est un mini-programme Zepp OS pour l'Amazfit GTR 3. Une grenouille vit sur votre poignet : marchez suffisamment dans la journée pour qu'elle reste heureuse. Tapotez-la pour lui envoyer des coeurs. Si vous ne faites pas assez de pas, elle dépérit.

### États de la grenouille

| Vie | État | Couleur |
|-----|------|---------|
| 80 – 100 % | 😊 Heureuse | Vert |
| 40 – 79 % | 😐 Neutre | Jaune |
| 10 – 39 % | 😟 Triste | Orange |
| 0 – 9 % | 💀 Mourante | Rouge |

> **Bonus matin** : avant midi, la grenouille ne peut pas afficher l'état "mourante" — elle reste au minimum dans l'état triste pour vous laisser le temps de vous réveiller.

---

## Fonctionnalités

- **Vie basée sur les pas du jour** — calcul en temps réel via le capteur de la montre
- **Pas fictifs au tapotement** — chaque tap sur la grenouille ajoute +1 pas fictif et déclenche une animation de cœurs
- **Cœurs animés** — ils s'envolent autour de la grenouille à chaque tap
- **Menu de paramètres** accessible depuis l'écran principal
  - Régler l'objectif journalier (de 1 000 à 30 000 pas, par paliers de 500)
  - Ajouter des pas fictifs en masse (pour les marches sans montre)
- **Remise à zéro automatique** chaque jour à minuit
- **Persistence** via le système de fichiers de la montre (`hmFS`)

---

## Captures d'écran

```
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│     ╔═══════╗       │     │    Parametres       │
│     ║  🐸  ║       │     │                     │
│     ╚═══════╝       │     │  Objectif journalier│
│       VIE           │     │  [−]  8000  [+]     │
│  ████████░░  82%    │     │  Sur 3 jours : 24000│
│                     │     │  ─────────────────  │
│  Auj: 6542 pas      │     │  Pas fictifs        │
│  Obj: 8000 pas      │     │  [−]   500  [+]     │
│      [ Menu ]       │     │     [ Retour ]      │
└─────────────────────┘     └─────────────────────┘
       index.js                    menu.js
```

---

## Installation

### Prérequis

- [Node.js](https://nodejs.org/) ≥ 14
- [Zeus CLI](https://docs.zepp.com/docs/1.0/guides/tools/cli/) — l'outil officiel Zepp pour build et déployer

```bash
npm install -g @zeppos/zeus-cli
```

- L'app **Zepp** sur votre smartphone, appairée avec votre GTR 3
- **Mode développeur** activé sur la montre

### Activer le mode développeur

1. Ouvrir l'app **Zepp** → Profil → GTR 3
2. Descendre jusqu'à "À propos"
3. Tapper **7 fois** sur le numéro de version
4. Activer "Mode développeur"

### Déployer

```bash
# Cloner le projet
git clone https://github.com/votre-pseudo/FrogiTchi.git
cd FrogiTchi

# Prévisualiser dans le simulateur Zeus
zeus preview

# Installer directement sur la montre (Bluetooth)
zeus bridge
```

---

## Structure du projet

```
FrogiTchi/
├── app.js                      # Point d'entrée, globalData partagé entre pages
├── app.json                    # Config Zepp OS (cible GTR 3, designWidth 480)
├── page/
│   └── gtr-3/
│       ├── index.js            # Écran principal — grenouille, barre de vie, cœurs
│       └── menu.js             # Paramètres — objectif et pas fictifs
├── assets/
│   └── gtr-3/
│       ├── frog_happy.png      # Grenouille heureuse  (164×164 px)
│       ├── frog_neutral.png    # Grenouille neutre    (164×164 px)
│       ├── frog_sad.png        # Grenouille triste    (164×164 px)
│       ├── frog_dead.png       # Grenouille mourante  (164×164 px)
│       ├── heart.png           # Cœur volant          (32×32 px)
│       └── icon.png            # Icône de l'app       (80×80 px)
└── pages/
    └── i18n/
        └── en-US.po            # Traductions (requis par Zeus CLI)
```

---

## Architecture technique

### Pourquoi `hmFS` et pas `hmStorage` ?

`hmStorage` **n'existe pas** sur Zepp OS 1.0. La seule API de persistence disponible est `hmFS` (système de fichiers). Toutes les données sont sérialisées en JSON dans un fichier `frogitchi.json` sur la montre.

```json
{
  "goal": 8000,
  "d2": 6542,
  "fake": 120,
  "date": "2026-3-18"
}
```

### Communication entre pages

Sur Zepp OS 1.0, `hmApp.goBack()` ne supporte pas le passage de paramètres. La communication entre `menu.js` et `index.js` passe par `getApp()._options.globalData` (objet partagé en mémoire) combiné à un flag `menuDirty`. Un timer de polling dans `index.js` détecte les changements et rafraîchit l'UI.

### Pourquoi un timer de polling ?

Le hook `onResume()` n'existe pas en Zepp OS 1.0. Un `timer.createTimer` toutes les secondes remplace `setInterval` (lui aussi absent en OS 1.0) et joue le rôle de boucle principale : mise à jour du capteur de pas, détection du retour depuis le menu, et détection du changement de jour à minuit.

---

## Limitations connues

| Limitation | Raison |
|---|---|
| Pas d'animation des sprites | `IMG_ANIM` non fonctionnel de façon fiable sur OS 1.0 |
| Pas d'historique multi-jours | `hmSensor.id.STEP` ne retourne que les pas du jour courant |
| Pas de notification push | L'API de notification n'est pas accessible depuis les mini-programmes OS 1.0 |
| `setInterval` / `setTimeout` absents | Remplacés par `timer.createTimer` |

---

## Contribuer

Les contributions sont bienvenues ! En particulier :

- 🎨 Amélioration des sprites grenouille
- 🔔 Système de notifications (si possible sur OS 1.0)
- 🌍 Traductions supplémentaires dans `pages/i18n/`
- 📊 Historique des pas sur plusieurs jours

---

## Licence

MIT — faites-en ce que vous voulez, gardez juste votre grenouille en vie. 🐸

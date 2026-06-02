# AgriMeasure — notes build interne et mises à jour

Ce document décrit uniquement la préparation et les commandes à lancer manuellement. Il ne génère pas d’APK et ne publie pas d’update automatiquement.

## Configuration préparée

- Application : `AgriMeasure`
- Version visible : `1.0.0`
- Package Android : `com.agritech.agrimeasure`
- Canal interne : `preview`
- Profil EAS Build interne : `preview`
- Type d’artefact Android interne : `apk`
- Runtime EAS Update : basé sur la version applicative (`appVersion`), donc `1.0.0` pour cette version.

> Note EAS Update : après connexion Expo, si le projet n’est pas encore lié à un projet EAS, lancer `eas update:configure` une fois. Cette commande ajoute l’identifiant projet EAS et l’URL `updates.url` nécessaires au service Expo Updates.

## 1. Installer EAS CLI

```bash
npm install -g eas-cli
```

## 2. Se connecter à Expo

```bash
eas login
```

Vérifier ensuite le compte connecté si besoin :

```bash
eas whoami
```

## 3. Configurer EAS Build si nécessaire

```bash
eas build:configure
```

Cette étape initialise ou vérifie la configuration EAS côté projet Expo. Le fichier `eas.json` contient déjà les profils `preview` et `production`.

## 4. Générer une APK interne Android

Utiliser uniquement le profil `preview` pour les tests internes :

```bash
eas build -p android --profile preview
```

Le profil `preview` produit une APK Android installable en interne et pointe sur le canal EAS Update `preview`.

## 5. Publier une petite mise à jour JS/design/textes

Après avoir testé localement une modification qui ne change pas le natif, publier sur le canal interne :

```bash
eas update --channel preview --message "Description de la mise à jour"
```

Cette commande envoie uniquement le bundle JavaScript et les assets compatibles avec la même version native/runtime.

## Règle de décision : update ou nouveau build ?

### Utiliser `eas update`

Utiliser EAS Update quand le changement concerne uniquement :

- Changement JavaScript
- Changement design
- Changement de textes
- Ajustement d’écrans existants sans nouvelle dépendance native
- Correction de logique applicative déjà supportée par le build installé

Commande :

```bash
eas update --channel preview --message "Description de la mise à jour"
```

### Refaire `eas build`

Refaire une build Android quand le changement touche le natif :

- Nouvelle dépendance native
- Nouvelle permission Android
- Changement de `android.package`, `android.versionCode`, icônes natives ou configuration native
- Changement de plugin Expo ou config plugin
- Upgrade Expo SDK / React Native
- Changement nécessitant une nouvelle version runtime

Commande interne Android :

```bash
eas build -p android --profile preview
```

## Profil production

Le profil `production` est préparé pour plus tard et ne doit pas être utilisé pour cette étape interne. Pour l’instant, ne pas publier sur Google Play et ne pas lancer de build production.

# AgriMeasure — préparation APK interne et EAS Update

Ce document décrit la configuration et les commandes à lancer manuellement avant la génération d’une APK interne. Il ne génère pas d’APK et ne publie pas d’update automatiquement.

## Configuration préparée

- Application : `AgriMeasure`
- Version visible : `1.0.0`
- Package Android : `com.agritech.agrimeasure`
- Canal interne : `preview`
- Profil EAS Build interne : `preview`
- Type d’artefact Android interne : `apk`
- Runtime EAS Update : basé sur la version applicative (`appVersion`), donc `1.0.0` pour cette version.
- Permissions Android localisation : `android.permission.ACCESS_COARSE_LOCATION` et `android.permission.ACCESS_FINE_LOCATION`.

> Note EAS Update : après connexion Expo, si le projet n’est pas encore lié à un projet EAS, lancer `eas update:configure` une fois. Cette commande ajoute l’identifiant projet EAS et l’URL `updates.url` nécessaires au service Expo Updates. Ne pas lancer `eas update` tant que cette liaison n’est pas faite.

## A. Distribution interne

Installer EAS CLI :

```bash
npm install -g eas-cli
```

Se connecter à Expo :

```bash
eas login
```

Configurer EAS Build si nécessaire :

```bash
eas build:configure
```

Générer l’APK interne Android avec le profil `preview` uniquement :

```bash
eas build -p android --profile preview
```

Le profil `preview` produit une APK Android installable en interne et pointe sur le canal EAS Update `preview`.

## B. Mises à jour simples

Après avoir testé localement une modification compatible avec le build installé, publier uniquement le bundle JavaScript et les assets sur le canal interne :

```bash
eas update --channel preview --message "Description de la mise à jour"
```

Cette commande ne doit être utilisée que pour les changements compatibles avec le même runtime natif `1.0.0`.

## C. Règle de décision

### Utiliser `eas update`

Utiliser EAS Update quand le changement concerne uniquement :

- Changement JavaScript
- Changement design
- Changement de textes
- Changement de logique simple déjà supportée par le build installé
- Ajustement d’écrans existants sans nouvelle dépendance native

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

## D. Roadmap de versions

- Version `1.0.0` : APK interne terrain.
- Version `1.1.0` : corrections légères via EAS Update.
- Version `2.0.0` : comptes techniciens / cloud / synchronisation, nouvelle APK probable.
- Version `3.0.0` : MapLibre / couches avancées / cartes hors ligne, nouvelle APK probable.

## Profil production

Le profil `production` est préparé pour plus tard et ne doit pas être utilisé pour cette étape interne. Pour l’instant, ne pas publier sur Google Play et ne pas lancer de build production.

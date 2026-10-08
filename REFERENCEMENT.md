# Référencement — état des lieux et marche à suivre

Objectif : qu'une personne qui cherche un bar à réserver ou à privatiser dans
le 20e arrondissement de Paris trouve L'impondérable rapidement.

Ce document sépare trois choses : ce qui est déjà fait dans le code, ce qu'il
faut faire le jour de la mise en ligne, et ce qui décide réellement du
classement — qui se joue en grande partie **hors du site**.

---

## 1. Ce qui est déjà en place

| Élément | État |
|---|---|
| Titre et description propres à chaque page, en français et en anglais | fait |
| Mots-clés de quartier dans les titres (« Paris 20e », « métro Jourdain ») | fait |
| Un seul `<h1>` par page, hiérarchie de titres cohérente | fait |
| Données structurées schema.org (établissement, carte, service de privatisation, fils d'Ariane) | fait |
| URL canonique, Open Graph, image de partage 1200 × 630 | fait |
| `sitemap.xml` avec les quatre pages et les photos | fait |
| Textes alternatifs descriptifs sur toutes les photos | fait |
| Polices et photo du premier écran préchargées (vitesse de chargement) | fait |
| Site adapté au téléphone, sans défilement horizontal | fait |
| Page 404 utile plutôt qu'une erreur de serveur | fait |

### Les données structurées, en clair

Elles ne changent rien à ce que voit le visiteur. Elles disent à Google, dans
un format qu'il lit sans ambiguïté : c'est un bar-restaurant, voici l'adresse,
les coordonnées GPS, le téléphone, les horaires, la capacité d'accueil (80),
la terrasse, le Happy Hour, et le fait que l'établissement se privatise.

C'est ce qui alimente la fiche latérale et le bandeau de résultats locaux.

**Volontairement absents : la note moyenne et les avis clients.** Google
interdit à un établissement de publier ses propres avis en données
structurées. Les avis doivent venir de la fiche Google. Les ajouter ici
risquerait une pénalité, pas un gain.

---

## 2. À faire le jour de la mise en ligne

Dans cet ordre.

### 2.1 Remplacer le domaine

Le marqueur `TODO-DOMAINE` apparaît **48 fois** (balises canoniques, Open
Graph, données structurées, sitemap, robots.txt). Une seule commande :

```powershell
# PowerShell, à la racine du projet
Get-ChildItem -Include *.html,*.xml,*.txt -Recurse |
  ForEach-Object {
    (Get-Content $_ -Raw -Encoding UTF8) -replace 'TODO-DOMAINE','www.exemple.fr' |
      Set-Content $_ -NoNewline -Encoding UTF8
  }
```

Vérifier ensuite qu'il n'en reste aucun :

```powershell
Select-String -Path *.html,*.xml,*.txt -Pattern 'TODO-DOMAINE'
```

### 2.2 Ouvrir le site aux moteurs

Deux verrous ont été posés pendant le développement. **Les deux** doivent
sauter, sinon le site reste invisible.

1. `robots.txt` : remplacer le contenu par la version commentée à l'intérieur
   du fichier (`Allow: /` + ligne `Sitemap:`).
2. Retirer `<meta name="robots" content="noindex, nofollow">` des quatre
   pages : `index.html`, `tarifs.html`, `privatisation.html`,
   `mentions-legales.html`.

```powershell
Get-ChildItem -Include *.html -Recurse |
  ForEach-Object {
    (Get-Content $_ -Raw -Encoding UTF8) -replace '\s*<meta name="robots" content="noindex, nofollow">','' |
      Set-Content $_ -NoNewline -Encoding UTF8
  }
```

### 2.3 Compléter les mentions légales

Le nom, l'adresse et le téléphone de l'hébergeur sont obligatoires et encore
marqués `TODO`. Un site sans mentions légales complètes est hors la loi, et
Google tient compte de la fiabilité affichée d'un site.

### 2.4 Réglages d'hébergement

- **HTTPS** obligatoire, avec redirection automatique depuis `http://`.
- **Une seule adresse canonique** : choisir `www` ou sans `www`, et rediriger
  l'autre en 301. Deux adresses accessibles = contenu dupliqué.
- **Compression** (gzip ou brotli) et **cache** sur les fichiers statiques.
- Vérifier que `404.html` est bien servi sur les adresses inexistantes. Netlify
  le fait seul ; d'autres hébergeurs demandent un réglage.

### 2.5 Déclarer le site à Google

1. Créer une propriété dans la **Search Console**, valider la propriété du
   domaine (enregistrement DNS).
2. Y envoyer `https://votre-domaine/sitemap.xml`.
3. Demander l'indexation de la page d'accueil et de la page de privatisation.
4. Passer les trois pages au **test des résultats enrichis**
   (`search.google.com/test/rich-results`) pour confirmer que les données
   structurées sont lues sans erreur.

Compter **deux à six semaines** avant d'être correctement positionné. Un site
neuf n'apparaît pas du jour au lendemain.

---

## 3. Ce qui décide réellement du classement local

C'est le point le plus important de ce document, et le moins intuitif.

Pour une recherche comme « bar à privatiser Paris 20 », Google affiche d'abord
un **bandeau de trois établissements avec une carte**. Ce bandeau capte la
majorité des clics. **Il ne se classe presque pas selon le site web** : il se
classe selon la **fiche Google Business Profile**.

Le site sert à confirmer et compléter la fiche. Il ne la remplace pas.

### 3.1 La fiche Google — priorité absolue

À faire par le gérant, c'est gratuit :

- **Revendiquer la fiche** sur `business.google.com` si ce n'est pas déjà fait.
- **Catégorie principale : « Bar »**. Catégories secondaires : « Restaurant »,
  « Pizzeria », « Bar à bières ». La catégorie principale pèse lourd.
- **Horaires exacts**, identiques à ceux du site (9h – 2h, 7j/7).
- **Attributs** à cocher : terrasse, privatisable pour événements, réservations acceptées.
- **Photos** : au moins quinze, et des photos récentes. Les fiches avec
  beaucoup de photos récentes ressortent mieux. La salle, la terrasse, les
  plats, l'ambiance du soir.
- **Lien « Rendez-vous »** pointant vers la page de privatisation du site.
- **Publications** (posts) régulières : Happy Hour, soirées, match, événement.
  Une par semaine suffit.
- **Questions / réponses** : y poser et répondre à « Peut-on privatiser le
  bar ? », « Jusqu'à combien de personnes ? ». C'est permis et efficace.

### 3.2 Les avis — le levier numéro un

Le nombre d'avis et la note moyenne sont, avec la proximité, le facteur le
plus déterminant du bandeau local.

- Demander un avis aux groupes qui viennent de privatiser, pendant qu'ils sont
  encore contents. C'est le meilleur moment.
- **Répondre à tous les avis**, y compris les mauvais. Google le valorise et
  les clients le lisent.
- Un QR code vers la fiche, sur le comptoir ou l'addition, change tout.

### 3.3 La cohérence des coordonnées

Le nom, l'adresse et le téléphone doivent être **écrits exactement pareil**
partout : fiche Google, site, Facebook, Instagram, annuaires. Une différence
d'écriture (« 320 rue des Pyrénées » contre « 320 r. des Pyrénées ») affaiblit
le signal.

À vérifier : Google, Facebook, Instagram, Pages Jaunes, TripAdvisor, Yelp,
Petit Futé, Apple Plans, Bing Places.

### 3.4 Les plateformes de privatisation

Les premiers résultats classiques sur « privatiser un bar à Paris » sont tenus
par des plateformes spécialisées, pas par les bars eux-mêmes. Un site de
quatre pages ne les dépassera pas.

La bonne stratégie est d'**y figurer** : Privateaser, 1001Salles, Bird Office,
ABC Salles. L'inscription est gratuite ou à la commission. Chacune apporte des
demandes directes **et** un lien vers le site, ce qui renforce le référencement.

---

## 4. Ce qui reste faible, et pourquoi

Points identifiés mais non corrigés, avec la raison.

### La page de privatisation est courte

Cinq repères et un formulaire. Pour se classer sur une requête concurrentielle,
il faudrait du contenu réel : déroulé d'une privatisation, formules de boissons,
exemples d'événements déjà organisés, réponses aux questions fréquentes, photos
d'une salle privatisée.

**Bloqué sur le client.** Écrire ces informations sans les tenir de lui
reviendrait à inventer des engagements commerciaux. C'est la plus grosse marge
de progression du site.

### La version anglaise n'est pas référençable

Le site bascule entre français et anglais en JavaScript, à la même adresse. Un
moteur de recherche n'indexe donc que la version française.

Pour que l'anglais soit trouvable, il faudrait des adresses distinctes
(`/en/privatisation.html`) et des balises `hreflang`. C'est un chantier à part
entière, probablement disproportionné : la clientèle visée est locale, et le
bouton EN sert les touristes **déjà sur le site**, pas ceux qui le cherchent.

### Les photos sont trop petites

La photo du premier écran fait 680 px de large. Affichée en pleine largeur sur
un écran d'ordinateur, elle est agrandie deux fois et paraît molle. De vraies
photos (1600 px minimum) amélioreraient le site **et** la fiche Google, qui est
largement jugée sur ses images.

### Le détail de la carte n'est pas en données structurées

Les 127 articles vivent dans `data/tarifs.json` et sont affichés en JavaScript.
Les décrire un à un en schema.org est possible mais fragile, et les résultats
enrichis de type « menu » sont rares en France. Seule la carte en tant que page
est déclarée.

---

## 5. Calibrage honnête des attentes

| Recherche | Objectif réaliste |
|---|---|
| « L'impondérable », « L'impondérable Paris » | **1re position**, rapidement |
| « bar rue des Pyrénées », « bar métro Jourdain » | **1re page**, voire bandeau local |
| « privatiser bar Paris 20 », « bar privatisable Jourdain » | **bandeau local atteignable** avec une fiche Google soignée ; les premières places classiques resteront aux plateformes |
| « privatiser un bar à Paris » | hors d'atteinte pour un site de quatre pages — c'est le terrain des plateformes |

Le site est désormais une base propre et rapide, correctement décrite aux
moteurs. **Le gain suivant, et de loin le plus important, se joue sur la fiche
Google et les avis** — pas dans le code.

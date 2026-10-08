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

Dans cet ordre. Hébergement retenu : **Cloudflare Pages** (plan gratuit),
domaine acheté chez **OVHcloud** (Cloudflare ne vend pas de `.fr`).

### 2.1 Domaine et compte Cloudflare

1. Acheter `limponderable.fr` chez OVHcloud **au nom de la SARL LE MODERNE**
   (contact : l'adresse du gérant). En option, `imponderable.fr` pour le
   rediriger vers le premier.
2. Créer le compte Cloudflare (au nom du client, ou au sien avec un accès
   partagé), puis *Ajouter un domaine* › `limponderable.fr` › plan **Free**.
   Cloudflare affiche deux serveurs de noms (`xxx.ns.cloudflare.com`).
3. Dans l'espace OVH : *Noms de domaine* › `limponderable.fr` ›
   *Serveurs DNS* › *Modifier* › remplacer par les deux serveurs Cloudflare.
   La bascule prend de quelques minutes à 24 h ; Cloudflare envoie un mail
   quand le domaine est actif.

### 2.2 Publier le site sur Cloudflare Pages

1. *Workers & Pages* › *Créer* › *Pages* › *Se connecter à Git* › dépôt
   `propbar`, branche `main`.
2. Réglages de build : aucun framework, **commande de build vide**, dossier
   de sortie vide (la racine). Le site est statique, il n'y a rien à
   compiler.
3. Vérifier le site sur l'adresse de test fournie (`xxx.pages.dev`) :
   pages, photos, formulaire.

Chaque `git push` sur `main` redéploie ensuite le site automatiquement.

### 2.3 Basculer le code sur le vrai domaine

Un seul script fait tout : remplace l'adresse de test GitHub et le marqueur
`TODO-DOMAINE` (balises canoniques, aperçu de partage, données
structurées, sitemap) en retirant au passage l'extension `.html`
(Cloudflare Pages sert `/tarifs` et redirige `/tarifs.html` vers cette
adresse), ancre la page 404 à la racine, ouvre `robots.txt`
aux moteurs et retire les balises `noindex` des quatre pages publiques
(la 404 garde la sienne). Il vérifie ensuite qu'il ne reste rien.

```powershell
# PowerShell, à la racine du projet
.\outils\mise-en-ligne.ps1 -Domaine limponderable.fr -Simulation   # montre sans rien écrire
.\outils\mise-en-ligne.ps1 -Domaine limponderable.fr               # applique
```

Si Windows refuse d'exécuter le script :
`powershell -ExecutionPolicy Bypass -File .\outils\mise-en-ligne.ps1 -Domaine limponderable.fr`

Puis committer et pousser : Cloudflare publie la nouvelle version.

### 2.4 Brancher le domaine et régler l'hébergement

1. Projet Pages › *Domaines personnalisés* › ajouter `limponderable.fr`,
   puis `www.limponderable.fr`.
2. **Une seule adresse** : *Règles* › *Redirect Rules* › modèle « Redirect
   from WWW to root » (301 de `www` vers `limponderable.fr`). Faire de même
   pour `imponderable.fr` s'il a été acheté.
3. *SSL/TLS* › *Edge Certificates* › activer **Always Use HTTPS**.
   La compression et le cache sont actifs par défaut.
4. **Désactiver GitHub Pages** sur le dépôt (*Settings* › *Pages* ›
   *Unpublish*) : une fois le `noindex` retiré, cette copie de test serait
   un doublon du site aux yeux de Google.

### 2.5 Vérifier en ligne

- `https://limponderable.fr` s'ouvre en HTTPS, et `http://` ou `www.`
  redirigent vers cette adresse.
- `https://limponderable.fr/robots.txt` affiche `Allow: /` et le sitemap.
- Une adresse inventée (`/test/inexistant`) affiche la page 404 **avec
  ses styles**.
- Une demande de privatisation de test arrive bien au gérant.
- L'aperçu WhatsApp du lien affiche l'image (ajouter `?v=1` au lien si
  WhatsApp a gardé un ancien aperçu en mémoire).

À savoir : le dépôt est publié tel quel. `REFERENCEMENT.md`, `outils/` et
`apps-script/` sont donc lisibles par qui connaît leur adresse. Rien de
sensible n'y figure, mais c'est à garder en tête avant d'y ajouter quoi
que ce soit.

### 2.6 Compléter les mentions légales

L'hébergeur est renseigné (Cloudflare). **Le médiateur de la consommation
reste à compléter** dès que le gérant l'a désigné : c'est une obligation
légale pour tout commerce qui vend à des particuliers.

### 2.7 Déclarer le site à Google

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

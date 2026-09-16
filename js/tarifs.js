// Construit la carte des tarifs à partir de data/tarifs.json.
// Le même fichier sert deux pages : tarifs.html (carte complète) et
// index.html (prix minimum des cartes portant un attribut data-prix-min).
// Chaque page ne reçoit que ce qu'elle contient : le script s'adapte au DOM trouvé.

const CHEMIN_DONNEES = "data/tarifs.json";

// Espace insécable exigé avant le symbole monétaire en typographie française.
const ESPACE_INSECABLE = " ";

// Précède le prix le plus bas d'une catégorie sur les cartes de l'accueil.
const LIBELLE_PRIX_MINIMUM = "à partir de";


/* --------------------------------------------------------------------------
   Formatage
   -------------------------------------------------------------------------- */

// Les prix sont des nombres dans le JSON : la convention française
// (virgule décimale, espace insécable) appartient à l'affichage seul.
function formaterPrix(montant) {
    return montant.toFixed(2).replace(".", ",") + ESPACE_INSECABLE + "€";
}

function estPrixValide(valeur) {
    return typeof valeur === "number" && Number.isFinite(valeur);
}


/* --------------------------------------------------------------------------
   Fabrique d'éléments
   Toute donnée issue du JSON passe par textContent : rien n'est concaténé en HTML.
   -------------------------------------------------------------------------- */

function creerElement(balise, classe, texte) {
    const element = document.createElement(balise);
    if (classe) {
        element.className = classe;
    }
    if (texte !== undefined && texte !== null) {
        element.textContent = texte;
    }
    return element;
}


/* --------------------------------------------------------------------------
   Articles
   -------------------------------------------------------------------------- */

function aUnPrixReduit(article) {
    return estPrixValide(article.prixReduit);
}

// Une ligne n'affiche jamais deux prix : le champ à lire est choisi par l'appelant.
function creerLigneArticle(article, champPrix) {
    const ligne = creerElement("li", "tarifs-article");
    const bloc = creerElement("div", "tarifs-article-texte");

    bloc.appendChild(creerElement("span", "tarifs-nom", article.nom));

    // Les champs optionnels absents ne produisent aucun élément vide.
    if (article.contenance) {
        bloc.appendChild(creerElement("span", "tarifs-contenance", article.contenance));
    }
    if (article.description) {
        bloc.appendChild(creerElement("p", "tarifs-description", article.description));
    }
    ligne.appendChild(bloc);

    const montant = article[champPrix];
    if (estPrixValide(montant)) {
        ligne.appendChild(creerElement("span", "tarifs-prix", formaterPrix(montant)));
    }
    return ligne;
}

function creerListeArticles(articles, champPrix) {
    const liste = creerElement("ul", "tarifs-liste");
    articles.forEach(function (article) {
        liste.appendChild(creerLigneArticle(article, champPrix));
    });
    return liste;
}


/* --------------------------------------------------------------------------
   Catégories
   -------------------------------------------------------------------------- */

function creerLienArdoise() {
    const lien = creerElement("a", "tarifs-lien-ardoise", "Voir l'ardoise");
    lien.href = "#ardoise";
    return lien;
}

// options.champPrix : "prix" (par défaut) ou "prixReduit"
// options.avecAncre : pose l'id de la catégorie sur son titre
// options.avecLienArdoise : ajoute le renvoi vers l'ardoise si un prix réduit existe
// options.niveauTitre : "h3" par défaut, "h4" sous un intertitre de groupe
function creerBlocCategorie(categorie, options) {
    const reglages = options || {};
    const champPrix = reglages.champPrix || "prix";
    const articles = categorie.articles || [];
    const bloc = creerElement("div", "tarifs-categorie");

    if (reglages.avecLienArdoise && articles.some(aUnPrixReduit)) {
        bloc.appendChild(creerLienArdoise());
    }

    const titre = creerElement(reglages.niveauTitre || "h3", "tarifs-categorie-titre", categorie.nom);
    if (reglages.avecAncre && categorie.id) {
        titre.id = categorie.id;
    }
    bloc.appendChild(titre);

    if (categorie.note) {
        bloc.appendChild(creerElement("p", "tarifs-note", categorie.note));
    }

    // Une catégorie sans article affiche sa note seule, pas de liste vide.
    if (articles.length > 0) {
        bloc.appendChild(creerListeArticles(articles, champPrix));
    }
    return bloc;
}


/* --------------------------------------------------------------------------
   Ardoise : tous les articles à prix réduit, regroupés par origine
   -------------------------------------------------------------------------- */

// Deux formes coexistent dans le fichier : une section peut porter des catégories,
// ou porter directement ses articles. Dans ce second cas l'origine est la section.
function collecterGroupesReduits(donnees) {
    const groupes = [];

    donnees.sections.forEach(function (section) {
        (section.categories || []).forEach(function (categorie) {
            const reduits = (categorie.articles || []).filter(aUnPrixReduit);
            if (reduits.length > 0) {
                groupes.push({ nom: categorie.nom, articles: reduits });
            }
        });

        const reduitsDirects = (section.articles || []).filter(aUnPrixReduit);
        if (reduitsDirects.length > 0) {
            groupes.push({ nom: section.nom, articles: reduitsDirects });
        }
    });

    return groupes;
}

// Sans aucun prix réduit, la section entière disparaît au lieu d'afficher un bloc vide.
function masquerSection(conteneur) {
    const section = conteneur.closest("section");
    (section || conteneur).hidden = true;
}

function construireArdoise(conteneur, donnees) {
    const groupes = collecterGroupesReduits(donnees);

    if (groupes.length === 0) {
        masquerSection(conteneur);
        return;
    }

    groupes.forEach(function (groupe) {
        // Pas d'ancre ici : les ids de catégorie appartiennent aux sections d'origine.
        conteneur.appendChild(creerBlocCategorie(groupe, { champPrix: "prixReduit" }));
    });
}


/* --------------------------------------------------------------------------
   Sections courantes
   -------------------------------------------------------------------------- */

function trouverSection(donnees, idSection) {
    return donnees.sections.find(function (section) {
        return section.id === idSection;
    }) || null;
}

// Les catégories partageant un même champ « groupe » sont coiffées d'un intertitre
// unique, posé à la première d'entre elles. Elles passent alors d'un cran dans la
// hiérarchie des titres pour que le regroupement se lise aussi hors du visuel.
function construireSection(conteneur, section) {
    let groupeCourant = null;

    (section.categories || []).forEach(function (categorie) {
        const groupe = categorie.groupe || null;

        if (groupe && groupe !== groupeCourant) {
            conteneur.appendChild(creerElement("h3", "tarifs-groupe", groupe));
        }
        groupeCourant = groupe;

        conteneur.appendChild(creerBlocCategorie(categorie, {
            avecAncre: true,
            avecLienArdoise: true,
            niveauTitre: groupe ? "h4" : "h3"
        }));
    });
}


/* --------------------------------------------------------------------------
   Prix minimum affiché sur les cartes de l'accueil
   -------------------------------------------------------------------------- */

function trouverCategorie(donnees, idCategorie) {
    let trouvee = null;
    donnees.sections.forEach(function (section) {
        (section.categories || []).forEach(function (categorie) {
            if (categorie.id === idCategorie) {
                trouvee = categorie;
            }
        });
    });
    return trouvee;
}

function prixMinimum(categorie) {
    const montants = (categorie.articles || [])
        .map(function (article) { return article.prix; })
        .filter(estPrixValide);

    return montants.length > 0 ? Math.min.apply(null, montants) : null;
}

// Une catégorie absente du fichier laisse la place vide : mieux vaut rien qu'un prix faux.
// Le libellé est écrit ici plutôt que dans le HTML, pour qu'il n'apparaisse jamais
// seul si les données ne se chargent pas.
function remplirPrixMinimums(donnees) {
    document.querySelectorAll("[data-prix-min]").forEach(function (cible) {
        const categorie = trouverCategorie(donnees, cible.dataset.prixMin);
        if (!categorie) {
            return;
        }
        const minimum = prixMinimum(categorie);
        if (minimum === null) {
            return;
        }
        cible.replaceChildren(
            creerElement("span", "card-prix-libelle", LIBELLE_PRIX_MINIMUM),
            creerElement("span", "card-prix-valeur", formaterPrix(minimum))
        );
    });
}


/* --------------------------------------------------------------------------
   Rendu de la page des tarifs
   -------------------------------------------------------------------------- */

function conteneursTarifs() {
    return {
        ardoise: document.getElementById("ardoise"),
        boissons: document.getElementById("boissons"),
        restauration: document.getElementById("restauration")
    };
}

function construirePageTarifs(donnees) {
    const conteneurs = conteneursTarifs();

    if (conteneurs.ardoise) {
        construireArdoise(conteneurs.ardoise, donnees);
    }

    [["boissons", conteneurs.boissons], ["restauration", conteneurs.restauration]]
        .forEach(function (paire) {
            const idSection = paire[0];
            const conteneur = paire[1];
            if (!conteneur) {
                return;
            }
            const section = trouverSection(donnees, idSection);
            if (section) {
                construireSection(conteneur, section);
            }
        });
}


/* --------------------------------------------------------------------------
   Repli en cas d'échec : la page ne reste jamais muette
   -------------------------------------------------------------------------- */

function afficherErreur() {
    const conteneurs = conteneursTarifs();
    const premier = conteneurs.ardoise || conteneurs.boissons || conteneurs.restauration;

    // Sur l'accueil, aucun conteneur de tarifs : le prix reste simplement vide.
    if (!premier) {
        return;
    }

    const message = creerElement(
        "p",
        "tarifs-erreur",
        "La carte n'a pas pu être chargée. Vous pouvez la consulter sur place."
    );
    premier.appendChild(message);
}


/* --------------------------------------------------------------------------
   Démarrage
   -------------------------------------------------------------------------- */

async function demarrer() {
    try {
        const reponse = await fetch(CHEMIN_DONNEES);
        if (!reponse.ok) {
            throw new Error("Réponse HTTP " + reponse.status);
        }

        const donnees = await reponse.json();
        if (!donnees || !Array.isArray(donnees.sections)) {
            throw new Error("Structure inattendue : tableau sections introuvable");
        }

        construirePageTarifs(donnees);
        remplirPrixMinimums(donnees);
    } catch (erreur) {
        console.error("Tarifs : chargement impossible.", erreur);
        afficherErreur();
    }
}

demarrer();

// Construit la carte des tarifs à partir de data/tarifs.json.
// Le même fichier sert deux pages : tarifs.html (carte complète) et
// index.html (prix minimum des cartes portant un attribut data-prix-min).
// Chaque page ne reçoit que ce qu'elle contient : le script s'adapte au DOM trouvé.

const CHEMIN_DONNEES = "data/tarifs.json";

// Espace insécable exigé avant le symbole monétaire en typographie française.
const ESPACE_INSECABLE = " ";

// Précède le prix le plus bas d'une catégorie sur les cartes de l'accueil.
const LIBELLE_PRIX_MINIMUM = "à partir de";

// Étiquette de la puce renvoyant à l'ardoise, plus courte que le titre affiché.
const LIBELLE_NAV_ARDOISE = "Happy Hour";

// Un saut d'ancre n'atterrit jamais tout à fait au pixel près sur la valeur CSS
// visée (arrondi sous-pixel du navigateur pendant le défilement, de l'ordre
// du demi-pixel) : sans cette tolérance, la comparaison stricte du scrollspy
// échoue au hasard selon le sens de l'arrondi, et la puce cliquée ne s'allume pas.
const TOLERANCE_ANCRE_PX = 2;

// Distance à laisser au-dessus d'une catégorie visée par une ancre, pour
// qu'elle n'atterrisse pas sous l'en-tête (et, sur mobile, sous la bande de
// catégories qui lui est propre). Cette distance diffère entre mobile et
// desktop (la colonne latérale du bureau ne mange pas de hauteur en haut de
// l'écran) : plutôt que de la dupliquer ici, on lit celle que le CSS a déjà
// posée en scroll-margin-top sur les titres, seule source de vérité.
function lireDecalageAncrePx(cible) {
    const valeur = parseFloat(getComputedStyle(cible).scrollMarginTop);
    return Number.isFinite(valeur) ? valeur : 0;
}


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

// Transforme un intitulé libre (ex. « Vins ») en id d'ancre stable, sans accents.
function creerIdDepuisTexte(texte) {
    return "groupe-" + texte
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
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

// Renvoie true si l'ardoise a du contenu, pour que l'appelant sache si une
// entrée de navigation doit lui être consacrée.
function construireArdoise(conteneur, donnees) {
    const groupes = collecterGroupesReduits(donnees);

    if (groupes.length === 0) {
        masquerSection(conteneur);
        return false;
    }

    groupes.forEach(function (groupe) {
        // Pas d'ancre ici : les ids de catégorie appartiennent aux sections d'origine.
        conteneur.appendChild(creerBlocCategorie(groupe, { champPrix: "prixReduit" }));
    });
    return true;
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
//
// Renvoie la liste des entrées de navigation correspondant à ce qui vient d'être
// construit (une entrée par catégorie isolée, une seule par groupe) : c'est ici,
// pendant la construction réelle du DOM, que ce regroupement est décidé, donc
// c'est aussi ici qu'il doit être lu plutôt que recalculé ailleurs.
function construireSection(conteneur, section) {
    const entreesNav = [];
    let groupeCourant = null;

    (section.categories || []).forEach(function (categorie) {
        const groupe = categorie.groupe || null;

        if (groupe && groupe !== groupeCourant) {
            const idGroupe = creerIdDepuisTexte(groupe);
            const intertitre = creerElement("h3", "tarifs-groupe", groupe);
            intertitre.id = idGroupe;
            conteneur.appendChild(intertitre);
            entreesNav.push({ id: idGroupe, nom: groupe });
        } else if (!groupe) {
            entreesNav.push({ id: categorie.id, nom: categorie.nom });
        }
        groupeCourant = groupe;

        conteneur.appendChild(creerBlocCategorie(categorie, {
            avecAncre: true,
            avecLienArdoise: true,
            niveauTitre: groupe ? "h4" : "h3"
        }));
    });

    return entreesNav;
}


/* --------------------------------------------------------------------------
   Bande de catégories : une puce par entrée, la puce de la catégorie lue
   se met en évidence pendant le défilement.
   -------------------------------------------------------------------------- */

function construireNavCategories(conteneur, entrees) {
    const nav = conteneur.closest("nav");

    if (entrees.length === 0) {
        if (nav) {
            nav.hidden = true;
        }
        return;
    }

    // Étiquette au-dessus de chaque rubrique (Happy Hour / Boissons / Restauration) :
    // n'apparaît visuellement que dans la colonne latérale du bureau (voir le CSS),
    // la bande horizontale du mobile reste une simple suite de puces.
    let rubriqueCourante = null;
    entrees.forEach(function (entree) {
        if (entree.rubrique && entree.rubrique !== rubriqueCourante) {
            conteneur.appendChild(creerElement("p", "categories-nav-rubrique", entree.rubrique));
            rubriqueCourante = entree.rubrique;
        }
        const lien = creerElement("a", "categories-nav-lien", entree.nom);
        lien.href = "#" + entree.id;
        conteneur.appendChild(lien);
    });
}

// Met en évidence, parmi les puces, celle de la catégorie actuellement lue.
//
// La catégorie active est la dernière, dans l'ordre du document, dont le
// titre a déjà franchi la ligne de déclenchement (juste sous l'en-tête et la
// bande collants) : à chaque défilement, on la recalcule entièrement à partir
// des positions réelles à l'écran, plutôt que d'accumuler un état au fil du
// temps — un état accumulé se trompe dès que deux titres courts se suivent
// d'assez près pour tenir tous les deux dans une même bande de détection.
//
// Ce recalcul est déclenché par l'événement scroll (cadencé à une fois par
// image), pas par IntersectionObserver : ce dernier ne prévient qu'aux
// franchissements d'une bande étroite, et un défilement rapide peut faire
// traverser cette bande à un titre court entre deux images affichées, sans
// jamais déclencher de recalcul. L'événement scroll, lui, ne peut pas être
// « sauté » de cette façon.
function activerScrollspyCategories(entrees) {
    const cibles = entrees
        .map(function (entree) { return document.getElementById(entree.id); })
        .filter(Boolean);

    if (cibles.length === 0) {
        return;
    }

    function activerPuce(idActif) {
        document.querySelectorAll(".categories-nav-lien").forEach(function (lien) {
            const estActif = lien.getAttribute("href") === "#" + idActif;
            lien.classList.toggle("est-actif", estActif);
            if (estActif) {
                lien.setAttribute("aria-current", "true");
            } else {
                lien.removeAttribute("aria-current");
            }
        });
    }

    // Relu au redimensionnement : la colonne latérale du bureau et la bande
    // du mobile n'imposent pas le même décalage, et une fenêtre peut changer
    // de gabarit sans recharger la page.
    let decalageAncrePx = lireDecalageAncrePx(cibles[0]);

    function categorieActive() {
        // La dernière catégorie peut n'avoir jamais assez de place en dessous
        // (juste le pied de page) pour que son titre atteigne la ligne de
        // déclenchement, même une fois la page défilée au maximum : sans ce
        // cas particulier, sa puce ne s'allumerait alors jamais. Arrivé en
        // bas de la page, c'est donc elle qui fait foi.
        const enBasDePage = window.scrollY + window.innerHeight
            >= document.documentElement.scrollHeight - TOLERANCE_ANCRE_PX;
        if (enBasDePage) {
            return cibles[cibles.length - 1].id;
        }

        let idActif = cibles[0].id;
        cibles.forEach(function (cible) {
            if (cible.getBoundingClientRect().top <= decalageAncrePx + TOLERANCE_ANCRE_PX) {
                idActif = cible.id;
            }
        });
        return idActif;
    }

    let recalculPlanifie = false;
    function planifierRecalcul() {
        if (recalculPlanifie) {
            return;
        }
        recalculPlanifie = true;
        requestAnimationFrame(function () {
            activerPuce(categorieActive());
            recalculPlanifie = false;
        });
    }

    window.addEventListener("scroll", planifierRecalcul, { passive: true });
    window.addEventListener("resize", function () {
        decalageAncrePx = lireDecalageAncrePx(cibles[0]);
        planifierRecalcul();
    }, { passive: true });

    // État initial, avant le premier défilement.
    activerPuce(categorieActive());
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
        restauration: document.getElementById("restauration"),
        navCategories: document.getElementById("categories-nav")
    };
}

function construirePageTarifs(donnees) {
    const conteneurs = conteneursTarifs();
    const entreesNav = [];

    if (conteneurs.ardoise) {
        const ardoiseVisible = construireArdoise(conteneurs.ardoise, donnees);
        if (ardoiseVisible) {
            entreesNav.push({ id: "ardoise-titre", nom: LIBELLE_NAV_ARDOISE, rubrique: LIBELLE_NAV_ARDOISE });
        }
    }

    // Le nom de rubrique reprend le h2 déjà affiché au-dessus de chaque section
    // dans tarifs.html : distinct du champ « groupe » des catégories (les vins,
    // par exemple), qui organise l'intérieur d'une seule section.
    [["boissons", conteneurs.boissons, "Boissons"], ["restauration", conteneurs.restauration, "Restauration"]]
        .forEach(function (triplet) {
            const idSection = triplet[0];
            const conteneur = triplet[1];
            const rubrique = triplet[2];
            if (!conteneur) {
                return;
            }
            const section = trouverSection(donnees, idSection);
            if (section) {
                construireSection(conteneur, section).forEach(function (entree) {
                    entree.rubrique = rubrique;
                    entreesNav.push(entree);
                });
            }
        });

    if (conteneurs.navCategories) {
        construireNavCategories(conteneurs.navCategories, entreesNav);
        activerScrollspyCategories(entreesNav);
    }
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

    // Une bande de catégories vide, sans rien à montrer en dessous, n'a pas lieu d'être.
    if (conteneurs.navCategories) {
        const nav = conteneurs.navCategories.closest("nav");
        if (nav) {
            nav.hidden = true;
        }
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

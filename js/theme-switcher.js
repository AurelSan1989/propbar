// SÉLECTEUR DE THÈME TEMPORAIRE — À SUPPRIMER AVANT MISE EN PRODUCTION
//
// Sert uniquement à présenter trois palettes de couleurs au client sur les
// pages du dossier squelette/. Aucune persistance (ni localStorage, ni
// cookie) : le thème affiché dépend uniquement du paramètre d'URL ?theme=,
// pour pouvoir envoyer un lien direct vers un thème donné.
//
// Pour retirer entièrement ce sélecteur : supprimer ce fichier, la ligne
// <script src="../js/theme-switcher.js" defer> (et son commentaire) sur
// chacune des trois pages du squelette, et le bloc CSS délimité en fin de
// css/style.css.
(function () {
    "use strict";

    var THEMES = [
        { valeur: "", libelle: "Bleu nuit" },
        { valeur: "ardoise", libelle: "Ardoise" },
        { valeur: "bouteille", libelle: "Bouteille" }
    ];

    // Les seules pages entre lesquelles la navigation doit conserver le
    // paramètre ?theme=, toutes dans le même dossier squelette/.
    var PAGES_INTERNES = ["index.html", "tarifs.html", "privatisation.html"];

    function themeValide(valeur) {
        return THEMES.some(function (theme) { return theme.valeur === valeur; });
    }

    function themeDepuisUrl() {
        var valeur = new URLSearchParams(location.search).get("theme") || "";
        return themeValide(valeur) ? valeur : "";
    }

    function appliquerTheme(valeur) {
        if (valeur) {
            document.documentElement.setAttribute("data-theme", valeur);
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
    }

    function mettreAJourUrl(valeur) {
        var url = new URL(location.href);
        if (valeur) {
            url.searchParams.set("theme", valeur);
        } else {
            url.searchParams.delete("theme");
        }
        history.replaceState(null, "", url);
    }

    // Garde le paramètre ?theme= sur les liens vers les deux autres pages du
    // squelette, pour que le thème choisi suive la navigation. Les liens vers
    // mentions-legales.html (hors squelette) ou externes ne sont pas touchés.
    function mettreAJourLiensInternes(valeur) {
        document.querySelectorAll("a[href]").forEach(function (lien) {
            var href = lien.getAttribute("href");
            var base = href.split("#")[0].split("?")[0];
            if (PAGES_INTERNES.indexOf(base) === -1) {
                return;
            }
            lien.setAttribute("href", valeur ? base + "?theme=" + valeur : base);
        });
    }

    function mettreAJourPuces(barre, valeur) {
        barre.querySelectorAll(".selecteur-theme-bouton").forEach(function (bouton) {
            bouton.setAttribute("aria-pressed", bouton.dataset.themeValeur === valeur ? "true" : "false");
        });
    }

    function choisirTheme(barre, valeur) {
        appliquerTheme(valeur);
        mettreAJourUrl(valeur);
        mettreAJourLiensInternes(valeur);
        mettreAJourPuces(barre, valeur);
    }

    // Posé comme dernier élément de la liste de #nav-principale plutôt que
    // dans une barre flottante par-dessus la page : sur mobile il vit dans
    // le panneau du menu burger (invisible tant qu'il n'est pas ouvert), sur
    // desktop il s'aligne avec les liens Accueil / Notre carte / Privatiser.
    function construireBarre(valeurInitiale) {
        var liste = document.querySelector("#nav-principale ul");
        if (!liste) {
            return;
        }

        var item = document.createElement("li");
        item.className = "selecteur-theme-item";

        var groupe = document.createElement("div");
        groupe.className = "selecteur-theme";

        THEMES.forEach(function (theme) {
            var bouton = document.createElement("button");
            bouton.type = "button";
            bouton.className = "selecteur-theme-bouton";
            bouton.textContent = theme.libelle;
            bouton.dataset.themeValeur = theme.valeur;
            bouton.setAttribute("aria-pressed", theme.valeur === valeurInitiale ? "true" : "false");
            bouton.addEventListener("click", function () {
                choisirTheme(groupe, theme.valeur);
            });
            groupe.appendChild(bouton);
        });

        item.appendChild(groupe);
        liste.appendChild(item);
    }

    var valeurInitiale = themeDepuisUrl();
    appliquerTheme(valeurInitiale);
    mettreAJourLiensInternes(valeurInitiale);
    construireBarre(valeurInitiale);
})();

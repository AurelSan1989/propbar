// Bascule jour / nuit.
//
// Le site change de matière avec l'heure : papier et grain le jour, encre et
// lumière la nuit. Le basculement suit le vrai coucher du soleil à Paris, qui
// va de 17 h en décembre à près de 22 h en juin — un horaire fixe serait faux
// la moitié de l'année.
//
// Le calcul est local : il ne dépend que de la date et des coordonnées du bar.
// Aucune requête réseau, aucune clé d'API.
(function () {
    "use strict";

    var CLE_STOCKAGE = "mode-affichage";   // "auto" (défaut), "jour" ou "nuit"
    var LATITUDE = 48.8736;
    var LONGITUDE = 2.3897;

    /* ----------------------------------------------------------------------
       Lever et coucher du soleil (équation du temps, formulation courante)
       ---------------------------------------------------------------------- */

    var DEG = Math.PI / 180;

    function jourJulienDepuis(date) {
        return date.getTime() / 86400000 + 2440587.5;
    }

    function dateDepuisJourJulien(jj) {
        return new Date((jj - 2440587.5) * 86400000);
    }

    // Renvoie { lever, coucher } en instants absolus, ou null au-delà des
    // cercles polaires (sans objet ici, mais le calcul doit rester honnête).
    //
    // Précision vérifiée contre les éphémérides de Paris : une dizaine de
    // minutes au pire selon la saison, l'approximation de l'équation du temps
    // dérivant un peu. Largement assez fin pour décider d'un basculement au
    // crépuscule ; affiner n'apporterait rien de perceptible.
    function soleil(date) {
        var n = Math.round(jourJulienDepuis(date) - 2451545.0 + 0.0008);
        // Paris est à l'est de Greenwich : le midi solaire y tombe plus tôt,
        // d'où la soustraction. Vérifié contre les éphémérides réelles.
        var jEtoile = n - LONGITUDE / 360;

        var anomalieMoyenne = (357.5291 + 0.98560028 * jEtoile) % 360;
        var equationCentre = 1.9148 * Math.sin(anomalieMoyenne * DEG)
            + 0.0200 * Math.sin(2 * anomalieMoyenne * DEG)
            + 0.0003 * Math.sin(3 * anomalieMoyenne * DEG);
        var longitudeEcliptique = (anomalieMoyenne + equationCentre + 180 + 102.9372) % 360;

        var transit = 2451545.0 + jEtoile
            + 0.0053 * Math.sin(anomalieMoyenne * DEG)
            - 0.0069 * Math.sin(2 * longitudeEcliptique * DEG);

        var declinaison = Math.asin(Math.sin(longitudeEcliptique * DEG) * Math.sin(23.4397 * DEG));

        // -0,833° : le bord supérieur du disque solaire, réfraction comprise.
        var cosAngleHoraire = (Math.sin(-0.833 * DEG) - Math.sin(LATITUDE * DEG) * Math.sin(declinaison))
            / (Math.cos(LATITUDE * DEG) * Math.cos(declinaison));

        if (cosAngleHoraire > 1 || cosAngleHoraire < -1) {
            return null;
        }

        var angleHoraire = Math.acos(cosAngleHoraire) / DEG;
        return {
            lever: dateDepuisJourJulien(transit - angleHoraire / 360),
            coucher: dateDepuisJourJulien(transit + angleHoraire / 360)
        };
    }

    function modeSelonSoleil(maintenant) {
        var heures = soleil(maintenant);
        if (!heures) {
            return "nuit";
        }
        return (maintenant >= heures.lever && maintenant < heures.coucher) ? "jour" : "nuit";
    }


    /* ----------------------------------------------------------------------
       Préférence et application
       ---------------------------------------------------------------------- */

    function preferenceStockee() {
        try {
            var valeur = localStorage.getItem(CLE_STOCKAGE);
            return (valeur === "jour" || valeur === "nuit" || valeur === "auto") ? valeur : "auto";
        } catch (e) {
            return "auto";
        }
    }

    function memoriser(valeur) {
        try {
            localStorage.setItem(CLE_STOCKAGE, valeur);
        } catch (e) {
            // Stockage indisponible : le mode reste simplement automatique
            // d'une visite à l'autre.
        }
    }

    var preference = preferenceStockee();

    function modeEffectif() {
        return preference === "auto" ? modeSelonSoleil(new Date()) : preference;
    }

    // La barre du navigateur (mobile, onglet) prend la couleur de fond du
    // mode : la valeur est lue dans la feuille de style plutôt que recopiée
    // ici, pour qu'un changement de palette n'ait qu'un seul endroit à vivre.
    function synchroniserCouleurBarre() {
        var balise = document.querySelector('meta[name="theme-color"]');
        if (!balise) {
            return;
        }
        var fond = getComputedStyle(document.documentElement)
            .getPropertyValue("--fond").trim();
        if (fond) {
            balise.setAttribute("content", fond);
        }
    }

    // Les transitions de couleur ne sont activées que le temps du changement :
    // en permanence, elles ralentiraient chaque survol et chaque défilement.
    function appliquer(mode, avecTransition) {
        var racine = document.documentElement;
        if (avecTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            racine.classList.add("bascule-en-cours");
            window.setTimeout(function () {
                racine.classList.remove("bascule-en-cours");
            }, 500);
        }
        racine.setAttribute("data-mode", mode);
        synchroniserCouleurBarre();
    }


    /* ----------------------------------------------------------------------
       Bouton de bascule, posé dans la liste de navigation
       ---------------------------------------------------------------------- */

    var SOLEIL = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
    var LUNE = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

    function construireBouton() {
        var liste = document.querySelector("#nav-principale ul");
        if (!liste) {
            return;
        }

        var item = document.createElement("li");
        item.className = "selecteur-mode-item";

        var bouton = document.createElement("button");
        bouton.type = "button";
        bouton.className = "selecteur-mode";

        // js/i18n.js est chargé en defer, donc après ce script : les libellés
        // repassent par le dictionnaire au premier rafraîchissement utile et
        // à chaque changement de langue. Sans lui (page des mentions légales,
        // page introuvable), les textes français ci-dessous font foi.
        function traduire(cle, defaut) {
            if (window.I18N && typeof window.I18N.t === "function") {
                var valeur = window.I18N.t(cle);
                if (valeur && valeur !== cle) {
                    return valeur;
                }
            }
            return defaut;
        }

        function rafraichir() {
            var mode = modeEffectif();
            bouton.innerHTML = mode === "nuit" ? SOLEIL : LUNE;
            bouton.setAttribute("aria-label", mode === "nuit"
                ? traduire("mode_jour_aria", "Passer en mode jour")
                : traduire("mode_nuit_aria", "Passer en mode nuit"));
            bouton.setAttribute("title", preference === "auto"
                ? traduire("mode_auto_titre", "Mode automatique, réglé sur le coucher du soleil")
                : traduire("mode_manuel_titre", "Mode choisi manuellement"));
        }

        bouton.addEventListener("click", function () {
            preference = modeEffectif() === "nuit" ? "jour" : "nuit";
            memoriser(preference);
            appliquer(preference, true);
            rafraichir();
        });

        window.addEventListener("langue-changee", rafraichir);

        rafraichir();
        item.appendChild(bouton);
        liste.appendChild(item);
    }


    /* ----------------------------------------------------------------------
       Démarrage
       ---------------------------------------------------------------------- */

    appliquer(modeEffectif(), false);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", construireBouton);
    } else {
        construireBouton();
    }

    // Une page laissée ouverte doit suivre le coucher du soleil.
    if (preference === "auto") {
        window.setInterval(function () {
            var attendu = modeSelonSoleil(new Date());
            if (document.documentElement.getAttribute("data-mode") !== attendu) {
                appliquer(attendu, true);
            }
        }, 60000);
    }

    // Exposé pour la vérification en console et les tests.
    window.JourNuit = { soleil: soleil, modeEffectif: modeEffectif };
})();

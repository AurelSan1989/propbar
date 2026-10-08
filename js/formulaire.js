// Formulaire de privatisation : validation de confort côté client, puis
// envoi à notre script Google Apps Script, qui transmet la demande par
// email (son code de référence est dans apps-script/Code.gs).
//
// IMPORTANT — cette validation n'est qu'un confort pour le visiteur (lui
// éviter un aller-retour serveur pour une date passée ou un champ oublié).
// Elle ne protège de rien : un robot qui vise directement l'URL du script la
// contourne entièrement. Les protections réelles sont le honeypot (voir plus
// bas) et, côté script, le plafond d'envois quotidien.

// URL de l'application web Apps Script, obtenue à son déploiement. Elle se
// termine par /exec — une URL en /dev ne répond qu'au compte qui l'a créée.
// Cette URL n'est pas un secret : elle vit forcément dans le code envoyé au
// navigateur du visiteur, au même titre qu'une clé d'API Google Maps.
const URL_FORMULAIRE = "https://script.google.com/macros/s/AKfycbzY9pStdESVvmM23W33BCeeiYNr4w1CtZB2HYGqhys6PQJU-fSs9RamUiZzFhxDflbIJw/exec";

// Capacité maximale du bar. Sert à la fois à la validation et à l'attribut
// max du champ. À tenir cohérent avec la clé privatisation_capacite de
// js/i18n.js, qui l'affiche parmi les repères de la page.
const CAPACITE_MAXIMALE = 80;


/* --------------------------------------------------------------------------
   Références aux éléments du formulaire
   -------------------------------------------------------------------------- */

const formulaire = document.getElementById("form-privatisation");

// La page d'accueil et la carte n'ont pas ce formulaire : le script ne fait
// rien si l'un de ses éléments essentiels est absent.
if (formulaire) {
    const champNom = document.getElementById("nom");
    const champEmail = document.getElementById("email");
    const champTelephone = document.getElementById("telephone");
    const champDate = document.getElementById("date");
    const champConvives = document.getElementById("convives");
    const champEvenement = document.getElementById("evenement");
    const champMessage = document.getElementById("message");
    const champHoneypot = document.getElementById("website");
    const boutonEnvoyer = formulaire.querySelector("button[type=submit]");

    const blocConfirmation = document.getElementById("confirmation");
    const blocErreurEnvoi = document.getElementById("erreur-envoi");

    let envoiEnCours = false;


    /* ----------------------------------------------------------------------
       Dates : aujourd'hui, en local, sans décalage de fuseau horaire
       ---------------------------------------------------------------------- */

    // Construit une date AAAA-MM-JJ à partir des composants locaux de
    // l'appareil, plutôt que via toISOString() (qui convertit en UTC et
    // peut donc afficher la veille ou le lendemain selon le fuseau horaire).
    function dateDuJourEnIso() {
        const maintenant = new Date();
        const annee = maintenant.getFullYear();
        const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
        const jour = String(maintenant.getDate()).padStart(2, "0");
        return annee + "-" + mois + "-" + jour;
    }

    function dateEstPassee(valeurIso) {
        return valeurIso < dateDuJourEnIso();
    }

    // Le dimanche est réservé depuis des années à un événement régulier
    // (lecture/concert) : le gérant ne veut pas avoir à refuser ces demandes.
    function dateEstUnDimanche(valeurIso) {
        return new Date(valeurIso + "T00:00:00").getDay() === 0;
    }

    // langueForcee : le mail envoyé au gérant reste en français, quelle que
    // soit la langue dans laquelle le visiteur consulte le site.
    function formaterDateLisible(valeurIso, langueForcee) {
        const langue = langueForcee || (window.I18N ? window.I18N.langue() : "fr");
        const date = new Date(valeurIso + "T00:00:00");
        return new Intl.DateTimeFormat(langue === "en" ? "en-GB" : "fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date);
    }


    /* ----------------------------------------------------------------------
       Validation
       ---------------------------------------------------------------------- */

    function champRempli(champ) {
        return champ.value.trim() !== "";
    }

    // Volontairement permissif : quelque chose@quelque-chose.extension, sans
    // espace. Le but est d'attraper les fautes de frappe, pas de juger
    // la validité d'une adresse (seul un envoi réel le peut).
    function emailPlausible(valeur) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur.trim());
    }

    // Accepte les écritures courantes (espaces, points, tirets, parenthèses)
    // puis vérifie le nombre de chiffres : 10 chiffres commençant par 0 pour
    // un numéro français (06 12 34 56 78), ou un indicatif international
    // (+33 6 12 34 56 78, 0033…, +44…) suivi de 8 à 15 chiffres.
    function telephonePlausible(valeur) {
        const brut = valeur.trim().replace(/[\s.\-()]/g, "");
        if (/^0[1-9]\d{8}$/.test(brut)) {
            return true;
        }
        // « +33 (0)6… » et « +33 06… » : le 0 national est en trop après
        // l'indicatif, mais l'écriture est courante, on le retire.
        const international = brut.replace(/^00/, "+").replace(/^\+330/, "+33");
        if (/^\+33/.test(international)) {
            return /^\+33[1-9]\d{8}$/.test(international);
        }
        return /^\+[1-9]\d{7,14}$/.test(international);
    }

    // Chaque erreur porte le champ à mettre en évidence, l'id de son
    // conteneur de message, et le texte à afficher.
    function traduire(cle) {
        return window.I18N ? window.I18N.t(cle) : cle;
    }

    function validerFormulaire() {
        const erreurs = [];

        if (!champRempli(champNom)) {
            erreurs.push({ champ: champNom, id: "erreur-nom", message: traduire("erreur_nom") });
        }

        // Le HTML ne sait pas exprimer « l'un des deux champs, au choix » :
        // cette règle ne peut être vérifiée qu'ici.
        if (!champRempli(champEmail) && !champRempli(champTelephone)) {
            erreurs.push({ champ: champEmail, id: "erreur-email", message: traduire("erreur_contact") });
        } else {
            // Chaque champ rempli doit être exploitable : un numéro faux ne
            // permettrait pas au gérant de rappeler, même si l'e-mail est bon.
            if (champRempli(champEmail) && !emailPlausible(champEmail.value)) {
                // L'adresse sert d'adresse de réponse au mail envoyé au gérant :
                // mal formée, elle fait échouer l'envoi côté Apps Script.
                erreurs.push({ champ: champEmail, id: "erreur-email", message: traduire("erreur_email_format") });
            }
            if (champRempli(champTelephone) && !telephonePlausible(champTelephone.value)) {
                erreurs.push({ champ: champTelephone, id: "erreur-telephone", message: traduire("erreur_telephone_format") });
            }
        }

        if (!champRempli(champDate)) {
            erreurs.push({ champ: champDate, id: "erreur-date", message: traduire("erreur_date_manquante") });
        } else if (dateEstPassee(champDate.value)) {
            erreurs.push({ champ: champDate, id: "erreur-date", message: traduire("erreur_date_passee") });
        } else if (dateEstUnDimanche(champDate.value)) {
            erreurs.push({ champ: champDate, id: "erreur-date", message: traduire("erreur_date_dimanche") });
        }

        if (!champRempli(champConvives)) {
            erreurs.push({ champ: champConvives, id: "erreur-convives", message: traduire("erreur_convives_manquant") });
        } else if (Number(champConvives.value) < 1) {
            erreurs.push({ champ: champConvives, id: "erreur-convives", message: traduire("erreur_convives_minimum") });
        } else if (Number(champConvives.value) > CAPACITE_MAXIMALE) {
            erreurs.push({
                champ: champConvives,
                id: "erreur-convives",
                message: traduire("erreur_convives_maximum").replace("{max}", CAPACITE_MAXIMALE)
            });
        }

        return erreurs;
    }

    function viderErreurs() {
        formulaire.querySelectorAll(".champ-erreur").forEach(function (conteneur) {
            conteneur.textContent = "";
        });
        formulaire.querySelectorAll("input, select, textarea").forEach(function (champ) {
            champ.removeAttribute("aria-invalid");
        });
    }

    // Toute donnée affichée vient du visiteur ou de ce script : textContent
    // uniquement, jamais innerHTML.
    function afficherErreurs(erreurs) {
        viderErreurs();
        erreurs.forEach(function (erreur) {
            const conteneur = document.getElementById(erreur.id);
            if (conteneur) {
                conteneur.textContent = erreur.message;
            }
            erreur.champ.setAttribute("aria-invalid", "true");
        });
    }


    /* ----------------------------------------------------------------------
       Confirmation et échec d'envoi
       ---------------------------------------------------------------------- */

    // Masquer le formulaire fait remonter brutalement le reste de la page :
    // sans ce recentrage, le visiteur resté au niveau du bouton se retrouve
    // devant le pied de page et ne voit jamais la réponse à son envoi.
    function revelerPanneau(panneau) {
        const animationReduite = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        panneau.hidden = false;
        panneau.focus({ preventScroll: true });
        panneau.scrollIntoView({ behavior: animationReduite ? "auto" : "smooth", block: "center" });
    }

    function afficherConfirmation() {
        document.getElementById("confirmation-date").textContent = formaterDateLisible(champDate.value);
        formulaire.hidden = true;
        blocErreurEnvoi.hidden = true;
        revelerPanneau(blocConfirmation);
    }

    function afficherErreurEnvoi() {
        revelerPanneau(blocErreurEnvoi);
    }

    function masquerErreurEnvoi() {
        blocErreurEnvoi.hidden = true;
    }

    // Croix de fermeture, commune aux deux panneaux : fermer la confirmation
    // réinitialise aussi le formulaire, pour repartir sur une demande neuve
    // plutôt que de laisser les anciennes valeurs affichées en arrière-plan.
    // Fermer le message d'échec, lui, garde le formulaire et ses valeurs tel
    // quel : la personne n'a pas à tout retaper pour réessayer.
    document.querySelectorAll(".formulaire-panel-fermer").forEach(function (bouton) {
        bouton.addEventListener("click", function () {
            const panneau = bouton.closest(".formulaire-panel");
            panneau.hidden = true;
            // Le bouton cliqué vient de disparaître avec son panneau : sans
            // point de chute, le focus repartirait du haut de la page.
            if (panneau === blocConfirmation) {
                formulaire.hidden = false;
                formulaire.reset();
                champNom.focus();
            } else {
                boutonEnvoyer.focus();
            }
        });
    });


    /* ----------------------------------------------------------------------
       Envoi au script Apps Script
       ---------------------------------------------------------------------- */

    // Ces noms de champs sont ceux que lit apps-script/Code.gs : les deux
    // fichiers doivent être modifiés ensemble.
    function construireParametresEnvoi() {
        const evenementChoisi = champEvenement.value
            ? champEvenement.options[champEvenement.selectedIndex].dataset.libelleFr
            : "Non précisé";
        const dateFr = formaterDateLisible(champDate.value, "fr");
        return {
            objet: "Demande de privatisation : " + champConvives.value + " personnes le " + dateFr,
            nom: champNom.value.trim(),
            email: champEmail.value.trim() || "Non renseigné",
            // Adresse de réponse du mail : vide plutôt qu'un texte qui ne
            // serait pas une adresse valide.
            reply_to: champEmail.value.trim(),
            telephone: champTelephone.value.trim() || "Non renseigné",
            date_lisible: dateFr,
            convives: champConvives.value,
            evenement: evenementChoisi,
            message: champMessage.value.trim() || "(aucun message)",
            langue: window.I18N && window.I18N.langue() === "en" ? "Anglais — répondre en anglais" : "Français"
        };
    }

    // En l'absence de configuration, l'envoi échoue volontairement : mieux
    // vaut un message d'erreur visible qu'une fausse confirmation.
    async function envoyerDemande(parametres) {
        if (!URL_FORMULAIRE) {
            throw new Error("Envoi non configuré : URL du script à renseigner en tête de js/formulaire.js.");
        }

        // Le type text/plain est délibéré : il fait entrer la requête dans la
        // catégorie « simple » du navigateur, qui n'envoie alors pas de
        // requête de contrôle OPTIONS — Apps Script ne sait pas y répondre et
        // l'envoi serait bloqué. Le corps reste du JSON, que le script relit.
        const reponse = await fetch(URL_FORMULAIRE, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(parametres)
        });

        if (!reponse.ok) {
            throw new Error("Réponse HTTP " + reponse.status);
        }

        // Le script répond toujours en JSON, y compris quand il refuse la
        // demande (champs manquants, plafond d'envois atteint).
        const resultat = await reponse.json();
        if (!resultat.ok) {
            throw new Error("Demande refusée par le script : " + resultat.erreur);
        }
        return resultat;
    }


    /* ----------------------------------------------------------------------
       Soumission du formulaire
       ---------------------------------------------------------------------- */

    formulaire.addEventListener("submit", async function (evenement) {
        evenement.preventDefault();

        // Honeypot rempli : très probablement un robot. On abandonne sans
        // rien envoyer et sans afficher la moindre erreur, pour ne pas
        // l'aider à comprendre pourquoi ça n'a pas marché.
        if (champHoneypot.value !== "") {
            return;
        }

        const erreurs = validerFormulaire();
        if (erreurs.length > 0) {
            afficherErreurs(erreurs);
            erreurs[0].champ.focus();
            return;
        }

        // La touche Entrée soumet le formulaire même quand le bouton est
        // désactivé : ce drapeau est la seule garantie contre un second envoi
        // pendant que le premier est en route.
        if (envoiEnCours) {
            return;
        }

        viderErreurs();
        masquerErreurEnvoi();
        envoiEnCours = true;
        boutonEnvoyer.disabled = true;
        // L'aller-retour avec le script dure près de deux secondes : sans ce
        // changement de libellé, rien ne bouge à l'écran et le visiteur croit
        // que son clic n'a pas été pris en compte.
        boutonEnvoyer.textContent = traduire("formulaire_envoi_en_cours");

        try {
            const parametres = construireParametresEnvoi();
            await envoyerDemande(parametres);
            afficherConfirmation();
        } catch (erreur) {
            console.error("Privatisation : envoi impossible.", erreur);
            afficherErreurEnvoi();
        } finally {
            envoiEnCours = false;
            boutonEnvoyer.disabled = false;
            boutonEnvoyer.textContent = traduire("formulaire_envoyer");
        }
    });


    /* ----------------------------------------------------------------------
       Changement de langue : retraduit ce que js/i18n.js ne voit pas
       (messages d'erreur déjà affichés, date déjà formatée en toutes lettres).
       ---------------------------------------------------------------------- */

    window.addEventListener("langue-changee", function () {
        const desErreursAffichees = Array.from(formulaire.querySelectorAll(".champ-erreur"))
            .some(function (conteneur) { return conteneur.textContent !== ""; });
        if (desErreursAffichees) {
            afficherErreurs(validerFormulaire());
        }
        if (!blocConfirmation.hidden) {
            document.getElementById("confirmation-date").textContent = formaterDateLisible(champDate.value);
        }
    });


    /* ----------------------------------------------------------------------
       Démarrage
       ---------------------------------------------------------------------- */

    champDate.min = dateDuJourEnIso();
    champConvives.max = CAPACITE_MAXIMALE;
}

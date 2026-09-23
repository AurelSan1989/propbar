// Formulaire de privatisation : validation de confort côté client, puis
// envoi par EmailJS (service tiers gratuit, sans dépendance à installer —
// il s'utilise via un script chargé en CDN et une clé publique).
//
// IMPORTANT — cette validation n'est qu'un confort pour le visiteur (lui
// éviter un aller-retour serveur pour une date passée ou un champ oublié).
// Elle ne protège de rien : un robot qui vise directement l'API EmailJS la
// contourne entièrement. La seule protection réelle ici est le honeypot
// (voir plus bas) et, côté tableau de bord EmailJS, la restriction de
// domaine et la limite de débit d'envoi.

// Identifiants EmailJS — à renseigner avant mise en production.
// La clé publique EmailJS est publique par conception : elle est faite pour
// vivre dans le code côté client, au même titre qu'une clé d'API Google Maps.
// Ce n'est donc pas un secret à cacher. La protection contre les abus se
// règle depuis le tableau de bord EmailJS, via la restriction de domaine
// (n'autoriser que le domaine du site) et la limite de débit d'envoi —
// jamais en tentant de dissimuler cette clé dans le code.
const EMAILJS_SERVICE_ID = "";
const EMAILJS_TEMPLATE_ID = "";
const EMAILJS_PUBLIC_KEY = "";


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

    function formaterDateLisible(valeurIso) {
        const langue = window.I18N ? window.I18N.langue() : "fr";
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
        }

        if (!champRempli(champDate)) {
            erreurs.push({ champ: champDate, id: "erreur-date", message: traduire("erreur_date_manquante") });
        } else if (dateEstPassee(champDate.value)) {
            erreurs.push({ champ: champDate, id: "erreur-date", message: traduire("erreur_date_passee") });
        }

        if (!champRempli(champConvives)) {
            erreurs.push({ champ: champConvives, id: "erreur-convives", message: traduire("erreur_convives_manquant") });
        } else if (Number(champConvives.value) < 1) {
            erreurs.push({ champ: champConvives, id: "erreur-convives", message: traduire("erreur_convives_minimum") });
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

    function afficherConfirmation() {
        document.getElementById("confirmation-date").textContent = formaterDateLisible(champDate.value);
        formulaire.hidden = true;
        blocErreurEnvoi.hidden = true;
        blocConfirmation.hidden = false;
    }

    function afficherErreurEnvoi() {
        blocErreurEnvoi.hidden = false;
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
            if (panneau === blocConfirmation) {
                formulaire.hidden = false;
                formulaire.reset();
            }
        });
    });


    /* ----------------------------------------------------------------------
       Envoi par EmailJS
       ---------------------------------------------------------------------- */

    function construireParametresEnvoi() {
        return {
            objet: "Privatisation — " + formaterDateLisible(champDate.value) + " — " + champConvives.value + " personnes",
            nom: champNom.value.trim(),
            email: champEmail.value.trim(),
            telephone: champTelephone.value.trim(),
            date: champDate.value,
            convives: champConvives.value,
            evenement: champEvenement.value,
            message: champMessage.value.trim()
        };
    }

    // TODO : appel réel une fois la bibliothèque EmailJS chargée (balise
    // <script> vers leur CDN dans le <head>) et les identifiants ci-dessus
    // renseignés, par exemple :
    //
    //   return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, parametres, EMAILJS_PUBLIC_KEY);
    //
    // En l'absence de configuration, l'envoi échoue volontairement : mieux
    // vaut un message d'erreur visible qu'une fausse confirmation.
    async function envoyerDemande(parametres) {
        throw new Error("Envoi non configuré : identifiants EmailJS à renseigner en tête de js/formulaire.js.");
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

        viderErreurs();
        masquerErreurEnvoi();
        boutonEnvoyer.disabled = true;

        try {
            const parametres = construireParametresEnvoi();
            await envoyerDemande(parametres);
            afficherConfirmation();
        } catch (erreur) {
            console.error("Privatisation : envoi impossible.", erreur);
            afficherErreurEnvoi();
        } finally {
            boutonEnvoyer.disabled = false;
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
}

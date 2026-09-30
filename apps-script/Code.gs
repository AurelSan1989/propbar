// L'Impondérable — réception des demandes de privatisation.
//
// Ce fichier ne fait PAS partie du site : c'est la copie de référence du
// script publié sur script.google.com, gardée ici pour ne pas la perdre et
// suivre ses modifications. Le formulaire de privatisation.html lui envoie
// la demande, ce script la transmet par email (voir js/formulaire.js).
//
// Le script tourne sous le compte Google qui l'a déployé : c'est donc ce
// compte qui envoie le mail, et son quota qui est consommé (100 envois par
// jour pour un compte Gmail ordinaire).
//
// APRÈS CHAQUE MODIFICATION, il faut republier, sinon l'URL continue de
// servir l'ancien code :
//   Déployer > Gérer les déploiements > icône crayon > Version : Nouvelle
//   version > Déployer. L'URL, elle, ne change pas.


// Adresse qui reçoit les demandes.
// Pendant les tests : celle de l'agence. À la mise en ligne : celle du gérant.
const DESTINATAIRE = "aurelien.girodet+imponderable@gmail.com";

// Garde-fou : l'URL du script est publique par nécessité (le navigateur du
// visiteur doit pouvoir l'appeler). Sans plafond, quelqu'un qui la découvre
// pourrait épuiser le quota d'envoi du compte Google et bloquer sa
// messagerie pour la journée.
const MAX_ENVOIS_PAR_JOUR = 30;

// Longueur retenue par champ : un envoi gonflé artificiellement ne doit pas
// produire un email démesuré.
const TAILLE_MAX = 2000;


function doPost(requete) {
    try {
        const demande = JSON.parse(requete.postData.contents);

        // Le formulaire vérifie déjà ces champs ; ce contrôle vaut pour les
        // appels qui viseraient l'URL directement, sans passer par la page.
        if (!demande.nom || !demande.date_lisible || !demande.convives) {
            return reponseJson({ ok: false, erreur: "champs_manquants" });
        }

        if (quotaJournalierAtteint()) {
            return reponseJson({ ok: false, erreur: "quota_atteint" });
        }

        const options = {
            to: DESTINATAIRE,
            subject: texte(demande.objet) || "Demande de privatisation",
            // Les deux versions du même contenu : les messageries qui
            // n'affichent pas le HTML se rabattent sur le texte brut.
            body: corpsTexte(demande),
            htmlBody: corpsHtml(demande),
            name: "Site L'Impondérable"
        };

        // Permet de répondre directement au visiteur depuis la boîte mail.
        if (demande.reply_to) {
            options.replyTo = texte(demande.reply_to);
        }

        MailApp.sendEmail(options);
        return reponseJson({ ok: true });
    } catch (erreur) {
        console.error(erreur);
        return reponseJson({ ok: false, erreur: "interne" });
    }
}


// Ouvrir l'URL du script dans un navigateur ne doit rien révéler.
function doGet() {
    return reponseJson({ ok: true });
}


function texte(valeur) {
    return String(valeur === null || valeur === undefined ? "" : valeur).slice(0, TAILLE_MAX);
}


function corpsTexte(demande) {
    return [
        "NOUVELLE DEMANDE DE PRIVATISATION",
        "",
        texte(demande.convives) + " personnes",
        "le " + texte(demande.date_lisible),
        "",
        "De la part de : " + texte(demande.nom),
        "Téléphone : " + texte(demande.telephone),
        "Email : " + texte(demande.email),
        "Occasion : " + texte(demande.evenement),
        "Langue : " + texte(demande.langue),
        "",
        "Son message :",
        texte(demande.message),
        "",
        "Pour répondre, écrivez à " + texte(demande.email)
            + " ou appelez le " + texte(demande.telephone) + ".",
        "",
        "Message automatique du site de L'Impondérable."
    ].join("\n");
}


// Tout ce qui vient du visiteur est neutralisé avant d'entrer dans le HTML,
// pour qu'un message contenant des balises ne déforme pas l'email.
function echapper(valeur) {
    return texte(valeur)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}


// Une ligne du tableau récapitulatif. « lien » rend la valeur cliquable
// (tel: ou mailto:) quand le visiteur a bien rempli le champ.
function ligneHtml(intitule, valeur, lien) {
    const brut = texte(valeur);
    const nonRenseigne = !brut || brut === "Non renseigné";
    const affichage = nonRenseigne || !lien
        ? echapper(brut)
        : '<a href="' + echapper(lien) + '" style="color:#B23A28;">' + echapper(brut) + "</a>";

    return '<tr>'
        + '<td style="padding:8px 16px 8px 0;color:#6B6257;white-space:nowrap;vertical-align:top;">' + intitule + '</td>'
        + '<td style="padding:8px 0;color:' + (nonRenseigne ? "#9A9186" : "#26201A") + ';font-weight:600;">' + affichage + '</td>'
        + '</tr>';
}


// Bouton d'action principal, volontairement indépendant du bouton
// « Répondre » de la messagerie : quand le compte qui fait tourner ce script
// est aussi celui qui reçoit le mail, Gmail repère un message qu'on s'est
// envoyé à soi-même et adresse la réponse au destinataire d'origine — donc à
// soi — en passant outre l'adresse de réponse. Un lien explicite, lui, vise
// toujours la bonne personne, quelle que soit la messagerie.
function blocReponseHtml(demande) {
    const email = texte(demande.email);
    const telephone = texte(demande.telephone);
    const renseigne = function (valeur) { return valeur && valeur !== "Non renseigné"; };

    let lien;
    let libelle;
    if (renseigne(email)) {
        lien = "mailto:" + email
            + "?subject=" + encodeURIComponent("Votre demande de privatisation à L'Impondérable");
        libelle = "Répondre à " + texte(demande.nom);
    } else if (renseigne(telephone)) {
        lien = "tel:" + telephone.replace(/[^0-9+]/g, "");
        libelle = "Appeler " + texte(demande.nom);
    } else {
        return "";
    }

    return '<div style="margin-top:24px;padding:20px;background-color:#F3EEE1;'
        + 'border-radius:8px;text-align:center;">'
        + '<a href="' + echapper(lien) + '" style="display:inline-block;padding:14px 28px;'
        + 'background-color:#B23A28;color:#FFFFFF;text-decoration:none;border-radius:8px;'
        + 'font-size:17px;font-weight:700;">' + echapper(libelle) + '</a>'
        + '<p style="margin:12px 0 0;font-size:14px;line-height:1.5;color:#6B6257;">'
        + 'Ce bouton ouvre votre messagerie avec l\'adresse déjà remplie.</p>'
        + '</div>';
}


function corpsHtml(demande) {
    const telephone = texte(demande.telephone);
    const email = texte(demande.email);
    // Les espaces d'un numéro saisi « 06 12 34 56 78 » empêchent la
    // composition automatique sur mobile.
    const lienTelephone = "tel:" + telephone.replace(/[^0-9+]/g, "");

    return '<div style="margin:0;padding:24px 12px;background-color:#F3EEE1;'
        + 'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">'

        + '<div style="max-width:560px;margin:0 auto;background-color:#FFFFFF;'
        + 'border:1px solid #E5DAC4;border-radius:12px;overflow:hidden;">'

        // Bandeau : l'essentiel se lit sans faire défiler, même sur téléphone.
        + '<div style="padding:24px;background-color:#26201A;color:#F3EEE1;">'
        + '<p style="margin:0 0 6px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#C9BBA4;">'
        + 'Nouvelle demande de privatisation</p>'
        + '<p style="margin:0;font-size:26px;font-weight:700;line-height:1.3;">'
        + echapper(demande.convives) + ' personnes<br>le ' + echapper(demande.date_lisible) + '</p>'
        + '</div>'

        + '<div style="padding:24px;">'
        + '<table style="width:100%;border-collapse:collapse;font-size:16px;line-height:1.5;">'
        + ligneHtml("De la part de", demande.nom, null)
        + ligneHtml("Téléphone", telephone, lienTelephone)
        + ligneHtml("Email", email, "mailto:" + email)
        + ligneHtml("Occasion", demande.evenement, null)
        + ligneHtml("Langue", demande.langue, null)
        + '</table>'

        + '<p style="margin:24px 0 8px;font-size:13px;letter-spacing:0.08em;'
        + 'text-transform:uppercase;color:#6B6257;">Son message</p>'
        + '<div style="padding:16px;background-color:#F3EEE1;border-radius:8px;'
        + 'font-size:16px;line-height:1.6;color:#26201A;white-space:pre-wrap;">'
        + echapper(demande.message) + '</div>'

        + blocReponseHtml(demande)
        + '</div>'

        + '<div style="padding:16px 24px;background-color:#F3EEE1;border-top:1px solid #E5DAC4;'
        + 'font-size:13px;color:#6B6257;text-align:center;">'
        + 'Message automatique envoyé depuis le site de L\'Impondérable.'
        + '</div>'

        + '</div></div>';
}


// Compteur d'envois remis à zéro au changement de jour. Le compteur est
// incrémenté avant l'envoi : en cas de doute, on plafonne plutôt trop tôt
// que trop tard.
function quotaJournalierAtteint() {
    const memoire = PropertiesService.getScriptProperties();
    const aujourdhui = Utilities.formatDate(new Date(), "Europe/Paris", "yyyy-MM-dd");
    const compte = memoire.getProperty("jour") === aujourdhui
        ? Number(memoire.getProperty("envois")) || 0
        : 0;

    if (compte >= MAX_ENVOIS_PAR_JOUR) {
        return true;
    }

    memoire.setProperties({ jour: aujourdhui, envois: String(compte + 1) });
    return false;
}


function reponseJson(charge) {
    return ContentService
        .createTextOutput(JSON.stringify(charge))
        .setMimeType(ContentService.MimeType.JSON);
}

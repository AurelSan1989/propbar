// Sélecteur de langue FR/EN — bascule le texte de l'interface sans recharger
// la page. Chargé uniquement sur index.html, tarifs.html et privatisation.html :
// les mentions légales restent en français uniquement.
//
// Fonctionnement : chaque élément traduisible porte un attribut data-i18n
// (son contenu texte) ou data-i18n-<attribut> (ex. data-i18n-alt,
// data-i18n-aria-label) pointant vers une clé du dictionnaire ci-dessous.
// appliquerTraductions() relit ces attributs à chaque changement de langue.
//
// Les autres scripts de la page (tarifs.js, formulaire.js, app.js) accèdent
// à la langue courante et aux traductions via window.I18N.t(cle) et
// window.I18N.langue(), et peuvent écouter l'évènement "langue-changee"
// pour se reconstruire (la carte, par exemple, est entièrement regénérée
// depuis data/tarifs.json).
(function () {
    "use strict";

    var LANGUES = ["fr", "en"];
    var LANGUE_PAR_DEFAUT = "fr";
    var CLE_STOCKAGE = "langue";

    var DICTIONNAIRE = {
        fr: {
            // Alternance de la balise <html lang="">, gérée directement par
            // appliquerTraductions() — aucune clé nécessaire ici.

            // En-tête / navigation, communs aux trois pages
            nav_accueil: "Accueil",
            nav_carte: "Notre carte",
            nav_privatiser: "Privatiser",
            appeler_aria: "Appeler le bar",
            menu_ouvrir_aria: "Ouvrir le menu",
            menu_fermer_aria: "Fermer le menu",
            barre_flottante_appeler: "Appeler",
            selecteur_langue_aria: "Choisir la langue",

            // Pied de page, commun aux trois pages
            footer_horaires_titre: "Horaires",
            footer_horaires_habituels: "TODO — horaires habituels à confirmer",
            footer_horaires_happy_hour: "Happy hour : TODO — créneau à confirmer",
            footer_horaires_note_avant: "Horaires du jour et fermetures exceptionnelles sur",
            footer_horaires_lien: "notre fiche Google",
            footer_lien_mentions: "Mentions légales",
            footer_retour_haut: "Retour en haut",

            // Accueil
            meta_description_accueil: "Bar restaurant avec terrasse toute l'année au 320 rue des Pyrénées à Paris, ouvert 7j/7 de 11h à 2h.",
            og_titre_accueil: "L'impondérable",
            hero_eyebrow: "Bar restaurant, terrasse toute l'année, ouvert 7j/7",
            hero_horaires: "Tous les jours : 11h - 2h00",
            hero_happy_hour: "Happy Hour 17h00 - 02h00",
            hero_metro: "Métro Jourdain",
            hero_cta: "Voir la Carte",
            story_eyebrow: "L'esprit Impondérable",
            story_h2: "Le repaire populaire de la rue des Pyrénées",
            story_lead_avant: "Au 320 rue des Pyrénées,",
            story_lead_apres: "cultive l'art de vivre des bistrots parisiens d'antan. Ici, on trinque à prix doux, autour de bières fraîches, de cocktails ou de vins. Coude à coude avec les gens du coin ou d'ailleurs.",
            story_important: "Notre grande terrasse vit au rythme des saisons : à l'abri en hiver, et déployée quand les beaux jours sont de retour.",
            story_cuisine: "On y sert une cuisine sincère et généreuse : Burgers, couscous, tapas du soir et maintenant des pizzas.",
            tag_terrasse: "Terrasse toute l'année",
            tag_happy_hour: "Happy Hour",
            tag_cuisine: "Cuisine généreuse",
            ambiance_eyebrow: "Sur le zinc et dans l'assiette",
            ambiance_h2: "Gourmandise et ambiance",
            ambiance_pizzas_titre: "Les pizzas",
            ambiance_pizzas_tag: "À emporter",
            ambiance_couscous_titre: "Les couscous",
            ambiance_couscous_tag: "Spécialité du chef",
            ambiance_terrasse_titre: "La terrasse",
            ambiance_terrasse_frequence: "7j/7",
            ambiance_terrasse_tag: "Toute l'année",
            avis_h2: "Ce qu'en disent les clients",
            avis_intro: "Le meilleur moyen de se faire une idée, c'est de lire les avis de ceux qui sont déjà passés et pourquoi pas d'y ajouter le vôtre.",
            avis_note: "4,2/5 sur Google",
            avis_nombre: "· 131 avis",
            avis_cta: "Voir tous les avis sur Google",
            privatisation_h2: "Privatiser L'Impondérable",
            privatisation_intro: "Anniversaire, pot de départ, after-work : la salle et la terrasse se privatisent pour vos occasions.",
            privatisation_capacite: "Capacité : TODO — à confirmer avec le gérant",
            privatisation_espaces: "Espaces disponibles : TODO — salle, terrasse, ou les deux",
            privatisation_cta_demande: "Faire une demande",
            privatisation_cta_appeler: "Nous téléphoner",

            // Notre carte
            titre_page_carte: "L'impondérable Notre carte",
            meta_description_carte: "Boissons, restauration et Happy Hour de L'Impondérable, bar restaurant au 320 rue des Pyrénées à Paris.",
            og_titre_carte: "L'impondérable Notre carte",
            carte_h1: "Notre carte",
            carte_happy_h2: "Notre Happy Hour",
            carte_boissons_h2: "Boissons",
            carte_restauration_h2: "Restauration",
            carte_prix_min: "à partir de",
            carte_lien_ardoise: "Voir l'ardoise",
            carte_nav_happy_hour: "Happy Hour",
            carte_erreur_chargement: "La carte n'a pas pu être chargée. Vous pouvez la consulter sur place.",

            // Privatisation
            titre_page_privatisation: "L'impondérable Privatisation",
            meta_description_privatisation: "Privatisez L'Impondérable pour un anniversaire, un pot de départ ou un after-work : salle et terrasse au 320 rue des Pyrénées à Paris.",
            og_titre_privatisation: "L'impondérable Privatisation",
            privatisation_h1: "Privatiser le bar",
            privatisation_photo_salle_alt: "Salle de L'Impondérable, le bar et les tables",
            privatisation_savoir_h2: "Ce qu'il faut savoir",
            privatisation_jours: "Jours et créneaux possibles : TODO — à confirmer avec le gérant",
            privatisation_conditions: "Conditions : TODO — minimum de consommation, acompte, à confirmer avec le gérant",
            formulaire_h2: "Votre demande",
            champ_nom: "Nom",
            champ_email: "E-mail",
            champ_telephone: "Téléphone",
            champ_aide_contact: "Renseignez au moins l'un des deux.",
            champ_date: "Date souhaitée",
            champ_convives: "Nombre de convives",
            champ_evenement: "Type d'événement",
            option_evenement_vide: "Sélectionnez (facultatif)",
            option_evenement_anniversaire: "Anniversaire",
            option_evenement_depart: "Pot de départ",
            option_evenement_afterwork: "After-work",
            option_evenement_autre: "Autre",
            champ_message: "Message",
            rgpd_texte: "Les informations de ce formulaire sont utilisées uniquement pour traiter votre demande de privatisation et vous recontacter.",
            rgpd_lien: "En savoir plus sur le traitement de vos données",
            formulaire_envoyer: "Envoyer la demande",
            confirmation_titre: "Demande envoyée",
            confirmation_avant: "Nous avons bien reçu votre demande de privatisation pour le",
            confirmation_appel_avant: "Pour toute question, appelez-nous au",
            confirmation_delai: "Délai de réponse habituel : sous 48h.",
            erreur_envoi_texte: "L'envoi a échoué. Vous pouvez réessayer, ou nous appeler directement au",
            contact_direct_h2: "Une question rapide ?",
            contact_direct_texte: "Plutôt que d'écrire, vous pouvez aussi nous appeler directement.",
            fermer_aria: "Fermer",

            // Messages de validation (js/formulaire.js)
            erreur_nom: "Merci d'indiquer votre nom.",
            erreur_contact: "Renseignez au moins un e-mail ou un numéro de téléphone.",
            erreur_date_manquante: "Merci d'indiquer une date souhaitée.",
            erreur_date_passee: "Cette date est déjà passée.",
            erreur_convives_manquant: "Merci d'indiquer le nombre de convives.",
            erreur_convives_minimum: "Le nombre de convives doit être d'au moins 1."
        },
        en: {
            nav_accueil: "Home",
            nav_carte: "Menu",
            nav_privatiser: "Private hire",
            appeler_aria: "Call the bar",
            menu_ouvrir_aria: "Open menu",
            menu_fermer_aria: "Close menu",
            barre_flottante_appeler: "Call",
            selecteur_langue_aria: "Choose language",

            footer_horaires_titre: "Opening hours",
            footer_horaires_habituels: "TODO — usual opening hours to confirm",
            footer_horaires_happy_hour: "Happy hour: TODO — time slot to confirm",
            footer_horaires_note_avant: "Today's hours and exceptional closures are on",
            footer_horaires_lien: "our Google listing",
            footer_lien_mentions: "Legal notice",
            footer_retour_haut: "Back to top",

            meta_description_accueil: "Bar and restaurant with a year-round terrace at 320 rue des Pyrénées in Paris, open every day from 11am to 2am.",
            og_titre_accueil: "L'impondérable",
            hero_eyebrow: "Bar & restaurant, year-round terrace, open every day",
            hero_horaires: "Every day: 11am – 2am",
            hero_happy_hour: "Happy Hour 5pm – 2am",
            hero_metro: "Jourdain metro station",
            hero_cta: "View the Menu",
            story_eyebrow: "The Impondérable spirit",
            story_h2: "The neighbourhood hangout on rue des Pyrénées",
            story_lead_avant: "At 320 rue des Pyrénées,",
            story_lead_apres: "keeps alive the spirit of old-time Parisian bistros. Here, you can raise a glass at friendly prices — cold beers, cocktails or wine — shoulder to shoulder with locals and visitors alike.",
            story_important: "Our large terrace changes with the seasons: sheltered in winter, and fully open once the sun comes back.",
            story_cuisine: "We serve honest, generous food: burgers, couscous, evening tapas and now pizzas too.",
            tag_terrasse: "Terrace all year round",
            tag_happy_hour: "Happy Hour",
            tag_cuisine: "Generous food",
            ambiance_eyebrow: "At the bar and on the plate",
            ambiance_h2: "Great food, great atmosphere",
            ambiance_pizzas_titre: "Pizzas",
            ambiance_pizzas_tag: "Takeaway",
            ambiance_couscous_titre: "Couscous",
            ambiance_couscous_tag: "Chef's speciality",
            ambiance_terrasse_titre: "The terrace",
            ambiance_terrasse_frequence: "Open every day",
            ambiance_terrasse_tag: "Year-round",
            avis_h2: "What our customers say",
            avis_intro: "The best way to get a feel for the place is to read what past visitors have said — and maybe add your own review.",
            avis_note: "4.2/5 on Google",
            avis_nombre: "· 131 reviews",
            avis_cta: "See all reviews on Google",
            privatisation_h2: "Book L'Impondérable",
            privatisation_intro: "Birthdays, leaving parties, after-work drinks: the room and terrace are available to hire for your occasion.",
            privatisation_capacite: "Capacity: TODO — to be confirmed with the manager",
            privatisation_espaces: "Available spaces: TODO — room, terrace, or both",
            privatisation_cta_demande: "Make a request",
            privatisation_cta_appeler: "Call us",

            titre_page_carte: "L'impondérable Menu",
            meta_description_carte: "Drinks, food and Happy Hour at L'Impondérable, bar and restaurant at 320 rue des Pyrénées in Paris.",
            og_titre_carte: "L'impondérable Menu",
            carte_h1: "Menu",
            carte_happy_h2: "Our Happy Hour",
            carte_boissons_h2: "Drinks",
            carte_restauration_h2: "Food",
            carte_prix_min: "from",
            carte_lien_ardoise: "View Happy Hour deals",
            carte_nav_happy_hour: "Happy Hour",
            carte_erreur_chargement: "The menu couldn't be loaded. You can view it on site.",

            titre_page_privatisation: "L'impondérable Private hire",
            meta_description_privatisation: "Book L'Impondérable for a birthday, leaving party or after-work drinks: room and terrace at 320 rue des Pyrénées in Paris.",
            og_titre_privatisation: "L'impondérable Private hire",
            privatisation_h1: "Book the bar",
            privatisation_photo_salle_alt: "L'Impondérable's dining room, the bar and tables",
            privatisation_savoir_h2: "Good to know",
            privatisation_jours: "Available days and time slots: TODO — to be confirmed with the manager",
            privatisation_conditions: "Conditions: TODO — minimum spend, deposit, to be confirmed with the manager",
            formulaire_h2: "Your request",
            champ_nom: "Name",
            champ_email: "Email",
            champ_telephone: "Phone",
            champ_aide_contact: "Please provide at least one of the two.",
            champ_date: "Preferred date",
            champ_convives: "Number of guests",
            champ_evenement: "Event type",
            option_evenement_vide: "Select (optional)",
            option_evenement_anniversaire: "Birthday",
            option_evenement_depart: "Leaving party",
            option_evenement_afterwork: "After-work drinks",
            option_evenement_autre: "Other",
            champ_message: "Message",
            rgpd_texte: "The information in this form is only used to handle your booking request and get back to you.",
            rgpd_lien: "Learn more about how your data is handled",
            formulaire_envoyer: "Send request",
            confirmation_titre: "Request sent",
            confirmation_avant: "We've received your booking request for",
            confirmation_appel_avant: "For any questions, call us on",
            confirmation_delai: "Usual response time: within 48 hours.",
            erreur_envoi_texte: "Something went wrong sending your request. You can try again, or call us directly on",
            contact_direct_h2: "A quick question?",
            contact_direct_texte: "Rather than writing, you can also call us directly.",
            fermer_aria: "Close",

            erreur_nom: "Please enter your name.",
            erreur_contact: "Please provide an email address or phone number.",
            erreur_date_manquante: "Please choose a preferred date.",
            erreur_date_passee: "This date has already passed.",
            erreur_convives_manquant: "Please enter the number of guests.",
            erreur_convives_minimum: "The number of guests must be at least 1."
        }
    };

    function langueValide(valeur) {
        return LANGUES.indexOf(valeur) !== -1;
    }

    function langueStockee() {
        try {
            var valeur = localStorage.getItem(CLE_STOCKAGE);
            return langueValide(valeur) ? valeur : null;
        } catch (e) {
            return null;
        }
    }

    function memoriserLangue(valeur) {
        try {
            localStorage.setItem(CLE_STOCKAGE, valeur);
        } catch (e) {
            // Stockage indisponible (navigation privée, cookies bloqués...) :
            // la langue reste simplement non mémorisée d'une visite à l'autre.
        }
    }

    var langueCourante = langueStockee() || LANGUE_PAR_DEFAUT;

    function traduire(cle) {
        var table = DICTIONNAIRE[langueCourante] || DICTIONNAIRE[LANGUE_PAR_DEFAUT];
        if (Object.prototype.hasOwnProperty.call(table, cle)) {
            return table[cle];
        }
        return DICTIONNAIRE[LANGUE_PAR_DEFAUT][cle] || cle;
    }

    // Transforme un nom d'attribut kebab-case en segment de clé dataset
    // camelCase : "aria-label" -> "i18nAriaLabel".
    function cleDataset(attribut) {
        return "i18n" + attribut.replace(/(^|-)([a-z])/g, function (_, tiret, lettre) {
            return lettre.toUpperCase();
        });
    }

    var ATTRIBUTS_TRADUISIBLES = ["alt", "aria-label", "placeholder", "content", "title"];

    function appliquerTraductions() {
        document.documentElement.lang = langueCourante;

        document.querySelectorAll("[data-i18n]").forEach(function (element) {
            element.textContent = traduire(element.dataset.i18n);
        });

        ATTRIBUTS_TRADUISIBLES.forEach(function (attribut) {
            var cle = cleDataset(attribut);
            document.querySelectorAll("[data-i18n-" + attribut + "]").forEach(function (element) {
                element.setAttribute(attribut, traduire(element.dataset[cle]));
            });
        });
    }

    function mettreAJourPuces() {
        document.querySelectorAll(".selecteur-langue-bouton").forEach(function (bouton) {
            bouton.setAttribute("aria-pressed", bouton.dataset.langueValeur === langueCourante ? "true" : "false");
        });
    }

    function choisirLangue(langue) {
        if (!langueValide(langue) || langue === langueCourante) {
            return;
        }
        langueCourante = langue;
        memoriserLangue(langue);
        appliquerTraductions();
        mettreAJourPuces();
        window.dispatchEvent(new CustomEvent("langue-changee", { detail: { langue: langueCourante } }));
    }

    // Posé comme dernier élément de la liste de #nav-principale plutôt que
    // dans une barre flottante par-dessus la page : voir le commentaire du
    // même choix dans js/theme-switcher.js.
    function construireSelecteur() {
        var liste = document.querySelector("#nav-principale ul");
        if (!liste) {
            return;
        }

        var item = document.createElement("li");
        item.className = "selecteur-langue-item";

        var groupe = document.createElement("div");
        groupe.className = "selecteur-langue";
        groupe.setAttribute("role", "group");
        groupe.setAttribute("data-i18n-aria-label", "selecteur_langue_aria");

        LANGUES.forEach(function (langue) {
            var bouton = document.createElement("button");
            bouton.type = "button";
            bouton.className = "selecteur-langue-bouton";
            bouton.textContent = langue.toUpperCase();
            bouton.dataset.langueValeur = langue;
            bouton.setAttribute("aria-pressed", langue === langueCourante ? "true" : "false");
            bouton.addEventListener("click", function () {
                choisirLangue(langue);
            });
            groupe.appendChild(bouton);
        });

        item.appendChild(groupe);
        liste.appendChild(item);
    }

    window.I18N = {
        langue: function () { return langueCourante; },
        t: traduire
    };

    construireSelecteur();
    appliquerTraductions();
})();

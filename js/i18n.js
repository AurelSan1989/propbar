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
            mode_jour_aria: "Passer en mode jour",
            mode_nuit_aria: "Passer en mode nuit",
            mode_auto_titre: "Mode automatique, réglé sur le coucher du soleil",
            mode_manuel_titre: "Mode choisi manuellement",
            aller_au_contenu: "Aller au contenu",
            itineraire: "Itinéraire",

            // Pied de page, commun aux trois pages
            footer_horaires_titre: "Horaires",
            footer_horaires_habituels: "Tous les jours : 9h – 2h",
            footer_horaires_happy_hour: "Happy Hour : 16h – 2h",
            footer_horaires_note_avant: "Horaires du jour et fermetures exceptionnelles sur",
            footer_horaires_lien: "notre fiche Google",
            footer_lien_mentions: "Mentions légales",
            footer_retour_haut: "Retour en haut",

            // Accueil
            titre_page_accueil: "L'impondérable — Bar restaurant à Paris 20e, terrasse 7j/7",
            meta_description_accueil: "Bar restaurant au 320 rue des Pyrénées, Paris 20e. Terrasse couverte toute l'année, Happy Hour de 16h à 2h, ouvert 7j/7. Métro Jourdain.",
            og_titre_accueil: "L'impondérable — Bar restaurant à Paris 20e",
            hero_eyebrow: "Bar restaurant, terrasse toute l'année, ouvert 7j/7",
            hero_photo_alt: "Devanture et terrasse de L'impondérable, rue des Pyrénées à Paris 20e",
            hero_horaires: "Tous les jours : 9h – 2h",
            hero_happy_hour: "Happy Hour 16h – 2h",
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
            ambiance_pizzas_alt: "Pizza cuite au four, garnie de mozzarella, salami, poivrons et oignons rouges",
            ambiance_couscous_titre: "Les couscous",
            ambiance_couscous_tag: "Spécialité du chef",
            ambiance_couscous_alt: "Couscous du chef à L'impondérable : semoule, viande, légumes, pois chiches et raisins secs",
            ambiance_tapas_titre: "Tapas et planches",
            ambiance_tapas_tag: "À partager",
            ambiance_tapas_alt: "Planche mixte de L'impondérable : jambon, chorizo, fromages, salade, tomates cerises et cornichons",
            ambiance_terrasse_titre: "La terrasse",
            ambiance_terrasse_happy_hour: "Happy Hour 16h – 2h",
            ambiance_terrasse_alt: "Cocktail aux fruits rouges et citron vert sur la terrasse de L'impondérable, rue des Pyrénées à Paris 20e",
            ambiance_terrasse_tag: "Toute l'année",
            avis_h2: "Ce qu'en disent les clients",
            avis_intro: "Le meilleur moyen de se faire une idée, c'est de lire les avis de ceux qui sont déjà passés et pourquoi pas d'y ajouter le vôtre.",
            avis_note: "4,2/5 sur Google",
            avis_nombre: "· 131 avis",
            avis_cta: "Voir tous les avis sur Google",
            privatisation_h2: "Privatiser L'impondérable",
            privatisation_intro: "Anniversaire, pot de départ, after-work : la salle et la terrasse se privatisent pour vos occasions.",
            privatisation_offre: "2 pizzas offertes à la réservation, à partir de 20 personnes",
            privatisation_capacite: "Capacité : jusqu'à 80 personnes",
            privatisation_espaces: "Espaces : tout le bar est privatisable, salle et terrasse, selon le nombre de convives",
            privatisation_cta_demande: "Faire une demande",
            privatisation_cta_appeler: "Nous téléphoner",

            // Notre carte
            titre_page_carte: "Carte et Happy Hour — L'impondérable, bar à Paris 20e",
            meta_description_carte: "Bières pression, cocktails, pizzas, couscous et salades : la carte et les tarifs du Happy Hour de L'impondérable, bar restaurant dans le 20e à Paris.",
            og_titre_carte: "La carte de L'impondérable, bar restaurant à Paris 20e",
            carte_h1: "Notre carte",
            carte_happy_h2: "Notre Happy Hour",
            carte_boissons_h2: "Boissons",
            carte_restauration_h2: "Restauration",
            carte_prix_min: "à partir de",
            carte_lien_ardoise: "Voir l'ardoise",
            carte_nav_happy_hour: "Happy Hour",
            carte_erreur_chargement: "La carte n'a pas pu être chargée. Vous pouvez la consulter sur place.",

            // Privatisation
            titre_page_privatisation: "Privatiser un bar à Paris 20e — L'impondérable",
            meta_description_privatisation: "Anniversaire, pot de départ, after-work : privatisez tout ou partie du bar, jusqu'à 80 personnes, tous les jours sauf dimanche. Paris 20e, métro Jourdain.",
            og_titre_privatisation: "Privatiser un bar à Paris 20e — L'impondérable",
            privatisation_h1: "Privatiser le bar",
            privatisation_photo_planche_alt: "Grand plateau de charcuterie à partager : jambons, saucisson, pâté, pain d'épices et tomates cerises",
            privatisation_photo_finger_alt: "Assortiment de finger food : nuggets, sticks de mozzarella, onion rings, frites, salade et sauces",
            privatisation_photo_cocktails_alt: "Plateau de cocktails servi au comptoir en soirée : Aperol Spritz, Moscow Mule et mojito",
            privatisation_photo_salle_alt: "Salle privatisable de L'impondérable, le comptoir et les tables, rue des Pyrénées à Paris 20e",
            privatisation_savoir_h2: "Ce qu'il faut savoir",
            privatisation_jours: "Jours : tous les jours sauf le dimanche",
            privatisation_conditions: "Conditions : communiquées selon le nombre de convives, envoyez-nous votre demande",
            formulaire_h2: "Votre demande",
            champ_nom: "Nom",
            champ_email: "E-mail",
            champ_telephone: "Téléphone",
            champ_aide_contact: "Renseignez au moins l'un des deux.",
            champ_date: "Date souhaitée (du lundi au samedi)",
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
            formulaire_envoi_en_cours: "Envoi en cours…",
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
            erreur_date_dimanche: "Le bar n'est pas privatisable le dimanche : merci de choisir un autre jour.",
            erreur_convives_manquant: "Merci d'indiquer le nombre de convives.",
            erreur_convives_minimum: "Le nombre de convives doit être d'au moins 1.",
            // {max} est remplacé par js/formulaire.js (constante CAPACITE_MAXIMALE).
            erreur_convives_maximum: "Nous pouvons accueillir jusqu'à {max} personnes. Pour un groupe plus grand, appelez-nous directement."
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
            mode_jour_aria: "Switch to day mode",
            mode_nuit_aria: "Switch to night mode",
            mode_auto_titre: "Automatic mode, follows the sunset",
            mode_manuel_titre: "Mode chosen manually",
            aller_au_contenu: "Skip to content",
            itineraire: "Get directions",

            footer_horaires_titre: "Opening hours",
            footer_horaires_habituels: "Every day: 9am – 2am",
            footer_horaires_happy_hour: "Happy Hour: 4pm – 2am",
            footer_horaires_note_avant: "Today's hours and exceptional closures are on",
            footer_horaires_lien: "our Google listing",
            footer_lien_mentions: "Legal notice",
            footer_retour_haut: "Back to top",

            titre_page_accueil: "L'impondérable — Bar and restaurant in Paris 20th",
            meta_description_accueil: "Bar and restaurant at 320 rue des Pyrénées, Paris 20th. Covered terrace all year round, Happy Hour 4pm to 2am, open every day. Métro Jourdain.",
            og_titre_accueil: "L'impondérable — Bar and restaurant in Paris 20th",
            hero_eyebrow: "Bar & restaurant, year-round terrace, open every day",
            hero_photo_alt: "L'impondérable's shopfront and terrace, rue des Pyrénées in Paris 20th",
            hero_horaires: "Every day: 9am – 2am",
            hero_happy_hour: "Happy Hour 4pm – 2am",
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
            ambiance_pizzas_alt: "Oven-baked pizza topped with mozzarella, salami, peppers and red onions",
            ambiance_couscous_titre: "Couscous",
            ambiance_couscous_tag: "Chef's speciality",
            ambiance_couscous_alt: "The chef's couscous at L'impondérable: semolina, meat, vegetables, chickpeas and raisins",
            ambiance_tapas_titre: "Tapas and boards",
            ambiance_tapas_tag: "For sharing",
            ambiance_tapas_alt: "L'impondérable's mixed board: ham, chorizo, cheeses, salad, cherry tomatoes and gherkins",
            ambiance_terrasse_titre: "The terrace",
            ambiance_terrasse_happy_hour: "Happy Hour 4pm – 2am",
            ambiance_terrasse_alt: "Red berry and lime cocktail on L'impondérable's terrace, rue des Pyrénées in Paris 20th",
            ambiance_terrasse_tag: "Year-round",
            avis_h2: "What our customers say",
            avis_intro: "The best way to get a feel for the place is to read what past visitors have said and maybe add your own review.",
            avis_note: "4.2/5 on Google",
            avis_nombre: "· 131 reviews",
            avis_cta: "See all reviews on Google",
            privatisation_h2: "Book L'impondérable",
            privatisation_intro: "Birthdays, leaving parties, after-work drinks: the room and terrace are available to hire for your occasion.",
            privatisation_offre: "2 free pizzas with your booking, for groups of 20 or more",
            privatisation_capacite: "Capacity: up to 80 guests",
            privatisation_espaces: "Spaces: the whole bar can be booked, room and terrace, depending on group size",
            privatisation_cta_demande: "Make a request",
            privatisation_cta_appeler: "Call us",

            titre_page_carte: "Menu and Happy Hour — L'impondérable, Paris 20th",
            meta_description_carte: "Draught beers, cocktails, pizzas, couscous and salads: the menu and Happy Hour prices at L'impondérable, bar and restaurant in Paris 20th.",
            og_titre_carte: "The menu at L'impondérable, bar and restaurant in Paris 20th",
            carte_h1: "Menu",
            carte_happy_h2: "Our Happy Hour",
            carte_boissons_h2: "Drinks",
            carte_restauration_h2: "Food",
            carte_prix_min: "from",
            carte_lien_ardoise: "View Happy Hour deals",
            carte_nav_happy_hour: "Happy Hour",
            carte_erreur_chargement: "The menu couldn't be loaded. You can view it on site.",

            titre_page_privatisation: "Private hire of a bar in Paris 20th — L'impondérable",
            meta_description_privatisation: "Birthday, leaving party, after-work drinks: hire part or all of the bar, up to 80 guests, every day except Sunday. Paris 20th, métro Jourdain.",
            og_titre_privatisation: "Private hire of a bar in Paris 20th — L'impondérable",
            privatisation_h1: "Book the bar",
            privatisation_photo_planche_alt: "Large charcuterie platter for sharing: hams, saucisson, pâté, gingerbread and cherry tomatoes",
            privatisation_photo_finger_alt: "Finger food selection: nuggets, mozzarella sticks, onion rings, fries, salad and dips",
            privatisation_photo_cocktails_alt: "A tray of cocktails served at the bar in the evening: Aperol Spritz, Moscow Mule and mojito",
            privatisation_photo_salle_alt: "L'impondérable's private-hire room, the counter and tables, rue des Pyrénées in Paris 20th",
            privatisation_savoir_h2: "Good to know",
            privatisation_jours: "Days: every day except Sunday",
            privatisation_conditions: "Conditions: depending on group size, send us your request",
            formulaire_h2: "Your request",
            champ_nom: "Name",
            champ_email: "Email",
            champ_telephone: "Phone",
            champ_aide_contact: "Please provide at least one of the two.",
            champ_date: "Preferred date (Monday to Saturday)",
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
            formulaire_envoi_en_cours: "Sending…",
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
            erreur_date_dimanche: "The bar can't be booked on Sundays: please choose another day.",
            erreur_convives_manquant: "Please enter the number of guests.",
            erreur_convives_minimum: "The number of guests must be at least 1.",
            erreur_convives_maximum: "We can host up to {max} guests. For a larger group, please call us directly."
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
        return "i18n" + attribut.replace(/(?:^|-)([a-z])/g, function (_, lettre) {
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
    // même choix que le bouton jour/nuit de js/jour-nuit.js.
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

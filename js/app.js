// Rejoue une fois l'effet d'invitation quand un bouton entre à l'écran.
// Sur pointeur, le survol suffit : le CSS limite l'effet à @media (hover: none).

// Le bouton téléphone en est exclu : son combiné sonne déjà en boucle.
const boutons = document.querySelectorAll(".cta, .cta-secondaire");

if ("IntersectionObserver" in window) {
    const observateur = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (entree) {
            if (entree.isIntersecting) {
                entree.target.classList.add("en-vue");
                observateur.unobserve(entree.target);
            }
        });
    }, { threshold: 0.6 });

    boutons.forEach(function (bouton) {
        observateur.observe(bouton);
    });
}

// Menu mobile : panneau plein écran ouvert/fermé par le bouton hamburger.
// Sur desktop (768px+), le CSS affiche la nav en ligne et cache ce bouton :
// le script n'a alors plus rien à faire.
const boutonMenu = document.getElementById("bouton-menu");
const navPrincipale = document.getElementById("nav-principale");

if (boutonMenu && navPrincipale) {
    const iconeOuvrir = boutonMenu.querySelector(".icone-menu-ouvrir");
    const iconeFermer = boutonMenu.querySelector(".icone-menu-fermer");

    // Sur un <svg>, contrairement au HTML, la propriété .hidden n'existe pas :
    // il faut poser/retirer l'attribut soi-même pour que [hidden] s'applique.
    function masquer(icone) {
        icone.setAttribute("hidden", "");
    }

    function afficher(icone) {
        icone.removeAttribute("hidden");
    }

    function ouvrirMenu() {
        navPrincipale.classList.add("est-ouvert");
        document.body.classList.add("menu-ouvert");
        boutonMenu.setAttribute("aria-expanded", "true");
        boutonMenu.setAttribute("aria-label", "Fermer le menu");
        masquer(iconeOuvrir);
        afficher(iconeFermer);
        navPrincipale.querySelector("a").focus();
    }

    function fermerMenu() {
        navPrincipale.classList.remove("est-ouvert");
        document.body.classList.remove("menu-ouvert");
        boutonMenu.setAttribute("aria-expanded", "false");
        boutonMenu.setAttribute("aria-label", "Ouvrir le menu");
        afficher(iconeOuvrir);
        masquer(iconeFermer);
    }

    boutonMenu.addEventListener("click", function () {
        if (navPrincipale.classList.contains("est-ouvert")) {
            fermerMenu();
        } else {
            ouvrirMenu();
        }
    });

    document.addEventListener("keydown", function (evenement) {
        if (evenement.key === "Escape" && navPrincipale.classList.contains("est-ouvert")) {
            fermerMenu();
            boutonMenu.focus();
        }
    });

    // Le passage en desktop pendant que le panneau est ouvert ne doit pas
    // laisser le défilement bloqué ou le bouton dans un état incohérent.
    window.matchMedia("(min-width: 768px)").addEventListener("change", function (evenement) {
        if (evenement.matches) {
            fermerMenu();
        }
    });
}

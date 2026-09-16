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

// Profondeur au défilement : les photos se décalent légèrement par rapport
// au texte qui les entoure. Assez pour donner du relief, jamais assez pour
// désorienter.
//
// Le calcul se fait dans une image d'animation (requestAnimationFrame), et
// n'écrit qu'une variable CSS : le navigateur compose le reste.
(function () {
    "use strict";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    // Amplitude du décalage, en pixels, de part et d'autre du centre.
    var AMPLITUDE = 28;

    var cibles = Array.prototype.slice.call(
        document.querySelectorAll(".card-media img, .hero-media img")
    );

    if (cibles.length === 0) {
        return;
    }

    cibles.forEach(function (image) {
        image.classList.add("parallaxe");
        // La photo est agrandie juste ce qu'il faut pour que le décalage ne
        // découvre jamais le fond sous ses bords.
        image.style.height = "calc(100% + " + (AMPLITUDE * 2) + "px)";
        image.style.marginTop = -AMPLITUDE + "px";
    });

    var recalculPlanifie = false;

    function recalculer() {
        var hauteurEcran = window.innerHeight;
        cibles.forEach(function (image) {
            var cadre = image.parentElement.getBoundingClientRect();
            if (cadre.bottom < 0 || cadre.top > hauteurEcran) {
                return;
            }
            // -1 quand le bloc entre par le bas, +1 quand il sort par le haut.
            var progression = (cadre.top + cadre.height / 2 - hauteurEcran / 2)
                / (hauteurEcran / 2 + cadre.height / 2);
            image.style.setProperty("--decalage", (-progression * AMPLITUDE).toFixed(1) + "px");
        });
        recalculPlanifie = false;
    }

    function planifier() {
        if (recalculPlanifie) {
            return;
        }
        recalculPlanifie = true;
        window.requestAnimationFrame(recalculer);
    }

    window.addEventListener("scroll", planifier, { passive: true });
    window.addEventListener("resize", planifier, { passive: true });
    recalculer();
})();

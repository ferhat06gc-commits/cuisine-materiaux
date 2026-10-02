/* ============================================================================
   Les valeurs d'ambiance, fournies par le laboratoire.
   Tout ce qui vaut null s'affiche « donnée à venir ». Rien n'est inventé.
   ============================================================================ */
export const DONNEES = {

  uniteFonctionnelle: null,   /* ex. "1 m² de mur, R = 4,0 m²·K/W, durée de vie 50 ans" */
  sourceImpact: null,         /* ex. "Base INIES — FDES n° xxxx et yyyy, consultées le ../../2026" */

  /* À RENSEIGNER AVANT TOUTE PRÉSENTATION PUBLIQUE.
     Simulation ou mesure ? quel outil ou quels capteurs ? quelle séquence ?
     L'écart annoncé est fort : c'est la première chose qu'on vous demandera. */
  sourceConfort: null,

  exterieur: { temp: 45, hum: 74 },          /* °C et % HR, séquence caniculaire */

  solutions: {
    conventionnel: {
      nom: 'Mur conventionnel',
      sousTitre: 'solution courante',
      carbone: null, energie: null, uniteEnergie: 'kWh',
      tempInterieure: 33, humRelative: 70,     /* valeur du laboratoire, révisée le 02/10/2026 (36 → 33 °C) */
      phraseFenetre: 'La matière vient de loin.'
    },
    terre: {
      nom: 'Mur terre + biosourcé',
      sousTitre: 'terre excavée et fibres végétales',
      carbone: null, energie: null, uniteEnergie: 'kWh',
      tempInterieure: 24, humRelative: 60,
      phraseFenetre: 'La matière vient du chantier d\'à côté.'
    }
  },

  /* Écarts calculés à partir des valeurs ci-dessus, pour l'affichage. */
  get ecartTemp() { return this.solutions.conventionnel.tempInterieure - this.solutions.terre.tempInterieure; },
  get amortissement() { return this.exterieur.temp - this.solutions.terre.tempInterieure; },

  /* ==================================================================
     L'ÉCRAN D'OPTIMISATION (avant le dosage)
     Le visiteur choisit un critère, le modèle du laboratoire cherche le
     meilleur dosage pour CE critère. Fonction de désirabilité de
     Derringer et Suich : chaque réponse est ramenée entre 0 et 1, et on
     maximise leur moyenne géométrique.
     ================================================================== */
  optimisation: {
    domaineFibres: [0, 2.5],     /* % — le domaine réellement mesuré */
    eauOptimale: 18,             /* % — sommet de la pénalité de teneur en eau */
    cibleSable: null,            /* le modèle ne porte pas sur le rapport terre/sable */
    /* Incertitude de répétabilité de VOS essais. Tant que c'est null,
       l'écran n'affiche aucune barre d'erreur. */
    incertitude: { rc: null, lambda: null, source: null },
    source: 'Derringer G., Suich R. (1980), Simultaneous Optimization of Several Response Variables, J. Qual. Technol. 12(4), 214-219'
  },

  /* ==================================================================
     ACTE 3 — SÉCHER À L'AIR OU À L'ÉTUVE
     Tout reste en terre crue. Deux chemins, deux durées, deux dépenses
     d'énergie, et un retrait au séchage à mesurer.
     ================================================================== */
  sechageModes: {
    naturel: {
      nom: 'Séchage naturel', detail: 'à l\u2019air libre, sous abri',
      temperature: null,      /* ambiante */
      duree: null,            /* jours — à renseigner (mesure maison) */
      energie: null,          /* aucune dépense, mais dites-le avec votre unité */
      source: null
    },
    etuve: {
      nom: 'Étuve à 50 °C', detail: 'séchage accéléré au laboratoire',
      temperature: 50,
      duree: null,            /* heures — à renseigner (mesure maison) */
      energie: null,
      source: null
    },

    /* ==================================================================
       LE RETRAIT AU SÉCHAGE — modèle calé sur une mesure du Builders Lab.
       Gharbage I., Benmahiddine F., Sebaibi N. (2024), « Analyse de
       l'influence de la teneur en eau et des agrégats végétaux sur le
       phénomène de retrait dans des blocs de terre crue », Academic
       Journal of Civil Engineering 42(1), 98-106, DOI 10.26168/ajce.42.1.9
       Terre d'excavation du Grand Paris Express, wL 35 ± 1 %, IP 12 ± 2 %,
       VBS 2,78 ± 0,13 g/100 g. Éprouvettes 16 × 4 × 4 cm, 3 par
       formulation, mesure au pied à coulisse, séchage à 40 °C jusqu'à
       masse constante (stabilisation ≈ 90 h).
       ------------------------------------------------------------------
       Ce qui est ÉCRIT dans l'article :
         · référence à 30 % d'eau, 0 % de paille : retrait longitudinal
           7,36 %, retrait latéral 10,75 %
         · 4 % de paille de blé : −70 % sur le longitudinal,
           −100 % sur le latéral
       Ce qui est LU sur la figure 4 (donc approché, à ± 0,3 point) :
         · référence à 20 % d'eau : retrait longitudinal ≈ 2 %
         · 1, 2, 3 % de paille à 30 % d'eau : ≈ 5,0 / 4,4 / 3,1 %
       ================================================================== */
    retraitModele: {
      actif: true,
      domaineEau: [20, 30],        /* % — domaine réellement balayé */
      domaineFibres: [0, 4],       /* % massique de paille de blé */
      /* droite du retrait longitudinal : (eau %, retrait %) */
      ancresLong: [[20, 2.0], [30, 7.36]],
      /* rapport latéral / longitudinal mesuré sur la référence à 30 % */
      ratioLateral: 10.75 / 7.36,
      /* effet des fibres, en facteur multiplicatif du retrait sans fibres */
      facteurFibresLong: [[0, 1.00], [1, 0.68], [2, 0.60], [3, 0.42], [4, 0.30]],
      facteurFibresLat:  [[0, 1.00], [4, 0.00]],
      temperatureEssai: 40,
      stabilisation: 90,           /* h, à 40 °C */
      lueSurFigure: true,
      /* la droite coupe zéro à ~16,3 % d'eau : on y voit une limite de
         retrait, au sens de XP P94-060-1, mais elle n'a PAS été mesurée. */
      limiteRetraitImplicite: 16.3,
      reserves: [
        'Retrait mesuré à 40 °C. L\u2019effet de la vitesse de séchage sur le retrait FINAL n\u2019est pas mesuré : le modèle applique le même retrait final à l\u2019étuve et à l\u2019air libre, et ne fait varier que la durée.',
        'Le retrait en hauteur n\u2019a pas été mesuré : on lui applique la valeur du retrait latéral (les deux sections de l\u2019éprouvette 16 × 4 × 4 sont identiques).',
        'En dessous de 20 % d\u2019eau le modèle extrapole (droite prolongée jusqu\u2019à 16,3 %) : à signaler à l\u2019écran, c\u2019est hors domaine mesuré.',
        'À confirmer : le dosage « fibres » du modèle d\u2019optimisation (0-2,5 %) et le dosage « paille de blé » de l\u2019essai de retrait (0-4 %) portent-ils sur la même fibre ?'
      ],
      source: 'Gharbage I., Benmahiddine F., Sebaibi N. (2024), AJCE 42(1), 98-106, DOI 10.26168/ajce.42.1.9',
      sourceLimite: 'XP P94-060-1 — Sols : essai de dessiccation, limite de retrait'
    },

    /* ==================================================================
       ET LES FISSURES ? La question revient toujours : une brique séchée
       vite à l'étuve se fissure-t-elle plus qu'une brique séchée à l'air ?
       NOUS N'EN AVONS AUCUNE MESURE. Tant que les deux champs ci-dessous
       valent null, l'application ne montre AUCUNE fissure liée au mode de
       séchage — elle se contente d'écrire le mécanisme, avec ses sources.
       Pour les remplir : une fournée d'étuve, une claie, mêmes éprouvettes,
       et on compte / mesure les fissures sur les faces après séchage.
       ================================================================== */
    fissuration: {
      etuve:   null,      /* ex. « 2 fissures, 18 mm cumulés, sur 3 éprouvettes » */
      naturel: null,
      protocole: null,    /* comment vous avez compté */
      note: 'Ce qui fissure une pièce en train de sécher, ce sont les gradients d’humidité et de température en son sein — pas la valeur du retrait final.',
      sources: [
        'Araújo M. V. et al. (2019), Industrial Ceramic Brick Drying in Oven by CFD, Materials 12(10), 1612, DOI 10.3390/ma12101612 — « The optimal conditions of the drying process occur when the water removal is carried out, promoting the lowest moisture and temperature gradient inside the material structure and reducing defects such as cracks and deformations. » (brique céramique CRUE, séchage à 70 °C)',
        'Eid J., Kanema J.-M., Bulatovas G., Bouchemella S., Taibi S. (2016), Retrait empêché d’un matériau à base de terre crue, Academic Journal of Civil Engineering 35(1) — mécanisme du retrait empêché sur béton de terre'
      ],
      reserve: 'AUCUNE de ces deux références ne compare étuve et air libre sur de la terre crue. La première porte sur de la brique céramique crue à 70 °C, la seconde ne fait pas varier la vitesse de séchage. Ne transformez pas ce mécanisme en résultat tant que vous ne l’avez pas mesuré.'
    },

    /* Amplitude de secours si retraitModele.actif = false. */
    retraitIllustration: 2.0,
    echelles: [1, 20],           /* échelle réelle, échelle amplifiée */
    noteFibres: '4 % de paille : −70 % de retrait en long, −100 % en large',
    sourceFibres: 'Gharbage, Benmahiddine, Sebaibi — AJCE 42(1) 2024, DOI 10.26168/ajce.42.1.9'
  },

  /* ------------------------------------------------------------------
     Acte 3 — cuire ou sécher.
     Aucun chiffre n'est écrit en dur dans l'application : tout ce qui vaut
     null s'affiche « donnée à venir ». Renseignez-les avec VOS sources,
     puis remplissez « source » : elle s'affiche sous le tableau.
     ------------------------------------------------------------------ */
  cuisson: {
    temperature: null,        /* °C — température de cuisson retenue */
    energie:     null,        /* même unité que uniteEnergie, par brique ou par kg : dites-le dans « base » */
    co2:         null,        /* kg CO2 éq., même base */
    base:        null,        /* ex. "par kg de produit fini" */
    source:      null
  },
  sechage: {
    energie:     null,
    co2:         null,
    base:        null,
    source:      null
  },

  mesuresPubliees: {
    mbvBTC: 3.26,
    lambdaBTC: 1.15,
    sourceMBV: 'Chehade, Dujardin, Giovannacci, Boudenne — congrès SFT 2024'
  },

  /* ==================================================================
     ACTE 6 — LA CAMÉRA THERMIQUE
     Modèle : régime permanent, transfert 1D, sans pont thermique ni fuite
     d'air. Température de surface extérieure :
         Tse = Te + U × Rse × (Ti − Te)
     avec Rse = 0,04 m²·K/W (paroi verticale, flux horizontal) et
          Rsi = 0,13 m²·K/W — NF EN ISO 6946.
     Le mur terre + fibres n'a PAS de U écrit en dur : il est calculé à
     partir de la formulation du visiteur, avec la loi du laboratoire
     λ(f) = 0,35 − 0,088·f, et l'épaisseur ci-dessous.
     ================================================================== */
  thermique: {
    /* °C — SCÉNARIO d'hiver avec neige, choisi par l'équipe (02/10/2026) :
       ce n'est pas une donnée climatique. Tout le reste en découle :
       températures de surface, déperditions, kWh/jour, textes affichés. */
    exterieurHiver: -2,
    consignes: [20, 30, 40],     /* °C — 20 est la consigne réaliste */
    consigneDefaut: 20,
    Rsi: 0.13, Rse: 0.04, RsiToit: 0.10,
    sourceResistances: 'NF EN ISO 6946',

    epaisseurMurTerre: 0.30,     /* m */

    parois: {
      parpaingNu: {
        nom: 'Parpaing nu',
        detail: 'blocs de béton creux, ép. ≤ 20 cm, non isolé',
        U: 2.8,
        source: 'Méthode 3CL-DPE 2021, arrêté du 31 mars 2021 (annexe 1), tableau des Umur0'
      },
      parpaingIsole: {
        nom: 'Parpaing isolé',
        detail: 'même mur + isolation R = 2,9 m²·K/W',
        Rajoute: 2.9,
        source: 'Arrêté du 22 mars 2017 (RT existant élément par élément), murs en contact avec l’extérieur, zones H1–H2'
      },
      fenetre: { nom: 'Fenêtre', U: 1.9,
        source: 'Arrêté du 22 mars 2017 — Uw ≤ 1,9 W/(m²·K)' },
      porte:   { nom: 'Porte d’entrée', U: 2.0,
        source: 'Arrêté du 22 mars 2017 — Ud ≤ 2 W/(m²·K)' },
      toiture: { nom: 'Toiture', R: 4.4,
        source: 'Arrêté du 22 mars 2017 — rampants de toiture, R ≥ 4,4 m²·K/W' }
    },

    /* ------------------------------------------------------------------
       LES PONTS THERMIQUES
       Le flux supplémentaire d'une liaison, ψ·ΔT par mètre de liaison, est
       réparti sur le mur selon une décroissance exponentielle de longueur
       caractéristique « longueur » — l'intégrale vaut exactement ψ·ΔT, donc
       le bilan est conservé. C'est une approximation 2D simple, pas un
       calcul aux éléments finis : elle donne la forme et l'ordre de
       grandeur des halos, pas leur valeur exacte.
       ------------------------------------------------------------------ */
    ponts: {
      longueur: 0.35,        /* m — étalement du flux de part et d'autre de la liaison */
      plancherBas: 0.40,     /* W/(m·K) — liaison mur / plancher bas, brique 30 cm non isolée */
      toiture:     0.81,     /* liaison mur / plancher haut, maçonnerie non isolée */
      appui:       0.35,     /* appui de baie, façade non isolée, menuiserie au nu intérieur */
      linteau:     0.10,     /* voir « reserve » */
      tableau:     0.10,     /* voir « reserve » */
      angle:       0.02,     /* angle sortant mur / mur */
      source: 'Règles Th-U, fascicule 5 « Ponts thermiques » — liaisons de maçonnerie non isolée',
      reserve: 'ψ de tableau et de linteau : valeur prise dans la plage 0–0,45 du fascicule, à affiner.'
    },

    /* Affiché sous l'image : ce que le modèle ne sait pas faire. */
    avertissement: 'Régime permanent, transmission seule : ni renouvellement d’air, ni fuites, ni apports internes ou solaires. Ponts thermiques linéiques étalés sur 0,35 m.'
  },

  duree: 230
};

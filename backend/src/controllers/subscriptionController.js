const prisma = require("../config/prisma");
const { PLANS, OFFRES_DEMANDABLES, OFFRES_AFFICHEES, montantPour } = require("../utils/plans");
const { saveFile, displayUrl } = require("../utils/storage");

// Coordonnées de paiement affichées à l'entreprise (comptes de l'exploitant de la plateforme)
exports.coordonnees = (req, res) => {
  res.json({
    wave: {
      numero: process.env.WAVE_NUMBER || "+223 00 00 00 00",
      nomBeneficiaire: process.env.PAYMENT_BENEFICIARY_NAME || "Archivix",
    },
    orangeMoney: {
      numero: process.env.ORANGE_MONEY_NUMBER || "+223 00 00 00 00",
      nomBeneficiaire: process.env.PAYMENT_BENEFICIARY_NAME || "Archivix",
    },
    contactEntreprise: process.env.PAYMENT_BENEFICIARY_EMAIL || "contact@archivix.example",
    offres: OFFRES_AFFICHEES.map((id) => {
      const p = PLANS[id];
      return {
        id,
        label: p.label,
        description: p.description,
        maxUsers: p.maxUsers,
        prixMensuel: p.prixMensuel,
        prixAnnuel: p.prixAnnuel,
        quotaMb: p.quotaMb,
        features: p.features,
        recommande: Boolean(p.recommande),
        surDevis: Boolean(p.surDevis),
      };
    }),
  });
};

// Réservé admin : soumettre une demande d'abonnement/réabonnement après dépôt Wave/Orange Money
// (paiement mensuel ou annuel — l'offre Institution se négocie sur devis, hors de ce flux)
exports.create = async (req, res) => {
  try {
    const { plan, moyenPaiement, numeroExpediteur, reference } = req.body;
    const dureeMois = Number(req.body.dureeMois || 12);
    if (!OFFRES_DEMANDABLES.includes(plan)) {
      return res.status(400).json({ message: "Offre invalide. Choisissez Essentiel, Professionnel ou Business." });
    }
    const montant = montantPour(plan, dureeMois);
    if (!montant) {
      return res.status(400).json({ message: "Durée invalide : choisissez un paiement mensuel ou annuel." });
    }
    if (!["wave", "orange_money"].includes(moyenPaiement)) {
      return res.status(400).json({ message: "Moyen de paiement invalide." });
    }
    if (!numeroExpediteur || !reference) {
      return res.status(400).json({ message: "Le numéro utilisé et la référence de la transaction sont obligatoires." });
    }

    let captureUrl = null;
    if (req.file) {
      const saved = await saveFile(req.file.buffer, req.file.originalname, `captures/${req.tenantId}`, req.file.mimetype);
      captureUrl = saved.url;
    }

    const request = await prisma.subscriptionRequest.create({
      data: {
        tenantId: req.tenantId,
        plan,
        dureeMois,
        montant,
        moyenPaiement,
        numeroExpediteur,
        reference,
        captureUrl,
      },
    });

    res.status(201).json({ request, message: "Demande envoyée. Elle sera examinée par l'administrateur de la plateforme." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'envoi de la demande.", error: err.message });
  }
};

// Réservé admin : historique des demandes de cette entreprise
exports.history = async (req, res) => {
  const requests = await prisma.subscriptionRequest.findMany({
    where: { tenantId: req.tenantId },
    orderBy: { createdAt: "desc" },
  });
  const withLinks = await Promise.all(requests.map(async (r) => ({ ...r, captureUrl: await displayUrl(r.captureUrl) })));
  res.json(withLinks);
};
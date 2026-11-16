const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { notifyTenantAdmins } = require("../utils/notify");
const { PLANS } = require("../utils/plans");
const { displayUrl } = require("../utils/storage");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await prisma.superAdmin.findUnique({ where: { email: email?.toLowerCase() } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    const token = jwt.sign({ sub: admin.id, type: "superadmin" }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.json({ token, admin: { id: admin.id, fullName: admin.fullName, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la connexion.", error: err.message });
  }
};

exports.me = (req, res) => res.json(req.superAdmin);

// Vue d'ensemble de toutes les entreprises de la plateforme
exports.tenants = async (req, res) => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, documents: true, departments: true } } },
  });
  res.json(tenants);
};

exports.toggleTenantActive = async (req, res) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ message: "Entreprise introuvable." });
  const updated = await prisma.tenant.update({ where: { id: tenant.id }, data: { isActive: !tenant.isActive } });
  res.json(updated);
};

// Liste des demandes d'abonnement, filtrable par statut
exports.subscriptionRequests = async (req, res) => {
  const { status } = req.query;
  const requests = await prisma.subscriptionRequest.findMany({
    where: status ? { status } : {},
    include: { tenant: { select: { id: true, name: true, slug: true, subscriptionExpiresAt: true } } },
    orderBy: { createdAt: "desc" },
  });
  const withLinks = await Promise.all(requests.map(async (r) => ({ ...r, captureUrl: await displayUrl(r.captureUrl) })));
  res.json(withLinks);
};

exports.approveRequest = async (req, res) => {
  try {
    const request = await prisma.subscriptionRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ message: "Demande introuvable." });
    if (request.status !== "en_attente") return res.status(400).json({ message: "Cette demande a déjà été traitée." });

    const tenant = await prisma.tenant.findUnique({ where: { id: request.tenantId } });
    const base = tenant.subscriptionExpiresAt && tenant.subscriptionExpiresAt > new Date()
      ? new Date(tenant.subscriptionExpiresAt)
      : new Date();
    base.setMonth(base.getMonth() + request.dureeMois);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionExpiresAt: base, isActive: true, plan: request.plan },
    });
    await prisma.subscriptionRequest.update({
      where: { id: request.id },
      data: { status: "approuve", decidedById: req.superAdmin.id, decidedAt: new Date() },
    });

    await notifyTenantAdmins(req.app, {
      tenantId: tenant.id,
      type: "abonnement_approuve",
      message: `Votre demande d'abonnement ${PLANS[request.plan]?.label || request.plan} a été approuvée. Abonnement actif jusqu'au ${base.toLocaleDateString("fr-FR")}.`,
      link: "/app/facturation",
    });

    res.json({ message: "Demande approuvée, abonnement activé." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'approbation.", error: err.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { motif } = req.body;
    const request = await prisma.subscriptionRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ message: "Demande introuvable." });
    if (request.status !== "en_attente") return res.status(400).json({ message: "Cette demande a déjà été traitée." });

    await prisma.subscriptionRequest.update({
      where: { id: request.id },
      data: { status: "refuse", motifRefus: motif || "Non conforme", decidedById: req.superAdmin.id, decidedAt: new Date() },
    });

    await notifyTenantAdmins(req.app, {
      tenantId: request.tenantId,
      type: "abonnement_refuse",
      message: `Votre demande d'abonnement a été refusée. Motif : ${motif || "non précisé"}.`,
      link: "/app/facturation",
    });

    res.json({ message: "Demande refusée." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors du refus.", error: err.message });
  }
};

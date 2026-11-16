// Envoi d'e-mails via l'API HTTP de Brevo (les ports SMTP sont bloqués sur les services gratuits de Render).
// Doc : https://developers.brevo.com/docs/send-a-transactional-email
// Sans BREVO_API_KEY, les e-mails sont seulement écrits dans les journaux (développement).

const API_URL = process.env.BREVO_API_URL || "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || "supportarchivix@gmail.com";
const FROM_NAME = process.env.MAIL_FROM_NAME || "Archivix";
const FRONTEND_URL = () => (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const configured = Boolean(process.env.BREVO_API_KEY);

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/** Mise en page commune (HTML simple, compatible avec les messageries). */
function layout({ title, intro, buttonLabel, buttonUrl, outro }) {
  const button = buttonUrl
    ? `<tr><td style="padding:8px 0 24px"><a href="${buttonUrl}" style="display:inline-block;background:#1D4ED8;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">${escapeHtml(buttonLabel)}</a></td></tr>
       <tr><td style="font-size:12px;color:#64748B;padding-bottom:16px">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><span style="color:#1D4ED8;word-break:break-all">${escapeHtml(buttonUrl)}</span></td></tr>`
    : "";
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#F6F7F9;font-family:Arial,Helvetica,sans-serif;color:#0F172A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F7F9;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E4E7EC;border-radius:12px">
<tr><td style="padding:20px 28px;border-bottom:1px solid #E4E7EC;font-weight:700;font-size:17px">
<span style="display:inline-block;width:24px;height:24px;background:#1D4ED8;border-radius:6px;vertical-align:middle;margin-right:8px"></span>Archivix</td></tr>
<tr><td style="padding:24px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-size:20px;font-weight:700;padding-bottom:12px">${escapeHtml(title)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#334155;padding-bottom:20px">${intro}</td></tr>
${button}
${outro ? `<tr><td style="font-size:13px;line-height:1.6;color:#64748B;padding-bottom:24px">${outro}</td></tr>` : ""}
</table></td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #E4E7EC;font-size:12px;color:#94A3B8">Archivix · Gestion documentaire et archivage sécurisé · ${escapeHtml(FROM_EMAIL)}</td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Envoie un e-mail. Ne lève jamais d'erreur : renvoie true si l'envoi a été accepté.
 * to : { email, name } ou tableau.
 */
async function sendMail({ to, subject, html }) {
  const recipients = (Array.isArray(to) ? to : [to]).filter((r) => r?.email);
  if (!recipients.length) return false;
  if (!configured) {
    console.log(`[E-mail non envoyé — BREVO_API_KEY absente] À : ${recipients.map((r) => r.email).join(", ")} · Objet : ${subject}`);
    return false;
  }
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json", "api-key": process.env.BREVO_API_KEY },
      body: JSON.stringify({ sender: { email: FROM_EMAIL, name: FROM_NAME }, to: recipients, subject, htmlContent: html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[E-mail] Brevo a refusé l'envoi (${res.status}) : ${body.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[E-mail] envoi impossible :", err.message);
    return false;
  }
}

// ---------- Modèles ----------

const ROLE_LABEL = { admin: "administrateur", gestionnaire: "gestionnaire", lecteur: "lecteur" };

function invitationEmail({ user, orgName, inviterName, setupUrl }) {
  return {
    to: { email: user.email, name: user.fullName },
    subject: `${inviterName} vous invite sur Archivix (${orgName})`,
    html: layout({
      title: `Bienvenue sur Archivix, ${user.fullName.split(" ")[0]}`,
      intro: `${escapeHtml(inviterName)} vous a ajouté à l'espace <b>${escapeHtml(orgName)}</b> en tant que <b>${ROLE_LABEL[user.role] || user.role}</b>.<br><br>Choisissez votre mot de passe pour accéder aux documents de votre organisation.`,
      buttonLabel: "Choisir mon mot de passe",
      buttonUrl: setupUrl,
      outro: "Ce lien est valable 72 heures et ne peut servir qu'une fois. Votre identifiant de connexion est cette adresse e-mail.",
    }),
  };
}

function resetEmail({ user, orgName, resetUrl }) {
  return {
    to: { email: user.email, name: user.fullName },
    subject: "Réinitialisation de votre mot de passe Archivix",
    html: layout({
      title: "Réinitialiser votre mot de passe",
      intro: `Une demande de réinitialisation a été faite pour votre compte <b>${escapeHtml(orgName)}</b>.`,
      buttonLabel: "Choisir un nouveau mot de passe",
      buttonUrl: resetUrl,
      outro: "Ce lien est valable 1 heure et ne peut servir qu'une fois. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.",
    }),
  };
}

function subscriptionDecisionEmail({ admins, orgName, approved, planLabel, until, motif }) {
  return {
    to: admins.map((a) => ({ email: a.email, name: a.fullName })),
    subject: approved ? `Abonnement ${planLabel} activé` : "Votre demande d'abonnement n'a pas été validée",
    html: layout({
      title: approved ? "Votre abonnement est actif" : "Demande d'abonnement refusée",
      intro: approved
        ? `L'abonnement <b>${escapeHtml(planLabel)}</b> de <b>${escapeHtml(orgName)}</b> est actif jusqu'au <b>${escapeHtml(until)}</b>. Merci pour votre confiance.`
        : `La demande d'abonnement de <b>${escapeHtml(orgName)}</b> n'a pas pu être validée.${motif ? `<br><br>Motif : ${escapeHtml(motif)}` : ""}<br><br>Vérifiez la référence de la transaction et renvoyez une demande depuis la page Abonnement.`,
      buttonLabel: "Ouvrir Archivix",
      buttonUrl: `${FRONTEND_URL()}/app/facturation`,
    }),
  };
}

function expiryReminderEmail({ admins, orgName, daysLeft, isTrial, until }) {
  const expired = daysLeft <= 0;
  const what = isTrial ? "essai gratuit" : "abonnement";
  return {
    to: admins.map((a) => ({ email: a.email, name: a.fullName })),
    subject: expired ? `Votre ${what} Archivix est terminé` : `Votre ${what} Archivix se termine dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
    html: layout({
      title: expired ? `Votre ${what} est terminé` : `Plus que ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
      intro: expired
        ? `L'${what} de <b>${escapeHtml(orgName)}</b> s'est terminé le ${escapeHtml(until)}. Vos documents restent consultables, mais l'ajout et la modification sont suspendus jusqu'au renouvellement.`
        : `L'${what} de <b>${escapeHtml(orgName)}</b> se termine le <b>${escapeHtml(until)}</b>. Choisissez une offre pour continuer sans interruption. Paiement par Wave ou Orange Money, dès 5 000 FCFA par mois.`,
      buttonLabel: "Choisir une offre",
      buttonUrl: `${FRONTEND_URL()}/app/facturation`,
    }),
  };
}

function newRequestEmail({ to, orgName, planLabel, montant, duree, moyen, reference }) {
  return {
    to,
    subject: `Nouvelle demande d'abonnement : ${orgName}`,
    html: layout({
      title: "Nouvelle demande à valider",
      intro: `<b>${escapeHtml(orgName)}</b> a envoyé une demande pour l'offre <b>${escapeHtml(planLabel)}</b> (${escapeHtml(duree)}) : <b>${escapeHtml(montant)}</b> par ${escapeHtml(moyen)}, référence <b>${escapeHtml(reference)}</b>.<br><br>Vérifiez le dépôt puis approuvez ou refusez la demande.`,
      buttonLabel: "Ouvrir l'espace super-admin",
      buttonUrl: `${FRONTEND_URL()}/superadmin`,
    }),
  };
}

module.exports = {
  configured,
  sendMail,
  invitationEmail,
  resetEmail,
  subscriptionDecisionEmail,
  expiryReminderEmail,
  newRequestEmail,
  FRONTEND_URL,
};

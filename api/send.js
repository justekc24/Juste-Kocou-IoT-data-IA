// Fonction serverless Vercel : envoie le message du formulaire via Mailjet.
// Variables d'environnement à définir dans Vercel (Settings > Environment Variables) :
//   MJ_APIKEY_PUBLIC  : clé API Mailjet
//   MJ_APIKEY_PRIVATE : clé secrète Mailjet
//   MAIL_FROM         : adresse expéditrice VALIDÉE dans Mailjet (ex. justekocou21@gmail.com)
//   MAIL_TO           : adresse qui reçoit les messages (ex. justekocou21@gmail.com)

const esc = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();

  // Champ piège anti-spam : les robots le remplissent, pas les humains
  if (body.website) return res.status(200).json({ ok: true });

  if (!name || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Champs invalides" });
  }
  if (name.length > 100 || email.length > 150 || message.length > 5000) {
    return res.status(400).json({ error: "Message trop long" });
  }

  const { MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE, MAIL_FROM, MAIL_TO } = process.env;
  if (!MJ_APIKEY_PUBLIC || !MJ_APIKEY_PRIVATE || !MAIL_FROM || !MAIL_TO) {
    return res.status(500).json({ error: "Serveur non configuré" });
  }

  try {
    const r = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(MJ_APIKEY_PUBLIC + ":" + MJ_APIKEY_PRIVATE).toString("base64"),
      },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: MAIL_FROM, Name: "Portfolio Juste KOCOU" },
            To: [{ Email: MAIL_TO, Name: "Juste KOCOU" }],
            ReplyTo: { Email: email, Name: name },
            Subject: "Nouveau message du portfolio — " + name,
            TextPart: "De : " + name + " (" + email + ")\n\n" + message,
            HTMLPart:
              "<p><strong>De :</strong> " + esc(name) + " (" + esc(email) + ")</p>" +
              "<p>" + esc(message).replace(/\n/g, "<br>") + "</p>",
          },
        ],
      }),
    });
    if (!r.ok) {
      console.error("Mailjet error", r.status, await r.text());
      return res.status(502).json({ error: "Envoi impossible" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

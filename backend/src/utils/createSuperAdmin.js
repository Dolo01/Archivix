// Usage : node src/utils/createSuperAdmin.js "Nom complet" email@exemple.com motdepasse
require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

async function main() {
  const [, , fullName, email, password] = process.argv;
  if (!fullName || !email || !password) {
    console.log('Usage : node src/utils/createSuperAdmin.js "Nom complet" email@exemple.com motdepasse');
    process.exit(1);
  }

  const existing = await prisma.superAdmin.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    console.log("Un super-administrateur existe déjà avec cet email.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.superAdmin.create({
    data: { fullName, email: email.toLowerCase(), passwordHash },
  });

  console.log(`Super-administrateur créé : ${admin.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

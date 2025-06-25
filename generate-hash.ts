import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("Administrador@1#", 10);
  console.log("HASH", hash);
}

main();

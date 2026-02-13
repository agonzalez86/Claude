import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  await prisma.systemConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      emailRecipients: ["admin@latambox.com"],
      supplierLocationName: "FLEX-BOX LIMITED",
      supplierLocationAddress: "Hong Kong",
      warehouseLocationName: "Mi Almacén",
      warehouseLocationAddress: "Querétaro, México",
    },
  });

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@latambox.com" },
    update: {},
    create: {
      email: "admin@latambox.com",
      password: hashedPassword,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  // Create demo sales user
  await prisma.user.upsert({
    where: { email: "ventas@latambox.com" },
    update: {},
    create: {
      email: "ventas@latambox.com",
      password: hashedPassword,
      name: "Pedro Ventas",
      role: "SALES",
    },
  });

  // Create demo warehouse coordinator
  await prisma.user.upsert({
    where: { email: "almacen@latambox.com" },
    update: {},
    create: {
      email: "almacen@latambox.com",
      password: hashedPassword,
      name: "María Almacén",
      role: "WAREHOUSE_COORDINATOR",
    },
  });

  console.log("✓ Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

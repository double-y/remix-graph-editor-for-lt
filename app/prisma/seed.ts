import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const nodes = await Promise.all(
    [0, 1, 2, 3, 4, 5].map((idx) => {
      return prisma.nodeData.upsert({
        where: { name: `seed${idx}` },
        update: { name: `seed${idx}` },
        create: { name: `seed${idx}` },
      });
    })
  );

  await Promise.all(
    [0, 1, 2, 3, 4].map((idx) => {
      const uniqueAttr = {
        fromNodeId: nodes[idx].id,
        toNodeId: nodes[idx + 1].id,
      };
      return prisma.directedEdgeData.upsert({
        where: {
          fromNodeId_toNodeId: uniqueAttr,
        },
        update: uniqueAttr,
        create: uniqueAttr,
      });
    })
  );

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

type X = {
  x: string;
};

type Y = {
  y: string;
};

const sample = (param: X | Y) => {
  if ("x" in param) {
    console.log(param.x);
  } else {
    console.log(param.y);
  }
};

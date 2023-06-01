import { ActionArgs, json } from "@remix-run/node";
import { prisma } from "~/db.server";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  if (data.name) {
    const node = await prisma.nodeData.upsert({
      where: { name: data.name as string },
      create: { name: data.name as string },
      update: { name: data.name as string },
    });
    return json(node);
  }

  return json(Object.fromEntries(formData));
};

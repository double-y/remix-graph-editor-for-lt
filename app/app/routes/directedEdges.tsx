import { ActionArgs, json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { graphCircularValidate } from "~/services/validators/graphCircularValidate";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const fromNodeId = formData.get("fromNodeId");
  const toNodeId = formData.get("toNodeId");
  const directedEdges = await prisma.directedEdgeData.findMany();

  invariant(typeof fromNodeId === "string", `fromNodeId must be string`);
  invariant(typeof toNodeId === "string", `toNodeId must be string`);

  const { valid } = graphCircularValidate(
    {
      fromNodeId,
      toNodeId,
    },
    directedEdges
  );

  if (!valid) {
    return json(
      {
        messsage: "circular found",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const newEdge = await prisma.directedEdgeData.create({
    data: {
      fromNodeId: fromNodeId,
      toNodeId: toNodeId,
    },
  });

  return json({
    data: newEdge,
  });
};

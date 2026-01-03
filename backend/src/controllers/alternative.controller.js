const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getOwnedCaseOr404(caseId, userId) {
  return prisma.decisionCase.findFirst({
    where: { id: caseId, userId },
    select: { id: true },
  });
}

// POST /decision-cases/:id/alternatives
exports.create = async (req, res) => {
  try {
    const caseId = req.params.id;
    const { name, note } = req.body;

    const dc = await getOwnedCaseOr404(caseId, req.user.id);
    if (!dc) return res.status(404).json({ message: "Decision case not found" });

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "name must be at least 2 characters" });
    }

    const alternative = await prisma.alternative.create({
      data: {
        name: name.trim(),
        note: note?.trim() || null,
        decisionCaseId: caseId,
      },
    });

    return res.status(201).json({
      message: "Alternative created",
      data: alternative,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

// GET /decision-cases/:id/alternatives
exports.list = async (req, res) => {
  try {
    const caseId = req.params.id;

    const dc = await getOwnedCaseOr404(caseId, req.user.id);
    if (!dc) return res.status(404).json({ message: "Decision case not found" });

    const alternatives = await prisma.alternative.findMany({
      where: { decisionCaseId: caseId },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({
      message: "Alternatives fetched",
      data: alternatives,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

// PUT /decision-cases/:id/alternatives/:alternativeId
exports.update = async (req, res) => {
  try {
    const caseId = req.params.id;
    const alternativeId = req.params.alternativeId;

    const dc = await getOwnedCaseOr404(caseId, req.user.id);
    if (!dc) return res.status(404).json({ message: "Decision case not found" });

    const { name, note } = req.body;
    const data = {};

    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ message: "name must be at least 2 characters" });
      }
      data.name = name.trim();
    }

    if (note !== undefined) {
      data.note = note ? String(note).trim() : null;
    }

    const existing = await prisma.alternative.findFirst({
      where: { id: alternativeId, decisionCaseId: caseId },
    });
    if (!existing) return res.status(404).json({ message: "Alternative not found" });

    const updated = await prisma.alternative.update({
      where: { id: alternativeId },
      data,
    });

    return res.status(200).json({
      message: "Alternative updated",
      data: updated,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

// DELETE /decision-cases/:id/alternatives/:alternativeId
exports.remove = async (req, res) => {
  try {
    const caseId = req.params.id;
    const alternativeId = req.params.alternativeId;

    const dc = await getOwnedCaseOr404(caseId, req.user.id);
    if (!dc) return res.status(404).json({ message: "Decision case not found" });

    const existing = await prisma.alternative.findFirst({
      where: { id: alternativeId, decisionCaseId: caseId },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ message: "Alternative not found" });

    await prisma.alternative.delete({ where: { id: alternativeId } });

    return res.status(200).json({ message: "Alternative deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

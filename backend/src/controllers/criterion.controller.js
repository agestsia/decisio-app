const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// helper: pastikan decision case milik user
async function getOwnedCaseOr404(caseId, userId) {
  const dc = await prisma.decisionCase.findFirst({
    where: { id: caseId, userId },
    select: { id: true },
  });
  return dc;
}

// POST /decision-cases/:id/criteria
exports.create = async (req, res) => {
  try {
    const caseId = req.params.id;
    const { name, weight, type } = req.body;

    const dc = await getOwnedCaseOr404(caseId, req.user.id);
    if (!dc) return res.status(404).json({ message: "Decision case not found" });

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "name must be at least 2 characters" });
    }

    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0) {
      return res.status(400).json({ message: "weight must be a number > 0" });
    }

    const t = (type || "benefit").toLowerCase();
    if (!["benefit", "cost"].includes(t)) {
      return res.status(400).json({ message: "type must be 'benefit' or 'cost'" });
    }

    const criterion = await prisma.criterion.create({
      data: {
        name: name.trim(),
        weight: w,
        type: t,
        decisionCaseId: caseId,
      },
    });

    return res.status(201).json({
      message: "Criterion created",
      data: criterion,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

// GET /decision-cases/:id/criteria
exports.list = async (req, res) => {
  try {
    const caseId = req.params.id;

    const dc = await getOwnedCaseOr404(caseId, req.user.id);
    if (!dc) return res.status(404).json({ message: "Decision case not found" });

    const criteria = await prisma.criterion.findMany({
      where: { decisionCaseId: caseId },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({
      message: "Criteria fetched",
      data: criteria,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

// PUT /decision-cases/:id/criteria/:criterionId
exports.update = async (req, res) => {
  try {
    const caseId = req.params.id;
    const criterionId = req.params.criterionId;

    const dc = await getOwnedCaseOr404(caseId, req.user.id);
    if (!dc) return res.status(404).json({ message: "Decision case not found" });

    const { name, weight, type } = req.body;

    const data = {};
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ message: "name must be at least 2 characters" });
      }
      data.name = name.trim();
    }

    if (weight !== undefined) {
      const w = Number(weight);
      if (!Number.isFinite(w) || w <= 0) {
        return res.status(400).json({ message: "weight must be a number > 0" });
      }
      data.weight = w;
    }

    if (type !== undefined) {
      const t = String(type).toLowerCase();
      if (!["benefit", "cost"].includes(t)) {
        return res.status(400).json({ message: "type must be 'benefit' or 'cost'" });
      }
      data.type = t;
    }

    // pastikan criterion ada & milik decision case ini
    const existing = await prisma.criterion.findFirst({
      where: { id: criterionId, decisionCaseId: caseId },
    });
    if (!existing) return res.status(404).json({ message: "Criterion not found" });

    const updated = await prisma.criterion.update({
      where: { id: criterionId },
      data,
    });

    return res.status(200).json({
      message: "Criterion updated",
      data: updated,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

// DELETE /decision-cases/:id/criteria/:criterionId
exports.remove = async (req, res) => {
  try {
    const caseId = req.params.id;
    const criterionId = req.params.criterionId;

    const dc = await getOwnedCaseOr404(caseId, req.user.id);
    if (!dc) return res.status(404).json({ message: "Decision case not found" });

    const existing = await prisma.criterion.findFirst({
      where: { id: criterionId, decisionCaseId: caseId },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ message: "Criterion not found" });

    await prisma.criterion.delete({ where: { id: criterionId } });

    return res.status(200).json({ message: "Criterion deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// PUT /scores  (upsert)
exports.upsert = async (req, res) => {
  try {
    const { alternativeId, criterionId, value } = req.body;

    if (!alternativeId || !criterionId) {
      return res.status(400).json({ message: "alternativeId and criterionId are required" });
    }

    const v = Number(value);
    if (!Number.isFinite(v)) {
      return res.status(400).json({ message: "value must be a number" });
    }

    // ownership check: alternative & criterion harus milik user (via decisionCase -> userId)
    const alt = await prisma.alternative.findFirst({
      where: {
        id: alternativeId,
        decisionCase: { userId: req.user.id },
      },
      select: { id: true, decisionCaseId: true },
    });

    if (!alt) return res.status(404).json({ message: "Alternative not found" });

    const crit = await prisma.criterion.findFirst({
      where: {
        id: criterionId,
        decisionCase: { userId: req.user.id },
      },
      select: { id: true, decisionCaseId: true },
    });

    if (!crit) return res.status(404).json({ message: "Criterion not found" });

    // harus dalam decision case yang sama
    if (alt.decisionCaseId !== crit.decisionCaseId) {
      return res.status(400).json({ message: "alternative and criterion must belong to the same decision case" });
    }

    const score = await prisma.alternativeScore.upsert({
      where: {
        alternativeId_criterionId: { alternativeId, criterionId },
      },
      update: { value: v },
      create: { alternativeId, criterionId, value: v },
    });

    return res.status(200).json({
      message: "Score saved",
      data: score,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
};

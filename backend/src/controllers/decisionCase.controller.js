const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function nearlyEqual(a, b, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

// ✅ ini yang benar sesuai schema.prisma kamu
const SCORE_DELEGATE = prisma.alternativeScore;

// POST /decision-cases
async function create(req, res) {
  try {
    const { title, description } = req.body;

    if (!title || title.trim().length < 3) {
      return res.status(400).json({ message: "title must be at least 3 characters" });
    }

    const decisionCase = await prisma.decisionCase.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        userId: req.user.id,
      },
    });

    return res.status(201).json({
      message: "Decision case created",
      data: decisionCase,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
}

// GET /decision-cases
async function list(req, res) {
  try {
    const cases = await prisma.decisionCase.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      message: "Decision cases fetched",
      data: cases,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
}

// GET /decision-cases/:id
async function detail(req, res) {
  try {
    const { id } = req.params;

    const decisionCase = await prisma.decisionCase.findFirst({
      where: { id, userId: req.user.id },
      include: {
        criteria: true,
        alternatives: true,
      },
    });

    if (!decisionCase) {
      return res.status(404).json({ message: "Decision case not found" });
    }

    return res.status(200).json({
      message: "Decision case fetched",
      data: decisionCase,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
}

// GET /decision-cases/:id/scores
async function scoreMatrix(req, res) {
  try {
    const { id } = req.params;

    const decisionCase = await prisma.decisionCase.findFirst({
      where: { id, userId: req.user.id },
      include: {
        criteria: { orderBy: { createdAt: "asc" } },
        alternatives: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!decisionCase) {
      return res.status(404).json({ message: "Decision case not found" });
    }

    const criteriaIds = decisionCase.criteria.map((c) => c.id);
    const alternativeIds = decisionCase.alternatives.map((a) => a.id);

    const scores = await SCORE_DELEGATE.findMany({
      where: {
        criterionId: { in: criteriaIds },
        alternativeId: { in: alternativeIds },
      },
    });

    const scoreMap = new Map();
    for (const s of scores) {
      scoreMap.set(`${s.alternativeId}|${s.criterionId}`, s.value);
    }

    const matrix = decisionCase.alternatives.map((alt) => ({
      alternativeId: alt.id,
      alternativeName: alt.name,
      values: decisionCase.criteria.map((crit) => ({
        criterionId: crit.id,
        criterionName: crit.name,
        value: scoreMap.get(`${alt.id}|${crit.id}`) ?? null,
      })),
    }));

    const missing = [];
    for (const alt of decisionCase.alternatives) {
      for (const crit of decisionCase.criteria) {
        const k = `${alt.id}|${crit.id}`;
        if (!scoreMap.has(k)) missing.push({ alternativeId: alt.id, criterionId: crit.id });
      }
    }

    return res.status(200).json({
      message: "Score matrix fetched",
      data: {
        decisionCaseId: decisionCase.id,
        criteria: decisionCase.criteria,
        alternatives: decisionCase.alternatives,
        matrix,
        missingCount: missing.length,
        missing,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
}

// GET /decision-cases/:id/results
async function results(req, res) {
  try {
    const { id } = req.params;

    const decisionCase = await prisma.decisionCase.findFirst({
      where: { id, userId: req.user.id },
      include: {
        criteria: { orderBy: { createdAt: "asc" } },
        alternatives: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!decisionCase) {
      return res.status(404).json({ message: "Decision case not found" });
    }

    if (decisionCase.criteria.length === 0 || decisionCase.alternatives.length === 0) {
      return res.status(400).json({
        message: "Criteria and alternatives must not be empty",
      });
    }

    const totalWeight = decisionCase.criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
    if (!nearlyEqual(totalWeight, 1)) {
      return res.status(400).json({
        message: "Total weight must equal 1",
        data: { totalWeight },
      });
    }

    const criteriaIds = decisionCase.criteria.map((c) => c.id);
    const alternativeIds = decisionCase.alternatives.map((a) => a.id);

    const scores = await SCORE_DELEGATE.findMany({
      where: {
        criterionId: { in: criteriaIds },
        alternativeId: { in: alternativeIds },
      },
    });

    const scoreMap = new Map();
    for (const s of scores) {
      scoreMap.set(`${s.alternativeId}|${s.criterionId}`, Number(s.value));
    }

    const missing = [];
    for (const alt of decisionCase.alternatives) {
      for (const crit of decisionCase.criteria) {
        const k = `${alt.id}|${crit.id}`;
        if (!scoreMap.has(k)) missing.push({ alternativeId: alt.id, criterionId: crit.id });
      }
    }
    if (missing.length > 0) {
      return res.status(400).json({
        message: "Scores are incomplete",
        data: { missingCount: missing.length, missing },
      });
    }

    const critStats = {};
    for (const crit of decisionCase.criteria) {
      const values = decisionCase.alternatives.map((alt) => scoreMap.get(`${alt.id}|${crit.id}`));
      critStats[crit.id] = { min: Math.min(...values), max: Math.max(...values) };
    }

    const computed = decisionCase.alternatives.map((alt) => {
      let total = 0;

      const breakdown = decisionCase.criteria.map((crit) => {
        const raw = scoreMap.get(`${alt.id}|${crit.id}`);
        const { min, max } = critStats[crit.id];

        let normalized = 0;
        if (crit.type === "cost") normalized = raw === 0 ? 0 : min / raw;
        else normalized = max === 0 ? 0 : raw / max;

        const weighted = normalized * Number(crit.weight);
        total += weighted;

        return {
          criterionId: crit.id,
          criterionName: crit.name,
          type: crit.type,
          weight: Number(crit.weight),
          raw,
          normalized,
          weighted,
          min,
          max,
        };
      });

      return {
        alternativeId: alt.id,
        alternativeName: alt.name,
        note: alt.note ?? null,
        totalScore: total,
        breakdown,
      };
    });

    computed.sort((a, b) => b.totalScore - a.totalScore);
    const ranked = computed.map((r, idx) => ({ ...r, rank: idx + 1 }));

    return res.status(200).json({
      message: "WSM results calculated",
      data: {
        decisionCaseId: decisionCase.id,
        totalWeight,
        results: ranked,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "internal server error" });
  }
}

module.exports = {
  create,
  list,
  detail,
  scoreMatrix,
  results,
};

// src/controllers/decisionCase.controller.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ import engine WSM
const { computeWSM } = require("../engine/wsm.engine");

function nearlyEqual(a, b, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

// ✅ delegate sesuai schema.prisma kamu
const SCORE_DELEGATE = prisma.alternativeScore;

/**
 * Helper: ambil decisionCase lengkap + ownership check
 */
async function getOwnedDecisionCaseOr404({ caseId, userId }) {
  const decisionCase = await prisma.decisionCase.findFirst({
    where: { id: caseId, userId },
    include: {
      criteria: { orderBy: { createdAt: "asc" } },
      alternatives: { orderBy: { createdAt: "asc" } },
    },
  });

  return decisionCase;
}

/**
 * Helper: hitung WSM (benefit/cost) dan return hasil lengkap
 * Output:
 *  - totalWeight
 *  - results: [{ rank, alternativeId, alternativeName, note, totalScore, breakdown }]
 */
async function computeWSMForCase({ decisionCase }) {
  if (!decisionCase) {
    const err = new Error("Decision case not found");
    err.status = 404;
    throw err;
  }

  if (decisionCase.criteria.length === 0 || decisionCase.alternatives.length === 0) {
    const err = new Error("Criteria and alternatives must not be empty");
    err.status = 400;
    throw err;
  }

  const totalWeight = decisionCase.criteria.reduce(
    (sum, c) => sum + Number(c.weight || 0),
    0
  );

  if (!nearlyEqual(totalWeight, 1)) {
    const err = new Error("Total weight must equal 1");
    err.status = 400;
    err.data = { totalWeight };
    throw err;
  }

  const criteriaIds = decisionCase.criteria.map((c) => c.id);
  const alternativeIds = decisionCase.alternatives.map((a) => a.id);

  // ambil score raw
  const scores = await SCORE_DELEGATE.findMany({
    where: {
      criterionId: { in: criteriaIds },
      alternativeId: { in: alternativeIds },
    },
    select: { alternativeId: true, criterionId: true, value: true },
  });

  const scoreMap = new Map();
  for (const s of scores) {
    scoreMap.set(`${s.alternativeId}|${s.criterionId}`, Number(s.value));
  }

  // cek missing score
  const missing = [];
  for (const alt of decisionCase.alternatives) {
    for (const crit of decisionCase.criteria) {
      const k = `${alt.id}|${crit.id}`;
      if (!scoreMap.has(k)) missing.push({ alternativeId: alt.id, criterionId: crit.id });
    }
  }

  if (missing.length > 0) {
    const err = new Error("Scores are incomplete");
    err.status = 400;
    err.data = { missingCount: missing.length, missing };
    throw err;
  }

  // stats per kriteria untuk normalisasi
  const critStats = {};
  for (const crit of decisionCase.criteria) {
    const values = decisionCase.alternatives.map((alt) =>
      scoreMap.get(`${alt.id}|${crit.id}`)
    );
    critStats[crit.id] = { min: Math.min(...values), max: Math.max(...values) };
  }

  // bikin scoresNormalized buat engine
  // engine akan hitung Σ(normalizedValue * weight)
  const scoresNormalized = [];
  for (const alt of decisionCase.alternatives) {
    for (const crit of decisionCase.criteria) {
      const raw = scoreMap.get(`${alt.id}|${crit.id}`);
      const { min, max } = critStats[crit.id];

      let normalized = 0;
      if (crit.type === "cost") {
        // cost: makin kecil makin baik
        normalized = raw === 0 ? 0 : min / raw;
      } else {
        // benefit: makin besar makin baik
        normalized = max === 0 ? 0 : raw / max;
      }

      scoresNormalized.push({
        alternativeId: alt.id,
        criterionId: crit.id,
        value: normalized,
      });
    }
  }

  // panggil engine
  const rankingRaw = computeWSM({
    criteria: decisionCase.criteria.map((c) => ({ id: c.id, weight: c.weight })),
    alternatives: decisionCase.alternatives.map((a) => ({ id: a.id })),
    scores: scoresNormalized,
  });

  // bikin breakdown detail + ambil totalScore dari engine
  const totalScoreMap = new Map(
    rankingRaw.map((r) => [r.alternativeId, r.totalScore])
  );

  const computed = decisionCase.alternatives.map((alt) => {
    const breakdown = decisionCase.criteria.map((crit) => {
      const raw = scoreMap.get(`${alt.id}|${crit.id}`);
      const { min, max } = critStats[crit.id];

      let normalized = 0;
      if (crit.type === "cost") normalized = raw === 0 ? 0 : min / raw;
      else normalized = max === 0 ? 0 : raw / max;

      const weighted = normalized * Number(crit.weight);

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
      totalScore: totalScoreMap.get(alt.id) ?? 0,
      breakdown,
    };
  });

  computed.sort((a, b) => b.totalScore - a.totalScore);
  const ranked = computed.map((r, idx) => ({ ...r, rank: idx + 1 }));

  return { totalWeight, results: ranked };
}

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
      select: { alternativeId: true, criterionId: true, value: true },
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

// POST /decision-cases/:id/compute
async function compute(req, res) {
  try {
    const { id } = req.params;

    const decisionCase = await getOwnedDecisionCaseOr404({
      caseId: id,
      userId: req.user.id,
    });

    if (!decisionCase) {
      return res.status(404).json({ message: "Decision case not found" });
    }

    const { totalWeight, results } = await computeWSMForCase({ decisionCase });

    return res.status(200).json({
      message: "WSM computed successfully",
      data: {
        decisionCaseId: decisionCase.id,
        totalWeight,
        results,
      },
    });
  } catch (err) {
    const status = err.status || 500;
    const payload = { message: err.message || "internal server error" };
    if (err.data) payload.data = err.data;
    console.error(err);
    return res.status(status).json(payload);
  }
}

// GET /decision-cases/:id/results
async function results(req, res) {
  try {
    const { id } = req.params;

    const decisionCase = await getOwnedDecisionCaseOr404({
      caseId: id,
      userId: req.user.id,
    });

    if (!decisionCase) {
      return res.status(404).json({ message: "Decision case not found" });
    }

    const { totalWeight, results } = await computeWSMForCase({ decisionCase });

    return res.status(200).json({
      message: "WSM results calculated",
      data: {
        decisionCaseId: decisionCase.id,
        totalWeight,
        results,
      },
    });
  } catch (err) {
    const status = err.status || 500;
    const payload = { message: err.message || "internal server error" };
    if (err.data) payload.data = err.data;
    console.error(err);
    return res.status(status).json(payload);
  }
}

module.exports = {
  create,
  list,
  detail,
  scoreMatrix,
  results,
  compute,
};

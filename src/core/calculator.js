/**
 * Fungsi untuk menghitung skor akhir berdasarkan Weighted Sum Model (WSM)
 * Sesuai Perencanaan Decisio Bab 3.4.1
 */
function calculateDecisio(data) {
    const { criteria, alternatives } = data;

    return alternatives.map(alt => {
        let totalScore = 0;

        // Proses perkalian nilai kriteria dengan bobot (Weighted Sum)
        criteria.forEach(crit => {
            const score = alt.scores[crit.id] || 0;
            totalScore += score * crit.weight;
        });

        return {
            name: alt.name,
            finalScore: totalScore.toFixed(2) // Membatasi 2 angka di belakang koma
        };
    }).sort((a, b) => b.finalScore - a.finalScore); // Mengurutkan dari skor tertinggi
}

module.exports = { calculateDecisio };
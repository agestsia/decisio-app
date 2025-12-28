const { calculateDecisio } = require('../core/calculator');
const dataKeputusan = require('../data/schema.json');

console.log("=== APLIKASI DECISIO (Tahap MVP) ===");
console.log(`Kasus: ${dataKeputusan.case_title}\n`);

const hasil = calculateDecisio(dataKeputusan);

console.log("HASIL REKOMENDASI (Peringkat):");
hasil.forEach((item, index) => {
    console.log(`${index + 1}. ${item.name} - Skor Akhir: ${item.finalScore}`);
});
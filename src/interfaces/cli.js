const { calculateDecisio } = require('../core/calculator');
const dataKeputusan = require('../data/schema.json');
const Table = require('cli-table3');
const chalk = require('chalk');

console.log(chalk.blue.bold("\n==========================================="));
console.log(chalk.white.bold("      DECISIO - PENDUKUNG KEPUTUSAN        "));
console.log(chalk.blue.bold("==========================================="));
console.log(`${chalk.yellow("Kasus:")} ${dataKeputusan.case_title}\n`);

const hasil = calculateDecisio(dataKeputusan);

// Membuat tabel untuk visualisasi yang lebih rapi (Tahap II)
const table = new Table({
    head: [chalk.cyan('Rank'), chalk.cyan('Alternatif'), chalk.cyan('Skor Akhir')],
    colWidths: [7, 30, 15]
});

hasil.forEach((item, index) => {
    const color = index === 0 ? chalk.green.bold : chalk.white;
    table.push([
        index + 1, 
        color(item.name), 
        color(item.finalScore)
    ]);
});

console.log(table.toString());
console.log(chalk.green("\n✔ Rekomendasi Utama: " + hasil[0].name));
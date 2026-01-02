const fs = require('fs');
const vm = require('vm');

// Konfigurasi Input dan Output
const INPUT_FILE = 'Simulation JFT-6.jsx';
const OUTPUT_FILE = 'Simulation JFT-6.json';

try {
    // 1. Baca file
    let content = fs.readFileSync(INPUT_FILE, 'utf8');

    // 2. Bersihkan syntax agar bisa dieksekusi
    // Menghapus deklarasi 'const SimulationJFT4Questions =' agar kita bisa mengambil array-nya saja
    // Kita mencari posisi '[' pertama (awal array)
    const startArray = content.indexOf('[');
    
    // Kita mencari posisi '];' atau ']' terakhir
    const endArray = content.lastIndexOf(']');

    if (startArray === -1 || endArray === -1) {
        throw new Error("Format array tidak ditemukan dalam file.");
    }

    // Ambil hanya bagian array-nya saja string: [ ... ]
    let arrayString = content.substring(startArray, endArray + 1);

    // 3. Eksekusi String sebagai JavaScript
    // Kita menggunakan VM (Virtual Machine) sandbox agar aman dan bisa memproses backticks (`)
    const sandbox = {};
    vm.createContext(sandbox);
    const script = new vm.Script(`result = ${arrayString}`);
    script.runInContext(sandbox);

    const questionsData = sandbox.result;

    // 4. Buat Format JSON Akhir
    const finalJson = {
        "name": "Simulation JFT-4", // Nama disesuaikan dengan file
        "level": "A2",
        "questions": questionsData
    };

    // 5. Simpan ke file JSON
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalJson, null, 2), 'utf8');

    console.log(`Berhasil! File disimpan sebagai ${OUTPUT_FILE}`);

} catch (err) {
    console.error("Terjadi kesalahan:", err.message);
}

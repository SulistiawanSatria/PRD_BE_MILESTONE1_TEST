/**
 * Menghitung similarity score antara dua set measurements
 * @param {Object} measurements1 - Measurements pertama (user)
 * @param {Object} measurements2 - Measurements kedua (review)
 * @returns {number} Similarity score (0-1)
 */
export function calculateSizeSimilarity(measurements1, measurements2) {
    // Jika salah satu measurements kosong, return 0
    if (!measurements1 || !measurements2) return 0;

    const weights = {
        waist: 0.25,
        bust: 0.25,
        hips: 0.25,
        height: 0.25
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Hitung similarity untuk setiap measurement
    Object.keys(weights).forEach(measurement => {
        const value1 = measurements1[measurement];
        const value2 = measurements2[measurement];

        if (value1 && value2) {
            // Hitung perbedaan dalam persentase
            const diff = Math.abs(value1 - value2);
            const maxAllowedDiff = {
                waist: 10,  // 10cm difference
                bust: 10,   // 10cm difference
                hips: 10,   // 10cm difference
                height: 15  // 15cm difference
            };

            // Konversi perbedaan ke score (0-1)
            const score = Math.max(0, 1 - (diff / maxAllowedDiff[measurement]));
            totalScore += score * weights[measurement];
            totalWeight += weights[measurement];
        }
    });

    // Jika tidak ada measurements yang bisa dibandingkan, return 0
    if (totalWeight === 0) return 0;

    // Normalisasi score
    return totalScore / totalWeight;
} 
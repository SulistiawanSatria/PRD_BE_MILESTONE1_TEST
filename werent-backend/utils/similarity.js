// Calculate similarity score between two sets of measurements
exports.calculateSizeSimilarity = (userMeasurements, reviewMeasurements) => {
    const measurements = ['waist', 'bust', 'hips', 'height'];
    let totalDifference = 0;

    measurements.forEach(measurement => {
        const difference = Math.abs(userMeasurements[measurement] - reviewMeasurements[measurement]);
        const percentDifference = difference / reviewMeasurements[measurement];
        totalDifference += percentDifference;
    });

    // Convert to similarity score (0-1)
    const averageDifference = totalDifference / measurements.length;
    return Math.max(0, 1 - averageDifference);
};

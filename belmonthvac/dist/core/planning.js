export function planJob(symptom) {
    const long = new Set(["leak", "frozen", "no_power"]);
    return { duration_min: long.has(symptom) ? 90 : 60, priority: "SOON", route_tags: ["hvac", "diag"] };
}

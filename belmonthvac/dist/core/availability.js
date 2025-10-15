export function getTwoWindows(duration_min = 60) {
    const now = Date.now();
    const mk = (msFromNow, tech, name) => {
        const start = new Date(now + msFromNow).toISOString();
        const end = new Date(new Date(start).getTime() + duration_min * 60 * 1000).toISOString();
        return { start, end, tech_id: tech, tech_name: name };
    };
    return [
        mk(2 * 60 * 60 * 1000, "TECH-07", "Alex"),
        mk(24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000, "TECH-12", "Sam"),
    ];
}

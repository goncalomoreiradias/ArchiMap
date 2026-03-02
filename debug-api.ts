
async function main() {
    // Hardcoded ID from previous attempt or just fetch first project ID via API if needed
    // But since I can't browse easily, I'll use the ID I saw: d05d4c1e... Wait that's brain ID.
    // I saw "Checking Project: Olá t"
    // I need the project ID.
    // I will try to list projects first via API.

    try {
        console.log("Fetching projects...");
        const listRes = await fetch('http://localhost:3000/api/projects');
        if (!listRes.ok) {
            console.error("Failed to list projects");
            return;
        }
        const projects = await listRes.json();
        const project = projects[0];
        if (!project) {
            console.log("No projects found via API.");
            return;
        }

        console.log(`Using Project: ${project.name} (${project.id})`);

        console.log("Fetching Gap View...");
        const res = await fetch(`http://localhost:3000/api/projects/${project.id}/views`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ viewType: 'gap' })
        });

        if (!res.ok) {
            console.error(`API Error: ${res.status}`);
            console.log(await res.text());
            return;
        }

        const data = await res.json();
        console.log(`Received ${data.nodes?.length} nodes.`);

        const posMap: Record<string, string[]> = {};

        data.nodes.forEach((node: any) => {
            const k = `${Math.round(node.position.x)},${Math.round(node.position.y)}`;
            if (!posMap[k]) posMap[k] = [];
            posMap[k].push(`[${node.data.layer}] ${node.data.label} (ID:${node.id})`);
        });

        Object.entries(posMap).forEach(([pos, items]) => {
            if (items.length > 1) {
                console.log(`\n!!! OVERLAP at ${pos} !!!`);
                items.forEach(i => console.log(`  - ${i}`));
            } else {
                console.log(`OK at ${pos}: ${items[0]}`);
            }
        });

    } catch (e) {
        console.error("Script error:", e);
    }
}

main();

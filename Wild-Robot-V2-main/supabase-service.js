// --- CONFIG ---
const SUPABASE_URL = "https://gkyhmhevfraeufbdlspx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdreWhtaGV2ZnJhZXVmYmRsc3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODczNDEsImV4cCI6MjA4MDI2MzM0MX0.ZcrU8OeWyHh4epLZDODJ8jbd2RykhBWJXyXypRlQAbk";

// --- CLIENT INIT ---
if (typeof window.supabase !== 'undefined') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

window.loadPlayersFromSupabase = async function (dbInstance, renderCallback) {
    console.log("🚀 Fetching Dynamic Data...");

    try {
        if (!window.supabaseClient) throw new Error("Supabase Client is missing.");

        // 1. Fetch EVERYTHING (Players, Skills, Sessions)
        const [pRes, sRes, sessRes] = await Promise.all([
            window.supabaseClient.from('players').select('*').order('name'),
            window.supabaseClient.from('skill_library').select('*'),
            window.supabaseClient.from('sessions').select('*').order('start_time') // Order by time
        ]);

        if (pRes.error) throw pRes.error;
        if (sessRes.error) throw sessRes.error;

        dbInstance.skillLibrary = sRes.data || [];

        // 2. Build Branches based on DB Sessions
        // Reset branches
        dbInstance.branches = [];

        const getOrCreateBranch = (id, name, city) => {
            let b = dbInstance.branches.find(x => x.id === id);
            if (!b) {
                b = { id: id, name: name, city: city, sessions: [] };
                dbInstance.branches.push(b);
            }
            return b;
        };

        // Initialize Branches (To ensure they exist even if empty)
        getOrCreateBranch('VISS', 'VISS (Sharjah)', 'Sharjah');
        getOrCreateBranch('Ajman_Academy', 'Ajman Academy', 'Ajman');

        // Map Sessions to Branches
        (sessRes.data || []).forEach(s => {
            // Map DB Branch name to ID
            const branchId = s.branch.includes('Ajman') ? 'Ajman_Academy' : 'VISS';
            const branch = dbInstance.branches.find(b => b.id === branchId);

            if (branch) {
                branch.sessions.push({
                    id: s.id,           // UUID from DB
                    slot: s.display_name, // "5-6 PM"
                    startTime: s.start_time,
                    players: []
                });
            }
        });

        // 3. Distribute Players
        (pRes.data || []).forEach(p => {
            const pBranchId = (p.branch || "").includes('Ajman') ? 'Ajman_Academy' : 'VISS';
            const branch = dbInstance.branches.find(b => b.id === pBranchId);

            if (branch && branch.sessions.length > 0) {
                // Try to find session by UUID first (New System), then by Name (Old System)
                let targetSession = branch.sessions.find(s => s.id === p.session_id);

                if (!targetSession) {
                    // Fallback for legacy data
                    targetSession = branch.sessions.find(s => s.slot === p.session_slot) || branch.sessions[0];
                }

                if (targetSession) {
                    const pLevel = p.level || "Bronze";
                    const playerDevices = ["Floor", "Bars", "Beam", "Vault"].map(dev => {
                        const deviceSkills = (dbInstance.skillLibrary || []).filter(s =>
                            (s.apparatus || "").toLowerCase() === dev.toLowerCase() &&
                            (s.level || "").toLowerCase() === pLevel.toLowerCase()
                        ).map(s => ({ name: s.name, rating: 0 }));
                        return { name: dev, skills: deviceSkills };
                    });

                    targetSession.players.push({
                        id: p.id,
                        supabaseId: p.id,
                        name: p.name,
                        levelCode: pLevel,
                        branchName: branch.name,
                        sessionUUID: targetSession.id, // Important for saving
                        sessionSlot: targetSession.slot,
                        devices: playerDevices
                    });
                }
            }
        });

        if (renderCallback) renderCallback();

    } catch (err) {
        console.error(err);
        alert("Data Load Error: " + err.message);
    }
};

async function listModels() {
    const key = "AIzaSyA93_psDAKrMmazqyMpnCWm4a46_SmJtPE";
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("ERR: " + e.message);
    }
}
listModels();

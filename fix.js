const fs = require("fs");
const path = "C:/Users/LOQ/.gemini/antigravity/scratch/ddma-pwa/app/report/page.tsx";
let code = fs.readFileSync(path, "utf8");
code = code.split("`n").join("\n");
fs.writeFileSync(path, code);
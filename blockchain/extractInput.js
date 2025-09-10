import fs from "fs";
const src =
  "./artifacts/build-info/solc-0_8_28-34dc7f492fee7b3840a691478282f4e41f8edc84.json";
const out = "standard-input.json";
const j = JSON.parse(fs.readFileSync(src, "utf8"));
fs.writeFileSync(out, JSON.stringify(j.input, null, 2), "utf8");
console.log("Wrote", out);

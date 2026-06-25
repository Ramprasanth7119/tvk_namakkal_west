import * as xlsx from "xlsx";
import path from "path";

function main() {
  const filePath = path.join(__dirname, "..", "lib", "Voter_List.xlsx");
  console.log("Reading file:", filePath);
  
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);
  
  console.log("Total rows in Voter_List.xlsx:", rows.length);
  console.log("First 10 rows:");
  console.log(JSON.stringify(rows.slice(0, 10), null, 2));
  
  const match = rows.find((r: any) => 
    Object.values(r).some(v => String(v).includes("Nainamalai") || String(v).includes("RHB0678557"))
  );
  console.log("Matches for Nainamalai/RHB0678557:", match);
}

main();

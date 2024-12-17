function uuid() {
  return Utilities.getUuid();
}

function populateProductUUIDs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("productInfo");
  if (!sheet) {
    throw new Error("Sheet 'productInfo' not found!");
  }

  const data = sheet.getDataRange().getValues(); // Get all data in the sheet
  let currentCategory = null;

  Logger.log("Starting UUID population...");

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const isBlankRow = row.every(cell => cell === "");

    if (!isBlankRow && !currentCategory) {
      // Found a new category
      currentCategory = row[0];
      Logger.log(`Category detected: '${currentCategory}' at row ${i + 1}`);
    } else if (isBlankRow && currentCategory) {
      // Blank row; end of current category
      Logger.log(`End of category '${currentCategory}' at row ${i + 1}`);
      currentCategory = null;
    } else if (!isBlankRow && currentCategory) {
      // Within a category, populate UUID if the first cell is empty
      if (row[0] === "") {
        const uuid = Utilities.getUuid();
        sheet.getRange(i + 1, 1).setValue(uuid); // Row index starts from 1 in Sheets
        Logger.log(`Generated UUID '${uuid}' for row ${i + 1}`);
      }
    }
  }

  Logger.log("UUID population completed.");
}

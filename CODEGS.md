**Codigo AppsScript Actual**

```javascript
const CONFIG = {
  SPREADSHEET_ID: "1nim06gDoCBdAjyWWRP9UWzf_oA_Ha08323tNviS6mJg",
  SHEET_NAME: "DATOS"
};

// ENTRYPOINT API
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, message: "No se recibieron datos" });
    }

    const payload = JSON.parse(e.postData.contents);

    // Lote: array de registros
    if (Array.isArray(payload)) {
      const firstRow = insertBatteryBatch(payload);
      return jsonResponse({
        success: true,
        message: `${payload.length} registros insertados correctamente`,
        firstRow: firstRow
      });
    }

    // Individual: objeto único
    const rowNumber = insertBatteryRow(payload);
    return jsonResponse({
      success: true,
      message: "Registro insertado correctamente",
      rowNumber: rowNumber
    });

  } catch (error) {
    Logger.log(error);
    return jsonResponse({
      success: false,
      message: "Error al insertar registro",
      error: error.toString()
    });
  }
}

// INSERCIÓN EN LOTE (un solo setValues para todas las filas)
function insertBatteryBatch(records) {
  const sheet = SpreadsheetApp
    .openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) throw new Error("La hoja DATOS no existe");

  // --- IDEMPOTENCIA ---
  // La app cliente puede reenviar el mismo lote si la red cortó antes de recibir
  // la respuesta (el servidor insertó pero el cliente nunca supo). Usamos el batchId
  // que la app genera una sola vez por envío de formulario y almacenamos los IDs
  // procesados en PropertiesService para evitar insertar el mismo lote dos veces.
  const batchId = records[0] && records[0].batchId;
  if (batchId) {
    const firstRow = getProcessedBatchRow(batchId);
    if (firstRow !== null) {
      Logger.log('Batch ' + batchId + ' ya procesado anteriormente (fila ' + firstRow + '). Omitiendo inserción.');
      return firstRow;
    }
  }

  const columnA = sheet.getRange("A:A").getValues();
  let lastDataRow = 0;
  for (let i = columnA.length - 1; i >= 0; i--) {
    if (columnA[i][0] !== "") { lastDataRow = i + 1; break; }
  }

  const rows = records.map(r => buildRow(r));
  const targetRow = lastDataRow + 1;

  // Inserta todas las filas de una sola vez
  sheet.getRange(targetRow, 1, rows.length, rows[0].length).setValues(rows);

  // Copia formato de la fila anterior al bloque insertado.
  // IMPORTANTE: copyTo con formatOnly:true también copia la altura de fila.
  // setRowHeightsForced resetea la altura al estándar (21px) para que las filas
  // nuevas no hereden una altura personalizada que pueda existir en lastDataRow.
  if (lastDataRow > 0) {
    sheet.getRange(lastDataRow, 1, 1, sheet.getLastColumn())
         .copyTo(sheet.getRange(targetRow, 1, rows.length, sheet.getLastColumn()), { formatOnly: true });
    sheet.setRowHeightsForced(targetRow, rows.length, 21);
  }

  // Registrar batchId como procesado para evitar duplicados en futuros reintentos
  if (batchId) {
    markBatchAsProcessed(batchId, targetRow);
  }

  return targetRow;
}

// INSERCIÓN INDIVIDUAL
function insertBatteryRow(data) {
  const sheet = SpreadsheetApp
    .openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) throw new Error("La hoja DATOS no existe");

  const row = buildRow(data);

  const columnA = sheet.getRange("A:A").getValues();
  let lastDataRow = 0;
  for (let i = columnA.length - 1; i >= 0; i--) {
    if (columnA[i][0] !== "") { lastDataRow = i + 1; break; }
  }

  const targetRow = lastDataRow + 1;
  sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);

  // Misma corrección de altura que en insertBatteryBatch
  if (lastDataRow > 0) {
    sheet.getRange(lastDataRow, 1, 1, sheet.getLastColumn())
         .copyTo(sheet.getRange(targetRow, 1), { formatOnly: true });
    sheet.setRowHeightsForced(targetRow, 1, 21);
  }

  return targetRow;
}

// CONSTRUCCIÓN DE FILA
function buildRow(data) {
  return [
    data.batteryReference || "",
    data.fechaInspeccion  || "",
    data.fechaFabricacion || "",
    data.fechaRecarga     || "",
    data.aspectoBornes    || "",
    data.aspectoCalcomanias || "",
    data.tapones          || "",
    data.aspectoGeneral   || "",
    data.presentaFugas    || "",
    data.voltage          || "",
    data.weight           || "",
    data.formula          || "",
    data.dias             || "",
    data.observaciones    || "",
    data.inspector        || ""
  ];
}

// --- GESTIÓN DE IDEMPOTENCIA (PropertiesService) ---
// Los batchId procesados se guardan como lista CSV en una sola propiedad.
// Se conservan los últimos 200 IDs (~5 KB), bien por debajo del límite de 9 KB por propiedad.

function getProcessedBatchRow(batchId) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('processedBatches') || '';
  const entries = raw ? raw.split('|') : [];
  for (let i = 0; i < entries.length; i++) {
    const parts = entries[i].split(':');
    if (parts[0] === batchId) return parseInt(parts[1], 10);
  }
  return null;
}

function markBatchAsProcessed(batchId, firstRow) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('processedBatches') || '';
  const entries = raw ? raw.split('|') : [];
  entries.push(batchId + ':' + firstRow);
  // Conservar solo los últimos 200 para no exceder el límite de la propiedad
  const trimmed = entries.slice(-200);
  props.setProperty('processedBatches', trimmed.join('|'));
}

// RESPUESTA JSON
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**Codigo AppsScript Hoja copia**

```javascript
const CONFIG = {
  SPREADSHEET_ID: "1US6BR0Tm8KbNI1U8Br3xO9Jqve5yXv-rabwow1YI9z4",
  SHEET_NAME: "DATOS"
};

var TELEGRAM_BOT_TOKEN = '8191184541:AAFmfPuS20tF9-kwJ2bqJHqhdI9hmSW_KFU';
var TELEGRAM_CHAT_ID   = '1254507172';

function notificarTelegram(mensaje) {
  UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage',
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: mensaje,
        parse_mode: 'HTML'
      })
    }
  );
}

// ENTRYPOINT API
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, message: "No se recibieron datos" });
    }

    const payload = JSON.parse(e.postData.contents);

    if (Array.isArray(payload)) {
      const firstRow = insertBatteryBatch(payload);
      return jsonResponse({
        success: true,
        message: `${payload.length} registros insertados correctamente`,
        firstRow: firstRow
      });
    }

    const rowNumber = insertBatteryRow(payload);
    return jsonResponse({
      success: true,
      message: "Registro insertado correctamente",
      rowNumber: rowNumber
    });

  } catch (error) {
    Logger.log(error);
    return jsonResponse({
      success: false,
      message: "Error al insertar registro",
      error: error.toString()
    });
  }
}

// INSERCIÓN EN LOTE
function insertBatteryBatch(records) {
  const sheet = SpreadsheetApp
    .openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) throw new Error("La hoja DATOS no existe");

  // --- IDEMPOTENCIA ---
  // Igual que en la hoja principal: verificamos el batchId antes de insertar para
  // evitar duplicados cuando la app reintenta un batch que el servidor ya procesó.
  // La notificación de Telegram también se omite si el batch ya fue procesado.
  const batchId = records[0] && records[0].batchId;
  if (batchId) {
    const firstRow = getProcessedBatchRow(batchId);
    if (firstRow !== null) {
      Logger.log('Batch ' + batchId + ' ya procesado anteriormente (fila ' + firstRow + '). Omitiendo inserción.');
      return firstRow;
    }
  }

  const columnA = sheet.getRange("A:A").getValues();
  let lastDataRow = 0;
  for (let i = columnA.length - 1; i >= 0; i--) {
    if (columnA[i][0] !== "") { lastDataRow = i + 1; break; }
  }

  const rows = records.map(r => buildRow(r));
  const targetRow = lastDataRow + 1;

  sheet.getRange(targetRow, 1, rows.length, rows[0].length).setValues(rows);

  // Copia formato y luego resetea altura al estándar para no heredar alturas
  // personalizadas de la fila anterior (causa del bug de celdas agrandadas).
  if (lastDataRow > 0) {
    sheet.getRange(lastDataRow, 1, 1, sheet.getLastColumn())
         .copyTo(sheet.getRange(targetRow, 1, rows.length, sheet.getLastColumn()), { formatOnly: true });
    sheet.setRowHeightsForced(targetRow, rows.length, 21);
  }

  // Registrar batchId como procesado antes de notificar
  if (batchId) {
    markBatchAsProcessed(batchId, targetRow);
  }

  // Notificar por Telegram solo en inserciones reales (no en reintentos ya procesados)
  notificarTelegram(
    '🔋 Se han insertado ' + records.length + ' nuevos registros de inspecciones de baterías.\n' +
    '📅 ' + new Date().toLocaleString('es-CO')
  );

  return targetRow;
}

// INSERCIÓN INDIVIDUAL
function insertBatteryRow(data) {
  const sheet = SpreadsheetApp
    .openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) throw new Error("La hoja DATOS no existe");

  const row = buildRow(data);

  const columnA = sheet.getRange("A:A").getValues();
  let lastDataRow = 0;
  for (let i = columnA.length - 1; i >= 0; i--) {
    if (columnA[i][0] !== "") { lastDataRow = i + 1; break; }
  }

  const targetRow = lastDataRow + 1;
  sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);

  // Misma corrección de altura que en insertBatteryBatch
  if (lastDataRow > 0) {
    sheet.getRange(lastDataRow, 1, 1, sheet.getLastColumn())
         .copyTo(sheet.getRange(targetRow, 1), { formatOnly: true });
    sheet.setRowHeightsForced(targetRow, 1, 21);
  }

  // Notificar
  notificarTelegram(
    '🔋 Se ha insertado 1 nuevo registro de inspección de baterías.\n' +
    '📅 ' + new Date().toLocaleString('es-CO')
  );

  return targetRow;
}

// CONSTRUCCIÓN DE FILA
function buildRow(data) {
  return [
    data.batteryReference   || "",
    data.fechaInspeccion    || "",
    data.fechaFabricacion   || "",
    data.fechaRecarga       || "",
    data.aspectoBornes      || "",
    data.aspectoCalcomanias || "",
    data.tapones            || "",
    data.aspectoGeneral     || "",
    data.presentaFugas      || "",
    data.voltage            || "",
    data.weight             || "",
    data.formula            || "",
    data.dias               || "",
    data.observaciones      || "",
    data.inspector          || ""
  ];
}

// --- GESTIÓN DE IDEMPOTENCIA (PropertiesService) ---
// Misma implementación que en la hoja principal. Cada hoja mantiene su propio
// registro de batchIds en su PropertiesService independiente.

function getProcessedBatchRow(batchId) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('processedBatches') || '';
  const entries = raw ? raw.split('|') : [];
  for (let i = 0; i < entries.length; i++) {
    const parts = entries[i].split(':');
    if (parts[0] === batchId) return parseInt(parts[1], 10);
  }
  return null;
}

function markBatchAsProcessed(batchId, firstRow) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('processedBatches') || '';
  const entries = raw ? raw.split('|') : [];
  entries.push(batchId + ':' + firstRow);
  // Conservar solo los últimos 200 para no exceder el límite de la propiedad
  const trimmed = entries.slice(-200);
  props.setProperty('processedBatches', trimmed.join('|'));
}

// RESPUESTA JSON
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

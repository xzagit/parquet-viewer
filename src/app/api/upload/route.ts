import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
// hyparquet will be dynamically imported

// Replacer function for JSON.stringify to convert BigInts to strings
function replacer(key: string, value: any) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

interface ColumnMetadata {
  name: string;
  type: string;
}

export async function POST(req: NextRequest) {
  console.log("--- API Route /api/upload POST request received (rebuilt v4 - column features) ---"); 
  let tempFilePath: string | null = null;

  try {
    const formData = await req.formData();
    console.log("--- FormData parsed (rebuilt v4) ---");
    const file = formData.get("file") as File | null;

    if (!file) {
      console.error("--- No file found in FormData (rebuilt v4) ---");
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    console.log(`--- File received: ${file.name}, size: ${file.size} (rebuilt v4) ---`);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log("--- File buffer created (rebuilt v4) ---");

    const uniquePrefix = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const safeFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    tempFilePath = `/tmp/${uniquePrefix}-${safeFileName}`;
    
    console.log(`--- Attempting to write to temp file: ${tempFilePath} (rebuilt v4) ---`);
    await fs.promises.writeFile(tempFilePath, fileBuffer);
    console.log(`--- File successfully written to ${tempFilePath} (rebuilt v4) ---`);

    console.log("--- Attempting to dynamically import hyparquet (rebuilt v4) ---");
    const { asyncBufferFromFile, parquetReadObjects, parquetSchema } = await import("hyparquet");
    console.log("--- hyparquet imported successfully (rebuilt v4) ---");
    
    console.log(`--- Attempting to create asyncBufferFromFile for: ${tempFilePath} (rebuilt v4) ---`);
    const asyncBuffer = await asyncBufferFromFile(tempFilePath);
    console.log("--- asyncBuffer created (rebuilt v4) ---");

    console.log("--- Attempting parquetReadObjects (rebuilt v4) ---");
    let jsonData = await parquetReadObjects({ file: asyncBuffer });
    console.log("--- parquetReadObjects successful, data retrieved (rebuilt v4) ---");

    // Extract column metadata
    let columns: ColumnMetadata[] = [];
    if (jsonData && jsonData.length > 0) {
      const firstRow = jsonData[0];
      columns = Object.keys(firstRow).map(key => {
        let type = typeof firstRow[key];
        if (type === 'bigint') {
          type = 'bigint (stringified)'; // Indicate it will be stringified
        } else if (type === 'object') {
          if (firstRow[key] === null) {
            type = 'null';
          } else if (Array.isArray(firstRow[key])) {
            type = 'array';
          } else {
            type = 'object';
          }
        }
        return { name: key, type: type };
      });
      console.log("--- Column metadata extracted (rebuilt v4):", columns, "---");
    } else if (jsonData && jsonData.length === 0) {
        // Attempt to get schema if no data rows
        console.log("--- No data rows, attempting to get schema for column metadata (rebuilt v4) ---");
        const schema = parquetSchema({ file: asyncBuffer });
        if (schema && schema.children) {
            columns = schema.children.map((col: any) => ({
                name: col.name,
                type: col.type || 'unknown' // hyparquet schema might have type info
            }));
            console.log("--- Column metadata extracted from schema (rebuilt v4):", columns, "---");
        } else {
            console.log("--- Could not extract schema for column metadata (rebuilt v4) ---");
        }
    }

    console.log("--- Pre-processing jsonData with JSON.stringify and replacer (rebuilt v4) ---");
    const jsonString = JSON.stringify(jsonData, replacer);
    const safeJsonData = JSON.parse(jsonString);
    console.log("--- jsonData pre-processed, BigInts should be strings (rebuilt v4) ---");

    try {
      console.log(`--- Attempting to unlink temp file: ${tempFilePath} (rebuilt v4) ---`);
      await fs.promises.unlink(tempFilePath);
      console.log(`--- Temp file ${tempFilePath} unlinked successfully (rebuilt v4) ---`);
      tempFilePath = null; 
    } catch (unlinkError: any) {
      console.warn(`Warning: Failed to clean up temp file ${tempFilePath} after successful processing (rebuilt v4):`, unlinkError.message);
      tempFilePath = null; 
    }

    console.log("--- Returning successful JSON response with data and columns (rebuilt v4) ---");
    return NextResponse.json({ data: safeJsonData, columns: columns }, { status: 200 });

  } catch (error: any) {
    console.error("---!!! UNCAUGHT ERROR IN API ROUTE (rebuilt v4) !!!---");
    console.error("Timestamp:", new Date().toISOString());
    if (tempFilePath) {
        console.error("Temp file path at time of error (rebuilt v4):", tempFilePath);
    }
    let errorMessage = "Failed to process Parquet file on the server.";

    if (error instanceof Error) {
      console.error("Error Name (rebuilt v4):", error.name);
      console.error("Error Message (rebuilt v4):", error.message);
      console.error("Error Stack (rebuilt v4):", error.stack);
      errorMessage = error.message;
    } else {
      console.error("Non-Error Object Thrown (rebuilt v4):", JSON.stringify(error, replacer));
      if (typeof error === "string") {
        errorMessage = error;
      } else if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
        errorMessage = error.message;
      }
    }
    
    if (tempFilePath) {
      try {
        console.log(`--- Attempting to clean up temp file ${tempFilePath} after error (rebuilt v4) ---`);
        if (fs.existsSync(tempFilePath)) { 
            await fs.promises.unlink(tempFilePath);
            console.log("--- Temporary file cleaned up after error (rebuilt v4):", tempFilePath, "---");
        } else {
            console.log(`--- Temp file ${tempFilePath} not found for cleanup after error (rebuilt v4) ---`);
        }
      } catch (cleanupError: any) {
        if (cleanupError.code !== "ENOENT") { 
            console.error(`Error during temporary file cleanup (\"${tempFilePath}\") after main error (rebuilt v4):`, cleanupError.message);
        } else {
            console.log(`--- Temp file ${tempFilePath} already gone during error cleanup (rebuilt v4) ---`);
        }
      }
    }
    
    console.error("--- Returning error JSON response (rebuilt v4) ---");
    const errorPayload = { error: `Server-side processing failed (rebuilt v4): ${errorMessage}` };
    return NextResponse.json(JSON.parse(JSON.stringify(errorPayload, replacer)), { status: 500 });
  }
}


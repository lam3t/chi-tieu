import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleDriveServerClient } from "@/lib/drive/server-client";
import { DriveMetaFile, DriveMonthFile } from "@/types/drive";
import { mergeTransactions, mergeCategories } from "@/lib/drive/merge";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized or missing Google access token" },
      { status: 401 }
    );
  }

  const client = new GoogleDriveServerClient(session.accessToken);
  const { searchParams } = new URL(req.url);
  const fullPull = searchParams.get("pull") === "true";

  try {
    const files = await client.listAppDataFiles();

    // If just listing
    if (!fullPull) {
      return NextResponse.json({ files });
    }

    // Full pull: fetch meta.json and all tx-YYYY-MM.json files
    let remoteMeta: DriveMetaFile | null = null;
    const remoteMonths: DriveMonthFile[] = [];

    const metaItem = files.find((f) => f.name === "meta.json");
    if (metaItem) {
      try {
        const raw = await client.getFileContent(metaItem.id);
        remoteMeta = JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse remote meta.json", e);
      }
    }

    // Download each month file
    const monthFiles = files.filter((f) => f.name.startsWith("tx-") && f.name.endsWith(".json"));
    for (const mf of monthFiles) {
      try {
        const raw = await client.getFileContent(mf.id);
        const parsed: DriveMonthFile = JSON.parse(raw);
        remoteMonths.push(parsed);
      } catch (e) {
        console.error(`Failed to parse remote ${mf.name}`, e);
      }
    }

    return NextResponse.json({
      files,
      remoteMeta,
      remoteMonths,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Drive sync GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized or missing Google access token" },
      { status: 401 }
    );
  }

  const client = new GoogleDriveServerClient(session.accessToken);

  try {
    const body = await req.json();
    const { localMeta, localMonths } = body as {
      localMeta?: DriveMetaFile;
      localMonths?: DriveMonthFile[];
    };

    const driveFiles = await client.listAppDataFiles();

    let mergedMeta: DriveMetaFile | null = null;
    const mergedMonths: DriveMonthFile[] = [];

    // 1. Process meta.json
    if (localMeta) {
      const existingMetaFile = driveFiles.find((f) => f.name === "meta.json");
      if (existingMetaFile) {
        try {
          const raw = await client.getFileContent(existingMetaFile.id);
          const remoteMeta: DriveMetaFile = JSON.parse(raw);
          mergedMeta = {
            schemaVersion: 1,
            categories: mergeCategories(localMeta.categories, remoteMeta.categories),
            settings: {
              ...remoteMeta.settings,
              ...localMeta.settings,
              updatedAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          };
        } catch {
          mergedMeta = localMeta;
        }
      } else {
        mergedMeta = localMeta;
      }

      await client.saveFile("meta.json", JSON.stringify(mergedMeta, null, 2));
    }

    // 2. Process month files
    if (localMonths && Array.isArray(localMonths)) {
      for (const lm of localMonths) {
        const filename = `tx-${lm.monthKey}.json`;
        const existingMonthFile = driveFiles.find((f) => f.name === filename);

        let finalMonth: DriveMonthFile = lm;
        if (existingMonthFile) {
          try {
            const raw = await client.getFileContent(existingMonthFile.id);
            const remoteMonth: DriveMonthFile = JSON.parse(raw);
            finalMonth = {
              monthKey: lm.monthKey,
              transactions: mergeTransactions(lm.transactions, remoteMonth.transactions),
              updatedAt: new Date().toISOString(),
            };
          } catch {
            finalMonth = lm;
          }
        }

        await client.saveFile(filename, JSON.stringify(finalMonth, null, 2));
        mergedMonths.push(finalMonth);
      }
    }

    return NextResponse.json({
      success: true,
      mergedMeta,
      mergedMonths,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Drive sync POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

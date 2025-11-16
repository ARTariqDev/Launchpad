import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { University } from "@/models/University";

export async function GET(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const colleges = await University.findAll();

    return NextResponse.json({
      success: true,
      colleges
    });
  } catch (error) {
    console.error("Error fetching colleges:", error);
    return NextResponse.json(
      { error: "Failed to fetch colleges" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";
import { Extracurricular } from "@/models/Extracurricular";

export async function POST(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { activityId } = await request.json();

    if (!activityId) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    const profile = await UserProfile.findByUserId(session.userId);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const savedExtracurriculars = profile.savedExtracurriculars || [];

    if (savedExtracurriculars.includes(activityId)) {
      return NextResponse.json({
        success: true,
        message: "Activity already in your list",
        alreadySaved: true
      });
    }

    savedExtracurriculars.push(activityId);
    await UserProfile.updateField(session.userId, 'savedExtracurriculars', savedExtracurriculars);

    return NextResponse.json({
      success: true,
      message: "Activity added to your list"
    });
  } catch (error) {
    console.error("Error adding activity to list:", error);
    return NextResponse.json(
      { error: "Failed to add activity to list" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await UserProfile.findByUserId(session.userId);
    console.log("Profile for extracurriculars:", profile ? "found" : "not found");

    if (!profile) {
      return NextResponse.json({
        success: true,
        extracurriculars: []
      });
    }

    const savedActivityIds = profile.savedExtracurriculars || [];
    console.log("Saved extracurricular IDs:", savedActivityIds);
    const extracurriculars = [];
    
    for (const activityId of savedActivityIds) {
      const activity = await Extracurricular.findById(activityId);
      if (activity) {
        extracurriculars.push(activity);
      }
    }

    console.log("Returning extracurriculars:", extracurriculars.length);
    return NextResponse.json({
      success: true,
      extracurriculars
    });
  } catch (error) {
    console.error("Error fetching saved extracurriculars:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved extracurriculars" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { activityId } = await request.json();

    if (!activityId) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    const profile = await UserProfile.findByUserId(session.userId);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const savedExtracurriculars = (profile.savedExtracurriculars || []).filter(
      id => id.toString() !== activityId
    );
    await UserProfile.updateField(session.userId, 'savedExtracurriculars', savedExtracurriculars);

    return NextResponse.json({
      success: true,
      message: "Activity removed from your list"
    });
  } catch (error) {
    console.error("Error removing activity from list:", error);
    return NextResponse.json(
      { error: "Failed to remove activity from list" },
      { status: 500 }
    );
  }
}

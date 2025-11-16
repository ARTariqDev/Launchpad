import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";
import { Scholarship } from "@/models/Scholarship";

export async function POST(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { scholarshipId } = await request.json();

    if (!scholarshipId) {
      return NextResponse.json(
        { error: "Scholarship ID is required" },
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

    const savedScholarships = profile.savedScholarships || [];

    if (savedScholarships.includes(scholarshipId)) {
      return NextResponse.json({
        success: true,
        message: "Scholarship already in your list",
        alreadySaved: true
      });
    }

    savedScholarships.push(scholarshipId);
    await UserProfile.updateField(session.userId, 'savedScholarships', savedScholarships);

    return NextResponse.json({
      success: true,
      message: "Scholarship added to your list"
    });
  } catch (error) {
    console.error("Error adding scholarship to list:", error);
    return NextResponse.json(
      { error: "Failed to add scholarship to list" },
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
    console.log("Profile for scholarships:", profile ? "found" : "not found");

    if (!profile) {
      return NextResponse.json({
        success: true,
        scholarships: []
      });
    }

    const savedScholarshipIds = profile.savedScholarships || [];
    console.log("Saved scholarship IDs:", savedScholarshipIds);
    const scholarships = [];
    
    for (const scholarshipId of savedScholarshipIds) {
      const scholarship = await Scholarship.findById(scholarshipId);
      if (scholarship) {
        scholarships.push(scholarship);
      }
    }

    console.log("Returning scholarships:", scholarships.length);
    return NextResponse.json({
      success: true,
      scholarships
    });
  } catch (error) {
    console.error("Error fetching saved scholarships:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved scholarships" },
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

    const { scholarshipId } = await request.json();

    if (!scholarshipId) {
      return NextResponse.json(
        { error: "Scholarship ID is required" },
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

    const savedScholarships = (profile.savedScholarships || []).filter(
      id => id.toString() !== scholarshipId
    );
    await UserProfile.updateField(session.userId, 'savedScholarships', savedScholarships);

    return NextResponse.json({
      success: true,
      message: "Scholarship removed from your list"
    });
  } catch (error) {
    console.error("Error removing scholarship from list:", error);
    return NextResponse.json(
      { error: "Failed to remove scholarship from list" },
      { status: 500 }
    );
  }
}

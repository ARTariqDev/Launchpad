import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";

export async function POST(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { collegeId } = await request.json();

    if (!collegeId) {
      return NextResponse.json(
        { error: "College ID is required" },
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

    // Initialize savedColleges array if it doesn't exist
    const savedColleges = profile.savedColleges || [];

    // Check if college is already saved
    if (savedColleges.includes(collegeId)) {
      return NextResponse.json({
        success: true,
        message: "College already in your list",
        alreadySaved: true
      });
    }

    // Add college to saved list
    savedColleges.push(collegeId);
    await UserProfile.updateField(session.userId, 'savedColleges', savedColleges);

    return NextResponse.json({
      success: true,
      message: "College added to your list"
    });
  } catch (error) {
    console.error("Error adding college to list:", error);
    return NextResponse.json(
      { error: "Failed to add college to list" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await UserProfile.findByUserId(session.userId);

    if (!profile) {
      return NextResponse.json({
        success: true,
        colleges: []
      });
    }

    // Get full college details for saved colleges
    const { University } = require("@/models/University");
    const savedCollegeIds = profile.savedColleges || [];
    const colleges = [];
    
    for (const collegeId of savedCollegeIds) {
      const college = await University.findById(collegeId);
      if (college) {
        colleges.push(college);
      }
    }

    return NextResponse.json({
      success: true,
      colleges
    });
  } catch (error) {
    console.error("Error fetching saved colleges:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved colleges" },
      { status: 500 }
    );
  }
}

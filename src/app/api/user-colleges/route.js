import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";
import clientPromise from "@/lib/mongodb";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Ensure database connection
    await clientPromise;
    
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

    let profile = await UserProfile.findByUserId(session.userId);

    // If profile doesn't exist, create it
    if (!profile) {
      await UserProfile.createOrUpdate(session.userId, {
        savedColleges: []
      });
      profile = await UserProfile.findByUserId(session.userId);
    }

    const savedColleges = profile.savedColleges || [];

    if (savedColleges.includes(collegeId)) {
      return NextResponse.json({
        success: true,
        message: "College already in your list",
        alreadySaved: true
      });
    }

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
    // Ensure database connection
    await clientPromise;
    
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

export async function DELETE(request) {
  try {
    // Ensure database connection
    await clientPromise;
    
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

    let profile = await UserProfile.findByUserId(session.userId);

    // If profile doesn't exist, nothing to delete
    if (!profile) {
      return NextResponse.json({
        success: true,
        message: "College not in your list"
      });
    }

    const savedColleges = (profile.savedColleges || []).filter(
      id => id.toString() !== collegeId
    );
    await UserProfile.updateField(session.userId, 'savedColleges', savedColleges);

    return NextResponse.json({
      success: true,
      message: "College removed from your list"
    });
  } catch (error) {
    console.error("Error removing college from list:", error);
    return NextResponse.json(
      { error: "Failed to remove college from list" },
      { status: 500 }
    );
  }
}

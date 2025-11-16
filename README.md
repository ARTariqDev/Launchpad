# Launchpad

A college application management platform that helps students organize their applications, track deadlines, and get AI-powered insights on their profile.

## What it does

Launchpad helps students keep everything about college applications in one place. You can build your profile with grades, test scores, activities, and essays. The platform uses AI to analyze your profile and show you where you stand. You can save colleges you're interested in, track application deadlines, and get personalized insights on your fit for specific schools.

## Features

**Profile Builder**  
Add your academic info, test scores, extracurriculars, awards, and essays. Everything is saved and tracked automatically.

**AI Analysis**  
Get a score for your overall profile and detailed feedback on each section. The AI only recalculates what changed, so updates are fast.

**College Research**  
Browse colleges, save the ones you like, and get AI insights on how well you match with each school. The system understands different admission requirements for different countries.

**Application Tracking**  
Save colleges, scholarships, and activities. Mark things as complete when you're done. View all your deadlines in a calendar or list.

**Smart Insights**  
Click any category score to get detailed feedback on what's strong, what needs work, and specific recommendations.

## Tech Stack

Built with Next.js 15, React 18, and MongoDB. Uses OpenAI GPT-3.5 for AI analysis. Styled with Tailwind CSS.

## Setup

Install dependencies:
```bash
npm install
```

Create a `.env.local` file with:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
Gpt=your_openai_api_key
```

Run the development server:
```bash
npm run dev
```

Open http://localhost:3000 to start using the app.

## Admin Panel

The platform includes an admin panel for managing content. Access it at `/admin` with admin credentials. You can add colleges, scholarships, and extracurricular opportunities from there.

## How the AI works

The profile analyzer looks at five categories: academics, test scores, extracurriculars, awards, and essays. It caches results and only updates what changed, so you're not waiting for a full analysis every time you edit something. The college insights feature considers whether you're a domestic or international student and uses the right criteria for each school.

## Notes

The platform handles different curriculum types (AP, IB, A-Levels) and understands that not all schools require the same tests. Canadian universities don't need SAT scores, UK schools focus on A-Levels, and US schools have their own requirements. The AI knows this and adjusts its analysis accordingly.

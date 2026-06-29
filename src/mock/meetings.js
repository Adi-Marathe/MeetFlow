export const meetings = [
  {
    id: "mtg-demo-001",
    title: "Q3 Sprint Kickoff",
    date: "2026-06-27T10:00:00Z",
    source: "google_meet",
    duration_mins: 45,
    status: "approved",
    participants: ["adimarathe234@gmail.com", "ahershruti1911@gmail.com"],
    raw_transcript: `Aditya: Let's kick off Q3. Shruti can you build the user dashboard by July 3?
Shruti: Yes I'll have it ready by July 3.
Aditya: Great. I'll set up the production server by July 1.
Shruti: Should I also create the onboarding flow?
Aditya: Yes Shruti, get that done by July 5.`,
    summary: "Q3 sprint kickoff. Dashboard, onboarding, and production server assigned.",
    task_count: 4,
  },
  {
    id: "mtg-001",
    title: "Product Sprint Planning",
    date: "2026-06-24T10:00:00Z",
    source: "google_meet",
    duration_mins: 45,
    status: "extracted",
    participants: ["adimarathe234@gmail.com", "ahershruti1911@gmail.com"],
    raw_transcript: `Aditya: Let's finalize the sprint. Shruti can you handle the API integration by June 27?
Shruti: Yes, done by EOD Thursday.
Aditya: I'll set up the staging environment today. Shruti please share the updated PRD with the team by tomorrow noon.`,
    summary: "Sprint planning. API integration, staging setup, and PRD sharing assigned.",
    task_count: 3,
  },
  {
    id: "mtg-002",
    title: "Client Onboarding — TechCorp",
    date: "2026-06-23T14:30:00Z",
    source: "zoom",
    duration_mins: 30,
    status: "pending_review",
    participants: ["adimarathe234@gmail.com", "ahershruti1911@gmail.com"],
    raw_transcript: `Shruti: We need to send the onboarding docs to TechCorp by Friday.
Aditya: I'll draft the welcome email. Shruti, can you prepare the account setup guide?
Shruti: Done by Thursday. Also we promised them a demo video by next Monday.
Aditya: I'll record the demo.`,
    summary: "Onboarding deliverables for TechCorp assigned.",
    task_count: 3,
  },
  {
    id: "mtg-003",
    title: "Weekly Standup — June 23",
    date: "2026-06-23T09:00:00Z",
    source: "slack_huddle",
    duration_mins: 15,
    status: "done",
    participants: ["adimarathe234@gmail.com", "ahershruti1911@gmail.com"],
    raw_transcript: `Aditya: Quick standup. What's blocking you?
Shruti: Nothing blocking, continuing on the auth module.
Aditya: Great. Everyone please fill the sprint retrospective form by EOD.`,
    summary: "Standup — retro form due today.",
    task_count: 1,
  }
];

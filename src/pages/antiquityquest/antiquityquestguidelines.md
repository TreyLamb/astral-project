web-based, multi-device score tracking application for the card game "Antiquity Quest". This application will be hosted on my existing Astral project website.

Core Architecture & Features Needed:

Session Management: I need a backend system (using WebSockets or a real-time database like Firebase/Supabase) where a host can generate a session code, and up to 8 players can join that same session via their mobile phones.

Mobile Client Views: Each player needs a mobile-friendly interface on their phone where they can input their own end-of-round stats. They need input fields for:

Number of Perfect Treasure Collections (1500 pts)

Number of Perfect Antiquity Collections (1000 pts)

Number of Standard Collections (500 pts)

Number of Mixed Collections (250 pts)

Total count of Antiquity cards played (25 pts each)

Total count of Treasure cards played (50 pts each)

Total count of Nigel Remington cards played (100 pts each)

Value of cards left in Hand/Cache (Subtract from score)

A toggle for "Went Out First" (500 pts)

TV Dashboard View: A separate desktop-optimized view designed to be cast to a TV. It should listen for real-time updates from the mobile clients and display a live leaderboard showing everyone's current standings across a 3-round game.

Math/Calculation Logic: Build a utility function that ingests the player's inputs and outputs their total round score based on the point values provided above.

Please generate the backend state management logic, the WebSocket/real-time sync architecture, and the frontend React/Astro component structures to support this. Keep the styling clean and adaptable to my Astral environment.



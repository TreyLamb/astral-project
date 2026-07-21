Act as an expert frontend developer. I need you to build a clean, whitelabeled multi-timer dashboard component. The layout should be based on a responsive grid of cards, but entirely stripped of any specific branding, background images, or flavor text.

It belongs in the TimerTool repo where this md lives.


UI and Layout Requirements:

Create a responsive grid layout to display multiple "Timer Cards" simultaneously.

Use a clean, minimalist design (standard dark or light mode styling, no background images or icons).

Each card should only display a generic title (e.g., "Timer 1", "Timer 2") and the timer interface. Do not include placeholder images or description text.

Functional Requirements:

Dual-Stage Timers: Each card must track a running timer against two distinct milestones (e.g., Milestone 1 at 65 seconds, Milestone 2 at 120 seconds).

Controls: Each card needs functional buttons to 'Start', 'Pause', and 'Reset' its specific timer independently of the others.

Visual Indicators: The UI should clearly show the current elapsed time. The card should visually change state (e.g., border color or text color) when Milestone 1 is reached, and change state again when Milestone 2 is reached.

Tiemrs should be able to 'alarm' once finishing. showing a pop up on the screen and making a sound.
there needs to be a feature/function somewhere that allows user to 'save' a sound/alarm/notification to be used later. Along with being able to delete saved presets.

Data Structure:

Drive the grid generation using an array of configuration objects so I can easily add, remove, or modify the timers later. Example structure: [{ id: 1, name: "Timer A", phaseOne: 65, phaseTwo: 120 }, ...]

Please write the complete, functional code for this UI using the frameworks currently established in this workspace.

Source of truth / reference website 
https://yetimoose.io/sot/cooking/
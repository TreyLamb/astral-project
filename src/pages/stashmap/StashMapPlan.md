Role & Objective:
You are an expert, meticulous full-stack developer. Your objective is to build a comprehensive, production-ready home inventory system and integrate it directly into the existing astral project environment.

System Requirements:

1. Core Inventory Management

Build a highly generic, flexible CRUD system to track household items.

Data structure should handle: Item Name, Category, Quantity, Description, and a highly granular Location Hierarchy (e.g., Room -> Zone -> Specific Storage like "NW wall shelves, rows 3x3").

2. Visual Layout System (2D vs. 3D)

The defining feature of this system is visual location mapping. If a user clicks on an item located in "NW wall shelves, rows 3x3", the UI should pull up a visual layout of the house/room highlighting that specific spot.

Architectural Decision Delegated to You: I want this to be visually impressive but it must use 100% free libraries/tools. Evaluate whether a 2D interactive map (e.g., SVG/Canvas) or a lightweight 3D model (e.g., Three.js) is the best approach for this constraint. Make the choice based on what will provide the best, most reliable user experience without incurring costs, and implement it fully.

3. Integration into astral

Build this directly into the astral project folder/architecture.

Adhere to the existing tech stack, routing, and state management patterns currently used in the workspace.

4. Quality & Execution Strict Constraints

No Shortcuts: Do not use placeholders like // TODO: implement logic here or ...rest of the code.

Thoroughness: Write complete files. Implement the database/state schema, the backend logic (if applicable), and the frontend UI components.

Ready for Review: The goal is for this to be fully functional and ready to go on the very first review. Take a deep breath, plan your file structure, and write production-grade code. Let me know your decision on the 2D vs 3D approach before/while you begin generating the codebase.
Here is a comprehensive prompt tailored for your VS Code agent. It sets a strict, high-bar persona ("a team of researchers"), details the exact Pokédex and Medal tracking requirements, and specifically references the local continuation steps and your friend's site.

You can copy and paste the block below directly into your agent.

The Prompt for Claude
Role & Objective:
You are not just a senior full-stack developer; you are acting as an elite team of Pokémon GO researchers and data scientists. Your objective is to build out the next phase of the pogoaccts project. Your standard for success is anticipation: you must deliver all relevant metrics, calculations, and data points before I even realize I need them. If I have to ask you to add a specific tracking metric to the dashboard, you have failed the assignment.

Step 1: Project Initialization

Locate and read the local documentation file in this repository that outlines the steps to continue the pogoaccts project. Execute this next phase based on that foundation, integrating the following two massive feature suites.

Feature Suite 1: The Ultimate Pokédex Tracker

Core Tracking: Build a comprehensive tracking system mirroring the Pokémon GO Pokédex.

Categories: Include Normal, Lucky, Shadow, Purified, Mega, and Shiny. Explicitly exclude Hundos.

Feasibility Engine: Integrate a logic layer that clearly distinguishes between what is currently available in-game and what is impossible (unreleased Pokémon, unreleased shinies, forms, etc.).

UI/UX & Lore: The design must be highly "Pokémon-esque" (thematic styling, colors, and layout). It shouldn't just be a spreadsheet of checkboxes. Embed dynamically generated or well-structured tips, FAQs, fun facts, and "nice-to-knows" for the species being viewed.

The Summary Dashboard: Build a world-class summary view. I want an aggressive, deep-dive breakdown of exactly what I have left to hunt. Calculate completion percentages by region, by form, and by type. Break down what I am missing into actionable insights.

Feature Suite 2: Advanced Medal Tracking & Analytics

Reference Material: Review [https://yetimoose.io/poke/medals/](https://yetimoose.io/poke/medals/). This is the baseline for how to sort and present medals nicely, but our system must be significantly bigger, better, and smarter.

Interactive Tracking: I need a system where I can input/upload my current raw numbers for each medal, and the system automatically calculates the rest.

Analytics: Show me what I have, what I don't have, and what is/isn't possible. Calculate the exact deltas (how much more I need for Platinum/Onyx). Anticipate metrics: if a medal requires doing something daily, calculate the minimum days required to finish it based on my current number.

Execution Constraints:

No Shortcuts: Write complete, production-ready code. Do not use placeholders like // TODO: implement calculation.

Thoroughness: Ensure the database schema, state management, and frontend components are tightly coupled and fully built out to support these complex data structures.

Review the local repo doc, take a deep breath, and generate the code for these features comprehensively.
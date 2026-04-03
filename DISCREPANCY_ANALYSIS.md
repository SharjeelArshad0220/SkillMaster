# Discrepancy & Bug Analysis

Following your screenshot and session walkthrough, I have identified the root causes of the data "safety check" errors.

## 1. The "[object Object]%" Error
- **Location**: `ProgressPage.jsx` (Line 81).
- **Cause**: The `examScores` array in our `AppContext` now stores rich objects: `{ dayId, score, passed, date }`. But the UI code was written before we had rich data, so it tries to print the whole object as a string: `${lastExamScore}%`. 
- **Fix**: Update the reference to `lastExamScore.score`.

## 2. The "0 Sessions" & "N/A" Bug
- **Location**: `ProgressPage.jsx` (Line 31 & 51).
- **Cause**: The `findDay` helper only looks for a simple number (e.g., `1`). However, our Session Engine uses "Composite IDs" (e.g., `m1-w1-d1`).
    - When the UI looks for `m1-w1-d1` in a list of numbers, it finds nothing (null).
    - Result: `lessonsCompleted` becomes 0, and session titles show up as "N/A" or "None yet".
- **Fix**: Improve the `findDay` logic to parse the Composite ID and extract the module/week/day values for matching.

## 3. Dashboard "Blank" or "Stuck" Crash
- **Location**: `LearnPage.jsx`.
- **Cause**: After completing Week 1 (Day 7), the `advanceProgress` logic sets the next day to **Module 1 Week 2 Day 1**. 
- **The Problem**: If your `roadmap.json` doesn't have Week 2 defined yet, the Dashboard tries to find a session that doesn't exist.
- **Fix**: Add a "Next Milestone Reached" or "Module Complete" fallback UI so the application doesn't try to render a "ghost" session.

## 4. Missing Icons
- **Location**: Everywhere referencing `material-symbols-outlined`.
- **Cause**: The Material Symbols font library was never linked in the root `index.html`.
- **Fix**: Add the Google Fonts link to the project header.

## How we got here

User completes auth and has an account (first-time) and then they come back once they either have [no tides] or they have [active tides]

## What we do here

All active tides are at the top of the screen. They have a defined hierarchy. The daily tide is prominent, while other tides appear as "previews" when the daily tide is displayed as a "card".

The daily tide card either encourages users to start their daily tide, or displays the existing daily tide

Users must end the daily tide from the previous day before they start a new tide.

The types of tides are "daily", "weekly", "monthly", and "project". Color coding the tides would be beneficial.

See `/tides-home.png` for reference.

When a user enters the app, they will have a few different scenarios:

a) They are a first-time user (they don't have any tides)
b) They don't have any tides
c) They have tides, but no daily tide
d) They have tides and they have a daily tide active
e) They have tides and they never ended their daily tide from the day before

If they are in scenario E), they should be gently told to end their last daily tide if they want to start a new daily tide. They should be encouraged to enter any information like what they did and when they stopped working before submitting.

If a user is in scenarios a), b), or c), it's all pretty similar—they will be encouraged to start a daily tide.

If a user is in scenario d), they kind of just continue as usual. Their main prompting section will be focused on adding context to their tide.

They will have their "tide window" and then their "prompting area".

a) Their tide window says "Welcome" and "Start a new tide" with checkbox options for daily, weekly, monthly, and project-based tides. Their prompting area input will say "Start a tide...". The prompting area initial message will say something like "Tell Tides useful information like what you'll accomplish today, how you are feeling, your energy level, or switch to a different tide type above."

b) They don't have any tides. Their tides message will be instructions, and their tides area will look exactly like scenario A.

c) It should suggest starting a daily tide and should show all their other tides below it.

d) They continue with their active daily tide, with prompts focused on adding context.

## Where we go from here

# TODOs

## P0 - Critical

-Agent needs to be ebtter at proactvely calliing tides tools

- If i summona. tides tool it gets plopped into the input (colorful and bold) and then like IDE intellisense its followed by a few parameters that should be entered.
  -If the essential paraeters arent entered, the agent will ask the user for them, if nonessentail parameters arent entered then its fine, the agent will execute the tides tool
  - if a user starts typing and then the suggester gies thema. tool, the tool will repalce the string of words that suggest they want to use that tool

- make sure ALL tides tools and AI agent commands are available from the tides tool bar

- when you click the tide info a calendar pops up - you switch your context and then select a day ont eh calendar, a week on the calendar, or a month ofnt eh calendar dependign ont he date. if it's project its a list of projects
- the calendar day shoudl have a amrk on it if it had any ocnversation doen that day (checked in)
  - i think proejcts should be locked for paying customers, locked for beta

## P1 - High Priority

- also, all flows are inherotedly heirarchal
│   and occur in daily tides then are passed
│   upawrds, idk what startHierarchicalFlow is    
│   for 

- any ocnversation you have with tides and the agent responses, all of those get saved so when you go to another day;s covnersation, it loads up
  - when you go to each day, if there is a report generated that report has been saved and will be shown, otherwise there is a button to "create a report" and a button to "view converstaion", i guess it woudnt really be 'expensive' to pull the converstaion though, make the chat window match whatvever date is up above

## P2 - Performance Polish

- [ ] **Fix AgentService re-configs** - Add `useMemo` dependency array in `ChatContext.tsx:XX`
- [ ] **Memoize URL provider** - Add `useCallback` in `MCPContext.tsx:XX`


**the big three are energy update, generate analysisi, create flow (can be timed, shoudl have a goal)

- shoudl have little buttons ont eh bottom of the agent repsonse when there is a tool its calling, that button would jsut toss it in the inptu with any paramters filled out already

## P3 - Nice to Haves

- [ ] **Better network detection** - Add NetInfo listener for online/offline states
- [ ] **Enhanced retry logging** - Add attempt counts and delays to MCP retry logs
- [ ] **Loading states** - Show spinners during health checks
- [ ] **Friendly error messages** - Replace technical errors with user-friendly text

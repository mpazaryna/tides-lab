# TODOs

## P0 - Critical

-Agent needs to be ebtter at proactvely calliing tides tools

- If i summona. tides tool it gets plopped into the input (colorful and bold) and then like IDE intellisense its followed by a few parameters that should be entered.
  -If the essential paraeters arent entered, the agent will ask the user for them, if nonessentail parameters arent entered then its fine, the agent will execute the tides tool
  - if a user starts typing and then the suggester gies thema. tool, the tool will repalce the string of words that suggest they want to use that tool

- make sure ALL tides tools and AI agent commands are available from the tides tool bar

## P1 - High Priority

## P2 - Performance Polish

- [ ] **Fix AgentService re-configs** - Add `useMemo` dependency array in `ChatContext.tsx:XX`
- [ ] **Memoize URL provider** - Add `useCallback` in `MCPContext.tsx:XX`

## P3 - Nice to Haves

- [ ] **Better network detection** - Add NetInfo listener for online/offline states
- [ ] **Enhanced retry logging** - Add attempt counts and delays to MCP retry logs
- [ ] **Loading states** - Show spinners during health checks
- [ ] **Friendly error messages** - Replace technical errors with user-friendly text

# ADR 0001: Implement Higher-Order Functions for Cross-Cutting Concerns

Date: 2024-11-13

## Status

Accepted

## Context

Our application needs to handle multiple cross-cutting concerns (rate limiting, error handling, performance monitoring) across different rule implementations. We need an architectural pattern that:

- Maintains separation of concerns
- Keeps core business logic pure and focused
- Allows for easy addition/removal of cross-cutting functionality
- Provides type safety and maintainability
- Supports composition of multiple concerns

The current implementation mixes these concerns with business logic, making the code harder to maintain and test.

## Decision

We will implement a Higher-Order Function (HOF) architecture where:

1. Base rule functions contain only core business logic
2. Cross-cutting concerns are implemented as HOF wrappers
3. Final enhanced functions are composed using these wrappers

Example structure:

```typescript
const withRateLimit =
  <T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    config: RateLimitConfig,
  ) =>
  async (...args: Args): Promise<T> => {
    // Rate limiting logic
    return fn(...args);
  };

// Usage
const rateLimitedFunction = withRateLimit(baseFunction, {
  maxRequestsPerMinute: 5,
  requestWindow: 60000,
});
```

This pattern allows us to:

- Add/remove concerns without modifying base functions
- Compose multiple wrappers in a clear order
- Maintain type safety through TypeScript generics
- Test concerns independently

## Consequences

### Positive

1. Improved separation of concerns

   - Core logic remains pure
   - Cross-cutting concerns are isolated
   - Easier to test individual components

2. Enhanced maintainability

   - Clear function composition chain
   - Easy to add/remove functionality
   - Consistent pattern across codebase

3. Better type safety
   - Generic type parameters ensure type safety
   - TypeScript compiler enforces correct usage

### Negative

1. Increased complexity

   - Stack traces become more complex
   - Learning curve for new developers
   - More complex type definitions

2. Performance considerations
   - Each wrapper adds function call overhead
   - Need to monitor and optimize hot paths

### Mitigations

1. For complexity:

   - Maintain clear documentation
   - Keep wrapper chain depth reasonable
   - Use meaningful function names

2. For performance:
   - Profile and optimize critical paths
   - Use only necessary wrappers
   - Monitor performance metrics

## Implementation Notes

### Required Changes

1. Create base HOF wrappers for:

   - Rate limiting
   - Error handling
   - Performance monitoring

2. Update existing rule implementations to use HOF pattern

3. Add monitoring and metrics collection

### Best Practices

1. Wrapper Design

   - Single responsibility per wrapper
   - Consistent naming conventions
   - Clear documentation

2. Error Handling

   - Preserve error context
   - Use appropriate error types
   - Maintain error chain

3. Testing
   - Test wrappers independently
   - Verify composed functions
   - Cover error cases

## Related Decisions

- Need to decide on metrics collection strategy
- May need to establish wrapper ordering conventions
- Consider standardizing configuration patterns

## References

- [Dev log](../../../apps/mobile/docs/logs/114-hof-design-pattern.md)
- TypeScript documentation on generics
- Functional programming best practices

Architecture Decision Record (ADR)​
An Architecture Decision Record (ADR) is a point-in-time document that records architectural decisions and the reasoning behind them.

Think of it as a snapshot that says, “On this date, given the context, drivers, and information we had, we made a decision to go with Option Z. We considered Options X, Y, and Z.”

Structure of an ADR​
According to Michael Nygard on #1, an ADR should include the title, status, context, decision, and consequences. Additionally, I suggest adding the decision maker(s) and stakeholders.

Title: A brief document title, e.g., “001: Decision to Choose a Cloud Provider for Data Project.”

Created By: Indicate the creator if the wiki doesn’t provide details.

Date: The creation date of the ADR.

Decision Maker: The person(s) responsible for making the decision.

Stakeholders: Those offering advice and those affected by the decision.

Status: The status of the ADR (Draft, Accepted, Rejected, Deprecated by YYY, Supersedes XXX).

Context: This section highlights the problem statement, drivers (functional and non-functional), and options considered.

Decision: Document the chosen decision and its rationale.

Consequences: Detail the resulting context or state after implementing the decision, including trade-offs.

How to create ADR​
1: Identify the need for an ADR​
Before you start creating an ADR, ensure that the decision is significant enough to warrant documentation. Consider decisions that have a lasting impact on the architecture, technology choices, or design principles. Once need is identified, create ADR in “Draft” status on a standard organisation or team template. ADR should include

Decision Maker(s)
Stakeholders
Problem Statement (In Context Section)
2: Define the Problem​
Clearly articulate the problem or challenge that the architectural decision aims to address. This sets the context for the decision and helps others understand why it’s being made.

3: Describe other options​
List and describe the alternative solutions or approaches considered to solve the problem. Include both the pros and cons of each alternative. This provides a comprehensive view of the decision-making process.

4: Collaborate​
Engage listed decision makers to work on problem statement. Discuss all options and choose the winning solutions. Once all decision makers are aligned, engage stakeholders and expertise on the decision for review and approval (I call it a sales process). It’s essential to engage stakeholders early because there might bring missing context which could changed your winning solution.

5: Record the Decision​
Once you have all the green lights, change the status to decided. Document the chosen solution or approach as the decision and the rationale behind the decision. Highlight the reasons, benefits, and trade-offs associated with the decision.

6: Consequences​
Outline the expected consequences of the decision. This includes both the positive outcomes and potential drawbacks. Consider technical, operational, and business impacts.

7: Maintain and Update​
If a decision changes due to new information or evolving requirements, update the ADR to reflect the current state. Change the status of the current ADR to ”Deprecated by YYY” and ”Create a new one with status “Superseded by XXX”

By following these steps, teams will be able to create well-structured, informative, and valuable Architecture Decision Records. These records will contribute to better communication, knowledge sharing, and informed decision-making within the team and across the organization.

ADR Example​
Zoom image will be displayed

Benefits of ADR​
Time and Cost saving
Without documentation, decisions are revisited more often. ADRs brings new members of the team or organisation up to speed on decisions made and the reason why they were made

Distributed Decision Making
ADRs helps teams to make informed decision and reach consensus more efficiently. They allow anyone in team to own or run with the decision making while ensuring that right stakeholders are involved

Transparency
Decisions made are not locked in meeting minutes or archive folder in document server. The collection of ADRs are accessebile and they can help in communication.

Knowledge Sharing
ADRs captures and preserves institutional knowledge by documenting insights, trade-offs, and lessons learned from past decisions. Because of individuals listed on the ADR, anyone can choose to have further conversations with those individuals

Accountability
Each decision is tied to specific individuals or groups, fostering accountability and ensuring that decisions align with the team or organisational goals and constraints.

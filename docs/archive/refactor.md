// GRAY

# Refactoring Guidelines

These guidelines are to be used when generating refactoring suggestions or when responding to refactoring-related requests.

## Core Principles

- Fowler's "Refactoring" (2nd Edition): All refactoring recommendations should be grounded in the patterns and principles described by Martin Fowler in his book "Refactoring: Improving the Design of Existing Code"
- Preserve Behavior: The primary goal of refactoring is to improve the internal structure of the code without changing its external behavior. Refactorings should maintain existing functionality.
- Small Steps: Favor small, incremental refactoring steps over large, sweeping changes. Each step should be testable and easily reversible.
- Test Driven: Refactoring is only safe if there are good tests. Test coverage is required before refactoring.

## When Suggesting a Refactor

- Identify the Smell: Clearly articulate the code smell or design issue that motivates the refactoring. (e.g., "Long Method," "Duplicate Code," "Feature Envy," etc.) using terminology from Fowler's book.
- Propose a Refactoring: Suggest a specific refactoring technique from Fowler's catalog. (e.g., "Extract Method," "Move Method," "Introduce Parameter Object," etc.)
- Explain the Rationale: Provide a concise explanation of why this refactoring is beneficial in this context. Explain how it addresses the identified code smell and improves the code's design.
- Outline the Steps: Briefly describe the key steps involved in performing the refactoring.
- Preserve Tests: make sure the proposed refactoring also include updating or adding tests as needed.
- Be explicit about which part of the code needs refactoring: Don't suggest refactoring for the entire file or method. be specific.

## Example Response Structure

- This code exhibits the 'Long Method' code smell because [explain why]. To address this, I recommend using the 'Extract Method' refactoring. This involves moving a logically cohesive block of code into a new method, which will improve readability and maintainability. The steps would be: 1) [step 1], 2) [step 2], etc. We should also add a new unit test for the extracted method.

## Things to Avoid

- Changing Functionality: Refactoring is not the time to add new features or fix bugs.
- Over-Engineering: Avoid introducing overly complex solutions. Favor simplicity and clarity.
- Unnecessary Refactoring: Don't refactor for the sake of refactoring. There should always be a clear benefit.

## Notes

- The user is aware of these guidelines, so the refactoring suggestions should assume that and provide clear direction and not waste words on definitions.
- When giving code suggestions it should be small and focused on only what is being refactored.

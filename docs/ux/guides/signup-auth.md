// GREEN

# Signup and Authentication UX Patterns

## Flow

```
[Initial] (immediately begins warming up MCP connection)
    --User has account and signs in--> [Home]
    --User doesn't have an account and signs in--> error
    --User clicks "create an account"--> [CreateAccount]
        --> User creates account: email, password, verify password
        --> Verifies with email
```

[Initial] should also have null buttons options for signing in with Apple, Google and GitHub

Implement standard UI flow principles for signup and authentication.

## Technical Notes

All Auth Stacks should be in `src/navigation/AuthNavigator.tsx` and `src/screens/Auth`

## Core Principles

- Remove interaction. Remove clicks, remove reading, remove waiting, remove thinking.
- Vigorous code is concise. A function should contain no unnecessary lines, a module no unnecessary functions, for the same reason that an algorithm should have no unnecessary steps and a system no unnecessary components. Verbose comments must die. Redundant syntax must die. Omit needless logic. Avoid generic helpers. Resolve all bugs.

## 1. Autofocus on the First Field

If 95% of users opening a signup form will immediately click into the first field, save them the trouble and auto-focus on it.

**Note:** Autofocusing can be jarring for screenreader users—test this experience.

## 2. Use Specialized Mobile Keyboards

Mobile phones have specialized keyboards for different input types. Use HTML input types to trigger appropriate keyboards:

- `type="email"` for email addresses (shows @ and .)
- `type="tel"` for telephone numbers
- `type="url"` for URLs
- `type="number"` for numeric inputs

## 3. Validate Fields on Blur

Don't wait for form submission to show errors. Validate as soon as your system can detect an error—typically when the user focuses on another field (on blur).

Target both blank fields and invalid formats (e.g., malformed email addresses).

## 4. Make Labels Clickable

Every labeled text input should have clickable labels. Place the input element inside its respective label element.

Benefits:

- Users can click labels to start typing
- Helps when fingers miss the textbox

**Accessibility Note:** For screen readers, wrap the label text in a separate span with a unique id, then add `aria-labelledby="my-unique-id"` to the input.

## 5. Show Password Requirements When Choosing Passwords

Display password requirements when they're relevant. Remove them when they're not.

No user should have to guess at password requirements.

## 6. Let Users See Their Password

Allow users to view the password they've entered to prevent issues with unintended passwords. This is less onerous than requiring double entry.

// Simple module-level state for client-side navigation persistence
// This prevents the Lanyard Card animation from re-running every time the user navigates back to the profile within the same session.
export const lanyardState = {
    hasAnimated: false
};

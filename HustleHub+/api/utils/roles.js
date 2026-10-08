// Role names used across the API, so the strings are not retyped in each file
const ROLES = Object.freeze({
    CLIENT: 'client',
    FREELANCER: 'freelancer',
    ADMIN: 'admin',
});

// Roles a user may choose at public registration (admin is never self-registered)
const PUBLIC_ROLES = [ROLES.CLIENT, ROLES.FREELANCER];

module.exports = { ROLES, PUBLIC_ROLES };

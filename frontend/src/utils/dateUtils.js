/**
 * Calculate days since a given date
 * @param {string|Date} date - The date to calculate from
 * @returns {number} Number of days
 */
export const getDaysSince = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diffTime = Math.abs(now - then);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

/**
 * Format date as "X days ago" or "Today" or "Yesterday"
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted string
 */
export const getDaysAgo = (date) => {
    const days = getDaysSince(date);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
};

/**
 * Format date with time
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateTime = (date) => {
    return new Date(date).toLocaleString();
};

/**
 * Format date only
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
};

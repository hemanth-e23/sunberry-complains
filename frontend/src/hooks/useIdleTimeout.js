import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useIdleTimeout = () => {
    const navigate = useNavigate();
    const timeoutRef = useRef(null);

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const resetTimer = () => {
        // Clear existing timer
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timer
        timeoutRef.current = setTimeout(() => {
            logout();
        }, IDLE_TIMEOUT);
    };

    useEffect(() => {
        // Events that indicate user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        // Reset timer on any activity
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });

        // Start initial timer
        resetTimer();

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { resetTimer };
};

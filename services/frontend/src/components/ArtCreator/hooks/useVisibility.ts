import { useEffect, useState } from 'react';

export function useVisibility(delayMs = 100): boolean {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setIsVisible(true), delayMs);
		return () => clearTimeout(timer);
	}, [delayMs]);

	return isVisible;
}
